import { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { sampleEvents, sampleConnections, generateId } from '@/utils/sampleData';
import type { CalendarEvent, Connection } from '@/utils/sampleData';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVENT_TYPES: CalendarEvent['type'][] = ['date', 'hangout', 'call', 'text', 'other'];

const CalendarPage = () => {
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('events', sampleEvents);
  const [connections] = useLocalStorage<Connection[]>('connections', sampleConnections);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', time: '12:00', location: '', notes: '', type: 'date' as CalendarEvent['type'], connectionId: '' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  const dateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const eventsForDay = (day: number) => events.filter(e => e.date === dateStr(day));
  const todayEvents = events.filter(e => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const newEvent: CalendarEvent = {
      id: generateId(),
      title: form.title,
      date: selectedDate,
      time: form.time,
      location: form.location,
      notes: form.notes,
      type: form.type,
      connectionId: form.connectionId || undefined,
    };
    setEvents(prev => [...prev, newEvent]);
    setForm({ title: '', time: '12:00', location: '', notes: '', type: 'date', connectionId: '' });
    setShowAdd(false);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="mobile-container pb-24">
      <PageHeader
        title="Calendar"
        rightAction={
          <button onClick={() => setShowAdd(!showAdd)} className="tap-target flex items-center justify-center text-primary active-scale">
            <Plus size={24} />
          </button>
        }
      />

      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 mb-3">
        <button onClick={prevMonth} className="tap-target active-scale"><ChevronLeft size={20} /></button>
        <h2 className="font-semibold text-foreground">{monthNames[month]} {year}</h2>
        <button onClick={nextMonth} className="tap-target active-scale"><ChevronRight size={20} /></button>
      </div>

      {/* Calendar grid */}
      <div className="px-5 mb-4">
        <div className="card-ios p-3">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />;
              const ds = dateStr(day);
              const hasEvents = eventsForDay(day).length > 0;
              const isSelected = ds === selectedDate;
              const isToday = ds === today;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(ds)}
                  className={`relative aspect-square rounded-xl flex items-center justify-center text-sm transition-ios ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : isToday
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  {day}
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Events for selected day */}
      <div className="px-5">
        <h3 className="text-section-title mb-3">
          {selectedDate === today ? 'Planned for today' : `Events on ${selectedDate}`}
        </h3>
        <div className="space-y-2">
          {todayEvents.map(event => {
            const conn = connections.find(c => c.id === event.connectionId);
            return (
              <div key={event.id} className="card-ios p-4 flex items-start gap-3 animate-slide-up">
                <div className="text-xs font-semibold text-muted-foreground mt-0.5 w-16 shrink-0">
                  {event.time.replace(/^(\d{2}):(\d{2})$/, (_, h, m) => {
                    const hr = parseInt(h);
                    return `${hr > 12 ? hr - 12 : hr}:${m}${hr >= 12 ? 'PM' : 'AM'}`;
                  })}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{event.title}</p>
                  {event.location && <p className="text-xs text-muted-foreground">{event.location}</p>}
                  {conn && <p className="text-xs text-primary mt-0.5">with {conn.name}</p>}
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Delete event?')) {
                      setEvents(prev => prev.filter(e => e.id !== event.id));
                    }
                  }}
                  className="text-xs text-destructive font-medium"
                >
                  ×
                </button>
              </div>
            );
          })}
          {todayEvents.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No events for this day</p>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-end">
          <div className="w-full max-w-md mx-auto bg-card rounded-t-3xl p-5 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">New Event</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground text-lg">×</button>
            </div>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <input
                placeholder="Event title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as CalendarEvent['type'] }))}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary"
                >
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <input
                placeholder="Location"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={form.connectionId}
                onChange={e => setForm(f => ({ ...f, connectionId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No connection</option>
                {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="submit" className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold active-scale">
                Add Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
