import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRoutes } from './router/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Never retry on 403/401 — these are permission errors, not transient failures
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status === 403 || status === 401) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
      // 403 errors on queries are silenced — guards don't need to see access denied on background data fetches
      throwOnError: (error: any) => {
        const status = error?.response?.status;
        return status !== 403 && status !== 401;
      },
    },
    mutations: {
      // Don't auto-throw on mutations — let each mutation's onError handle it
      throwOnError: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
