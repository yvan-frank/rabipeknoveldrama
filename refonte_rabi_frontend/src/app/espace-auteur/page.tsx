import { AuthorShell } from '@/components/dashboard/author/AuthorShell';
import { AuthorOverview } from '@/components/dashboard/author/AuthorOverview';

export default function EspaceAuteurPage() {
  return (
    <AuthorShell>
      <AuthorOverview />
    </AuthorShell>
  );
}
