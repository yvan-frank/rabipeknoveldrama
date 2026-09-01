import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ShieldCheck, ShieldAlert, UploadCloud, CheckCircle2, X } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { useRequireAuth } from '../lib/useRequireAuth';
import { glassPanel, inputBase, labelBase, btnPrimary, errorText } from '../lib/authorUi';
import { Checkbox } from '../components/Checkbox';

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'cni', label: "Carte nationale d'identité (CNI)" },
  { value: 'passeport', label: 'Passeport' },
  { value: 'autre', label: "Autre pièce d'identité" },
];

// Liste volontairement non exhaustive (priorité aux pays francophones et aux
// principaux marchés), même choix que refonte_rabi_frontend/src/lib/schemas/kyc.ts.
const COUNTRY_OPTIONS = [
  'Cameroun', 'Sénégal', "Côte d'Ivoire", 'Bénin', 'Togo', 'Mali', 'Burkina Faso', 'Niger', 'Guinée', 'Gabon',
  'Congo', 'République démocratique du Congo', 'Tchad', 'République centrafricaine', 'Rwanda', 'Burundi',
  'Madagascar', 'Maroc', 'Algérie', 'Tunisie', 'France', 'Belgique', 'Suisse', 'Canada', 'Haïti', 'États-Unis',
  'Royaume-Uni', 'Allemagne', 'Espagne', 'Portugal', 'Nigeria', 'Ghana', 'Afrique du Sud', 'Autre',
];

interface KycExtension {
  country: string | null;
  address: string | null;
  documentType: string | null;
  documentId: string | null;
  documents: string | null;
  fullName: string | null;
  socialLinks: Record<string, string> | null;
  privacyAcceptedAt: string | null;
  kycVerifiedAt: string | null;
}

interface KycStatus {
  extension: KycExtension | null;
  isComplete: boolean;
  isVerified: boolean;
}

interface FormState {
  fullName: string;
  country: string;
  address: string;
  documentType: string;
  documentId: string;
  documents: string;
  facebook: string;
  instagram: string;
  twitter: string;
  website: string;
  privacyAccepted: boolean;
}

const EMPTY_FORM: FormState = {
  fullName: '',
  country: '',
  address: '',
  documentType: 'cni',
  documentId: '',
  documents: '',
  facebook: '',
  instagram: '',
  twitter: '',
  website: '',
  privacyAccepted: false,
};

function toApiPayload(form: FormState) {
  const { facebook, instagram, twitter, website, ...rest } = form;
  const socialLinks: Record<string, string> = {};
  if (facebook) socialLinks.facebook = facebook;
  if (instagram) socialLinks.instagram = instagram;
  if (twitter) socialLinks.twitter = twitter;
  if (website) socialLinks.website = website;
  return { ...rest, ...(Object.keys(socialLinks).length > 0 ? { socialLinks } : {}) };
}

const rowClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2';

