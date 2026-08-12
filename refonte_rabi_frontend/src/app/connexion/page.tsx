import Link from 'next/link';
import { LoginForm } from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Connexion</h1>
      <LoginForm />
      <p className="text-sm">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="underline">
          Inscrivez-vous
        </Link>
      </p>
    </div>
  );
}
