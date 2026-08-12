'use client';

import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

type Listener = () => void;
let listeners: Listener[] = [];

// La classe `.dark` sur <html> est déjà posée avant l'hydratation par le
// script anti-flash (voir layout.tsx). `useSyncExternalStore` est fait pour
// exactement ce cas — un état vivant hors de React (le DOM) — et gère seul
// la synchronisation post-hydratation sans mismatch ni setState-in-effect.
function getSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getServerSnapshot(): Theme {
  return 'light';
}

function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function applyTheme(next: Theme) {
  document.documentElement.classList.toggle('dark', next === 'dark');
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleTheme() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return { theme, toggleTheme };
}
