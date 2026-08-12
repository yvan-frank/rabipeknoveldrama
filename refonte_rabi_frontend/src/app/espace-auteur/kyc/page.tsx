import { AuthorShell } from '@/components/dashboard/author/AuthorShell';
import { KycForm } from '@/components/dashboard/author/KycForm';

export default function KycPage() {
  return (
    <AuthorShell>
      <div>
        <h2 className="text-lg font-semibold">Vérification d&apos;identité (KYC)</h2>
        <p className="mt-1 text-sm text-black/45 dark:text-white/45">
          Ces informations sont requises avant de pouvoir gérer vos livres et chapitres.
        </p>
      </div>
      <KycForm />
    </AuthorShell>
  );
}
