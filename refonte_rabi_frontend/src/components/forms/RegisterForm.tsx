'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, Feather, Loader2, PartyPopper } from 'lucide-react';
import {
  registerSchema,
  toRegisterAuthorPayload,
  countWords,
  MAX_ABOUT_WORDS,
  type RegisterFormValues,
} from '@/lib/schemas/auth';
import { useRegister, useRegisterAuthor } from '@/hooks/useAuth';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import { getDashboardPath } from '@/lib/dashboard';
import { useImmersiveOverrideStore } from '@/stores/immersive-store';
import { PasswordInput } from './PasswordInput';
import { PasswordStrengthPanel } from './PasswordStrengthPanel';
import type { ApiResponse, AuthUser, Category } from '@/types/api';

interface RegisterFormProps {
  // Par défaut, redirige vers l'accueil (compte simple) ou le dashboard
  // (compte auteur) — surchargeable (ex. AuthModal).
  onSuccess?: (user: AuthUser) => void;
  // La modale de connexion rapide (gate de lecture) n'a pas la place pour un
  // onboarding en 4 étapes — désactivé là-bas, actif sur /inscription.
  enableAuthorOnboarding?: boolean;
}

const inputClass =
  'w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-amber/50 dark:border-white/20';
const labelClass = 'text-sm font-medium';

interface WizardStepMeta {
  eyebrow?: string;
  title: string;
  description?: string;
  fields: (keyof RegisterFormValues)[];
}

const WIZARD_STEPS: WizardStepMeta[] = [
  { title: 'Création de votre profil auteur', fields: ['fullName', 'readerName'] },
  { eyebrow: 'Enquête auprès des auteurs', title: 'Dis-nous à propos de vous', fields: ['about'] },
  { eyebrow: 'Enquête auprès des auteurs', title: 'Dans quel genre êtes-vous spécialisé ?', fields: ['genreIds'] },
  {
    title: 'Merci, nous vous connaissons mieux maintenant',
    description: 'Ces quelques informations nous aident à mieux vous accompagner et à mettre en valeur votre profil auprès des lecteurs.',
    fields: [],
  },
];

