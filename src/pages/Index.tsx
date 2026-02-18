import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Calendar, Target, MessageCircle, Home } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  const menuItems = [
    { path: '/connections', label: 'Connections', icon: Users },
    { path: '/map', label: 'Map', icon: MapPin },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/rizzbot', label: 'RizzBot', icon: MessageCircle },
  ];

  return (
    <div className="mobile-container flex flex-col items-center justify-center min-h-screen px-8 pb-24">
      <div className="flex flex-col items-center mb-10 animate-fade-in">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/20 flex items-center justify-center mb-4 shadow-lg">
          <Home size={40} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
          Area Book 2.0
        </h1>
      </div>

      <div className="w-full space-y-3 animate-slide-up">
        {menuItems.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="w-full card-ios p-5 flex items-center gap-4 active-scale gradient-card hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon size={22} className="text-primary" />
            </div>
            <span className="text-lg font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
