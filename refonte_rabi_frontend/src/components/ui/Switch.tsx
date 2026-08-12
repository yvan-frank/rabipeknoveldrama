'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';

interface SwitchProps {
  label: string;
  description?: React.ReactNode;
  registration: UseFormRegisterReturn;
}

// Toggle custom (checkbox natif masqué + rendu visuel piloté par `peer-checked`)
// — garde le comportement/accessibilité natif du checkbox tout en remplaçant
// son apparence par défaut, non désirée ("les checkbox doivent être customisés").
export function Switch({ label, description, registration }: SwitchProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-3 transition hover:border-black/20 dark:border-white/15 dark:hover:border-white/25">
      <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center">
        <input type="checkbox" className="peer sr-only" {...registration} />
        <span className="absolute inset-0 rounded-full bg-black/15 transition peer-checked:bg-gradient-to-r peer-checked:from-brand-amber peer-checked:to-brand-pink dark:bg-white/15" />
        <span className="absolute left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5 dark:bg-neutral-900" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-black/50 dark:text-white/50">{description}</span>}
      </span>
    </label>
  );
}