export function RegisterForm({ onSuccess, enableAuthorOnboarding = true }: RegisterFormProps = {}) {
  const router = useRouter();
  const registerUser = useRegister();
  const registerAuthor = useRegisterAuthor();
  // -1 = étape "compte" (email/mot de passe/case auteur) ; 0..3 = onboarding auteur.
  const [step, setStep] = useState(-1);
  // Le panneau flottant n'apparaît que pendant que le champ mot de passe a
  // le focus, et se referme dès qu'on clique ailleurs (blur) — jamais au
  // chargement de la page, jamais figé à l'écran.
  const [passwordFocused, setPasswordFocused] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: { isAuthor: false, name: '', email: '', password: '', confirmPassword: '', fullName: '', readerName: '', about: '', genreIds: [] },
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Category[]>>('/categories');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: enableAuthorOnboarding,
  });

  const values = watch();
  const isAuthor = enableAuthorOnboarding && values.isAuthor;
  const isWizard = isAuthor && step >= 0;
  const currentStepMeta = isWizard ? WIZARD_STEPS[step] : null;
  const isLastWizardStep = step === WIZARD_STEPS.length - 1;
  const mutation = isAuthor ? registerAuthor : registerUser;

  const setImmersiveForced = useImmersiveOverrideStore((state) => state.setForced);
  useEffect(() => {
    setImmersiveForced(isWizard);
    return () => setImmersiveForced(false);
  }, [isWizard, setImmersiveForced]);

  const onSubmit = handleSubmit((formValues) => {
    if (formValues.isAuthor) {
      registerAuthor.mutate(toRegisterAuthorPayload(formValues), {
        onSuccess: onSuccess ?? ((user) => router.push(getDashboardPath(user.role))),
      });
    } else {
      registerUser.mutate(
        { name: formValues.name!, email: formValues.email, password: formValues.password },
        { onSuccess: onSuccess ?? (() => router.push('/')) },
      );
    }
  });

  async function goToOnboarding() {
    const isValid = await trigger(['email', 'password', 'confirmPassword']);
    if (!isValid) return;
    setStep(0);
  }

  async function goNext() {
    if (!currentStepMeta) return;
    const isValid = await trigger(currentStepMeta.fields);
    if (!isValid) return;
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, -1));
  }

  function toggleGenre(id: number) {
    const current = values.genreIds ?? [];
    const next = current.includes(id) ? current.filter((g) => g !== id) : [...current, id];
    setValue('genreIds', next, { shouldValidate: true });
  }

  const aboutWordCount = countWords(values.about ?? '');
  const categories = categoriesQuery.data ?? [];

  return (
    <div className={`mx-auto w-full ${isWizard ? 'max-w-2xl' : 'max-w-sm'}`}>
      <div className="mb-6">
        {isWizard ? (
          <>
            {currentStepMeta?.eyebrow && (
              <p className="text-xs font-semibold tracking-wide text-brand-pink uppercase">{currentStepMeta.eyebrow}</p>
            )}
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{currentStepMeta?.title}</h1>
            {currentStepMeta?.description && (
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">{currentStepMeta.description}</p>
            )}
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-amber to-brand-pink transition-all duration-300"
                style={{ width: `${((step + 1) / WIZARD_STEPS.length) * 100}%` }}
              />
            </div>
          </>
        ) : (
          <h1 className="text-2xl font-semibold">Inscription</h1>
        )}
      </div>

      <form onSubmit={onSubmit} className={`flex flex-col gap-4 ${isWizard ? 'pb-24' : ''}`} noValidate>
        {step === -1 && (
          <>
            {!isAuthor && (
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className={labelClass}>
                  Nom
                </label>
                <input id="name" type="text" autoComplete="name" className={inputClass} {...register('name')} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input id="email" type="email" autoComplete="email" className={inputClass} {...register('email')} />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="relative flex flex-col gap-1">
              <label htmlFor="password" className={labelClass}>
                Mot de passe
              </label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                registration={register('password')}
                onFocus={() => setPasswordFocused(true)}
                onBlurCapture={() => setPasswordFocused(false)}
              />
              <PasswordStrengthPanel password={values.password ?? ''} visible={passwordFocused} />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirmer le mot de passe
              </label>
              <PasswordInput id="confirmPassword" autoComplete="new-password" registration={register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            {enableAuthorOnboarding && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-3 transition hover:border-black/20 dark:border-white/15 dark:hover:border-white/25">
                <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center">
                  <input type="checkbox" className="peer sr-only" {...register('isAuthor')} />
                  <span className="absolute inset-0 rounded-full bg-black/15 transition peer-checked:bg-gradient-to-r peer-checked:from-brand-amber peer-checked:to-brand-pink dark:bg-white/15" />
                  <span className="absolute left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5 dark:bg-neutral-900" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Feather size={14} className="text-brand-amber" />
                    Je suis auteur
                  </span>
                  <span className="mt-0.5 block text-xs text-black/50 dark:text-white/50">
                    Quelques questions en plus pour créer votre profil auteur.
                  </span>
                </span>
              </label>
            )}

            {mutation.isError && (
              <p className="text-sm text-red-600">{extractApiErrorMessage(mutation.error, 'Inscription impossible')}</p>
            )}

            {isAuthor ? (
              <button
                type="button"
                onClick={goToOnboarding}
                className="flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background"
              >
                Continuer
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={registerUser.isPending}
                className="rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
              >
                {registerUser.isPending ? 'Inscription…' : "S'inscrire"}
              </button>
            )}

            <p className="text-sm">
              Déjà un compte ?{' '}
              <Link href="/connexion" className="underline">
                Connectez-vous
              </Link>
            </p>
          </>
        )}

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="fullName" className={labelClass}>
                Nom complet
              </label>
              <input id="fullName" type="text" autoComplete="name" className={inputClass} {...register('fullName')} />
              {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="readerName" className={labelClass}>
                Nom pour les lecteurs
              </label>
              <input id="readerName" type="text" className={inputClass} {...register('readerName')} />
              <p className="text-xs text-black/45 dark:text-white/45">Le nom affiché publiquement sur vos livres.</p>
              {errors.readerName && <p className="text-sm text-red-600">{errors.readerName.message}</p>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-2">
            <textarea
              {...register('about')}
              rows={6}
              placeholder="Parlez-nous de votre parcours, votre style d'écriture, ce qui vous inspire…"
              className="w-full resize-none rounded-2xl border border-black/15 bg-transparent px-4 py-3.5 text-sm leading-relaxed outline-none transition focus:border-brand-amber/50 dark:border-white/20"
            />
            <div className="flex items-center justify-between">
              <span>{errors.about && <p className="text-sm text-red-600">{errors.about.message}</p>}</span>
              <span className={`shrink-0 text-xs ${aboutWordCount > MAX_ABOUT_WORDS ? 'font-semibold text-red-600' : 'text-black/40 dark:text-white/40'}`}>
                {aboutWordCount}/{MAX_ABOUT_WORDS} mots
              </span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            {categoriesQuery.isLoading ? (
              <p className="text-sm text-black/50 dark:text-white/50">Chargement des genres…</p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {categories.map((category) => {
                  const checked = (values.genreIds ?? []).includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      aria-pressed={checked}
                      onClick={() => toggleGenre(category.id)}
                      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                        checked
                          ? 'border-brand-amber/60 bg-gradient-to-r from-brand-amber/15 to-brand-pink/15 font-medium'
                          : 'border-black/10 hover:border-black/20 dark:border-white/15 dark:hover:border-white/25'
                      }`}
                    >
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded-md border transition ${
                          checked ? 'border-brand-amber bg-brand-amber text-black' : 'border-black/25 dark:border-white/25'
                        }`}
                      >
                        {checked && <Check size={11} />}
                      </span>
                      {category.name}
                    </button>
                  );
                })}
              </div>
            )}
            {errors.genreIds && <p className="text-sm text-red-600">{errors.genreIds.message}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-amber/25 bg-gradient-to-br from-brand-amber/10 to-brand-pink/10 p-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber to-brand-pink text-black">
              <PartyPopper size={22} />
            </span>
            <p className="text-sm text-black/70 dark:text-white/70">
              Vous êtes prêt·e à publier votre premier livre et à rejoindre la communauté des auteurs RabipekNovel.
            </p>
            {registerAuthor.isError && (
              <p className="text-sm text-red-600">{extractApiErrorMessage(registerAuthor.error, 'Inscription impossible')}</p>
            )}
          </div>
        )}
      </form>

      {isWizard && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-black/10 bg-background p-4 pb-[calc(env(safe-area-inset-bottom)_+_1rem)] dark:border-white/15">
          {isLastWizardStep ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={registerAuthor.isPending}
              className="mx-auto flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-8 py-3 text-sm font-semibold text-black shadow-lg shadow-brand-amber/20 disabled:opacity-50"
            >
              {registerAuthor.isPending ? <Loader2 size={16} className="animate-spin" /> : <Feather size={16} />}
              Profitez de l&apos;écriture
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2.5 text-sm font-medium dark:border-white/15"
              >
                <ChevronLeft size={16} />
                Précédent
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
