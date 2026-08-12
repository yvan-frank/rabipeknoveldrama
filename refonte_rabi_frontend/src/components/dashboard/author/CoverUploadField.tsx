'use client';

import { useRef, useState, type DragEvent } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

interface CoverUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

// Upload immédiat au choix du fichier : la couverture doit être une image
// hébergée par le serveur, pas un simple lien saisi par l'auteur. On envoie
// le fichier dès la sélection/dépôt et on récupère une URL utilisable
// directement comme n'importe quel champ `cover` texte lors de la création du livre.
export function CoverUploadField({ value, onChange, error }: CoverUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  async function uploadFile(file: File) {
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('cover', file);
      // `postForm` (pas `post`) : l'instance apiClient fixe un Content-Type
      // JSON par défaut, qui casserait le multipart s'il n'était pas
      // explicitement remplacé par la bonne boundary générée par axios.
      const { data } = await apiClient.postForm<ApiResponse<{ url: string }>>('/uploads/cover', formData);
      if (!data.success) throw new Error(data.message);
      onChange(data.data.url);
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
    <div>
      <label className="text-xs font-medium text-black/60 dark:text-white/60">Image de couverture</label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`mt-1 flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${
          isDraggingOver ? 'border-brand-amber bg-brand-amber/5' : 'border-black/15 hover:border-brand-amber/50 dark:border-white/20'
        }`}
      >
        {value ? (
          <div className="relative">
            {/* Aperçu servi par le backend, pas next/image (domaine dynamique en dev). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Couverture" width={112} height={160} className="h-40 w-28 rounded-lg object-cover shadow-md" />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange('');
              }}
              aria-label="Retirer l'image"
              className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-neutral-900 text-white shadow"
            >
              <X size={13} />
            </button>
          </div>
        ) : isUploading ? (
          <Loader2 size={26} className="animate-spin text-brand-amber" />
        ) : (
          <>
            <ImagePlus size={28} className="text-black/30 dark:text-white/30" />
            <p className="text-sm text-black/60 dark:text-white/60">Glissez une image ici ou cliquez pour la choisir</p>
            <p className="text-xs text-black/40 dark:text-white/40">JPG, PNG ou WebP — 5 Mo max</p>
          </>
        )}
        {isUploading && <p className="text-xs text-brand-amber">Envoi en cours…</p>}
      </div>

      {value && !isUploading && (
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-2 text-xs text-black/60 hover:underline dark:text-white/60">
          Changer l&apos;image
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadFile(file);
          event.target.value = '';
        }}
      />

      {(uploadError || error) && <p className="mt-1 text-xs text-red-600">{uploadError ?? error}</p>}
    </div>
  );
}
