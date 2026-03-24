import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { CalendarEvent } from '@/utils/sampleData';
import { migrateCalendarEvent } from '@/utils/migrateData';
import { useUser } from '@/contexts/UserContext';

export function useEvents(): [CalendarEvent[], React.Dispatch<React.SetStateAction<CalendarEvent[]>>] {
  const { currentUser } = useUser();
  const [events, setEventsState] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!currentUser) {
      setEventsState([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.events.getAll(currentUser.id);
      setEventsState(data.map((row: Record<string, unknown> & { id: string }) => migrateCalendarEvent(row)));
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setEventsState([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const setEvents = useCallback(
    async (value: CalendarEvent[] | ((prev: CalendarEvent[]) => CalendarEvent[])) => {
      if (!currentUser) return;
      const prev = events;
      const newEvents = typeof value === 'function' ? value(prev) : value;

      const prevIds = new Set(prev.map((e) => e.id));
      const newIds = new Set(newEvents.map((e) => e.id));
      const added = newEvents.filter((e) => !prevIds.has(e.id));
      const removed = prev.filter((e) => !newIds.has(e.id));
      const updated = newEvents.filter((e) => prevIds.has(e.id) && JSON.stringify(prev.find((x) => x.id === e.id)) !== JSON.stringify(e));

      setEventsState(newEvents);

      try {
        for (const e of added) await api.events.create(currentUser.id, e);
        for (const e of removed) await api.events.delete(currentUser.id, e.id);
        for (const e of updated) await api.events.update(currentUser.id, e.id, e);
        if (added.length || removed.length || updated.length) fetchEvents();
      } catch (err) {
        console.error('Failed to sync events:', err);
        fetchEvents();
      }
    },
    [events, fetchEvents, currentUser?.id]
  );

  return [loading ? [] : events, setEvents];
}
