import { AuthorShell } from '@/components/dashboard/author/AuthorShell';
import { AuthorSettingsSection } from '@/components/dashboard/author/AuthorSettingsSection';

export default function ParametresAuteurPage() {
  return (
    <AuthorShell>
      <AuthorSettingsSection />
    </AuthorShell>
  );
}
