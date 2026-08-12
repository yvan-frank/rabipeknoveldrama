'use client';

import { LogOut } from 'lucide-react';

export function LogoutConfirmModal({ open, onClose, onConfirm, isSubmitting = false }: { open: boolean; onClose: () => void; onConfirm: () => void; isSubmitting?: boolean }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="logout-confirmation-title" className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl"><div className="flex size-11 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-600 dark:text-rose-300"><LogOut size={20}/></div><h2 id="logout-confirmation-title" className="mt-4 text-xl font-bold">Se déconnecter ?</h2><p className="mt-2 text-sm leading-6 text-black/55 dark:text-white/55">Vous devrez vous reconnecter pour accéder à votre espace.</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={isSubmitting} onClick={onClose} className="rounded-full px-4 py-2 text-sm disabled:opacity-50">Annuler</button><button type="button" disabled={isSubmitting} onClick={onConfirm} className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? 'Déconnexion…' : 'Se déconnecter'}</button></div></section></div>;
}