// Équivalent de src/components/dashboard/author/KycForm.tsx (+
// DocumentUploadField.tsx intégré). Une fois vérifié (isVerified), le
// formulaire est verrouillé : cf. AuthorKycMiddleware côté API, qui
// réinitialise kycVerifiedAt à chaque nouvelle soumission — modifier après
// vérification repasserait l'auteur en attente.
export default function KycForm() {
  const user = useRequireAuth('/espace-auteur/kyc');
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [docUploading, setDocUploading] = useState(false);
  const [docFileName, setDocFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadStatus() {
    apiClient
      .get('/authors/moi/kyc')
      .then((res) => {
        const data: KycStatus = res.data?.data;
        setStatus(data);
        const ext = data?.extension;
        if (ext) {
          setForm({
            fullName: ext.fullName ?? '',
            country: ext.country ?? '',
            address: ext.address ?? '',
            documentType: ext.documentType ?? 'cni',
            documentId: ext.documentId ?? '',
            documents: ext.documents ?? '',
            facebook: ext.socialLinks?.facebook ?? '',
            instagram: ext.socialLinks?.instagram ?? '',
            twitter: ext.socialLinks?.twitter ?? '',
            website: ext.socialLinks?.website ?? '',
            privacyAccepted: Boolean(ext.privacyAcceptedAt),
          });
        }
      })
      .catch((err) => setLoadError(extractApiErrorMessage(err, 'Impossible de charger votre KYC.')));
  }

  useEffect(() => {
    if (user) loadStatus();
  }, [user]);

  if (!user) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleDocumentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setDocUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('document', file);
      const res = await apiClient.postForm('/uploads/document', body);
      set('documents', res.data?.data?.url ?? '');
      setDocFileName(file.name);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Impossible d'envoyer le document"));
    } finally {
      setDocUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.fullName.trim()) return setError('Le nom complet est requis');
    if (!form.country) return setError('Le pays est requis');
    if (!form.address.trim()) return setError("L'adresse est requise");
    if (!form.documentId.trim()) return setError('Le numéro du document est requis');
    if (!form.documents) return setError('Le document scanné est requis');
    if (!form.privacyAccepted) return setError('Vous devez accepter la politique de confidentialité');

    setIsSubmitting(true);
    try {
      await apiClient.post('/authors/moi/kyc', toApiPayload(form));
      setSuccess(true);
      loadStatus();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Impossible d'enregistrer votre KYC"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) return <p className={errorText}>{loadError}</p>;
  if (status === null) return <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />;

  const isVerified = status.isVerified;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">Vérification KYC</h1>
        <p className="mt-1.5 text-sm text-white/50">Confirmez votre identité pour débloquer la gestion complète de vos livres.</p>
      </div>

      {isVerified ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
          <ShieldCheck size={20} className="shrink-0 text-emerald-400" />
          <p className="text-sm text-emerald-300">
            Votre identité est vérifiée — vous pouvez gérer vos livres librement. Vos informations sont verrouillées ;
            contactez un administrateur si vous devez les modifier.
          </p>
        </div>
      ) : (
        status.isComplete && (
          <div className="flex items-center gap-3 rounded-2xl border border-brand-amber/30 bg-brand-amber/10 px-5 py-4">
            <ShieldAlert size={20} className="shrink-0 text-brand-amber" />
            <p className="text-sm text-brand-amber">KYC soumis — en attente de vérification par un administrateur.</p>
          </div>
        )
      )}

      <form className={`${glassPanel} flex max-w-2xl flex-col gap-5 p-6 sm:p-7`} onSubmit={handleSubmit}>
        <fieldset disabled={isVerified} className="m-0 flex flex-col gap-5 border-none p-0 disabled:opacity-50">
          <label className={labelBase}>
            Nom complet
            <input type="text" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} maxLength={50} required className={inputBase} />
          </label>

          <div className={rowClass}>
            <label className={labelBase}>
              Pays
              <select value={form.country} onChange={(e) => set('country', e.target.value)} required className={inputBase}>
                <option value="" disabled className="bg-neutral-900">
                  Choisir…
                </option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c} className="bg-neutral-900">
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelBase}>
              Adresse
              <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} maxLength={50} required className={inputBase} />
            </label>
          </div>

          <div className={rowClass}>
            <label className={labelBase}>
              Type de pièce d'identité
              <select value={form.documentType} onChange={(e) => set('documentType', e.target.value)} className={inputBase}>
                {DOCUMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-neutral-900">
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelBase}>
              Numéro du document
              <input type="text" value={form.documentId} onChange={(e) => set('documentId', e.target.value)} maxLength={50} required className={inputBase} />
            </label>
          </div>

          <div className={labelBase}>
            <span>Pièce d'identité (CNI, passeport ou autre)</span>
            {form.documents ? (
              <div className="mt-1 flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 text-[0.82rem] text-emerald-300">
                <CheckCircle2 size={16} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{docFileName ?? 'Document envoyé'}</span>
                {!isVerified && (
                  <button
                    type="button"
                    onClick={() => {
                      set('documents', '');
                      setDocFileName(null);
                    }}
                    className="shrink-0 rounded-md p-1 text-emerald-300/70 hover:bg-emerald-500/15 hover:text-emerald-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <label
                className={`mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/15 px-4 py-6 text-center transition hover:border-brand-amber/40 hover:bg-white/[0.02] ${
                  docUploading || isVerified ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <UploadCloud size={22} className="text-white/40" />
                <span className="text-[0.8rem] text-white/50">{docUploading ? 'Envoi…' : 'Cliquez pour choisir un fichier (JPG, PNG, PDF)'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleDocumentChange}
                  disabled={docUploading || isVerified}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <fieldset className="m-0 flex flex-col gap-3.5 rounded-2xl border border-white/10 bg-black/15 p-4">
            <legend className="px-1.5 text-[0.7rem] font-semibold tracking-[0.12em] text-white/40 uppercase">Réseaux sociaux (facultatif)</legend>
            <div className={rowClass}>
              <label className={labelBase}>
                Facebook
                <input type="text" value={form.facebook} onChange={(e) => set('facebook', e.target.value)} placeholder="https://facebook.com/…" className={inputBase} />
              </label>
              <label className={labelBase}>
                Instagram
                <input type="text" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="https://instagram.com/…" className={inputBase} />
              </label>
            </div>
            <div className={rowClass}>
              <label className={labelBase}>
                X / Twitter
                <input type="text" value={form.twitter} onChange={(e) => set('twitter', e.target.value)} placeholder="https://x.com/…" className={inputBase} />
              </label>
              <label className={labelBase}>
                Site web
                <input type="text" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://…" className={inputBase} />
              </label>
            </div>
          </fieldset>

          <Checkbox checked={form.privacyAccepted} onChange={(v) => set('privacyAccepted', v)} className="text-[0.85rem] text-white/70">
            J'accepte la politique de confidentialité
          </Checkbox>
          <a href="/politique-confidentialite" target="_blank" rel="noreferrer" className="-mt-3 text-xs text-brand-amber hover:underline">
            Lire la politique de confidentialité
          </a>
        </fieldset>

        {error && <p className={errorText}>{error}</p>}
        {success && <p className="text-[0.85rem] text-emerald-400">✓ Informations enregistrées.</p>}

        {!isVerified && (
          <button type="submit" disabled={isSubmitting || docUploading} className={`${btnPrimary} self-start`}>
            {isSubmitting ? 'Enregistrement…' : 'Soumettre mon KYC'}
          </button>
        )}
      </form>
    </div>
  );
}
