import type { CalendarEvent, Connection } from '@/utils/sampleData';
import { localDateStr } from '@/utils/eventTime';

export type DerivedMilestones = Connection['milestones'];

const emptyMilestones = (): DerivedMilestones => ({
  dates: 0,
  heldHands: false,
  kissed: false,
  metParents: false,
  contactStreak: 0,
});

/**
 * Milestones shown on the connection dashboard: derived from reported calendar events only.
 */
export function deriveMilestonesFromEvents(connectionId: string, events: CalendarEvent[]): DerivedMilestones {
  const connEvents = events.filter((e) => e.connectionId === connectionId);
  if (connEvents.length === 0) return emptyMilestones();

  const dates = connEvents.filter((e) => e.type === 'date' && e.status === 'happened').length;

  let heldHands = false;
  let kissed = false;
  let metParents = false;
  for (const e of connEvents) {
    if (e.status !== 'happened' || !e.reportMilestones) continue;
    const rm = e.reportMilestones;
    heldHands = heldHands || !!rm.heldHands;
    kissed = kissed || !!rm.kissed;
    metParents = metParents || !!rm.metParents;
  }

  let contactStreak = 0;
  const d = new Date();
  while (true) {
    const dayStr = localDateStr(d);
    const has = connEvents.some(
      (e) =>
        e.date === dayStr &&
        (e.type === 'call' || e.type === 'text') &&
        e.status === 'happened'
    );
    if (!has) break;
    contactStreak += 1;
    d.setDate(d.getDate() - 1);
  }

  return { dates, heldHands, kissed, metParents, contactStreak };
}
