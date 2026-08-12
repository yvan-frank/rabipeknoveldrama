import { AuthorShell } from '@/components/dashboard/author/AuthorShell';
import { BookManageDashboard } from '@/components/dashboard/author/BookManageDashboard';

interface GererLivrePageProps {
  params: Promise<{ id: string }>;
}

export default async function GererLivrePage({ params }: GererLivrePageProps) {
  const { id } = await params;

  return (
    <AuthorShell>
      <BookManageDashboard bookId={Number(id)} />
    </AuthorShell>
  );
}
