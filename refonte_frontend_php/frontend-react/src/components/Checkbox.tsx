import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  // Aligne la case sur la première ligne plutôt qu'au centre — pour un
  // libellé multi-lignes (ex. case "carte" avec titre + description).
  alignTop?: boolean;
}

// Case à cocher personnalisée (case verre + coche dégradée amber→pink au
// lieu du rendu natif du navigateur) — l'<input> reste réel et fonctionnel
// (sr-only : accessible, focusable au clavier), seule l'apparence est
// remplacée par le <span> voisin piloté en `peer-*`.
export function Checkbox({ checked, onChange, disabled, children, className, alignTop }: Props) {
  return (
    <label
      className={`inline-flex gap-2.5 ${alignTop ? 'items-start' : 'items-center'} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className ?? ''}`}
    >
      <span className={`relative inline-flex shrink-0 ${alignTop ? 'mt-0.5' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <span
          className={`flex size-[18px] items-center justify-center rounded-[6px] border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-amber/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white peer-focus-visible:dark:ring-offset-[#0b0b10] ${
            checked
              ? 'border-transparent bg-gradient-to-br from-brand-amber to-brand-pink'
              : 'border-black/20 bg-white peer-hover:border-black/40 dark:border-white/20 dark:bg-black/20 dark:peer-hover:border-white/40'
          }`}
        >
          <Check size={12} strokeWidth={3.5} className={`text-neutral-950 transition-opacity duration-100 ${checked ? 'opacity-100' : 'opacity-0'}`} />
        </span>
      </span>
      {children}
    </label>
  );
}
