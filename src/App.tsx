import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AddConnectionProvider } from "@/contexts/AddConnectionContext";
import { EventModalProvider } from "@/contexts/EventModalContext";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";
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

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AddConnectionProvider>
            <EventModalProvider>
              <div className="max-w-md mx-auto min-h-screen bg-background relative gradient-bg">
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/connections/new" element={<NewConnectionPage />} />
              <Route path="/connections/:id" element={<ConnectionDetailPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/rizzbot" element={<RizzBotPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
                <BottomNav />
              </div>
            </EventModalProvider>
          </AddConnectionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
