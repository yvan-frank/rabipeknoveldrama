import { AuthorShell } from '@/components/dashboard/author/AuthorShell';
import { AuthorStatistics } from '@/components/dashboard/author/AuthorStatistics';

export default function StatistiquesPage() {
  return (
    <AuthorShell>
      <AuthorStatistics />
    </AuthorShell>
  );
}
