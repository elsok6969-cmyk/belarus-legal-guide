import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';

import Landing from './pages/Landing';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import Legal from './pages/Legal';
import Login from './pages/Login';
import Register from './pages/Register';
import Index from './pages/Index';
import DocumentViewer from './pages/DocumentViewer';
import AIChat from './pages/AIChat';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public pages with shared header/footer */}
          <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/how-it-works" element={<PublicLayout><HowItWorks /></PublicLayout>} />
          <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
          <Route path="/legal" element={<PublicLayout><Legal /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />

          {/* Authenticated app */}
          <Route path="/app" element={<AuthGuard><AppLayout><Index /></AppLayout></AuthGuard>} />
          <Route path="/app/documents/:id" element={<AuthGuard><AppLayout><DocumentViewer /></AppLayout></AuthGuard>} />
          <Route path="/app/ai-chat" element={<AuthGuard><AppLayout><AIChat /></AppLayout></AuthGuard>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
