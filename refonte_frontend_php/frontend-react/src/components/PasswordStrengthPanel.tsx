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
    <ul className={`password-strength${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <li key={rule.id} className={passed ? 'is-passed' : ''}>
            {passed ? '✓' : '✕'} {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
