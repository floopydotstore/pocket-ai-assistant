import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useAgentStore } from "@/store/agentStore";
import { useBackButton } from "@/hooks/useBackButton";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import CreateAgent from "./pages/CreateAgent";
import AgentChat from "./pages/AgentChat";
import TaskHistory from "./pages/TaskHistory";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const hasCompletedOnboarding = useAgentStore((s) => s.hasCompletedOnboarding);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const hasCompletedOnboarding = useAgentStore((s) => s.hasCompletedOnboarding);
  
  // Enable Android back button handling
  useBackButton();

  return (
    <Routes>
      <Route path="/" element={hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <Onboarding />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreateAgent /></ProtectedRoute>} />
      <Route path="/chat/:agentId" element={<ProtectedRoute><AgentChat /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><TaskHistory /></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
