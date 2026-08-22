'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileArchive, RefreshCw } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import type { ApiResponse, EpubEdition } from '@/types/api';

function formatSize(bytes: number | null) {
  if (bytes === null) return null;
  return bytes < 1_000_000 ? `${Math.ceil(bytes / 1_000)} Ko` : `${(bytes / 1_000_000).toFixed(1)} Mo`;
}

function statusLabel(status: EpubEdition['status']) {
  return { QUEUED: 'En attente', PROCESSING: 'Génération…', READY: 'Prête', FAILED: 'Échec' }[status];
}

export function EpubEditionsPanel({ bookId, chapterCount }: { bookId: number; chapterCount: number }) {
  const queryClient = useQueryClient();
  const editions = useQuery({
    queryKey: ['author', 'book', bookId, 'epub-editions'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<EpubEdition[]>>(`/books/${bookId}/epub-editions`);
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    refetchInterval: (query) => query.state.data?.some((edition) => edition.status === 'QUEUED' || edition.status === 'PROCESSING') ? 2_500 : false,
  });

  const generate = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<EpubEdition>>(`/books/${bookId}/epub-editions`);
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['author', 'book', bookId, 'epub-editions'] }),
  });

  const download = useMutation({
    mutationFn: async (edition: EpubEdition) => {
      const response = await apiClient.get(`/epub-editions/${edition.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `livre-version-${edition.version}.epub`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
  });

  const activeEdition = editions.data?.find((edition) => edition.status === 'QUEUED' || edition.status === 'PROCESSING');

  return (
    <section className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 sm:p-6 dark:border-white/8 dark:bg-white/[0.035]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><FileArchive size={20} /><h2 className="text-xl font-bold">Éditions EPUB</h2></div>
          <p className="mt-1 text-sm text-black/50 dark:text-white/50">Générez un fichier EPUB versionné à partir des {chapterCount} chapitres du livre.</p>
        </div>
        <button type="button" onClick={() => generate.mutate()} disabled={!chapterCount || generate.isPending || Boolean(activeEdition)} className="inline-flex items-center gap-2 rounded-xl bg-brand-amber px-4 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw size={16} className={generate.isPending || activeEdition ? 'animate-spin' : ''} />
          {activeEdition ? statusLabel(activeEdition.status) : 'Générer une édition'}
        </button>
      </div>

      {!chapterCount && <p className="mt-4 text-sm text-amber-700 dark:text-amber-200">Ajoutez au moins un chapitre avant de générer un EPUB.</p>}
      {generate.isError && <p className="mt-4 text-sm text-rose-600">{extractApiErrorMessage(generate.error, 'Impossible de lancer la génération EPUB.')}</p>}
      {editions.isError && <p className="mt-4 text-sm text-rose-600">{extractApiErrorMessage(editions.error, 'Impossible de charger les éditions EPUB.')}</p>}

      {editions.data && editions.data.length > 0 && (
        <ul className="mt-5 divide-y divide-black/8 rounded-xl border border-black/8 dark:divide-white/10 dark:border-white/10">
          {editions.data.map((edition) => (
            <li key={edition.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5">
              <div>
                <p className="font-medium">Version {edition.version}{edition.isCurrent ? <span className="ml-2 text-xs font-normal text-emerald-600 dark:text-emerald-300">à jour</span> : <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-200">contenu modifié</span>}</p>
                <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">{statusLabel(edition.status)}{formatSize(edition.fileSizeBytes) ? ` · ${formatSize(edition.fileSizeBytes)}` : ''}{edition.generatedAt ? ` · ${new Date(edition.generatedAt).toLocaleString('fr-FR')}` : ''}</p>
                {edition.errorMessage && <p className="mt-1 text-xs text-rose-600">{edition.errorMessage}</p>}
              </div>
              {edition.status === 'READY' && <button type="button" onClick={() => download.mutate(edition)} disabled={download.isPending} className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"><Download size={15} />Télécharger</button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
