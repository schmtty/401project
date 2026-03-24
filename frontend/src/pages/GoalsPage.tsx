import { useState, useEffect } from 'react';
import { Plus, Heart, GraduationCap, Briefcase, Users, Dumbbell, Target, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { useGoals } from '@/hooks/useGoals';
import { generateId } from '@/utils/sampleData';
import type { Goal, GoalType } from '@/utils/sampleData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const categoryConfig: Record<Goal['category'], { icon: typeof Heart; color: string; cssVar: string; label: string }> = {
  love: { icon: Heart, color: 'hsl(var(--love))', cssVar: '--love', label: 'Love' },
  fitness: { icon: Dumbbell, color: 'hsl(var(--warning))', cssVar: '--warning', label: 'Fitness' },
  school: { icon: GraduationCap, color: 'hsl(var(--primary))', cssVar: '--primary', label: 'School' },
  work: { icon: Briefcase, color: 'hsl(var(--success))', cssVar: '--success', label: 'Work' },
  social: { icon: Users, color: 'hsl(var(--muted-foreground))', cssVar: '--muted-foreground', label: 'Social' },
};

function resolveThemeColor(cssVar: string): string {
  const val = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return val ? `hsl(${val})` : '#888';
}

const GoalsPage = () => {
  useDocumentTitle('Goals');
  const navigate = useNavigate();
  const [goals, setGoals] = useGoals();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    goalType: 'measurable' as GoalType,
    measure: '',
    actions: '',
    targetDate: '',
    notes: '',
    category: 'love' as Goal['category'],
    target: '',
    current: '0',
  });

  const featured = goals.find(g => (g.goalType ?? 'measurable') === 'measurable') || goals[0];

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const initialCurrent = (form.goalType ?? 'measurable') === 'measurable' ? (parseInt(form.current) || 0) : 0;
    const today = new Date().toISOString().split('T')[0];
    const newGoal: Goal = {
      id: generateId(),
      title: form.title,
      goalType: form.goalType ?? 'measurable',
      measure: (form.goalType ?? 'measurable') === 'measurable' ? form.measure : '',
      actions: form.actions,
      targetDate: form.targetDate,
      notes: form.notes,
      category: form.category,
      target: (form.goalType ?? 'measurable') === 'measurable' ? (parseInt(form.target) || 0) : 0,
      current: initialCurrent,
      completed: form.goalType === 'completion' ? false : undefined,
      history: initialCurrent > 0 ? [{ date: today, value: initialCurrent }] : [],
    };
    setGoals(prev => [...prev, newGoal]);
    setForm({ title: '', goalType: 'measurable', measure: '', actions: '', targetDate: '', notes: '', category: 'love', target: '', current: '0' });
    setShowAdd(false);
  };

  const updateProgress = (id: string, delta: number) => {
    const today = new Date().toISOString().split('T')[0];
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const newCurrent = Math.max(0, Math.min(g.target || 999, g.current + delta));
      const history = [...(g.history ?? [])];
      const existingIdx = history.findIndex(h => h.date === today);
      if (existingIdx >= 0) {
        history[existingIdx] = { date: today, value: newCurrent };
      } else {
        history.push({ date: today, value: newCurrent });
      }
      history.sort((a, b) => a.date.localeCompare(b.date));
      return { ...g, current: newCurrent, history };
    }));
  };

  const markComplete = (id: string) => {
    setGoals(prev => prev.map(g =>
      g.id === id ? { ...g, completed: true } : g
    ));
  };

  const detail = selectedGoal ? goals.find(g => g.id === selectedGoal) : null;

  useEffect(() => {
    if (showAdd) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showAdd]);

  return (
    <div className="mobile-container pb-24">
      <PageHeader
        title={detail ? 'Goal Detail' : 'Goals'}
        showBack
        rightAction={
          !detail ? (
            <button onClick={() => setShowAdd(true)} className="tap-target flex items-center justify-center text-primary active-scale">
              <Plus size={24} />
            </button>
          ) : undefined
        }
      />

      {detail ? (
        <GoalDetail goal={detail} onUpdate={(delta) => updateProgress(detail.id, delta)} onMarkComplete={() => markComplete(detail.id)} onBack={() => setSelectedGoal(null)} />
      ) : (
        <div className="page-padding space-y-5">
          {featured && (
            <div>
              <h2 className="text-section-title mb-2">Featured Goal</h2>
              <button
                onClick={() => setSelectedGoal(featured.id)}
                className="w-full card-ios p-5 active-scale text-left"
              >
                <div className="flex items-center gap-2 mb-3">
                  {(() => { const Icon = categoryConfig[featured.category].icon; return <Icon size={20} style={{ color: categoryConfig[featured.category].color }} />; })()}
                  <span className="font-semibold text-foreground">{featured.title}</span>
                </div>
                {(featured.goalType ?? 'measurable') === 'measurable' ? (
                  <>
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(featured.target ? (featured.current / featured.target) * 100 : 0)}%`, backgroundColor: categoryConfig[featured.category].color }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{Math.round((featured.target ? (featured.current / featured.target) * 100 : 0))}% complete</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">{featured.completed ? 'Completed!' : 'Not yet completed'}</p>
                )}
              </button>
            </div>
          )}

          <div>
            <h2 className="text-section-title mb-3">All Goals</h2>
            <div className="space-y-2">
              {goals.map(goal => {
                const config = categoryConfig[goal.category];
                const Icon = config.icon;
                const pct = (goal.goalType ?? 'measurable') === 'measurable' && goal.target ? Math.round((goal.current / goal.target) * 100) : (goal.completed ? 100 : 0);
                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className="w-full card-ios p-4 flex items-center gap-3 active-scale animate-slide-up text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: config.color + '20' }}>
                      <Icon size={18} style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {(goal.goalType ?? 'measurable') === 'completion' ? ((goal.completed ?? false) ? 'Completed!' : 'Not yet completed') : (pct >= 80 ? 'On track with goal' : pct >= 50 ? 'Making progress!' : 'Might need to pick it up a little! You got this!')}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{(goal.goalType ?? 'measurable') === 'completion' ? ((goal.completed ?? false) ? '✓' : '—') : `${pct}%`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end overflow-hidden">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowAdd(false)} aria-hidden />
          <div className="relative w-full max-w-md mx-auto bg-card rounded-t-3xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-5 flex-shrink-0 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">New Goal</h3>
              <button onClick={() => setShowAdd(false)} className="tap-target flex items-center justify-center text-muted-foreground text-xl active-scale">×</button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
              <form onSubmit={handleAddGoal} className="p-5 space-y-3 pb-24">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Goal Type</label>
                  <select value={form.goalType} onChange={e => setForm(f => ({ ...f, goalType: e.target.value as GoalType }))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary">
                    <option value="measurable">Measurable</option>
                    <option value="completion">Completion</option>
                  </select>
                </div>
                <input placeholder="What is your goal?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary" />
                {form.goalType === 'measurable' && (
                  <>
                    <input placeholder="How will you measure it?" value={form.measure} onChange={e => setForm(f => ({ ...f, measure: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" placeholder="Goal Number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary" />
                  </>
                )}
                <input placeholder="What actions will you take?" value={form.actions} onChange={e => setForm(f => ({ ...f, actions: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary" />
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Complete by (optional)</label>
                  <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary [&::placeholder]:text-muted-foreground"
                    title="Complete by..." />
                </div>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Goal['category'] }))}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary">
                  {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button type="submit" className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold active-scale">
                  Add Goal
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function GoalDetail({ goal, onUpdate, onMarkComplete, onBack }: { goal: Goal; onUpdate: (delta: number) => void; onMarkComplete: () => void; onBack: () => void }) {
  const config = categoryConfig[goal.category];
  const [justCompleted, setJustCompleted] = useState(false);
  const isCompletion = (goal.goalType ?? 'measurable') === 'completion';
  const pct = isCompletion ? (goal.completed ? 100 : 0) : (goal.target ? Math.round((goal.current / goal.target) * 100) : 0);

  const handleMarkComplete = () => {
    if (goal.completed) return;
    setJustCompleted(true);
    onMarkComplete();
    setTimeout(() => setJustCompleted(false), 800);
  };

  // Build last 14 days: days[0]=14 days ago, days[13]=today
  const today = new Date();
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  const historyMap = Object.fromEntries((goal.history ?? []).map(h => [h.date, h.value]));
  let carryForward = 0;
  const dataPoints = isCompletion ? [] : days.map(date => {
    const v = historyMap[date];
    if (v !== undefined) carryForward = v;
    return carryForward;
  });
  const chartColor = resolveThemeColor(config.cssVar);
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${MONTH_NAMES[parseInt(m) - 1]} ${parseInt(day)}`;
  };
  const xLabels = days.map((d, i) => (i === 0 ? formatDate(d) : i === 13 ? 'Now' : ''));

  const chartData = {
    labels: xLabels,
    datasets: [
      {
        label: 'Progress',
        data: dataPoints,
        borderColor: chartColor,
        fill: false,
        tension: 0.35,
        pointRadius: 0,
      },
      {
        label: 'Goal',
        data: days.map(() => goal.target || 0),
        borderColor: chartColor,
        borderDash: [6, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const mutedColor = resolveThemeColor('--muted-foreground');
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max((goal.target || 10) + 2, ...dataPoints) || 10,
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: mutedColor,
          callback: function(this: unknown, value: number | string) {
            const v = typeof value === 'number' ? value : parseFloat(String(value));
            if (v === goal.current || v === goal.target || v === 0) return v;
            return '';
          },
        },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: mutedColor,
          maxRotation: 0,
          callback: function(this: unknown, index: number) {
            return index === 0 ? formatDate(days[0]) : index === 13 ? 'Now' : '';
          },
        },
      },
    },
  };

  return (
    <div className="page-padding space-y-5 animate-fade-in">
      <div className="card-ios p-5 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: config.color + '20' }}>
          {(() => { const Icon = config.icon; return <Icon size={28} style={{ color: config.color }} />; })()}
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">{goal.title}</h2>
        {!isCompletion && goal.measure && <p className="text-sm text-muted-foreground mb-4">{goal.measure}</p>}
        {isCompletion ? (
          <>
            <p className="text-2xl font-bold text-foreground mb-4">{goal.completed ? 'Completed!' : 'Not yet completed'}</p>
            {!goal.completed && (
              <button
                onClick={handleMarkComplete}
                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                  justCompleted ? 'bg-success text-success-foreground animate-check-pop' : 'bg-primary text-primary-foreground active:scale-[0.98]'
                }`}
              >
                <Check size={24} className={justCompleted ? 'animate-bounce' : ''} strokeWidth={3} />
                Mark Complete
              </button>
            )}
          </>
        ) : (
          <>
            <div className="w-full h-3 rounded-full bg-secondary overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: config.color }} />
            </div>
            <p className="text-2xl font-bold text-foreground">{pct}%</p>
            <p className="text-xs text-muted-foreground">{goal.current} / {goal.target}</p>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={() => onUpdate(-1)} className="px-4 py-2 rounded-xl bg-secondary text-foreground font-medium active-scale">−1</button>
              <button onClick={() => onUpdate(1)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium active-scale">+1</button>
            </div>
          </>
        )}
      </div>

      {!isCompletion && (
        <div className="card-ios p-4">
          <h3 className="font-semibold text-foreground mb-3">Progress Chart</h3>
          <div style={{ height: 200 }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {goal.actions && (
        <div className="card-ios p-4">
          <h3 className="font-semibold text-foreground mb-2">Actions</h3>
          <p className="text-sm text-muted-foreground">{goal.actions}</p>
        </div>
      )}

      <button onClick={onBack} className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium active-scale">
        ← Back to Goals
      </button>
    </div>
  );
}

export default GoalsPage;
