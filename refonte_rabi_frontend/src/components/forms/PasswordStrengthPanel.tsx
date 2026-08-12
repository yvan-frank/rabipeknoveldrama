'use client';

import { Check, X } from 'lucide-react';
import { PASSWORD_RULES } from '@/lib/schemas/auth';

interface PasswordStrengthPanelProps {
  password: string;
  visible: boolean;
}

// Carte flottante (position absolute, ancrée sur le champ mot de passe via
// le conteneur `relative` parent) — affichée seulement une fois le champ
// touché (focus ou sortie), jamais au chargement de la page. Flotte
// au-dessus du contenu plutôt que de pousser la mise en page (pas de
// montage/démontage abrupt : transition fondu + léger décalage vertical,
// ça ne "fige" jamais l'affichage).
export function PasswordStrengthPanel({ password, visible }: PasswordStrengthPanelProps) {
  return (
    <div
      aria-hidden={!visible}
      className={`absolute top-full left-0 z-20 mt-2 w-full origin-top rounded-xl border border-black/10 bg-background p-3 text-xs shadow-xl transition-all duration-200 ease-out dark:border-white/10 ${
        visible ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
      }`}
    >
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-1.5 transition-colors ${
                passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-black/45 dark:text-white/45'
              }`}
            >
              {passed ? <Check size={13} className="shrink-0" /> : <X size={13} className="shrink-0" />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
