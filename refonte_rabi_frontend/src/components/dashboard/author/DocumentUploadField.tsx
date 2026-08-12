'use client';

import { useRef, useState, type DragEvent } from 'react';
import { CheckCircle2, FileText, Loader2, X } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

interface DocumentUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  error?: string;
  disabled?: boolean;
}

// Upload de la pièce d'identité (KYC) — image ou PDF, envoyé dès le dépôt du
// fichier vers un stockage dédié (distinct des couvertures de livre).
export function DocumentUploadField({ value, onChange, error, disabled }: DocumentUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  async function uploadFile(file: File) {
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('document', file);
      const { data } = await apiClient.postForm<ApiResponse<{ url: string }>>('/uploads/document', formData);
      if (!data.success) throw new Error(data.message);
      setFileName(file.name);
      onChange(data.data.url);
    } catch (err) {
      setUploadError(extractApiErrorMessage(err, "Impossible d'envoyer le document"));
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  return (
    <div>
      <label className="text-xs font-medium text-black/60 dark:text-white/60">Pièce d&apos;identité (CNI, passeport ou autre)</label>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`mt-1 flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${
          disabled
            ? 'cursor-not-allowed border-black/10 opacity-60 dark:border-white/10'
            : `cursor-pointer ${isDraggingOver ? 'border-brand-amber bg-brand-amber/5' : 'border-black/15 hover:border-brand-amber/50 dark:border-white/20'}`
        }`}
      >
        {isUploading ? (
          <Loader2 size={26} className="animate-spin text-brand-amber" />
        ) : value ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <span className="text-sm">{fileName ?? 'Document envoyé'}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange('');
                  setFileName(null);
                }}
                aria-label="Retirer le document"
                className="flex size-6 items-center justify-center rounded-full text-black/40 hover:bg-black/5 dark:text-white/40 dark:hover:bg-white/10"
              >
                <X size={13} />
              </button>
            )}
          </div>
        ) : (
          <>
            <FileText size={26} className="text-black/30 dark:text-white/30" />
            <p className="text-sm text-black/60 dark:text-white/60">Glissez le document ici ou cliquez pour le choisir</p>
            <p className="text-xs text-black/40 dark:text-white/40">JPG, PNG, WebP ou PDF — 8 Mo max</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        disabled={disabled}
        accept="image/jpeg,image/png,image/webp,application/pdf"
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
