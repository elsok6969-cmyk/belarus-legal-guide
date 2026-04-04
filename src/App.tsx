import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';

import Index from './pages/Index';
import DocumentViewer from './pages/DocumentViewer';
import AIChat from './pages/AIChat';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <AppLayout>
                  <Index />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <AuthGuard>
                <AppLayout>
                  <DocumentViewer />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/ai-chat"
            element={
              <AuthGuard>
                <AppLayout>
                  <AIChat />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
