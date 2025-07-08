import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import TelegramAuth from "@/pages/TelegramAuth";
import Home from "@/pages/Home";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [hasTriedAuth, setHasTriedAuth] = useState(false);

  useEffect(() => {
    // Mark that we've tried to check authentication
    if (!isLoading) {
      setHasTriedAuth(true);
    }
  }, [isLoading]);

  // Show loading while checking authentication
  if (isLoading || !hasTriedAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <TelegramAuth onSuccess={() => window.location.reload()} />;
  }

  // If authenticated, show the main app
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
