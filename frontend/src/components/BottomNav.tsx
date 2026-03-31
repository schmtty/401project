import { useLocation, useNavigate } from 'react-router-dom';
import { UserPlus, Home, Settings } from 'lucide-react';
import { useAddConnection } from '@/contexts/AddConnectionContext';
import { useLanguage } from '@/contexts/LanguageContext';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { open: openAddConnection } = useAddConnection();
  const { t } = useLanguage();

  // Show on all main pages (hide only on connection detail to avoid crowding)
  const isDetailPage = /^\/connections\/[^/]+$/.test(location.pathname);
  if (isDetailPage) return null;

  const isHome = location.pathname === '/';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-lg">
      <div
        className="max-w-md mx-auto flex items-center justify-between px-6 pb-[var(--safe-bottom)]"
        style={{ height: 'var(--nav-height)' }}
      >
        <button
          onClick={openAddConnection}
          aria-label="Add new connection"
          className="flex flex-col items-center gap-0.5 tap-target px-4 py-1 transition-ios text-muted-foreground hover:text-foreground active-scale"
        >
          <UserPlus size={24} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">{t('nav.add')}</span>
        </button>

        <button
          onClick={() => navigate('/')}
          aria-label="Go to home"
          aria-current={isHome ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 tap-target px-4 py-1 transition-ios active-scale ${
            isHome ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home size={24} strokeWidth={isHome ? 2.5 : 1.8} />
          <span className="text-[10px] font-medium">{t('nav.home')}</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          aria-label="Go to settings"
          aria-current={location.pathname === '/settings' ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 tap-target px-4 py-1 transition-ios active-scale ${
            location.pathname === '/settings' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings size={24} strokeWidth={location.pathname === '/settings' ? 2.5 : 1.8} />
          <span className="text-[10px] font-medium">{t('nav.settings')}</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
