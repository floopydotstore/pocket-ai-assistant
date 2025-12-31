import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAgentStore } from "@/store/agentStore";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import CreateAgent from "./pages/CreateAgent";
import AgentChat from "./pages/AgentChat";
import TaskHistory from "./pages/TaskHistory";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const hasCompletedOnboarding = useAgentStore((s) => s.hasCompletedOnboarding);

  return (
    <Routes>
      <Route path="/" element={hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <Onboarding />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create" element={<CreateAgent />} />
      <Route path="/chat/:agentId" element={<AgentChat />} />
      <Route path="/history" element={<TaskHistory />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
