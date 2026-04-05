import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { PublicLayout } from '@/components/layout/PublicLayout';
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
import PublicRates from './pages/PublicRates';
import PublicCalendar from './pages/PublicCalendar';
import PublicDocuments from './pages/PublicDocuments';
import PublicDocumentView from './pages/PublicDocumentView';

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

          {/* Public content pages */}
          <Route path="/rates" element={<PublicLayout><PublicRates /></PublicLayout>} />
          <Route path="/calendar" element={<PublicLayout><PublicCalendar /></PublicLayout>} />
          <Route path="/documents" element={<PublicLayout><PublicDocuments /></PublicLayout>} />
          <Route path="/documents/:id" element={<PublicLayout><PublicDocumentView /></PublicLayout>} />
          <Route path="/doc/:slug" element={<PublicLayout><PublicDocumentView /></PublicLayout>} />

          {/* App pages — auth temporarily disabled for review */}
          <Route path="/app" element={<AppLayout><Index /></AppLayout>} />
          <Route path="/app/search" element={<AppLayout><AppSearch /></AppLayout>} />
          <Route path="/app/documents/:id" element={<AppLayout><DocumentViewer /></AppLayout>} />
          <Route path="/app/bookmarks" element={<AppLayout><Bookmarks /></AppLayout>} />
          <Route path="/app/topics" element={<AppLayout><AppTopics /></AppLayout>} />
          <Route path="/app/assistant" element={<AppLayout><AIChat /></AppLayout>} />
          <Route path="/app/updates" element={<AppLayout><Updates /></AppLayout>} />
          <Route path="/app/settings" element={<AppLayout><Settings /></AppLayout>} />
          <Route path="/app/services/rates" element={<AppLayout><CurrencyRates /></AppLayout>} />
          <Route path="/app/services/calendar" element={<AppLayout><DeadlineCalendar /></AppLayout>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
