import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, MoreVertical, Info, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useEventModal } from '@/contexts/EventModalContext';
import { useConnections } from '@/hooks/useConnections';
import type { CalendarEvent } from '@/utils/sampleData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage = () => {
  useDocumentTitle('Calendar');
  const [searchParams, setSearchParams] = useSearchParams();
  const { events, setEvents, openEvent, openEventForDate } = useEventModal();
  const [connections] = useConnections();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
  const eventsForDay = (day: number) => events.filter((e) => e.date === dateStr(day));
  const todayEvents = events.filter((e) => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Open event from URL (e.g. /calendar?event=123 or /calendar?date=2026-02-11)
  const handledRef = useRef(false);
  useEffect(() => {
    if (handledRef.current) return;
    const eventId = searchParams.get('event');
    const date = searchParams.get('date');
    const mode = searchParams.get('mode') as 'view' | 'edit' | null;
    if (eventId) {
      handledRef.current = true;
      setSearchParams({});
      openEvent(eventId, mode || 'view');
    } else if (date) {
      handledRef.current = true;
      setSelectedDate(date);
      setSearchParams({});
      openEventForDate(date);
    }
  }, [searchParams]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDeleteConfirmId(null);
  };

  return (
    <div className="mobile-container pb-24">
      <PageHeader
        title="Calendar"
        showBack
        rightAction={
          <button onClick={() => openEventForDate(selectedDate)} className="tap-target flex items-center justify-center text-primary active-scale">
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
            {DAYS.map((d) => (
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
                    isSelected ? 'bg-primary text-primary-foreground font-semibold' : isToday ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  {day}
                  {hasEvents && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 justify-center">
                      {eventsForDay(day).slice(0, 3).map((ev, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : ''}`}
                          style={!isSelected ? { backgroundColor: ev.color || 'hsl(var(--primary))' } : undefined}
                        />
                      ))}
                    </div>
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
          {todayEvents.map((event) => {
            const conn = connections.find((c) => c.id === event.connectionId);
            const eventColor = event.color || 'hsl(var(--primary))';
            return (
              <div
                key={event.id}
                className="card-ios p-4 flex items-start gap-3 animate-slide-up border-l-4 cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderLeftColor: eventColor }}
                onClick={() => openEvent(event.id, 'view')}
              >
                <div className="text-xs font-semibold text-muted-foreground mt-0.5 w-16 shrink-0">
                  {event.time.replace(/^(\d{2}):(\d{2})$/, (_, h, m) => {
                    const hr = parseInt(h);
                    return `${hr > 12 ? hr - 12 : hr}:${m}${hr >= 12 ? 'PM' : 'AM'}`;
                  })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{event.title}</p>
                  {event.location && <p className="text-xs text-muted-foreground">{event.location}</p>}
                  {conn && <p className="text-xs text-primary mt-0.5">with {conn.name}</p>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="tap-target flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEvent(event.id, 'view'); }}>
                      <Info size={14} className="mr-2" />
                      View info
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEvent(event.id, 'edit'); }}>
                      <Pencil size={14} className="mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(event.id); }} className="text-destructive focus:text-destructive">
                      <Trash2 size={14} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
          {todayEvents.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No events for this day</p>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDeleteEvent(deleteConfirmId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CalendarPage;
