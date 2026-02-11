import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Calendar, Target, MessageCircle, Home } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  const menuItems = [
    { path: '/connections', label: 'Connections', icon: Users },
    { path: '/map', label: 'Map', icon: MapPin },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/goals', label: 'Goals', icon: Target },
  ];

  return (
    <div className="mobile-container flex flex-col items-center justify-center min-h-screen px-8 pb-24">
      <div className="flex flex-col items-center mb-10 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center mb-4 shadow-sm">
          <Home size={36} className="text-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Area Book 2.0</h1>
      </div>

      <div className="w-full space-y-3 animate-slide-up">
        {menuItems.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="w-full card-ios p-5 flex items-center gap-4 active-scale"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Icon size={22} className="text-foreground" />
            </div>
            <span className="text-lg font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
