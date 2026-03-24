export type ConnectionGender = 'male' | 'female';
export type ConnectionRelationship = 'family' | 'friend' | 'connection';

export interface Connection {
  id: string;
  name: string;
  age: number;
  phone: string;
  location: string;
  notes: string;
  /** @deprecated Use gender instead. Kept for migration. */
  avatar?: string;
  gender: ConnectionGender;
  relationship: ConnectionRelationship;
  liked: boolean;
  createdAt: string;
  milestones: {
    dates: number;
    heldHands: boolean;
    kissed: boolean;
    metParents: boolean;
    contactStreak: number;
  };
}

export const EVENT_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
] as const;

export type EventColor = (typeof EVENT_COLORS)[number];


export type EventStatus = 'planned' | 'happened' | 'fell_through';

export interface EventReportMilestones {
  heldHands: boolean;
  kissed: boolean;
  metParents: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  type: 'date' | 'hangout' | 'call' | 'text' | 'other';
  connectionId?: string;
  color?: string;
  /** Lat/lng when user picked location from map */
  lat?: number;
  lng?: number;
  /** Outcome: planned until user reports on a past event */
  status: EventStatus;
  reportedAt?: string | null;
  /** Notes from post-event report (not planning notes) */
  reportNotes: string;
  reportMilestones?: EventReportMilestones | null;
}

export type GoalType = 'measurable' | 'completion';

export interface Goal {
  id: string;
  title: string;
  goalType: GoalType;
  measure: string;
  actions: string;
  targetDate: string;
  notes: string;
  category: 'love' | 'fitness' | 'school' | 'work' | 'social';
  target: number;
  current: number;
  completed?: boolean;
  /** Daily progress history for chart: { date: 'YYYY-MM-DD', value: number } */
  history?: { date: string; value: number }[];
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export const sampleConnections: Connection[] = [
  {
    id: '1', name: 'John Cena', age: 24, phone: '555-0101',
    location: 'Provo Library', notes: 'Likes to wrestle',
    gender: 'male', relationship: 'friend', liked: false, createdAt: '2025-12-01',
    milestones: { dates: 3, heldHands: true, kissed: false, metParents: false, contactStreak: 7 },
  },
  {
    id: '2', name: 'Kristy Jensen', age: 22, phone: '555-0102',
    location: 'The Coffee Pod Provo', notes: 'DATE PLANNED THIS FRIDAY DON\'T BE LATE',
    gender: 'female', relationship: 'connection', liked: true, createdAt: '2025-11-15',
    milestones: { dates: 5, heldHands: true, kissed: true, metParents: false, contactStreak: 14 },
  },
  {
    id: '3', name: 'Don Pedro', age: 25, phone: '555-0103',
    location: 'Vasa Fitness Orem', notes: 'Need to setup some pickle ball with him soon...',
    gender: 'male', relationship: 'friend', liked: false, createdAt: '2025-10-20',
    milestones: { dates: 1, heldHands: false, kissed: false, metParents: false, contactStreak: 2 },
  },
  {
    id: '4', name: 'Brinleigh Jackson', age: 23, phone: '555-0104',
    location: 'UVU Art Building', notes: 'SHE WAS CUTE GOTTA MAKE IT HAPPEN',
    gender: 'female', relationship: 'connection', liked: true, createdAt: '2026-01-10',
    milestones: { dates: 2, heldHands: false, kissed: false, metParents: false, contactStreak: 5 },
  },
  {
    id: '5', name: 'Jake Jake', age: 26, phone: '555-0105',
    location: 'Westview Park Orem', notes: 'My absolute dog',
    gender: 'male', relationship: 'friend', liked: false, createdAt: '2026-01-25',
    milestones: { dates: 0, heldHands: false, kissed: false, metParents: false, contactStreak: 1 },
  },
];

const eventDefaults = (
  x: Omit<CalendarEvent, 'status' | 'reportNotes'> & Partial<Pick<CalendarEvent, 'status' | 'reportedAt' | 'reportMilestones'>>
): CalendarEvent => ({
  status: 'planned',
  reportNotes: '',
  ...x,
});

export const sampleEvents: CalendarEvent[] = [
  eventDefaults({ id: '1', title: 'Breakfast with Brooke', date: '2026-02-11', time: '10:00', location: 'BYU Cougareat, Provo, UT', notes: '', type: 'date', connectionId: '2', color: EVENT_COLORS[0] }),
  eventDefaults({ id: '2', title: 'Study Spanish', date: '2026-02-11', time: '11:00', location: 'Provo City Library, Provo, UT', notes: '', type: 'other', color: EVENT_COLORS[1] }),
  eventDefaults({ id: '3', title: 'Lunch with David', date: '2026-02-11', time: '12:00', location: 'BYU Wilkinson Center, Provo, UT', notes: '', type: 'hangout', connectionId: '3', color: EVENT_COLORS[2] }),
  eventDefaults({ id: '4', title: 'Group Blind Date', date: '2026-02-11', time: '17:00', location: 'Center Street, Provo, UT', notes: '', type: 'date', color: EVENT_COLORS[3] }),
  eventDefaults({ id: '5', title: 'Pickle Ball with the boys', date: '2026-02-14', time: '15:00', location: 'Provo Recreation Center, Provo, UT', notes: '', type: 'hangout', connectionId: '3', color: EVENT_COLORS[4] }),
  eventDefaults({ id: '6', title: 'Date with Katelyn', date: '2026-02-14', time: '18:00', location: 'Brick Oven Pizza, Provo, UT', notes: '', type: 'date', connectionId: '2', color: EVENT_COLORS[5] }),
  eventDefaults({ id: '7', title: 'Dinner date', date: '2026-02-15', time: '19:00', location: 'Happy Sumo Sushi, Provo, UT', notes: '', type: 'date', connectionId: '4', color: EVENT_COLORS[6] }),
];

export const sampleGoals: Goal[] = [
  { id: '1', title: 'Go on 10 dates', goalType: 'measurable', measure: 'Number of dates', actions: 'Ask someone out each week', targetDate: '2026-06-01', notes: '', category: 'love', target: 10, current: 6, history: [
    { date: '2026-01-29', value: 2 }, { date: '2026-02-01', value: 3 }, { date: '2026-02-05', value: 4 }, { date: '2026-02-08', value: 5 }, { date: '2026-02-11', value: 6 },
  ]},
  { id: '2', title: 'Hit the gym 5x/week', goalType: 'measurable', measure: 'Gym visits per week', actions: 'Morning workouts', targetDate: '2026-04-01', notes: '', category: 'fitness', target: 20, current: 12, history: [
    { date: '2026-01-28', value: 4 }, { date: '2026-02-02', value: 6 }, { date: '2026-02-06', value: 8 }, { date: '2026-02-09', value: 10 }, { date: '2026-02-11', value: 12 },
  ]},
  { id: '3', title: 'Get 3.5 GPA', goalType: 'measurable', measure: 'GPA score', actions: 'Study 2 hours daily', targetDate: '2026-05-15', notes: '', category: 'school', target: 100, current: 78 },
  { id: '4', title: 'Land internship', goalType: 'completion', measure: '', actions: 'Apply to 5 companies per week', targetDate: '2026-03-01', notes: '', category: 'work', target: 0, current: 0, completed: false },
  { id: '5', title: 'Expand social circle', goalType: 'measurable', measure: 'New people met', actions: 'Attend 2 social events/week', targetDate: '2026-06-01', notes: '', category: 'social', target: 30, current: 12 },
];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
