import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Dumbbell,
  GraduationCap,
  Briefcase,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Star,
  LayoutDashboard,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useGoals } from '@/hooks/useGoals';
import { useConnections } from '@/hooks/useConnections';
import { useEvents } from '@/hooks/useEvents';
import type { Goal } from '@/utils/sampleData';

const categoryConfig: Record<
  Goal['category'],
  { icon: typeof Heart; color: string; label: string }
> = {
  love: { icon: Heart, color: 'hsl(var(--love))', label: 'Love' },
  fitness: { icon: Dumbbell, color: 'hsl(var(--warning))', label: 'Fitness' },
  school: { icon: GraduationCap, color: 'hsl(var(--primary))', label: 'School' },
  work: { icon: Briefcase, color: 'hsl(var(--success))', label: 'Work' },
  social: { icon: Users, color: 'hsl(var(--muted-foreground))', label: 'Social' },
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [goals] = useGoals();
  const [connections] = useConnections();
  const [events] = useEvents();

  // ── Goal KIs per category ────────────────────────────────────────────────
  const categoryKIs = useMemo(
    () =>
      (Object.keys(categoryConfig) as Goal['category'][]).map((cat) => {
        const catGoals = goals.filter((g) => g.category === cat);
        if (catGoals.length === 0) return { cat, pct: 0, count: 0 };
        const totalPct = catGoals.reduce((sum, g) => {
          if ((g.goalType ?? 'measurable') === 'completion')
            return sum + (g.completed ? 100 : 0);
          return (
            sum + (g.target ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0)
          );
        }, 0);
        return { cat, pct: Math.round(totalPct / catGoals.length), count: catGoals.length };
      }),
    [goals]
  );

  // ── Overall score (average of categories that have goals) ────────────────
  const overallScore = useMemo(() => {
    const active = categoryKIs.filter((k) => k.count > 0);
    if (!active.length) return 0;
    return Math.round(active.reduce((s, k) => s + k.pct, 0) / active.length);
  }, [categoryKIs]);

  // ── Relationship KIs ─────────────────────────────────────────────────────
  const totalConnections = connections.length;
  const totalDates = connections.reduce((s, c) => s + (c.milestones?.dates ?? 0), 0);
  const totalHeldHands = connections.filter((c) => c.milestones?.heldHands).length;
  const topStreak = Math.max(0, ...connections.map((c) => c.milestones?.contactStreak ?? 0));

  // ── Upcoming events (next 7 days) ────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7 = new Date(today);
  in7.setDate(today.getDate() + 7);

  const upcomingEvents = events
    .filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d >= today && d <= in7;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const scoreLabel =
    overallScore >= 80
      ? 'Crushing it! 🔥'
      : overallScore >= 50
      ? 'Making great strides! 💪'
      : overallScore > 0
      ? 'Keep going — you got this! 🌱'
      : 'Add some goals to get started';

  return (
    <div className="mobile-container pb-24">
      <PageHeader title="KI Dashboard" showBack />

      <div className="page-padding space-y-5">

        {/* ── Overall Score Ring ─────────────────────────────────────────── */}
        <div className="card-ios p-5 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <LayoutDashboard size={18} className="text-primary" />
            <h2 className="font-semibold text-foreground">Overall Progress</h2>
          </div>
          <div className="relative w-28 h-28 mx-auto mb-3">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
              <circle
                cx="56" cy="56" r="46"
                fill="none" strokeWidth="10"
                className="stroke-secondary"
              />
              <circle
                cx="56" cy="56" r="46"
                fill="none" strokeWidth="10"
                stroke="hsl(var(--primary))"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - overallScore / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{overallScore}%</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{scoreLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Across {categoryKIs.filter((k) => k.count > 0).length} active categor
            {categoryKIs.filter((k) => k.count > 0).length === 1 ? 'y' : 'ies'}
          </p>
        </div>

        {/* ── Goal KIs by Category ───────────────────────────────────────── */}
        <div>
          <h2 className="text-section-title mb-3 flex items-center gap-2">
            <Target size={15} className="text-primary" />
            Goal Progress by Category
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {categoryKIs.map(({ cat, pct, count }) => {
              const { icon: Icon, color, label } = categoryConfig[cat];
              return (
                <button
                  key={cat}
                  onClick={() => navigate('/goals')}
                  className="card-ios p-4 text-left active-scale animate-slide-up"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: color + '20' }}
                    >
                      <Icon size={15} style={{ color }} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {count} goal{count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Relationship KIs ───────────────────────────────────────────── */}
        <div>
          <h2 className="text-section-title mb-3 flex items-center gap-2">
            <Heart size={15} className="text-primary" />
            Relationship Indicators
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: 'Connections',
                value: totalConnections,
                icon: Users,
                color: 'hsl(var(--primary))',
                sub: 'total people',
              },
              {
                label: 'Total Dates',
                value: totalDates,
                icon: Heart,
                color: 'hsl(var(--love))',
                sub: 'across all',
              },
              {
                label: 'Held Hands',
                value: totalHeldHands,
                icon: Star,
                color: 'hsl(var(--warning))',
                sub: 'milestone reached',
              },
              {
                label: 'Top Streak',
                value: `${topStreak}d`,
                icon: TrendingUp,
                color: 'hsl(var(--success))',
                sub: 'contact streak',
              },
            ].map(({ label, value, icon: Icon, color, sub }) => (
              <button
                key={label}
                onClick={() => navigate('/connections')}
                className="card-ios p-4 text-left active-scale"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: color + '20' }}
                >
                  <Icon size={15} style={{ color }} />
                </div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Upcoming Events ────────────────────────────────────────────── */}
        <div>
          <h2 className="text-section-title mb-3 flex items-center gap-2">
            <Calendar size={15} className="text-primary" />
            Upcoming (Next 7 Days)
          </h2>
          {upcomingEvents.length === 0 ? (
            <button
              onClick={() => navigate('/calendar')}
              className="w-full card-ios p-5 text-center active-scale"
            >
              <p className="text-muted-foreground text-sm">No events this week</p>
              <p className="text-primary text-xs mt-1 font-medium">+ Schedule something</p>
            </button>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 4).map((event) => (
                <button
                  key={event.id}
                  onClick={() => navigate('/calendar')}
                  className="w-full card-ios p-4 flex items-center gap-3 active-scale text-left"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color ?? 'hsl(var(--primary))' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.date}
                      {event.time ? ` · ${event.time}` : ''}
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                  </div>
                </button>
              ))}
              {upcomingEvents.length > 4 && (
                <button
                  onClick={() => navigate('/calendar')}
                  className="w-full text-center text-primary text-sm py-2 font-medium"
                >
                  +{upcomingEvents.length - 4} more
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
