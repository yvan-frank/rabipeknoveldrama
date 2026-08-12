import { WifiOff } from 'lucide-react';

export function ApiUnavailableNotice({
  message = 'Le service est momentanément indisponible. Réessayez dans un instant.',
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 px-6 py-16 text-center dark:border-white/10">
      <WifiOff size={28} className="text-black/40 dark:text-white/40" />
      <p className="text-sm text-black/60 dark:text-white/60">{message}</p>
    </div>
  );
}
