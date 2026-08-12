'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

// Wrapper stylé autour d'un <select> natif : on garde le comportement/clavier
// natif (contrairement à un listbox custom, plus lourd à rendre accessible),
// mais on masque le rendu par défaut du navigateur pour un style cohérent
// avec le reste du design system, clair/sombre inclus.
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        {...props}
        className={`w-full appearance-none rounded-lg border border-black/15 bg-transparent px-3 py-2 pr-9 text-sm outline-none focus:border-brand-amber/50 dark:border-white/20 ${className ?? ''}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-background text-foreground">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-black/40 dark:text-white/40" />
    </div>
  );
});
