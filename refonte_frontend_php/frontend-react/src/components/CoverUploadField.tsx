import { useRef, useState, type DragEvent } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';

interface Props {
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

// Port fidèle de
// refonte_rabi_frontend/src/components/dashboard/author/CoverUploadField.tsx :
// upload immédiat au choix/dépôt du fichier (clic ou glisser-déposer),
// aperçu avec bouton de retrait, "Changer l'image" une fois envoyée.
export function CoverUploadField({ value, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  async function uploadFile(file: File) {
    setIsUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append('cover', file);
      // postForm (pas post) : l'instance apiClient fixe un Content-Type JSON
      // par défaut, qui casse le multipart s'il n'est pas explicitement
      // remplacé par la bonne boundary générée par axios.
      const res = await apiClient.postForm('/uploads/cover', body);
      onChange(res.data?.data?.url ?? '');
    } catch (err) {
      setUploadError(extractApiErrorMessage(err, "Impossible d'envoyer l'image"));
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.8rem] opacity-85">Image de couverture</span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`flex min-h-40 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          isDraggingOver ? 'border-brand-amber bg-brand-amber/5' : 'border-black/10 dark:border-white/10'
        }`}
      >
        {value ? (
          <div className="relative">
            <img src={value} alt="Couverture" className="h-40 w-28 rounded-[0.6rem] object-cover shadow-[0_8px_20px_rgb(0_0_0/20%)]" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              aria-label="Retirer l'image"
              className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border-none bg-neutral-900 text-sm leading-none text-white"
            >
              ×
            </button>
          </div>
        ) : isUploading ? (
          <span className="text-[0.8rem] opacity-60">Envoi…</span>
        ) : (
          <>
            <span className="text-2xl">🖼️</span>
            <p className="m-0 text-sm opacity-75">Glissez une image ici ou cliquez pour la choisir</p>
            <p className="m-0 text-xs opacity-50">JPG, PNG ou WebP — 5 Mo max</p>
          </>
        )}
        {isUploading && <p className="m-0 text-[0.8rem] opacity-60">Envoi en cours…</p>}
      </div>

      {value && !isUploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="self-start border-none bg-none p-0 text-xs text-brand-amber underline"
        >
          Changer l'image
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
          e.target.value = '';
        }}
      />

      {(uploadError || error) && <p className="text-sm text-rose-600">{uploadError ?? error}</p>}
    </div>
  );
}
