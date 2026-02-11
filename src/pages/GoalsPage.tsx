import { useState } from 'react';
import { Plus, Heart, GraduationCap, Briefcase, Users, Dumbbell, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { sampleGoals, generateId } from '@/utils/sampleData';
import type { Goal } from '@/utils/sampleData';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const categoryConfig: Record<Goal['category'], { icon: typeof Heart; color: string; label: string }> = {
  love: { icon: Heart, color: 'hsl(var(--love))', label: 'Love' },
  fitness: { icon: Dumbbell, color: 'hsl(var(--warning))', label: 'Fitness' },
  school: { icon: GraduationCap, color: 'hsl(var(--primary))', label: 'School' },
  work: { icon: Briefcase, color: 'hsl(var(--success))', label: 'Work' },
  social: { icon: Users, color: 'hsl(var(--muted-foreground))', label: 'Social' },
};

const GoalsPage = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useLocalStorage<Goal[]>('goals', sampleGoals);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', measure: '', actions: '', targetDate: '', notes: '',
    category: 'love' as Goal['category'], target: '10', current: '0',
  });

  const featured = goals.find(g => g.category === 'fitness') || goals[0];

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const newGoal: Goal = {
      id: generateId(),
      title: form.title,
      measure: form.measure,
      actions: form.actions,
      targetDate: form.targetDate,
      notes: form.notes,
      category: form.category,
      target: parseInt(form.target) || 10,
      current: parseInt(form.current) || 0,
    };
    setGoals(prev => [...prev, newGoal]);
    setForm({ title: '', measure: '', actions: '', targetDate: '', notes: '', category: 'love', target: '10', current: '0' });
    setShowAdd(false);
  };

  const updateProgress = (id: string, delta: number) => {
    setGoals(prev => prev.map(g =>
      g.id === id ? { ...g, current: Math.max(0, Math.min(g.target, g.current + delta)) } : g
    ));
  };

  const detail = selectedGoal ? goals.find(g => g.id === selectedGoal) : null;

  return (
    <div className="mobile-container pb-24">
      <PageHeader
        title={detail ? 'Goal Detail' : 'Goals'}
        showBack={!!detail}
        rightAction={
          !detail ? (
            <button onClick={() => setShowAdd(true)} className="tap-target flex items-center justify-center text-primary active-scale">
              <Plus size={24} />
            </button>
          ) : undefined
        }
      />

      {detail ? (
        <GoalDetail goal={detail} onUpdate={(delta) => updateProgress(detail.id, delta)} onBack={() => setSelectedGoal(null)} />
      ) : (
        <div className="page-padding space-y-5">
          {/* Featured goal */}
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
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(featured.current / featured.target) * 100}%`, backgroundColor: categoryConfig[featured.category].color }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{Math.round((featured.current / featured.target) * 100)}% complete</p>
              </button>
            </div>
          )}

          {/* All goals */}
          <div>
            <h2 className="text-section-title mb-3">All Goals</h2>
            <div className="space-y-2">
              {goals.map(goal => {
                const config = categoryConfig[goal.category];
                const Icon = config.icon;
                const pct = Math.round((goal.current / goal.target) * 100);
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
                        {pct >= 80 ? 'On track with goal' : pct >= 50 ? 'Making progress!' : 'Might need to pick it up a little! You got this!'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{pct}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-end">
          <div className="w-full max-w-md mx-auto bg-card rounded-t-3xl p-5 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">New Goal</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground text-lg">×</button>
            </div>
            <form onSubmit={handleAddGoal} className="space-y-3">
              <input placeholder="What is your goal?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary" />
              <input placeholder="How will you measure it?" value={form.measure} onChange={e => setForm(f => ({ ...f, measure: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary" />
              <input placeholder="What actions will you take?" value={form.actions} onChange={e => setForm(f => ({ ...f, actions: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary" />
              <div className="flex gap-2">
                <input type="number" placeholder="Target" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary" />
                <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary" />
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
      )}
    </div>
  );
};

function GoalDetail({ goal, onUpdate, onBack }: { goal: Goal; onUpdate: (delta: number) => void; onBack: () => void }) {
  const config = categoryConfig[goal.category];
  const pct = Math.round((goal.current / goal.target) * 100);

  // Simulated progress data for chart
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Now'];
  const dataPoints = [
    Math.round(goal.current * 0.2),
    Math.round(goal.current * 0.4),
    Math.round(goal.current * 0.65),
    Math.round(goal.current * 0.85),
    goal.current,
  ];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Progress',
        data: dataPoints,
        borderColor: config.color,
        backgroundColor: config.color + '20',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: config.color,
      },
      {
        label: 'Goal',
        data: labels.map(() => goal.target),
        borderColor: 'hsl(var(--border))',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      y: { beginAtZero: true, max: goal.target + 5, grid: { color: 'hsl(var(--border))' }, ticks: { color: 'hsl(var(--muted-foreground))' } },
      x: { grid: { display: false }, ticks: { color: 'hsl(var(--muted-foreground))' } },
    },
  };

  return (
    <div className="page-padding space-y-5 animate-fade-in">
      <div className="card-ios p-5 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: config.color + '20' }}>
          {(() => { const Icon = config.icon; return <Icon size={28} style={{ color: config.color }} />; })()}
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">{goal.title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{goal.measure}</p>
        <div className="w-full h-3 rounded-full bg-secondary overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: config.color }} />
        </div>
        <p className="text-2xl font-bold text-foreground">{pct}%</p>
        <p className="text-xs text-muted-foreground">{goal.current} / {goal.target}</p>
        <div className="flex gap-3 justify-center mt-4">
          <button onClick={() => onUpdate(-1)} className="px-4 py-2 rounded-xl bg-secondary text-foreground font-medium active-scale">−1</button>
          <button onClick={() => onUpdate(1)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium active-scale">+1</button>
          <button onClick={() => onUpdate(5)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium active-scale">+5</button>
        </div>
      </div>

      <div className="card-ios p-4">
        <h3 className="font-semibold text-foreground mb-3">Progress Chart</h3>
        <div style={{ height: 200 }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

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
