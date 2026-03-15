import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SharedLayout } from "@/components/SharedLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CookieBanner } from "@/components/CookieBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import { RadioProvider } from "@/contexts/RadioContext";
import { LajvProvider } from "@/contexts/LajvContext";

// Lazy-loaded routes for code splitting
const Room = lazy(() => import("./pages/Room"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const News = lazy(() => import("./pages/News"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Terms = lazy(() => import("./pages/Terms"));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RadioProvider>
          <LajvProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<div className="flex-1" />}>
                <Routes>
                  {/* Shared layout wraps all main routes */}
                  <Route element={<SharedLayout />}>
                    <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
                    <Route path="/rum" element={<ProtectedRoute><ErrorBoundary><Room /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/profile/:username" element={<ProtectedRoute><ErrorBoundary><Profile /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/news" element={<ErrorBoundary><News /></ErrorBoundary>} />
                    <Route path="/news/:id" element={<ErrorBoundary><News /></ErrorBoundary>} />
                  </Route>
                  
                  {/* Auth page without shared layout (full-page login) */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/villkor" element={<Terms />} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CookieBanner />
            </BrowserRouter>
          </LajvProvider>
        </RadioProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
