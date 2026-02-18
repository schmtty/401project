import type { Connection, Goal } from './sampleData';

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
