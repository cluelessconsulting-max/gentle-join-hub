import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import GlobalLoading from "@/components/GlobalLoading";
import ScrollToTop from "@/components/ScrollToTop";
import CookieBanner from "@/components/CookieBanner";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Apply from "./pages/Apply";
import QrCardApply from "./pages/QrCardApply";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import CheckIn from "./pages/CheckIn";
import BrandPortal from "./pages/BrandPortal";
import MemberProfile from "./pages/MemberProfile";
import ProfilePage from "./pages/ProfilePage";
import AuthCallback from "./pages/AuthCallback";
import ConfirmEmail from "./pages/ConfirmEmail";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

const queryClient = new QueryClient();

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) return <GlobalLoading />;

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/qr-apply" element={<QrCardApply />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/checkin/:eventId" element={<CheckIn />} />
        <Route path="/brand/:slug" element={<BrandPortal />} />
        <Route path="/member/:code" element={<MemberProfile />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CookieBanner />
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
