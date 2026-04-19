import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotesProvider } from "@/store/NotesContext";
import { VisualSettingsProvider } from "@/store/VisualSettingsContext";
import { getStoredToken, getStoredUser, type User } from "@/lib/auth";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ProtectedRoute({ children, user }: { children: React.ReactNode; user: User | null }) {
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (token && storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <VisualSettingsProvider>
          <NotesProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth onAuth={setUser} />} />
                <Route path="/" element={<ProtectedRoute user={user}><Index onSignOut={() => setUser(null)} /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </NotesProvider>
        </VisualSettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
