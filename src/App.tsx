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
import News from './pages/News';
import NewsArticle from './pages/NewsArticle';
import Topics from './pages/Topics';
import TopicDetail from './pages/TopicDetail';
import Experts from './pages/Experts';
import ExpertProfile from './pages/ExpertProfile';

import Index from './pages/Index';
import AppSearch from './pages/AppSearch';
import DocumentViewer from './pages/DocumentViewer';
import Bookmarks from './pages/Bookmarks';
import AppTopics from './pages/AppTopics';
import AIChat from './pages/AIChat';
import Updates from './pages/Updates';
import Settings from './pages/Settings';
import CurrencyRates from './pages/CurrencyRates';
import DeadlineCalendar from './pages/DeadlineCalendar';
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
          {/* Public pages */}
          <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/how-it-works" element={<PublicLayout><HowItWorks /></PublicLayout>} />
          <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
          <Route path="/legal" element={<PublicLayout><Legal /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
          <Route path="/news" element={<PublicLayout><News /></PublicLayout>} />
          <Route path="/news/:slug" element={<PublicLayout><NewsArticle /></PublicLayout>} />
          <Route path="/topics" element={<PublicLayout><Topics /></PublicLayout>} />
          <Route path="/topics/:slug" element={<PublicLayout><TopicDetail /></PublicLayout>} />
          <Route path="/experts" element={<PublicLayout><Experts /></PublicLayout>} />
          <Route path="/experts/:id" element={<PublicLayout><ExpertProfile /></PublicLayout>} />

          {/* Authenticated app */}
          <Route path="/app" element={<AuthGuard><AppLayout><Index /></AppLayout></AuthGuard>} />
          <Route path="/app/search" element={<AuthGuard><AppLayout><AppSearch /></AppLayout></AuthGuard>} />
          <Route path="/app/documents/:id" element={<AuthGuard><AppLayout><DocumentViewer /></AppLayout></AuthGuard>} />
          <Route path="/app/bookmarks" element={<AuthGuard><AppLayout><Bookmarks /></AppLayout></AuthGuard>} />
          <Route path="/app/topics" element={<AuthGuard><AppLayout><AppTopics /></AppLayout></AuthGuard>} />
          <Route path="/app/assistant" element={<AuthGuard><AppLayout><AIChat /></AppLayout></AuthGuard>} />
          <Route path="/app/updates" element={<AuthGuard><AppLayout><Updates /></AppLayout></AuthGuard>} />
          <Route path="/app/settings" element={<AuthGuard><AppLayout><Settings /></AppLayout></AuthGuard>} />
          <Route path="/app/services/rates" element={<AuthGuard><AppLayout><CurrencyRates /></AppLayout></AuthGuard>} />
          <Route path="/app/services/calendar" element={<AuthGuard><AppLayout><DeadlineCalendar /></AppLayout></AuthGuard>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
