import { AuthorShell } from '@/components/dashboard/author/AuthorShell';
import { BookWizard } from '@/components/dashboard/author/BookWizard';

export default function NouveauLivrePage() {
  return (
    <AuthorShell>
      <div>
        <h2 className="text-lg font-semibold">Nouveau livre</h2>
        <p className="mt-1 text-sm text-black/45 dark:text-white/45">Publiez un nouveau livre en quelques étapes.</p>
      </div>
      <BookWizard />
    </AuthorShell>
  );
}
