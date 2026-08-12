'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Gift, LoaderCircle, Trash2 } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import type { ApiResponse, AuthorBookListItem, Paginated } from '@/types/api';

interface AdminUser {
  id: number;
  name: string | null;
  email: string;
  isActive: boolean;
}

interface BookGrantResult {
  user: Pick<AdminUser, 'id' | 'name' | 'email'>;
  book: { id: number; title: string; slug: string };
}

interface BookGrantHistoryItem extends BookGrantResult {
  id: number;
  date: string;
  note: string | null;
}

interface SelectOption {
  value: string;
  label: string;
  detail?: string;
}

export function AdminBookGrantSection() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState('');
  const [bookId, setBookId] = useState('');
  const [note, setNote] = useState('');
  const [lastGrant, setLastGrant] = useState<BookGrantResult | null>(null);
  const [grantPage, setGrantPage] = useState(1);
  const [grantToRevoke, setGrantToRevoke] = useState<number | null>(null);

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'book-grants'],
    queryFn: async () => {
      const { data: firstPage } = await apiClient.get<ApiResponse<Paginated<AdminUser>>>('/users', { params: { page: 1, pageSize: 100 } });
      if (!firstPage.success) throw new Error(firstPage.message);
      const pageCount = Math.ceil(firstPage.data.total / firstPage.data.pageSize);
      if (pageCount <= 1) return firstPage.data.items;

      const remainingPages = await Promise.all(
        Array.from({ length: pageCount - 1 }, async (_, index) => {
          const { data } = await apiClient.get<ApiResponse<Paginated<AdminUser>>>('/users', { params: { page: index + 2, pageSize: 100 } });
          if (!data.success) throw new Error(data.message);
          return data.data.items;
        }),
      );
      return [...firstPage.data.items, ...remainingPages.flat()];
    },
  });
  const booksQuery = useQuery({
    queryKey: ['admin', 'books', 'book-grants'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AuthorBookListItem[]>>('/books/mine');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });
  const grantsQuery = useQuery({
    queryKey: ['admin', 'book-grants', grantPage],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Paginated<BookGrantHistoryItem>>>('/users/book-grants', {
        params: { page: grantPage, pageSize: 20 },
      });
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });

  const grantBook = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<BookGrantResult>>(`/users/${userId}/book-grants`, {
        bookId: Number(bookId),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (grant) => {
      setLastGrant(grant);
      setNote('');
      setGrantPage(1);
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'book-grants'] });
    },
  });
  const revokeBookGrant = useMutation({
    mutationFn: async (grantId: number) => {
      await apiClient.delete(`/users/book-grants/${grantId}`);
    },
    onSuccess: () => {
      setGrantToRevoke(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'book-grants'] });
    },
  });

  if (usersQuery.isLoading || booksQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-[1.75rem] bg-black/[0.04] dark:bg-white/[0.06]" />;
  }
  if (usersQuery.isError || booksQuery.isError || !usersQuery.data || !booksQuery.data) {
    return (
      <p className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-600 dark:text-rose-100">
        {extractApiErrorMessage(usersQuery.error ?? booksQuery.error, 'Impossible de charger les utilisateurs et les livres.')}
      </p>
    );
  }

  const canGrant = Boolean(userId && bookId) && !grantBook.isPending;
  const userOptions: SelectOption[] = usersQuery.data.map((account) => ({
    value: String(account.id),
    label: account.name ?? account.email,
    detail: account.name ? account.email : undefined,
  }));
  const bookOptions: SelectOption[] = booksQuery.data.map((book) => ({
    value: String(book.id),
    label: book.title,
    detail: book.isFree ? 'Gratuit' : `${book.price} FCFA`,
  }));

  return (
    <section className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 sm:p-6 dark:border-white/8 dark:bg-white/[0.035]">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-600 dark:text-sky-200">
          <Gift size={21} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Attribuer un livre</h2>
          <p className="mt-1 text-sm leading-6 text-black/45 dark:text-white/45">
            Accordez l&apos;accès complet à un livre sans paiement. L&apos;attribution est enregistrée dans la bibliothèque du lecteur.
          </p>
        </div>
      </div>

      <form
        className="mt-6 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (canGrant) grantBook.mutate();
        }}
      >
        <CustomSelect label="Lecteur" placeholder="Sélectionnez un utilisateur" value={userId} options={userOptions} onChange={setUserId} />
        <CustomSelect label="Livre" placeholder="Sélectionnez un livre" value={bookId} options={bookOptions} onChange={setBookId} />

        <label className="grid gap-1.5 text-sm font-medium">
          Note interne <span className="font-normal text-black/40 dark:text-white/40">(facultative)</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} className="resize-y rounded-xl border border-black/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-sky-400/60 dark:border-white/15" placeholder="Ex. geste commercial, partenariat…" />
        </label>

        {grantBook.isError && <p className="rounded-xl bg-rose-400/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-200">{extractApiErrorMessage(grantBook.error, 'Impossible d’attribuer ce livre.')}</p>}
        {lastGrant && !grantBook.isError && (
          <p className="rounded-xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200">
            « {lastGrant.book.title} » a été attribué à {lastGrant.user.name ?? lastGrant.user.email}.
          </p>
        )}

        <button type="submit" disabled={!canGrant} className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40">
          {grantBook.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <Gift size={16} />}
          Attribuer le livre
        </button>
      </form>

      <div className="mt-8 border-t border-black/8 pt-6 dark:border-white/8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="font-semibold">Livres attribués</h3>
            <p className="mt-1 text-sm text-black/45 dark:text-white/45">Historique des accès accordés manuellement.</p>
          </div>
          {grantsQuery.data && <span className="text-xs text-black/40 dark:text-white/40">{grantsQuery.data.total} attribution{grantsQuery.data.total > 1 ? 's' : ''}</span>}
        </div>

        {grantsQuery.isLoading ? (
          <div className="mt-4 h-32 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
        ) : grantsQuery.isError || !grantsQuery.data ? (
          <p className="mt-4 rounded-xl bg-rose-400/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-200">
            {extractApiErrorMessage(grantsQuery.error, 'Impossible de charger les attributions.')}
          </p>
        ) : grantsQuery.data.items.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-black/12 px-4 py-8 text-center text-sm text-black/45 dark:border-white/15 dark:text-white/45">
            Aucun livre n&apos;a encore été attribué.
          </p>
        ) : (
          <>
            {revokeBookGrant.isError && (
              <p className="mt-4 rounded-xl bg-rose-400/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-200">
                {extractApiErrorMessage(revokeBookGrant.error, 'Impossible de retirer cette attribution.')}
              </p>
            )}
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/8 dark:border-white/8">
              {grantsQuery.data.items.map((grant) => (
                <div key={grant.id} className="border-b border-black/6 px-4 py-3 last:border-b-0 dark:border-white/8">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <p className="font-medium">{grant.book.title}</p>
                    <div className="flex items-center gap-3">
                      <time className="text-xs text-black/45 dark:text-white/45" dateTime={grant.date}>
                        {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(grant.date))}
                      </time>
                      {grantToRevoke === grant.id ? (
                        <span className="flex items-center gap-1.5">
                          <button type="button" disabled={revokeBookGrant.isPending} onClick={() => revokeBookGrant.mutate(grant.id)} className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50">
                            {revokeBookGrant.isPending ? 'Retrait…' : 'Confirmer'}
                          </button>
                          <button type="button" disabled={revokeBookGrant.isPending} onClick={() => setGrantToRevoke(null)} className="text-xs text-black/45 hover:text-foreground disabled:opacity-50 dark:text-white/45">
                            Annuler
                          </button>
                        </span>
                      ) : (
                        <button type="button" disabled={revokeBookGrant.isPending} onClick={() => setGrantToRevoke(grant.id)} className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 disabled:opacity-50 dark:text-rose-300 dark:hover:text-rose-200">
                          <Trash2 size={13} /> Retirer
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-black/50 dark:text-white/50">Attribué à {grant.user.name ?? grant.user.email}{grant.user.name ? ` · ${grant.user.email}` : ''}</p>
                  {grant.note && <p className="mt-1.5 text-xs italic text-black/45 dark:text-white/45">Note : {grant.note}</p>}
                  {grantToRevoke === grant.id && <p className="mt-2 text-xs text-rose-600 dark:text-rose-200">Cette action retire l&apos;accès manuel à ce livre.</p>}
                </div>
              ))}
            </div>
            {grantsQuery.data.total > grantsQuery.data.pageSize && (
              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" disabled={grantPage === 1} onClick={() => setGrantPage((current) => current - 1)} className="rounded-full border border-black/12 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-white/15">
                  Précédent
                </button>
                <span className="text-xs text-black/45 dark:text-white/45">Page {grantPage}</span>
                <button type="button" disabled={grantPage * grantsQuery.data.pageSize >= grantsQuery.data.total} onClick={() => setGrantPage((current) => current + 1)} className="rounded-full border border-black/12 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-white/15">
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function CustomSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div
      className="relative grid gap-1.5 text-sm font-medium"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <span>{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`flex min-h-12 w-full items-center gap-3 rounded-xl border bg-background px-3 text-left outline-none transition focus:border-sky-400/60 dark:bg-white/[0.03] ${
          open ? 'border-sky-400/60 ring-4 ring-sky-400/10' : 'border-black/12 dark:border-white/15'
        }`}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? 'text-foreground' : 'text-black/40 dark:text-white/40'}`}>
          {selected?.label ?? placeholder}
        </span>
        {selected?.detail && <span className="shrink-0 text-xs font-normal text-black/45 dark:text-white/45">{selected.detail}</span>}
        <ChevronDown size={17} className={`shrink-0 text-black/45 transition-transform dark:text-white/45 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="listbox" aria-label={label} className="absolute top-[calc(100%+0.35rem)] z-20 max-h-64 w-full overflow-y-auto rounded-xl border border-black/10 bg-background p-1.5 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-[#201d19]">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  isSelected ? 'bg-sky-400/12 text-sky-700 dark:text-sky-100' : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.07]'
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-sm">{option.label}</span>
                {option.detail && <span className="shrink-0 text-xs text-black/45 dark:text-white/45">{option.detail}</span>}
                {isSelected && <Check size={15} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
