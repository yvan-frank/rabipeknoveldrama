import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';

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

const fieldClass = 'flex flex-col gap-1.5 text-[0.8rem] opacity-85';
const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-brand-amber focus:ring-3 focus:ring-brand-amber/20 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100';
const rowClass = 'grid grid-cols-2 gap-4';
const btnPrimaryClass =
  'inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900';

// Équivalent de src/components/dashboard/author/KycForm.tsx (+
// DocumentUploadField.tsx intégré). Une fois vérifié (isVerified), le
// formulaire est verrouillé : cf. AuthorKycMiddleware côté API, qui
// réinitialise kycVerifiedAt à chaque nouvelle soumission — modifier après
// vérification repasserait l'auteur en attente.
export default function KycForm() {
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

  useEffect(loadStatus, []);

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

  if (loadError) return <p className="text-sm text-rose-600">{loadError}</p>;
  if (status === null) return <p className="opacity-60">Chargement…</p>;

  const isVerified = status.isVerified;

  return (
    <div className="flex flex-col gap-5">
      {isVerified ? (
        <p className="rounded-xl border border-emerald-500/35 bg-emerald-500/12 px-4.5 py-3.5 text-[0.85rem] text-emerald-500">
          ✓ Votre identité est vérifiée — vous pouvez gérer vos livres librement. Vos informations sont verrouillées ;
          contactez un administrateur si vous devez les modifier.
        </p>
      ) : (
        status.isComplete && (
          <p className="rounded-xl border border-brand-amber/35 bg-brand-amber/12 px-4.5 py-3.5 text-[0.85rem] text-brand-amber">
            ✓ KYC soumis — en attente de vérification par un administrateur.
          </p>
        )
      )}

      <form className="flex max-w-2xl flex-col gap-4" onSubmit={handleSubmit}>
        <fieldset disabled={isVerified} className="flex flex-col gap-4 border-none p-0 m-0 disabled:opacity-65">
          <label className={fieldClass}>
            Nom complet
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              maxLength={50}
              required
              className={inputClass}
            />
          </label>

          <div className={rowClass}>
            <label className={fieldClass}>
              Pays
              <select value={form.country} onChange={(e) => set('country', e.target.value)} required className={inputClass}>
                <option value="" disabled>
                  Choisir…
                </option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className={fieldClass}>
              Adresse
              <input
                type="text"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                maxLength={50}
                required
                className={inputClass}
              />
            </label>
          </div>

          <div className={rowClass}>
            <label className={fieldClass}>
              Type de pièce d'identité
              <select value={form.documentType} onChange={(e) => set('documentType', e.target.value)} className={inputClass}>
                {DOCUMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={fieldClass}>
              Numéro du document
              <input
                type="text"
                value={form.documentId}
                onChange={(e) => set('documentId', e.target.value)}
                maxLength={50}
                required
                className={inputClass}
              />
            </label>
          </div>

          <div className={fieldClass}>
            <span>Pièce d'identité (CNI, passeport ou autre)</span>
            {form.documents && (
              <p className="my-1 flex items-center gap-2.5 text-[0.85rem] text-emerald-500">
                ✓ {docFileName ?? 'Document envoyé'}
                {!isVerified && (
                  <button
                    type="button"
                    onClick={() => {
                      set('documents', '');
                      setDocFileName(null);
                    }}
                    className="border-none bg-none text-xs text-inherit underline opacity-70"
                  >
                    Retirer
                  </button>
                )}
              </p>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleDocumentChange}
              disabled={docUploading || isVerified}
            />
            {docUploading && <p className="opacity-60">Envoi…</p>}
          </div>

          <fieldset className="flex flex-col gap-3.5 rounded-xl border border-black/10 p-4 dark:border-white/10">
            <legend className="px-1.5 text-xs font-bold tracking-[0.05em] uppercase opacity-60">Réseaux sociaux (facultatif)</legend>
            <div className={rowClass}>
              <label className={fieldClass}>
                Facebook
                <input
                  type="text"
                  value={form.facebook}
                  onChange={(e) => set('facebook', e.target.value)}
                  placeholder="https://facebook.com/…"
                  className={inputClass}
                />
              </label>
              <label className={fieldClass}>
                Instagram
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => set('instagram', e.target.value)}
                  placeholder="https://instagram.com/…"
                  className={inputClass}
                />
              </label>
            </div>
            <div className={rowClass}>
              <label className={fieldClass}>
                X / Twitter
                <input
                  type="text"
                  value={form.twitter}
                  onChange={(e) => set('twitter', e.target.value)}
                  placeholder="https://x.com/…"
                  className={inputClass}
                />
              </label>
              <label className={fieldClass}>
                Site web
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://…"
                  className={inputClass}
                />
              </label>
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-[0.85rem]">
            <input type="checkbox" checked={form.privacyAccepted} onChange={(e) => set('privacyAccepted', e.target.checked)} />
            J'accepte la politique de confidentialité
          </label>
          <a
            href="/politique-confidentialite"
            target="_blank"
            rel="noreferrer"
            className="-mt-2 text-xs text-brand-amber"
          >
            Lire la politique de confidentialité
          </a>
        </fieldset>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {success && <p className="text-[0.85rem] text-emerald-500">Informations enregistrées.</p>}

        {!isVerified && (
          <div className="flex items-center gap-3">
            <button type="submit" disabled={isSubmitting || docUploading} className={btnPrimaryClass}>
              {isSubmitting ? 'Enregistrement…' : 'Soumettre mon KYC'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
