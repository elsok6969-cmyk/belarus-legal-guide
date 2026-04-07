import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminGuard } from '@/components/auth/AdminGuard';
import AccountLayout from '@/components/layout/AccountLayout';

import Landing from './pages/Landing';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import Legal from './pages/Legal';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Subscription from './pages/Subscription';
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
import CurrencyRates from './pages/CurrencyRates';
import DeadlineCalendar from './pages/DeadlineCalendar';
import DeadlinesCalendar from './pages/DeadlinesCalendar';
import AdminImport from './pages/AdminImport';
import Codexes from './pages/Codexes';
import Calculators from './pages/Calculators';
import CalculatorRouter from './pages/CalculatorRouter';
import Subscribe from './pages/Subscribe';
import Guide from './pages/Guide';
import Forms from './pages/Forms';
import NotFound from './pages/NotFound';
import { AIChatWidget } from './components/chat/AIChatWidget';

import ProfilePage from './pages/account/ProfilePage';
import SettingsPage from './pages/account/SettingsPage';
import FavoritesPage from './pages/account/FavoritesPage';
import NotificationsPage from './pages/account/NotificationsPage';
import HistoryPage from './pages/account/HistoryPage';
import SubscriptionPage from './pages/account/SubscriptionPage';

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
          <Route path="/auth" element={<PublicLayout><Auth /></PublicLayout>} />
          <Route path="/auth/reset-password" element={<PublicLayout><ResetPassword /></PublicLayout>} />
          <Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />
          <Route path="/privacy" element={<PublicLayout><Privacy /></PublicLayout>} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />
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

          {/* Public subscription pages */}
          <Route path="/subscription" element={<PublicLayout><Subscription /></PublicLayout>} />
          <Route path="/subscribe/:plan" element={<PublicLayout><Subscribe /></PublicLayout>} />
          <Route path="/ai-assistant" element={<AppLayout><AIChat /></AppLayout>} />

          {/* Account pages (inside AppLayout with nested AccountLayout) */}
          <Route path="/app/account" element={<AppLayout><AccountLayout /></AppLayout>}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
          </Route>
          {/* Redirect old routes */}
          <Route path="/profile" element={<Navigate to="/app/account/profile" replace />} />
          <Route path="/app/settings" element={<Navigate to="/app/account/settings" replace />} />
          <Route path="/app/bookmarks" element={<Navigate to="/app/account/favorites" replace />} />
          <Route path="/app/updates" element={<Navigate to="/app/account/notifications" replace />} />

          {/* App pages */}
          <Route path="/app" element={<AppLayout><Index /></AppLayout>} />
          <Route path="/app/search" element={<AppLayout><AppSearch /></AppLayout>} />
          <Route path="/app/documents/:id" element={<AppLayout><DocumentViewer /></AppLayout>} />
          <Route path="/app/topics" element={<AppLayout><AppTopics /></AppLayout>} />
          <Route path="/app/assistant" element={<AppLayout><AIChat /></AppLayout>} />
          <Route path="/app/services/rates" element={<AppLayout><CurrencyRates /></AppLayout>} />
          <Route path="/app/services/calendar" element={<AppLayout><DeadlineCalendar /></AppLayout>} />
          <Route path="/app/codex" element={<AppLayout><Codexes /></AppLayout>} />
          <Route path="/app/calculator" element={<AppLayout><Calculators /></AppLayout>} />
          <Route path="/app/calculator/:slug" element={<AppLayout><CalculatorRouter /></AppLayout>} />
          <Route path="/app/calendar" element={<AppLayout><DeadlinesCalendar /></AppLayout>} />
          <Route path="/app/guide" element={<AppLayout><Guide /></AppLayout>} />
          <Route path="/app/forms" element={<AppLayout><Forms /></AppLayout>} />

          {/* Admin pages */}
          <Route path="/admin/import" element={<AdminGuard><AppLayout><AdminImport /></AppLayout></AdminGuard>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIChatWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
