import { PASSWORD_RULES } from '../lib/auth';

interface Props {
  password: string;
  visible: boolean;
}

// Carte flottante ancrée sous le champ mot de passe (le conteneur
// .password-input est en position relative) — port de
// refonte_rabi_frontend/src/components/forms/PasswordStrengthPanel.tsx.
export function PasswordStrengthPanel({ password, visible }: Props) {
  return (
    <ul
      aria-hidden={!visible}
      className={`grid grid-cols-2 gap-x-4 gap-y-1.5 overflow-hidden rounded-xl border border-black/10 bg-white text-xs shadow-[0_10px_30px_rgb(0_0_0/12%)] transition-[opacity,max-height] duration-150 dark:border-white/10 dark:bg-neutral-900 ${
        visible ? 'mt-2 max-h-40 py-3 opacity-100' : 'max-h-0 py-0 opacity-0'
      }`}
    >
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <li key={rule.id} className={passed ? 'text-emerald-500 opacity-100' : 'opacity-50'}>
            {passed ? '✓' : '✕'} {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
