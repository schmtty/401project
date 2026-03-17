import { Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AddConnectionProvider } from "@/contexts/AddConnectionContext";
import { EventModalProvider } from "@/contexts/EventModalContext";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import NewConnectionPage from "./pages/NewConnectionPage";
import ConnectionDetailPage from "./pages/ConnectionDetailPage";
import CalendarPage from "./pages/CalendarPage";
import MapPage from "./pages/MapPage";
import GoalsPage from "./pages/GoalsPage";
import RizzBotPage from "./pages/RizzBotPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useUser();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (!currentUser && location.pathname !== '/login' && location.pathname !== '/users') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { currentUser } = useUser();
  const location = useLocation();
  const isUsersPage = location.pathname === '/users' || location.pathname === '/login';

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background relative gradient-bg">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
        <Route path="/connections" element={<AuthGuard><ConnectionsPage /></AuthGuard>} />
        <Route path="/connections/new" element={<AuthGuard><NewConnectionPage /></AuthGuard>} />
        <Route path="/connections/:id" element={<AuthGuard><ConnectionDetailPage /></AuthGuard>} />
        <Route path="/calendar" element={<AuthGuard><CalendarPage /></AuthGuard>} />
        <Route path="/map" element={<AuthGuard><MapPage /></AuthGuard>} />
        <Route path="/goals" element={<AuthGuard><GoalsPage /></AuthGuard>} />
        <Route path="/rizzbot" element={<AuthGuard><RizzBotPage /></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {currentUser && !isUsersPage && <BottomNav />}
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ThemeProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AddConnectionProvider>
                  <EventModalProvider>
                    <AppContent />
                  </EventModalProvider>
                </AddConnectionProvider>
              </BrowserRouter>
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </UserProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
