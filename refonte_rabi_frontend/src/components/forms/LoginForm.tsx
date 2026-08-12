'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '@/lib/schemas/auth';
import { useLogin } from '@/hooks/useAuth';
import { extractApiErrorMessage } from '@/lib/api-client';
import { getDashboardPath } from '@/lib/dashboard';
import { PasswordInput } from './PasswordInput';
import type { AuthUser } from '@/types/api';

interface LoginFormProps {
  // Par défaut, redirige vers le tableau de bord du rôle — surchargeable
  // (ex. AuthModal referme la modale et laisse l'appelant sur place).
  onSuccess?: (user: AuthUser) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps = {}) {
  const router = useRouter();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: onSuccess ?? ((user) => router.replace(getDashboardPath(user.role))),
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </label>
        <PasswordInput id="password" autoComplete="current-password" registration={register('password')} />
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {login.isError && (
        <p className="text-sm text-red-600">{extractApiErrorMessage(login.error, 'Connexion impossible')}</p>
      )}

      <button
        type="submit"
        disabled={login.isPending}
        className="rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {login.isPending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}
