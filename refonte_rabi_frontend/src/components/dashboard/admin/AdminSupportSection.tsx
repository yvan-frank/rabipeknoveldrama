'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

type Sender = 'user' | 'admin';

interface SupportMessage {
  id: number;
  sender: Sender;
  content: string;
  createdAt: string;
}

interface ConversationSummary {
  userId: number;
  name: string | null;
  email: string;
  lastMessage: { content: string; createdAt: string; sender: Sender } | null;
  unreadCount: number;
}

interface ConversationDetail {
  user: { id: number; name: string | null; email: string };
  messages: SupportMessage[];
}

const formatDateTime = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// Même fil qu'affiché côté mobile (cf. refonte_rabi_mobile/app/(app)/inbox.tsx)
// — un seul thread par utilisateur, pas de notion de conversations multiples.
export function AdminSupportSection() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const conversations = useQuery({
    queryKey: ['admin', 'support', 'conversations'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ conversations: ConversationSummary[] }>>('/support/administration/conversations');
      if (!data.success) throw new Error(data.message);
      return data.data.conversations;
    },
    enabled: selectedUserId === null,
  });

  const conversation = useQuery({
    queryKey: ['admin', 'support', 'conversation', selectedUserId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ConversationDetail>>(`/support/administration/conversations/${selectedUserId}`);
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: selectedUserId !== null,
  });

  if (selectedUserId === null) {
    return (
      <section className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 sm:p-6 dark:border-white/8 dark:bg-white/[0.035]">
        <h2 className="text-xl font-bold">Support</h2>
        <p className="mt-1 text-sm text-black/45 dark:text-white/45">Messages envoyés par les lecteurs depuis l’application mobile.</p>

        {conversations.isLoading ? (
          <div className="mt-5 h-64 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
        ) : conversations.isError ? (
          <p className="mt-5 rounded-2xl bg-rose-400/10 p-4 text-sm text-rose-600">
            {extractApiErrorMessage(conversations.error, 'Impossible de charger les conversations.')}
          </p>
        ) : conversations.data!.length === 0 ? (
          <p className="mt-5 text-sm text-black/45 dark:text-white/45">Aucun message pour l’instant.</p>
        ) : (
          <div className="mt-5 divide-y divide-black/5 dark:divide-white/7">
            {conversations.data!.map((item) => (
              <button
                key={item.userId}
                type="button"
                onClick={() => setSelectedUserId(item.userId)}
                className="flex w-full items-center gap-3 py-3 text-left transition hover:opacity-80"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-violet-500 text-sm font-bold text-neutral-950">
                  {(item.name ?? item.email).slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name ?? item.email}</p>
                  {item.lastMessage ? (
                    <p className="mt-0.5 truncate text-xs text-black/45 dark:text-white/45">
                      {item.lastMessage.sender === 'admin' ? 'Vous : ' : ''}
                      {item.lastMessage.content}
                    </p>
                  ) : null}
                </div>
                {item.unreadCount > 0 ? (
                  <span className="shrink-0 rounded-full bg-sky-500 px-2 py-0.5 text-xs font-semibold text-white">{item.unreadCount}</span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <ConversationThread
      userId={selectedUserId}
      conversation={conversation}
      onBack={() => {
        setSelectedUserId(null);
        queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'conversations'] });
      }}
    />
  );
}

function ConversationThread({
  userId,
  conversation,
  onBack,
}: {
  userId: number;
  conversation: ReturnType<typeof useQuery<ConversationDetail>>;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data } = await apiClient.post<ApiResponse<SupportMessage>>(`/support/administration/conversations/${userId}/messages`, {
        content: text,
      });
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (message) => {
      setContent('');
      queryClient.setQueryData<ConversationDetail | undefined>(['admin', 'support', 'conversation', userId], (current) =>
        current ? { ...current, messages: [...current.messages, message] } : current,
      );
    },
  });

  function handleSend() {
    const text = content.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  }

  return (
    <section className="flex h-[calc(100vh-11rem)] flex-col rounded-[1.75rem] border border-black/8 bg-black/[0.02] dark:border-white/8 dark:bg-white/[0.035]">
      <div className="flex items-center gap-3 border-b border-black/8 p-4 dark:border-white/8">
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-black/10 dark:border-white/15"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{conversation.data?.user.name ?? conversation.data?.user.email ?? '…'}</p>
          {conversation.data?.user.name ? (
            <p className="truncate text-xs text-black/45 dark:text-white/45">{conversation.data.user.email}</p>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {conversation.isLoading ? (
          <div className="h-full animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
        ) : conversation.isError ? (
          <p className="rounded-2xl bg-rose-400/10 p-4 text-sm text-rose-600">
            {extractApiErrorMessage(conversation.error, 'Impossible de charger cette conversation.')}
          </p>
        ) : (
          conversation.data!.messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  message.sender === 'admin'
                    ? 'rounded-br-md bg-sky-500 text-white'
                    : 'rounded-bl-md bg-black/[0.05] text-foreground dark:bg-white/[0.08]'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className={`mt-1 text-[11px] ${message.sender === 'admin' ? 'text-white/70' : 'text-black/40 dark:text-white/40'}`}>
                  {formatDateTime.format(new Date(message.createdAt))}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-black/8 p-3 dark:border-white/8">
        {sendMutation.isError ? (
          <p className="mb-2 text-xs text-rose-600">{extractApiErrorMessage(sendMutation.error, "Impossible d'envoyer le message.")}</p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Répondre au lecteur…"
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-2xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-sky-400/50 dark:border-white/15"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={content.trim().length === 0 || sendMutation.isPending}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
