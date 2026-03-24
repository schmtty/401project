import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { Heart } from 'lucide-react';
import MapLocationPicker from '@/components/MapLocationPicker';
import { useEvents } from '@/hooks/useEvents';
import { useConnections } from '@/hooks/useConnections';
import { generateId, EVENT_COLORS } from '@/utils/sampleData';
import type { CalendarEvent, Connection, EventReportMilestones, EventStatus } from '@/utils/sampleData';
import { isEventInPast } from '@/utils/eventTime';

const EVENT_TYPES: CalendarEvent['type'][] = ['date', 'hangout', 'call', 'text', 'other'];

const defaultReportMilestones = (): EventReportMilestones => ({
  heldHands: false,
  kissed: false,
  metParents: false,
});

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
  status: EventStatus;
  reportedAt: string | null;
  reportNotes: string;
  reportMilestones: EventReportMilestones;
};

function emptyForm(partial: Partial<EventFormState> = {}): EventFormState {
  return {
    title: '',
    date: '',
    time: '12:00',
    location: '',
    notes: '',
    type: 'date',
    connectionId: '',
    color: EVENT_COLORS[0],
    status: 'planned',
    reportedAt: null,
    reportNotes: '',
    reportMilestones: defaultReportMilestones(),
    ...partial,
  };
}

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
  const [events, setEvents] = useEvents();
  const [connections, setConnections] = useConnections();
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>('view');
  const [form, setForm] = useState<EventFormState>(emptyForm());

  const event = events.find((e) => e.id === focusedEventId);

  const openEvent = useCallback(
    (eventId: string, m: 'view' | 'edit' = 'view') => {
      setFocusedEventId(eventId);
      setFocusedDate(null);
      setMode(m);
      const ev = events.find((e) => e.id === eventId);
      if (ev) {
        setForm(
          emptyForm({
            title: ev.title,
            date: ev.date,
            time: ev.time,
            location: ev.location,
            notes: ev.notes || '',
            type: ev.type,
            connectionId: ev.connectionId || '',
            color: ev.color || EVENT_COLORS[0],
            lat: ev.lat,
            lng: ev.lng,
            status: ev.status,
            reportedAt: ev.reportedAt ?? null,
            reportNotes: ev.reportNotes || '',
            reportMilestones: ev.reportMilestones
              ? { ...ev.reportMilestones }
              : defaultReportMilestones(),
          })
        );
      }
    },
    [events]
  );

  const openEventForDate = useCallback((date: string) => {
    setFocusedEventId(null);
    setFocusedDate(date);
    setMode('add');
    setForm(
      emptyForm({
        date,
      })
    );
  }, []);

  const closeEvent = useCallback(() => {
    setFocusedEventId(null);
    setFocusedDate(null);
  }, []);

  const handleLikeConnection = useCallback(
    (connectionId: string) => {
      setConnections((prev) =>
        prev.map((c) => (c.id === connectionId ? { ...c, liked: true } : c))
      );
    },
    [setConnections]
  );

  const buildCalendarEventFromForm = useCallback(
    (id: string, prev: CalendarEvent | undefined): CalendarEvent => {
      const prevReportedAt = prev?.reportedAt ?? null;
      const reportedAt =
        form.status === 'planned' ? null : prevReportedAt || new Date().toISOString();
      const linkedConn = form.connectionId
        ? connections.find((c) => c.id === form.connectionId)
        : undefined;
      const reportMilestones =
        form.status === 'happened' && linkedConn?.liked ? { ...form.reportMilestones } : null;

      return {
        id,
        title: form.title.trim(),
        date: form.date,
        time: form.time,
        location: form.location,
        notes: '',
        type: form.type,
        connectionId: form.connectionId || undefined,
        color: form.color,
        lat: form.lat,
        lng: form.lng,
        status: form.status,
        reportedAt,
        reportNotes: form.status === 'planned' ? '' : form.reportNotes,
        reportMilestones,
      };
    },
    [form, connections]
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (focusedEventId) {
      const prev = events.find((x) => x.id === focusedEventId);
      const updated = buildCalendarEventFromForm(focusedEventId, prev);
      setEvents((p) => p.map((ev) => (ev.id === focusedEventId ? updated : ev)));
    } else {
      const newEvent = buildCalendarEventFromForm(generateId(), undefined);
      setEvents((p) => [...p, { ...newEvent, status: 'planned', reportedAt: null, reportNotes: '', reportMilestones: null }]);
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
          onLikeConnection={handleLikeConnection}
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
  onLikeConnection,
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
  onLikeConnection: (connectionId: string) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: () => void;
  onModeChange: (m: 'view' | 'edit' | 'add') => void;
  isAdd: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const displayEvent = event || (isAdd ? null : undefined);
  const conn = connections.find((c) => c.id === (displayEvent?.connectionId || form.connectionId));

  const isPast = isEventInPast(form.date, form.time);
  const showReportSection = isPast && !isAdd;
  /** Server still says unreported — keeps draft form visible after user picks an outcome */
  const showPendingReportForm = isPast && !isAdd && event?.status === 'planned';

  const outcomeChip = (status: EventStatus, label: string) => (
    <button
      key={status}
      type="button"
      onClick={() =>
        setForm((f) => ({
          ...f,
          status,
          reportMilestones: status === 'happened' ? f.reportMilestones : defaultReportMilestones(),
          reportNotes: status === 'planned' ? '' : f.reportNotes,
        }))
      }
      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-ios ${
        form.status === status ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end overflow-hidden">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md mx-auto bg-card rounded-t-3xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 flex-shrink-0 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">
            {isAdd ? 'Add Event' : mode === 'view' ? 'Event Details' : 'Edit Event'}
          </h3>
          <button
            onClick={onClose}
            className="tap-target flex items-center justify-center text-muted-foreground text-xl active-scale"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          {mode === 'view' && !isAdd && displayEvent ? (
            <div className="p-5 space-y-4 pb-24">
              <div>
                <p className="text-2xl font-bold text-foreground">{displayEvent.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {displayEvent.date} ·{' '}
                  {displayEvent.time.replace(/^(\d{2}):(\d{2})$/, (_, h, m) => {
                    const hr = parseInt(h, 10);
                    return `${hr > 12 ? hr - 12 : hr}:${m}${hr >= 12 ? 'PM' : 'AM'}`;
                  })}
                </p>
                {displayEvent.type && (
                  <p className="text-xs text-muted-foreground mt-1 capitalize">Type: {displayEvent.type}</p>
                )}
              </div>
              {displayEvent.location && (
                <p className="text-sm">
                  <span className="font-medium">Location:</span> {displayEvent.location}
                </p>
              )}
              {conn && <p className="text-sm text-primary">with {conn.name}</p>}

              {showPendingReportForm && (
                <form onSubmit={onSave} className="space-y-3 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">Report how it went</p>
                  <div className="flex gap-2">
                    {outcomeChip('happened', 'Happened')}
                    {outcomeChip('fell_through', 'Fell through')}
                  </div>
                  {form.status === 'happened' && (
                    <>
                      <textarea
                        placeholder="Notes about this time together"
                        value={form.reportNotes}
                        onChange={(e) => setForm((f) => ({ ...f, reportNotes: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                      {conn && !conn.liked && (
                        <button
                          type="button"
                          onClick={() => onLikeConnection(conn.id)}
                          className="w-full py-2.5 rounded-xl border border-primary text-primary font-medium flex items-center justify-center gap-2 active-scale"
                        >
                          <Heart size={16} className="shrink-0" />
                          Like {conn.name} to log milestones
                        </button>
                      )}
                      {conn && conn.liked && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Milestones this time</p>
                          {(
                            [
                              ['heldHands', 'Held hands'] as const,
                              ['kissed', 'Kissed'] as const,
                              ['metParents', 'Met family'] as const,
                            ] as const
                          ).map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={!!form.reportMilestones[key]}
                                onChange={(e) =>
                                  setForm((f) => ({
                                    ...f,
                                    reportMilestones: { ...f.reportMilestones, [key]: e.target.checked },
                                  }))
                                }
                                className="rounded border-border"
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {form.status === 'fell_through' && (
                    <textarea
                      placeholder="Optional note (e.g. rescheduling)"
                      value={form.reportNotes}
                      onChange={(e) => setForm((f) => ({ ...f, reportNotes: e.target.value }))}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  )}
                  <button
                    type="submit"
                    disabled={form.status === 'planned'}
                    className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold active-scale disabled:opacity-50"
                  >
                    Submit report
                  </button>
                </form>
              )}

              {isPast && displayEvent && displayEvent.status !== 'planned' && (
                <div className="border-t border-border pt-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Outcome</p>
                  <p className="text-sm capitalize">
                    {displayEvent.status === 'happened' ? 'Happened' : 'Fell through'}
                  </p>
                  {displayEvent.reportNotes && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Notes:</span> {displayEvent.reportNotes}
                    </p>
                  )}
                  {displayEvent.status === 'happened' && conn?.liked && displayEvent.reportMilestones && (
                    <ul className="text-sm text-muted-foreground list-disc pl-4">
                      {displayEvent.reportMilestones.heldHands && <li>Held hands</li>}
                      {displayEvent.reportMilestones.kissed && <li>Kissed</li>}
                      {displayEvent.reportMilestones.metParents && <li>Met family</li>}
                      {!displayEvent.reportMilestones.heldHands &&
                        !displayEvent.reportMilestones.kissed &&
                        !displayEvent.reportMilestones.metParents && <li>No extra milestones logged</li>}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => onModeChange('edit')}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium active-scale"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium active-scale"
                >
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
                  <option key={t} value={t}>
                    {t}
                  </option>
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
              <select
                value={form.connectionId}
                onChange={(e) => setForm((f) => ({ ...f, connectionId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No connection</option>
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
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
                      className={`w-8 h-8 rounded-full transition-all active-scale ${
                        form.color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {showReportSection && (
                <div className="border-t border-border pt-3 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Outcome report</p>
                  <div className="flex gap-2">
                    {outcomeChip('planned', 'Planned')}
                    {outcomeChip('happened', 'Happened')}
                    {outcomeChip('fell_through', 'Fell through')}
                  </div>
                  {(form.status === 'happened' || form.status === 'fell_through') && (
                    <textarea
                      placeholder={form.status === 'happened' ? 'Notes about this time together' : 'Optional note'}
                      value={form.reportNotes}
                      onChange={(e) => setForm((f) => ({ ...f, reportNotes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  )}
                  {form.status === 'happened' && conn && !conn.liked && (
                    <button
                      type="button"
                      onClick={() => onLikeConnection(conn.id)}
                      className="w-full py-2.5 rounded-xl border border-primary text-primary font-medium flex items-center justify-center gap-2 active-scale"
                    >
                      <Heart size={16} className="shrink-0" />
                      Like {conn.name} to log milestones
                    </button>
                  )}
                  {form.status === 'happened' && conn && conn.liked && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Milestones this time</p>
                      {(
                        [
                          ['heldHands', 'Held hands'] as const,
                          ['kissed', 'Kissed'] as const,
                          ['metParents', 'Met family'] as const,
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!form.reportMilestones[key]}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                reportMilestones: { ...f.reportMilestones, [key]: e.target.checked },
                              }))
                            }
                            className="rounded border-border"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold active-scale"
                >
                  {isAdd ? 'Add Event' : 'Save'}
                </button>
                {!isAdd && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-3.5 rounded-xl bg-destructive text-destructive-foreground font-semibold active-scale"
                  >
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
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-secondary font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
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
