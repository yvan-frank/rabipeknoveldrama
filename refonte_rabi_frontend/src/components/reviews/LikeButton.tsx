'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useSession } from '@/hooks/useAuth';
import type { ApiResponse } from '@/types/api';

interface LikeButtonProps {
  bookId: number;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ bookId, initialLiked, initialCount }: LikeButtonProps) {
  const router = useRouter();
  const { data: user } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  const toggleLike = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<{ liked: boolean; likeCount: number }>>(
        `/likes/books/${bookId}`,
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onMutate: () => {
      // Optimiste : on inverse tout de suite, on resynchronise si l'appel échoue.
      setLiked((prev) => !prev);
      setCount((prev) => (liked ? prev - 1 : prev + 1));
    },
    onSuccess: (result) => {
      setLiked(result.liked);
      setCount(result.likeCount);
    },
    onError: () => {
      setLiked(initialLiked);
      setCount(initialCount);
    },
  });

  function handleClick() {
    if (!user) {
      router.push('/connexion');
      return;
    }
    toggleLike.mutate();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggleLike.isPending}
      aria-pressed={liked}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        liked
          ? 'border-brand-pink/40 bg-brand-pink/10 text-brand-pink'
          : 'border-black/10 text-black/70 hover:border-black/30 dark:border-white/10 dark:text-white/70 dark:hover:border-white/30'
      }`}
    >
      <Heart size={16} className={liked ? 'fill-brand-pink' : ''} />
      {count}
    </button>
  );
}
