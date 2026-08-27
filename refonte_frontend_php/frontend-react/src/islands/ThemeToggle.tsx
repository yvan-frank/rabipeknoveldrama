import { useEffect, useState } from 'react';

// Meme logique que refonte_rabi_frontend/src/hooks/useTheme.ts : bascule la
// classe .dark sur <html> et persiste le choix dans localStorage (le script
// anti-flash de layout.php lit cette meme cle au chargement suivant).
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      // stockage indisponible (navigation privee) - pas bloquant
    }
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark((v) => !v)}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      style={{
        width: 32,
        height: 32,
        borderRadius: '9999px',
        border: '1px solid var(--border)',
        background: 'transparent',
        cursor: 'pointer',
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
