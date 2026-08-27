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
    <div className="cover-upload">
      <span className="book-form__field-label">Image de couverture</span>
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
        className={`cover-upload__zone${isDraggingOver ? ' is-dragging' : ''}`}
      >
        {value ? (
          <div className="cover-upload__preview">
            <img src={value} alt="Couverture" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              aria-label="Retirer l'image"
            >
              ×
            </button>
          </div>
        ) : isUploading ? (
          <span className="cover-upload__spinner">Envoi…</span>
        ) : (
          <>
            <span className="cover-upload__icon">🖼️</span>
            <p>Glissez une image ici ou cliquez pour la choisir</p>
            <p className="cover-upload__hint">JPG, PNG ou WebP — 5 Mo max</p>
          </>
        )}
        {isUploading && <p className="cover-upload__uploading">Envoi en cours…</p>}
      </div>

      {value && !isUploading && (
        <button type="button" className="cover-upload__change" onClick={() => inputRef.current?.click()}>
          Changer l'image
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="cover-upload__input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
          e.target.value = '';
        }}
      />

      {(uploadError || error) && <p className="review-form__error">{uploadError ?? error}</p>}
    </div>
  );
}
