import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Calendar, MapPin, Target, MessageCircle } from 'lucide-react';

const tabs = [
  { path: '/connections', label: 'Connections', icon: Users },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/map', label: 'Map', icon: MapPin },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/rizzbot', label: 'RizzBot', icon: MessageCircle },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on detail pages
  const showNav = tabs.some(t => location.pathname === t.path) || location.pathname === '/';

  if (!showNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 pb-[var(--safe-bottom)]" style={{ height: 'var(--nav-height)' }}>
        {tabs.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path === '/connections' && location.pathname === '/');
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 tap-target px-3 py-1 transition-ios ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
