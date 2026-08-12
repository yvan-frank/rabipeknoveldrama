import { AuthorShell } from '@/components/dashboard/author/AuthorShell';
import { AuthorBooksSection } from '@/components/dashboard/author/AuthorBooksSection';

export default function MesLivresPage() {
  return (
    <AuthorShell>
      <AuthorBooksSection />
    </AuthorShell>
  );
}
