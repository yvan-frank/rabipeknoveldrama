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

  if (loadError) return <p className="review-form__error">{loadError}</p>;
  if (status === null) return <p className="empty">Chargement…</p>;

  const isVerified = status.isVerified;

  return (
    <div className="kyc-form">
      {isVerified ? (
        <p className="kyc-form__banner kyc-form__banner--verified">
          ✓ Votre identité est vérifiée — vous pouvez gérer vos livres librement. Vos informations sont verrouillées ;
          contactez un administrateur si vous devez les modifier.
        </p>
      ) : (
        status.isComplete && (
          <p className="kyc-form__banner kyc-form__banner--pending">✓ KYC soumis — en attente de vérification par un administrateur.</p>
        )
      )}

      <form className="book-form" onSubmit={handleSubmit}>
        <fieldset disabled={isVerified} className="kyc-form__fieldset">
          <label className="book-form__field">
            Nom complet
            <input type="text" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} maxLength={50} required />
          </label>

          <div className="book-form__row">
            <label className="book-form__field">
              Pays
              <select value={form.country} onChange={(e) => set('country', e.target.value)} required>
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
            <label className="book-form__field">
              Adresse
              <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} maxLength={50} required />
            </label>
          </div>

          <div className="book-form__row">
            <label className="book-form__field">
              Type de pièce d'identité
              <select value={form.documentType} onChange={(e) => set('documentType', e.target.value)}>
                {DOCUMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="book-form__field">
              Numéro du document
              <input type="text" value={form.documentId} onChange={(e) => set('documentId', e.target.value)} maxLength={50} required />
            </label>
          </div>

          <div className="book-form__field">
            <span>Pièce d'identité (CNI, passeport ou autre)</span>
            {form.documents && (
              <p className="kyc-form__doc-status">
                ✓ {docFileName ?? 'Document envoyé'}
                {!isVerified && (
                  <button
                    type="button"
                    onClick={() => {
                      set('documents', '');
                      setDocFileName(null);
                    }}
                  >
                    Retirer
                  </button>
                )}
              </p>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleDocumentChange} disabled={docUploading || isVerified} />
            {docUploading && <p className="empty">Envoi…</p>}
          </div>

          <fieldset className="book-form__extension">
            <legend>Réseaux sociaux (facultatif)</legend>
            <div className="book-form__row">
              <label className="book-form__field">
                Facebook
                <input type="text" value={form.facebook} onChange={(e) => set('facebook', e.target.value)} placeholder="https://facebook.com/…" />
              </label>
              <label className="book-form__field">
                Instagram
                <input type="text" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="https://instagram.com/…" />
              </label>
            </div>
            <div className="book-form__row">
              <label className="book-form__field">
                X / Twitter
                <input type="text" value={form.twitter} onChange={(e) => set('twitter', e.target.value)} placeholder="https://x.com/…" />
              </label>
              <label className="book-form__field">
                Site web
                <input type="text" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://…" />
              </label>
            </div>
          </fieldset>

          <label className="kyc-form__consent">
            <input type="checkbox" checked={form.privacyAccepted} onChange={(e) => set('privacyAccepted', e.target.checked)} />
            J'accepte la politique de confidentialité
          </label>
          <a href="/politique-confidentialite" target="_blank" rel="noreferrer" className="kyc-form__policy-link">
            Lire la politique de confidentialité
          </a>
        </fieldset>

        {error && <p className="review-form__error">{error}</p>}
        {success && <p className="kyc-form__success">Informations enregistrées.</p>}

        {!isVerified && (
          <div className="book-form__actions">
            <button type="submit" className="btn btn--primary" disabled={isSubmitting || docUploading}>
              {isSubmitting ? 'Enregistrement…' : 'Soumettre mon KYC'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
