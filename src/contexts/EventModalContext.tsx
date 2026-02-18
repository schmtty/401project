import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import MapLocationPicker from '@/components/MapLocationPicker';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useConnections } from '@/hooks/useConnections';
import { sampleEvents, generateId, EVENT_COLORS } from '@/utils/sampleData';
import type { CalendarEvent, Connection } from '@/utils/sampleData';

const EVENT_TYPES: CalendarEvent['type'][] = ['date', 'hangout', 'call', 'text', 'other'];

type EventFormState = {
  title: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  type: CalendarEvent['type'];
  connectionId: string;
  color: string;
  lat?: number;
  lng?: number;
};

interface EventModalContextType {
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  openEvent: (eventId: string, mode?: 'view' | 'edit') => void;
  openEventForDate: (date: string) => void;
  closeEvent: () => void;
  focusedEventId: string | null;
  focusedDate: string | null;
}

const EventModalContext = createContext<EventModalContextType | undefined>(undefined);

export function EventModalProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('events', sampleEvents);
  const [connections] = useConnections();
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>('view');
  const [form, setForm] = useState<EventFormState>({
    title: '',
    date: '',
    time: '12:00',
    location: '',
    notes: '',
    type: 'date',
    connectionId: '',
    color: EVENT_COLORS[0],
  });

  const event = events.find((e) => e.id === focusedEventId);

  const openEvent = useCallback((eventId: string, m: 'view' | 'edit' = 'view') => {
    setFocusedEventId(eventId);
    setFocusedDate(null);
    setMode(m);
    const ev = events.find((e) => e.id === eventId);
    if (ev) {
      setForm({
        title: ev.title,
        date: ev.date,
        time: ev.time,
        location: ev.location,
        notes: ev.notes,
        type: ev.type,
        connectionId: ev.connectionId || '',
        color: ev.color || EVENT_COLORS[0],
        lat: ev.lat,
        lng: ev.lng,
      });
    }
  }, [events]);

  const openEventForDate = useCallback((date: string) => {
    setFocusedEventId(null);
    setFocusedDate(date);
    setMode('add');
    setForm({
      title: '',
      date,
      time: '12:00',
      location: '',
      notes: '',
      type: 'date',
      connectionId: '',
      color: EVENT_COLORS[0],
    });
  }, []);

  const closeEvent = useCallback(() => {
    setFocusedEventId(null);
    setFocusedDate(null);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (focusedEventId) {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === focusedEventId
            ? {
                ...ev,
                ...form,
                connectionId: form.connectionId || undefined,
                lat: form.lat,
                lng: form.lng,
              }
            : ev
        )
      );
    } else {
      const newEvent: CalendarEvent = {
        id: generateId(),
        ...form,
        connectionId: form.connectionId || undefined,
        lat: form.lat,
        lng: form.lng,
      };
      setEvents((prev) => [...prev, newEvent]);
    }
    closeEvent();
  };

  const handleDelete = () => {
    if (focusedEventId) {
      setEvents((prev) => prev.filter((e) => e.id !== focusedEventId));
    }
    closeEvent();
  };

  const isOpen = !!focusedEventId || !!focusedDate;

  return (
    <EventModalContext.Provider
      value={{
        events,
        setEvents,
        openEvent,
        openEventForDate,
        closeEvent,
        focusedEventId,
        focusedDate,
      }}
    >
      {children}
      {isOpen && (
        <EventModal
          event={event}
          mode={mode}
          form={form}
          setForm={setForm}
          connections={connections}
          onClose={closeEvent}
          onSave={handleSave}
          onDelete={handleDelete}
          onModeChange={setMode}
          isAdd={!!focusedDate && !focusedEventId}
        />
      )}
    </EventModalContext.Provider>
  );
}

function EventModal({
  event,
  mode,
  form,
  setForm,
  connections,
  onClose,
  onSave,
  onDelete,
  onModeChange,
  isAdd,
}: {
  event: CalendarEvent | undefined;
  mode: 'view' | 'edit' | 'add';
  form: EventFormState;
  setForm: React.Dispatch<React.SetStateAction<EventFormState>>;
  connections: Connection[];
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: () => void;
  onModeChange: (m: 'view' | 'edit' | 'add') => void;
  isAdd: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const displayEvent = event || (isAdd ? null : undefined);
  const conn = connections.find((c) => c.id === (displayEvent?.connectionId || form.connectionId));

  return (
    <div className="fixed inset-0 z-[60] flex items-end overflow-hidden">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md mx-auto bg-card rounded-t-3xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 flex-shrink-0 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">
            {isAdd ? 'New Event' : mode === 'view' ? 'Event Details' : 'Edit Event'}
          </h3>
          <button onClick={onClose} className="tap-target flex items-center justify-center text-muted-foreground text-xl active-scale">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          {mode === 'view' && !isAdd && displayEvent ? (
            <div className="p-5 space-y-4 pb-24">
              <div>
                <p className="text-2xl font-bold text-foreground">{displayEvent.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {displayEvent.date} · {displayEvent.time.replace(/^(\d{2}):(\d{2})$/, (_, h, m) => {
                    const hr = parseInt(h);
                    return `${hr > 12 ? hr - 12 : hr}:${m}${hr >= 12 ? 'PM' : 'AM'}`;
                  })}
                </p>
              </div>
              {displayEvent.location && <p className="text-sm"><span className="font-medium">Location:</span> {displayEvent.location}</p>}
              {displayEvent.notes && <p className="text-sm"><span className="font-medium">Notes:</span> {displayEvent.notes}</p>}
              {conn && <p className="text-sm text-primary">with {conn.name}</p>}
              <div className="flex gap-2">
                <button onClick={() => onModeChange('edit')} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium active-scale">
                  Edit
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium active-scale">
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSave} className="p-5 space-y-3 pb-24">
              <input
                placeholder="Event title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CalendarEvent['type'] }))}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div>
                <input
                  placeholder="Location (e.g. Provo, UT)"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="mt-2 text-sm text-primary font-medium"
                >
                  Or pick location on map
                </button>
              </div>
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <select
                value={form.connectionId}
                onChange={(e) => setForm((f) => ({ ...f, connectionId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No connection</option>
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Event Color</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full transition-all active-scale ${form.color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold active-scale">
                  {isAdd ? 'Add Event' : 'Save'}
                </button>
                {!isAdd && (
                  <button type="button" onClick={() => setShowDeleteConfirm(true)} className="px-4 py-3.5 rounded-xl bg-destructive text-destructive-foreground font-semibold active-scale">
                    Delete
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {showMapPicker && (
        <MapLocationPicker
          onSelect={(lat, lng, address) => {
            setForm((f) => ({ ...f, lat, lng, location: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl p-5 max-w-sm w-full">
            <h4 className="font-semibold text-foreground mb-2">Delete event?</h4>
            <p className="text-sm text-muted-foreground mb-4">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-xl bg-secondary font-medium">
                Cancel
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); onDelete(); }}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function useEventModal() {
  const ctx = useContext(EventModalContext);
  if (!ctx) throw new Error('useEventModal must be used within EventModalProvider');
  return ctx;
}
