import { AuthorShell } from '@/components/dashboard/author/AuthorShell';

export default function RevenusPage() {
  return (
    <AuthorShell>
      <section className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 sm:p-6 dark:border-white/8 dark:bg-white/[0.035]">
        <h2 className="text-xl font-bold">Revenus</h2>
        <p className="mt-1 text-sm text-black/45 dark:text-white/45">
          Le suivi des ventes et des reversements sera ajouté à cette section une fois le parcours d&apos;achat en ligne
          disponible.
        </p>
      </section>
    </AuthorShell>
  );
}
