export function LegalPageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <div
        className="flex flex-col gap-4 text-sm leading-relaxed text-black/70 dark:text-white/70
          [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground
          [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-2
          [&_a]:text-brand-amber [&_a]:underline
          [&_strong]:font-semibold [&_strong]:text-foreground"
      >
        {children}
      </div>
    </div>
  );
}
