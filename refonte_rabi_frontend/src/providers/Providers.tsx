'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NavigationProgress } from '@/components/NavigationProgress';

export function Providers({ children }: { children: React.ReactNode }) {
  // useState (pas une constante module) : garantit un QueryClient par requête
  // côté serveur / par session de navigateur, jamais partagé entre utilisateurs.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationProgress />
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
