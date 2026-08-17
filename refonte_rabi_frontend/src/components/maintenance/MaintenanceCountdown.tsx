'use client';

import { useEffect, useState } from 'react';

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

// Cette échéance est volontairement fixe : chaque visiteur voit le même temps restant.
// Modifiez cette valeur pour déplacer la date de réouverture.
const MAINTENANCE_END_DATE = '2026-09-14T12:00:00+02:00';

function getCountdown(target: Date): Countdown {
  const distance = Math.max(0, target.getTime() - Date.now());

  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1_000) % 60),
  };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function MaintenanceCountdown() {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    const target = new Date(MAINTENANCE_END_DATE);

    const updateCountdown = () => setCountdown(getCountdown(target));
    updateCountdown();

    const interval = window.setInterval(updateCountdown, 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const units = [
    { label: 'Jours', value: countdown?.days },
    { label: 'Heures', value: countdown?.hours },
    { label: 'Minutes', value: countdown?.minutes },
    { label: 'Secondes', value: countdown?.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4" aria-label="Temps restant avant le retour de RabipekNovel">
      {units.map(({ label, value }) => (
        <div
          key={label}
          className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-2 py-4 text-center shadow-lg shadow-black/10 backdrop-blur-sm sm:px-5 sm:py-5"
        >
          <p className="bg-gradient-to-b from-white to-white/65 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
            {value === undefined ? '--' : pad(value)}
          </p>
          <p className="mt-1.5 text-[9px] font-semibold tracking-[0.16em] text-white/45 uppercase sm:text-[10px]">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
