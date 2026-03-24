import type { CalendarEvent, Connection, Goal } from './sampleData';

export function migrateConnection(c: Record<string, unknown> & { id: string }): Connection {
  const hasNewFormat = c.gender != null && c.relationship != null && typeof c.liked === 'boolean';
  if (hasNewFormat) {
    return c as Connection;
  }
  const avatar = String(c.avatar ?? '');
  const gender = (c.gender ?? (avatar.includes('👩') || avatar.includes('👱‍♀️') ? 'female' : 'male')) as Connection['gender'];
  return {
    ...c,
    gender: gender as 'male' | 'female',
    relationship: (c.relationship ?? 'connection') as 'family' | 'friend' | 'connection',
    liked: c.liked ?? false,
    name: c.name ?? '',
      age: Number(c.age) || 0,
    phone: c.phone ?? '',
    location: c.location ?? '',
    notes: c.notes ?? '',
    createdAt: c.createdAt ?? new Date().toISOString().split('T')[0],
    milestones: c.milestones ?? {
      dates: 0,
      heldHands: false,
      kissed: false,
      metParents: false,
      contactStreak: 0,
    },
  } as Connection;
}

export function migrateCalendarEvent(raw: Record<string, unknown> & { id: string }): CalendarEvent {
  const rm = raw.reportMilestones as Record<string, unknown> | null | undefined;
  const reportMilestones =
    rm && typeof rm === 'object'
      ? {
          heldHands: !!rm.heldHands,
          kissed: !!rm.kissed,
          metParents: !!rm.metParents,
        }
      : null;

  const st = raw.status;
  const status =
    st === 'happened' || st === 'fell_through' || st === 'planned' ? st : 'planned';

  return {
    id: String(raw.id),
    title: String(raw.title ?? ''),
    date: String(raw.date ?? '').slice(0, 10),
    time: String(raw.time ?? '12:00'),
    location: String(raw.location ?? ''),
    notes: String(raw.notes ?? ''),
    type: (raw.type as CalendarEvent['type']) ?? 'date',
    connectionId: raw.connectionId ? String(raw.connectionId) : undefined,
    color: raw.color ? String(raw.color) : undefined,
    lat: raw.lat != null ? Number(raw.lat) : undefined,
    lng: raw.lng != null ? Number(raw.lng) : undefined,
    status,
    reportedAt: raw.reportedAt != null && raw.reportedAt !== '' ? String(raw.reportedAt) : null,
    reportNotes: String(raw.reportNotes ?? ''),
    reportMilestones,
  };
}

export function migrateGoal(g: Record<string, unknown> & { id: string }): Goal {
  const today = new Date().toISOString().split('T')[0];
  const current = Number(g.current) || 0;
  const existing = g.history as { date: string; value: number }[] | undefined;
  const history = Array.isArray(existing) && existing.length > 0
    ? existing
    : current > 0 ? [{ date: today, value: current }] : [];
  const hasNewFormat = g.goalType != null;
  if (hasNewFormat) {
    return { ...g, goalType: g.goalType ?? 'measurable', history } as Goal;
  }
  return {
    ...g,
    goalType: 'measurable',
    measure: g.measure ?? '',
    target: Number(g.target) || 0,
    current,
    history,
  } as Goal;
}
