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

const fieldClass = 'flex flex-col gap-1.5 text-sm opacity-85';
const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-brand-amber focus:ring-3 focus:ring-brand-amber/20 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100';
const btnClass = 'inline-block rounded-full border border-black/10 px-5 py-3 text-sm disabled:opacity-60 dark:border-white/15';
const btnPrimaryClass =
  'mt-1 inline-block rounded-full bg-brand-amber px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100';

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
    <div>
      {isWizard && currentStepMeta && (
        <div className="mb-6 flex items-center gap-3">
          <div>
            {currentStepMeta.eyebrow && (
              <p className="text-sm font-semibold tracking-[0.1em] text-brand-pink uppercase">{currentStepMeta.eyebrow}</p>
            )}
            <h2>{currentStepMeta.title}</h2>
            {currentStepMeta.description && <p className="mt-1 text-[0.8rem] opacity-60">{currentStepMeta.description}</p>}
          </div>
        </div>
      )}

      {isWizard && (
        <div className="mb-6 flex items-center">
          {WIZARD_STEPS.map((s, index) => (
            <div key={s.title} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={`flex size-8 items-center justify-center rounded-full text-[0.85rem] font-semibold ${
                  index === step
                    ? 'bg-gradient-to-br from-brand-amber to-brand-pink text-neutral-900'
                    : index < step
                      ? 'bg-emerald-500 text-white'
                      : 'bg-black/10 dark:bg-white/10'
                }`}
              >
                {index < step ? '✓' : index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {step === -1 && (
          <>
            {!form.isAuthor && (
              <label className={fieldClass}>
                Nom
                <input
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={inputClass}
                />
              </label>
            )}

            <label className={fieldClass}>
              Email
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className={inputClass}
              />
            </label>

            <label className={fieldClass}>
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

            <label className={fieldClass}>
              Confirmer le mot de passe
              <PasswordInput id="confirmPassword" value={form.confirmPassword} onChange={(v) => set('confirmPassword', v)} autoComplete="new-password" />
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 p-3.5 hover:border-brand-amber dark:border-white/10">
              <input type="checkbox" checked={form.isAuthor} onChange={(e) => set('isAuthor', e.target.checked)} className="mt-0.5 shrink-0" />
              <span className="flex flex-col gap-0.5">
                <strong className="text-[0.875rem] font-semibold">✒ Je suis auteur</strong>
                <span className="text-xs opacity-60">Quelques questions en plus pour créer votre profil auteur.</span>
              </span>
            </label>

            {stepError && <p className="text-sm text-rose-600">{stepError}</p>}
            {submitError && <p className="text-sm text-rose-600">{submitError}</p>}

            {form.isAuthor ? (
              <button type="button" onClick={goToOnboarding} className={btnPrimaryClass}>
                Continuer →
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className={btnPrimaryClass}>
                {isSubmitting ? 'Inscription…' : "S'inscrire"}
              </button>
            )}

            <p className="mt-2 text-center text-sm opacity-70">
              Déjà un compte ?{' '}
              <a href="/connexion" className="font-semibold text-brand-amber no-underline hover:underline">
                Connectez-vous
              </a>
            </p>
          </>
        )}

        {step === 0 && (
          <>
            <label className={fieldClass}>
              Nom complet
              <input
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={fieldClass}>
              Nom pour les lecteurs
              <input type="text" value={form.readerName} onChange={(e) => set('readerName', e.target.value)} className={inputClass} />
              <span className="text-xs opacity-55">Le nom affiché publiquement sur vos livres.</span>
            </label>
          </>
        )}

        {step === 1 && (
          <label className={fieldClass}>
            <textarea
              rows={6}
              placeholder="Parlez-nous de votre parcours, votre style d'écriture, ce qui vous inspire…"
              value={form.about}
              onChange={(e) => set('about', e.target.value)}
              className={`${inputClass} resize-y`}
            />
            <span className="text-xs opacity-55">
              {countWords(form.about)}/{MAX_ABOUT_WORDS} mots
            </span>
          </label>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-2.5">
            {categories.length === 0 ? (
              <p className="opacity-60">Chargement des genres…</p>
            ) : (
              categories.map((category) => {
                const checked = form.genreIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleGenre(category.id)}
                    className={`rounded-xl border px-3.5 py-2.5 text-left text-[0.85rem] ${
                      checked
                        ? 'border-brand-amber bg-brand-amber/12 font-semibold'
                        : 'border-black/10 bg-transparent text-inherit dark:border-white/10'
                    }`}
                  >
                    {checked ? '✓ ' : ''}
                    {category.name}
                  </button>
                );
              })
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-amber bg-brand-amber/8 p-8 text-center">
            <span className="text-[2rem]">🎉</span>
            <p>Vous êtes prêt·e à publier votre premier livre et à rejoindre la communauté des auteurs RabipekNovel.</p>
          </div>
        )}

        {step >= 0 && (
          <>
            {stepError && <p className="text-sm text-rose-600">{stepError}</p>}
            {submitError && <p className="text-sm text-rose-600">{submitError}</p>}
            <div className="mt-6 flex justify-between">
              <button type="button" onClick={goBack} className={btnClass}>
                ← Précédent
              </button>
              {isLastWizardStep ? (
                <button type="submit" disabled={isSubmitting} className={btnPrimaryClass}>
                  {isSubmitting ? 'Inscription…' : "Profitez de l'écriture"}
                </button>
              ) : (
                <button type="button" onClick={goNext} className={btnPrimaryClass}>
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
