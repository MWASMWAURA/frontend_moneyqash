import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

// Direct imports for protected routes to avoid type issues
import DashboardPage from "@/pages/dashboard-page";
import ReferralsPage from "@/pages/referrals-page";
import EarningsPage from "@/pages/earnings-page";
import TasksPageNew from "@/pages/tasks-page-new";
import SettingsPage from "@/pages/settings-page";

// Lazy load only public components
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth-page"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/register" component={AuthPage} />
        <ProtectedRoute path="/" component={DashboardPage} />
        <ProtectedRoute path="/referrals" component={ReferralsPage} />
        <ProtectedRoute path="/earnings" component={EarningsPage} />
        <ProtectedRoute path="/tasks" component={TasksPageNew} />
        <ProtectedRoute path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
