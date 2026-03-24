/** Local calendar date YYYY-MM-DD (client timezone) */
export function localDateStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local calendar date relative to `from` (e.g. -1 = yesterday). */
export function offsetLocalDateStr(dayOffset: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + dayOffset);
  return localDateStr(d);
}

/**
 * Heading for the calendar event list: EVENTS TODAY / YESTERDAY / TOMORROW / ON {Mmm d}.
 */
export function formatCalendarEventsHeading(selectedDate: string, now: Date = new Date()): string {
  const today = localDateStr(now);
  const yesterday = offsetLocalDateStr(-1, now);
  const tomorrow = offsetLocalDateStr(1, now);
  if (selectedDate === today) return 'EVENTS TODAY';
  if (selectedDate === yesterday) return 'EVENTS YESTERDAY';
  if (selectedDate === tomorrow) return 'EVENTS TOMORROW';
  const d = new Date(`${selectedDate}T12:00:00`);
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `EVENTS ON ${label}`;
}

export function eventMinutesFromMidnight(timeStr: string): number {
  const [h = 12, m = 0] = String(timeStr || '12:00').split(':').map((x) => parseInt(x, 10));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

/**
 * True when event date/time is not after the current local moment
 * (same rules as backend `isEventInPast`).
 */
export function isEventInPast(dateStr: string, timeStr: string, now = new Date()): boolean {
  const today = localDateStr(now);
  if (dateStr < today) return true;
  if (dateStr > today) return false;
  return eventMinutesFromMidnight(timeStr) <= now.getHours() * 60 + now.getMinutes();
}

export type EventTemporalBucket = 'past' | 'today' | 'future';

/**
 * Classify relative to now:
 * - past: already occurred
 * - today: still later today (same calendar day, time in the future)
 * - future: scheduled on a date after today
 */
export function getEventTemporalBucket(dateStr: string, timeStr: string, now = new Date()): EventTemporalBucket {
  const today = localDateStr(now);
  if (dateStr > today) return 'future';
  if (dateStr < today) return 'past';
  return isEventInPast(dateStr, timeStr, now) ? 'past' : 'today';
}

export function eventNeedsReport(
  event: { date: string; time: string; status?: string },
  now = new Date()
): boolean {
  const status = event.status ?? 'planned';
  return isEventInPast(event.date, event.time, now) && status === 'planned';
}
