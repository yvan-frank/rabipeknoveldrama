'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, ShieldCheck, ShieldX, TriangleAlert } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import type { ApiResponse, AuthorKycBypassPolicy, AuthorKycReviewItem } from '@/types/api';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  cni: "Carte nationale d'identité",
  passeport: 'Passeport',
  autre: 'Autre pièce',
};

export function AdminKycSection() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const kycQuery = useQuery({
    queryKey: ['admin', 'kyc'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AuthorKycReviewItem[]>>('/authors/kyc');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });

  const kycBypassQuery = useQuery({
    queryKey: ['admin', 'kyc-bypass'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AuthorKycBypassPolicy>>('/authors/kyc-bypass');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });

  const setVerification = useMutation({
    mutationFn: async ({ authorId, verified }: { authorId: number; verified: boolean }) => {
      const { data } = await apiClient.patch<ApiResponse<unknown>>(`/authors/${authorId}/kyc-verification`, { verified });
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] }),
  });

  const setKycBypass = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data } = await apiClient.patch<ApiResponse<AuthorKycBypassPolicy>>('/authors/kyc-bypass', { enabled });
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (policy) => queryClient.setQueryData(['admin', 'kyc-bypass'], policy),
  });

  if (kycQuery.isLoading || kycBypassQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-[1.75rem] bg-black/[0.04] dark:bg-white/[0.06]" />;
  }
  if (kycQuery.isError || kycBypassQuery.isError || !kycQuery.data || !kycBypassQuery.data) {
    return (
      <p className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-600 dark:text-rose-100">
        {extractApiErrorMessage(kycQuery.error, 'Impossible de charger les KYC.')}
      </p>
    );
  }

  const authors = kycQuery.data;
  const pending = authors.filter((a) => a.isComplete && !a.isVerified);
  const others = authors.filter((a) => !(a.isComplete && !a.isVerified));
  const ordered = [...pending, ...others];
  const bypassEnabled = kycBypassQuery.data.enabled;

  return (
    <section className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 sm:p-6 dark:border-white/8 dark:bg-white/[0.035]">
      <h2 className="text-xl font-bold">Vérification KYC des auteurs</h2>
      <p className="mt-1 text-sm text-black/45 dark:text-white/45">
        {pending.length} soumission{pending.length > 1 ? 's' : ''} en attente de vérification.
      </p>

      <div className="mt-5 rounded-2xl border border-black/8 bg-black/[0.025] p-4 dark:border-white/8 dark:bg-white/[0.04]">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${bypassEnabled ? 'bg-amber-400/15 text-amber-600 dark:text-amber-300' : 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-300'}`}>
            {bypassEnabled ? <TriangleAlert size={18} /> : <ShieldCheck size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">Accès des auteurs sans KYC validé</h3>
            <p className="mt-1 text-xs leading-5 text-black/50 dark:text-white/50">
              Ce réglage s&apos;applique immédiatement aux auteurs déjà inscrits et aux futurs comptes auteurs.
            </p>
          </div>
        </div>

        <div role="radiogroup" aria-label="Politique KYC des auteurs" className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            role="radio"
            aria-checked={!bypassEnabled}
            disabled={setKycBypass.isPending}
            onClick={() => setKycBypass.mutate(false)}
            className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition disabled:opacity-50 ${
              !bypassEnabled
                ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200'
                : 'border-black/8 hover:bg-black/[0.04] dark:border-white/8 dark:hover:bg-white/[0.06]'
            }`}
          >
            <span className={`flex size-4 items-center justify-center rounded-full border ${!bypassEnabled ? 'border-current' : 'border-black/30 dark:border-white/30'}`}>
              {!bypassEnabled && <span className="size-2 rounded-full bg-current" />}
            </span>
            Exiger le KYC
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={bypassEnabled}
            disabled={setKycBypass.isPending}
            onClick={() => setKycBypass.mutate(true)}
            className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition disabled:opacity-50 ${
              bypassEnabled
                ? 'border-amber-400/45 bg-amber-400/12 text-amber-700 dark:text-amber-200'
                : 'border-black/8 hover:bg-black/[0.04] dark:border-white/8 dark:hover:bg-white/[0.06]'
            }`}
          >
            <span className={`flex size-4 items-center justify-center rounded-full border ${bypassEnabled ? 'border-current' : 'border-black/30 dark:border-white/30'}`}>
              {bypassEnabled && <span className="size-2 rounded-full bg-current" />}
            </span>
            Bypasser le KYC
          </button>
        </div>

        {bypassEnabled && (
          <p className="mt-3 text-xs leading-5 text-amber-700 dark:text-amber-200">
            Les auteurs peuvent publier sans pièce d&apos;identité ni validation administrative tant que cette option reste active.
          </p>
        )}
        {setKycBypass.isError && (
          <p className="mt-3 text-xs text-rose-600 dark:text-rose-300">
            {extractApiErrorMessage(setKycBypass.error, 'Impossible de modifier la politique KYC.')}
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {ordered.length === 0 ? (
          <p className="py-6 text-center text-sm text-black/45 dark:text-white/45">Aucun auteur n&apos;a encore soumis de KYC.</p>
        ) : (
          ordered.map((author) => (
            <AuthorKycRow
              key={author.id}
              author={author}
              isExpanded={expandedId === author.id}
              onToggle={() => setExpandedId((id) => (id === author.id ? null : author.id))}
              onVerify={(verified) => setVerification.mutate({ authorId: author.id, verified })}
              isSubmitting={setVerification.isPending}
            />
          ))
        )}
      </div>
    </section>
  );
}

function AuthorKycRow({
  author,
  isExpanded,
  onToggle,
  onVerify,
  isSubmitting,
}: {
  author: AuthorKycReviewItem;
  isExpanded: boolean;
  onToggle: () => void;
  onVerify: (verified: boolean) => void;
  isSubmitting: boolean;
}) {
  const ext = author.extension;

  return (
    <div className="rounded-2xl border border-black/8 dark:border-white/8">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-rose-500 text-sm font-bold text-neutral-950">
            {(author.name ?? author.email).slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{author.name ?? author.email}</p>
            <p className="truncate text-xs text-black/45 dark:text-white/45">{author.email}</p>
          </div>
        </div>
        <StatusBadge author={author} />
      </button>

      {isExpanded && (
        <div className="border-t border-black/8 p-4 dark:border-white/8">
          {!ext ? (
            <p className="text-sm text-black/45 dark:text-white/45">Aucune donnée KYC.</p>
          ) : (
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <DetailRow label="Nom complet" value={ext.fullName} />
              <DetailRow label="Pays" value={ext.country} />
              <DetailRow label="Adresse" value={ext.address} />
              <DetailRow label="Type de document" value={ext.documentType ? DOCUMENT_TYPE_LABELS[ext.documentType] : null} />
              <DetailRow label="Numéro du document" value={ext.documentId} />
              <DetailRow label="Politique de confidentialité" value={ext.privacyAcceptedAt ? 'Acceptée' : 'Non acceptée'} />
            </div>
          )}

          {ext?.documents && (
            <a
              href={ext.documents}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-amber hover:underline"
            >
              Voir la pièce d&apos;identité
              <ExternalLink size={13} />
            </a>
          )}

          {ext?.socialLinks && Object.keys(ext.socialLinks).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(ext.socialLinks).map(([key, url]) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-black/5 px-2.5 py-1 text-xs capitalize hover:underline dark:bg-white/10"
                >
                  {key}
                </a>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            {author.isVerified ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onVerify(false)}
                className="flex items-center gap-1.5 rounded-full border border-rose-400/30 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-400/10 disabled:opacity-50 dark:text-rose-300"
              >
                <ShieldX size={14} />
                Révoquer la vérification
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !author.isComplete}
                onClick={() => onVerify(true)}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
              >
                <ShieldCheck size={14} />
                Vérifier le KYC
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ author }: { author: AuthorKycReviewItem }) {
  if (author.isVerified) {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
        <CheckCircle2 size={12} />
        Vérifié
      </span>
    );
  }
  if (author.isComplete) {
    return (
      <span className="shrink-0 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-300">
        En attente
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/45 dark:bg-white/10 dark:text-white/45">
      Incomplet
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-black/45 dark:text-white/45">{label}</p>
      <p className="font-medium">{value ?? '—'}</p>
    </div>
  );
}
