'use client';

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

const DEBOUNCE_MS = 400;

export function SearchBar({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? '');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function updateUrl(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue) {
      params.set('recherche', nextValue);
    } else {
      params.delete('recherche');
    }
    params.delete('page');
    router.push(`/livres?${params.toString()}`);
  }

  function handleChange(nextValue: string) {
    setValue(nextValue);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => updateUrl(nextValue), DEBOUNCE_MS);
  }

  function handleClear() {
    clearTimeout(timeoutRef.current);
    setValue('');
    updateUrl('');
  }

  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
      <input
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Rechercher un titre…"
        className="w-full rounded-full border border-black/10 bg-transparent py-2.5 pr-10 pl-10 text-sm outline-none focus:border-brand-amber/50 dark:border-white/10"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Effacer la recherche"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-black/40 dark:text-white/40"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
