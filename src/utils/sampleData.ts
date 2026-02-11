export interface Connection {
  id: string;
  name: string;
  age: number;
  phone: string;
  location: string;
  notes: string;
  avatar: string;
  createdAt: string;
  milestones: {
    dates: number;
    heldHands: boolean;
    kissed: boolean;
    metParents: boolean;
    contactStreak: number;
  };
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
}

export interface Goal {
  id: string;
  title: string;
  measure: string;
  actions: string;
  targetDate: string;
  notes: string;
  category: 'love' | 'fitness' | 'school' | 'work' | 'social';
  target: number;
  current: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

const AVATARS = [
  '👨‍🦱', '👩‍🦰', '👨', '👩', '🧔',
];

export const sampleConnections: Connection[] = [
  {
    id: '1', name: 'John Cena', age: 24, phone: '555-0101',
    location: 'Campus Library', notes: 'Likes to wrestle',
    avatar: AVATARS[0], createdAt: '2025-12-01',
    milestones: { dates: 3, heldHands: true, kissed: false, metParents: false, contactStreak: 7 },
  },
  {
    id: '2', name: 'Kristy Jensen', age: 22, phone: '555-0102',
    location: 'Coffee Shop', notes: 'DATE PLANNED THIS FRIDAY DON\'T BE LATE',
    avatar: AVATARS[1], createdAt: '2025-11-15',
    milestones: { dates: 5, heldHands: true, kissed: true, metParents: false, contactStreak: 14 },
  },
  {
    id: '3', name: 'Don Pedro', age: 25, phone: '555-0103',
    location: 'Gym', notes: 'Need to setup some pickle ball with him soon...',
    avatar: AVATARS[2], createdAt: '2025-10-20',
    milestones: { dates: 1, heldHands: false, kissed: false, metParents: false, contactStreak: 2 },
  },
  {
    id: '4', name: 'Brinleigh Jackson', age: 23, phone: '555-0104',
    location: 'Art Class', notes: 'SHE WAS CUTE GOTTA MAKE IT HAPPEN',
    avatar: AVATARS[3], createdAt: '2026-01-10',
    milestones: { dates: 2, heldHands: false, kissed: false, metParents: false, contactStreak: 5 },
  },
  {
    id: '5', name: 'Jake Jake', age: 26, phone: '555-0105',
    location: 'Dog Park', notes: 'My absolute dog',
    avatar: AVATARS[4], createdAt: '2026-01-25',
    milestones: { dates: 0, heldHands: false, kissed: false, metParents: false, contactStreak: 1 },
  },
];

export const sampleEvents: CalendarEvent[] = [
  { id: '1', title: 'Breakfast with Brooke', date: '2026-02-11', time: '10:00', location: 'Campus Café', notes: '', type: 'date', connectionId: '2' },
  { id: '2', title: 'Study Spanish', date: '2026-02-11', time: '11:00', location: 'Library', notes: '', type: 'other' },
  { id: '3', title: 'Lunch with David', date: '2026-02-11', time: '12:00', location: 'Student Center', notes: '', type: 'hangout', connectionId: '3' },
  { id: '4', title: 'Group Blind Date', date: '2026-02-11', time: '17:00', location: 'Downtown Restaurant', notes: '', type: 'date' },
  { id: '5', title: 'Pickle Ball with the boys', date: '2026-02-14', time: '15:00', location: 'Rec Center', notes: '', type: 'hangout', connectionId: '3' },
  { id: '6', title: 'Date with Katelyn', date: '2026-02-14', time: '18:00', location: 'Italian Place', notes: '', type: 'date', connectionId: '2' },
  { id: '7', title: 'Dinner date', date: '2026-02-15', time: '19:00', location: 'Sushi Bar', notes: '', type: 'date', connectionId: '4' },
];

export const sampleGoals: Goal[] = [
  { id: '1', title: 'Go on 10 dates', measure: 'Number of dates', actions: 'Ask someone out each week', targetDate: '2026-06-01', notes: '', category: 'love', target: 10, current: 6 },
  { id: '2', title: 'Hit the gym 5x/week', measure: 'Gym visits per week', actions: 'Morning workouts', targetDate: '2026-04-01', notes: '', category: 'fitness', target: 20, current: 12 },
  { id: '3', title: 'Get 3.5 GPA', measure: 'GPA score', actions: 'Study 2 hours daily', targetDate: '2026-05-15', notes: '', category: 'school', target: 100, current: 78 },
  { id: '4', title: 'Land internship', measure: 'Applications sent', actions: 'Apply to 5 companies per week', targetDate: '2026-03-01', notes: '', category: 'work', target: 25, current: 15 },
  { id: '5', title: 'Expand social circle', measure: 'New people met', actions: 'Attend 2 social events/week', targetDate: '2026-06-01', notes: '', category: 'social', target: 30, current: 12 },
];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
