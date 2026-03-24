import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  MapPin,
  Calendar,
  Target,
  MessageCircle,
  Home,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEventModal } from "@/contexts/EventModalContext";
import { eventNeedsReport } from "@/utils/eventTime";

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { events } = useEventModal();

  const calendarNeedsReport = useMemo(
    () => events.some((e) => eventNeedsReport(e)),
    [events]
  );

  const menuItems = [
    { path: "/connections", labelKey: "home.connections", icon: Users },
    { path: "/map", labelKey: "home.map", icon: MapPin },
    { path: "/calendar", labelKey: "home.calendar", icon: Calendar },
    { path: "/goals", labelKey: "home.goals", icon: Target },
    { path: "/rizzbot", labelKey: "home.rizzbot", icon: MessageCircle },
  ];

  return (
    <div className="mobile-container flex flex-col items-center justify-center min-h-screen px-8 pb-24">
      <div className="flex flex-col items-center mb-10 animate-fade-in">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/20 flex items-center justify-center mb-4 shadow-lg">
          <Home size={40} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
          {t("app.title")}
        </h1>
      </div>

      <div className="w-full space-y-3 animate-slide-up">
        {menuItems.map(({ path, labelKey, icon: Icon }) => {
          const isCalendar = path === "/calendar";
          const showReportDot = isCalendar && calendarNeedsReport;
          const label = t(labelKey);
          return (
            <button
              type="button"
              key={path}
              onClick={() => navigate(path)}
              aria-label={showReportDot ? `${label}. Calendar events need a report.` : label}
              title={showReportDot ? "Some calendar events need a report" : undefined}
              className="w-full card-ios p-5 flex items-center gap-4 active-scale gradient-card hover:shadow-md transition-shadow"
            >
              <div className="relative w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon size={22} className="text-primary" aria-hidden="true" />
                {showReportDot && (
                  <span
                    className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive ring-1 ring-card"
                    aria-hidden
                  />
                )}
              </div>
              <span className="text-lg font-medium text-foreground min-w-0">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;
