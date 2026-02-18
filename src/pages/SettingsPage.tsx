import { Palette, Moon, Sun, Sparkles, Coffee, Sunset } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext';

const themeOptions: { id: ThemeMode; label: string; icon: typeof Sun; desc: string }[] = [
  { id: 'light', label: 'Light', icon: Sun, desc: 'Clean white background' },
  { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes at night' },
  { id: 'pastel', label: 'Pastel', icon: Sparkles, desc: 'Soft muted colors' },
  { id: 'comfort', label: 'Comfort', icon: Coffee, desc: 'Warm cozy tones' },
  { id: 'sunset', label: 'Sunset', icon: Sunset, desc: 'Warm gradient vibes' },
];

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mobile-container pb-24">
      <PageHeader title="Settings" showBack />

      <div className="px-5 pt-4 space-y-6">
        <div className="card-ios p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Palette size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Theme</h2>
              <p className="text-sm text-muted-foreground">Change how Area Book looks</p>
            </div>
          </div>

          <div className="space-y-2">
            {themeOptions.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all active-scale text-left ${
                  theme === id
                    ? 'bg-primary/15 border-2 border-primary'
                    : 'bg-secondary/50 hover:bg-secondary border-2 border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  theme === id ? 'bg-primary text-primary-foreground' : 'bg-background'
                }`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                {theme === id && (
                  <div className="w-5 h-5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="card-ios p-5">
          <h3 className="font-semibold text-foreground mb-2">About</h3>
          <p className="text-sm text-muted-foreground">
            Area Book 2.0 — Relationship planner & goal tracker for young single adults.
            Track connections, events, and milestones all in one place.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
