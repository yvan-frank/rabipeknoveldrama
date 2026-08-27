import { useEffect, useState, type FormEvent } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { PasswordInput } from '../components/PasswordInput';
import { PasswordStrengthPanel } from '../components/PasswordStrengthPanel';
import { countWords, isStrongPassword, MAX_ABOUT_WORDS } from '../lib/auth';

interface Props {
  redirectTo: string;
}

interface Category {
  id: number;
  name: string;
}

interface FormState {
  isAuthor: boolean;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  readerName: string;
  about: string;
  genreIds: number[];
}

const EMPTY_FORM: FormState = {
  isAuthor: false,
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  readerName: '',
  about: '',
  genreIds: [],
};

const WIZARD_STEPS = [
  { title: 'Création de votre profil auteur' },
  { eyebrow: 'Enquête auprès des auteurs', title: 'Dis-nous à propos de vous' },
  { eyebrow: 'Enquête auprès des auteurs', title: 'Dans quel genre êtes-vous spécialisé ?' },
  { title: 'Merci, nous vous connaissons mieux maintenant', description: "Ces quelques informations nous aident à mieux vous accompagner et à mettre en valeur votre profil auprès des lecteurs." },
];

// Équivalent de src/components/forms/RegisterForm.tsx : compte simple
// (nom/email/mot de passe) ou, si "Je suis auteur" est coché, onboarding en
// 4 étapes supplémentaires. POST /auth/register-author n'existe pas encore
// côté API (cf. AuthRoutes.php : "register-author n'est pas encore porté")
// — le formulaire va jusqu'au bout, mais la soumission finale d'un compte
// auteur échouera tant que cette route n'est pas ajoutée côté serveur.
export default function RegisterForm({ redirectTo }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [step, setStep] = useState(-1);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWizard = form.isAuthor && step >= 0;
  const currentStepMeta = isWizard ? WIZARD_STEPS[step] : null;
  const isLastWizardStep = step === WIZARD_STEPS.length - 1;

  useEffect(() => {
    if (!form.isAuthor) return;
    apiClient
      .get('/categories')
      .then((res) => setCategories(res.data?.data ?? []))
      .catch(() => setCategories([]));
  }, [form.isAuthor]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleGenre(id: number) {
    set('genreIds', form.genreIds.includes(id) ? form.genreIds.filter((g) => g !== id) : [...form.genreIds, id]);
  }

  function validateAccountStep(): string | null {
    if (!form.isAuthor && form.name.trim().length < 2) return 'Nom trop court';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Email invalide';
    if (!isStrongPassword(form.password)) return 'Le mot de passe ne respecte pas tous les critères ci-dessous';
    if (form.password !== form.confirmPassword) return 'Les mots de passe ne correspondent pas';
    return null;
  }

  function validateOnboardingStep(): string | null {
    if (step === 0) {
      if (form.fullName.trim().length < 2) return 'Nom complet trop court';
      if (form.readerName.trim().length < 2) return 'Nom pour les lecteurs trop court';
    }
    if (step === 1) {
      if (form.about.trim().length < 10) return 'Décrivez-vous en quelques mots';
      if (countWords(form.about) > MAX_ABOUT_WORDS) return `${MAX_ABOUT_WORDS} mots maximum`;
    }
    if (step === 2 && form.genreIds.length < 1) return 'Choisissez au moins un genre';
    return null;
  }

  function goToOnboarding() {
    const error = validateAccountStep();
    if (error) return setStepError(error);
    setStepError(null);
    setStep(0);
  }

  function goNext() {
    const error = validateOnboardingStep();
    if (error) return setStepError(error);
    setStepError(null);
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, -1));
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    setSubmitError(null);

    if (form.isAuthor) {
      const error = validateOnboardingStep();
      if (error) return setStepError(error);
    } else {
      const error = validateAccountStep();
      if (error) return setStepError(error);
    }

    setIsSubmitting(true);
    try {
      if (form.isAuthor) {
        await apiClient.post('/auth/register-author', {
          name: form.readerName,
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          about: form.about,
          genreIds: form.genreIds,
        });
      } else {
        await apiClient.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      }
      window.location.href = redirectTo;
    } catch (err: any) {
      if (form.isAuthor && err?.response?.status === 404) {
        setSubmitError("L'inscription en tant qu'auteur n'est pas encore disponible sur cette API — créez un compte lecteur pour l'instant.");
      } else {
        setSubmitError(extractApiErrorMessage(err, 'Inscription impossible'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`register-form${isWizard ? ' register-form--wizard' : ''}`}>
      {isWizard && currentStepMeta && (
        <div className="wizard__panel-head" style={{ marginBottom: '1.5rem' }}>
          <div>
            {currentStepMeta.eyebrow && <p className="about-pillars__eyebrow">{currentStepMeta.eyebrow}</p>}
            <h2>{currentStepMeta.title}</h2>
            {currentStepMeta.description && <p className="dashboard-panel__description">{currentStepMeta.description}</p>}
          </div>
        </div>
      )}

      {isWizard && (
        <div className="wizard__steps" style={{ marginBottom: '1.5rem' }}>
          {WIZARD_STEPS.map((s, index) => (
            <div key={s.title} className={`wizard__step${index === step ? ' is-current' : ''}${index < step ? ' is-done' : ''}`}>
              <span className="wizard__step-badge">{index < step ? '✓' : index + 1}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        {step === -1 && (
          <>
            {!form.isAuthor && (
              <label className="book-form__field">
                Nom
                <input type="text" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </label>
            )}

            <label className="book-form__field">
              Email
              <input type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </label>

            <label className="book-form__field">
              Mot de passe
              <PasswordInput
                id="password"
                value={form.password}
                onChange={(v) => set('password', v)}
                autoComplete="new-password"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <PasswordStrengthPanel password={form.password} visible={passwordFocused} />
            </label>

            <label className="book-form__field">
              Confirmer le mot de passe
              <PasswordInput id="confirmPassword" value={form.confirmPassword} onChange={(v) => set('confirmPassword', v)} autoComplete="new-password" />
            </label>

            <label className="author-toggle">
              <input type="checkbox" checked={form.isAuthor} onChange={(e) => set('isAuthor', e.target.checked)} />
              <span>
                <strong>✒ Je suis auteur</strong>
                <span>Quelques questions en plus pour créer votre profil auteur.</span>
              </span>
            </label>

            {stepError && <p className="review-form__error">{stepError}</p>}
            {submitError && <p className="review-form__error">{submitError}</p>}

            {form.isAuthor ? (
              <button type="button" className="btn btn--primary" onClick={goToOnboarding}>
                Continuer →
              </button>
            ) : (
              <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Inscription…' : "S'inscrire"}
              </button>
            )}

            <p className="empty">
              Déjà un compte ? <a href="/connexion">Connectez-vous</a>
            </p>
          </>
        )}

        {step === 0 && (
          <>
            <label className="book-form__field">
              Nom complet
              <input type="text" autoComplete="name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
            </label>
            <label className="book-form__field">
              Nom pour les lecteurs
              <input type="text" value={form.readerName} onChange={(e) => set('readerName', e.target.value)} />
              <span className="wizard__hint">Le nom affiché publiquement sur vos livres.</span>
            </label>
          </>
        )}

        {step === 1 && (
          <label className="book-form__field">
            <textarea
              rows={6}
              placeholder="Parlez-nous de votre parcours, votre style d'écriture, ce qui vous inspire…"
              value={form.about}
              onChange={(e) => set('about', e.target.value)}
            />
            <span className="wizard__hint">
              {countWords(form.about)}/{MAX_ABOUT_WORDS} mots
            </span>
          </label>
        )}

        {step === 2 && (
          <div className="genre-picker">
            {categories.length === 0 ? (
              <p className="empty">Chargement des genres…</p>
            ) : (
              categories.map((category) => {
                const checked = form.genreIds.includes(category.id);
                return (
                  <button key={category.id} type="button" className={checked ? 'is-active' : ''} onClick={() => toggleGenre(category.id)}>
                    {checked ? '✓ ' : ''}
                    {category.name}
                  </button>
                );
              })
            )}
          </div>
        )}

        {step === 3 && (
          <div className="register-form__congrats">
            <span>🎉</span>
            <p>Vous êtes prêt·e à publier votre premier livre et à rejoindre la communauté des auteurs RabipekNovel.</p>
          </div>
        )}

        {step >= 0 && (
          <>
            {stepError && <p className="review-form__error">{stepError}</p>}
            {submitError && <p className="review-form__error">{submitError}</p>}
            <div className="wizard__nav">
              <button type="button" className="btn" onClick={goBack}>
                ← Précédent
              </button>
              {isLastWizardStep ? (
                <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Inscription…' : "Profitez de l'écriture"}
                </button>
              ) : (
                <button type="button" className="btn btn--primary" onClick={goNext}>
                  Suivant →
                </button>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
