import { useState } from 'react';
import { MapPin } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { sampleEvents, sampleConnections } from '@/utils/sampleData';
import type { CalendarEvent, Connection } from '@/utils/sampleData';

// Simulated location positions for event locations
const locationPositions: Record<string, { x: number; y: number }> = {
  'Campus Café': { x: 25, y: 30 },
  'Library': { x: 45, y: 20 },
  'Student Center': { x: 55, y: 50 },
  'Downtown Restaurant': { x: 70, y: 65 },
  'Rec Center': { x: 30, y: 70 },
  'Italian Place': { x: 80, y: 35 },
  'Sushi Bar': { x: 60, y: 80 },
  'Coffee Shop': { x: 35, y: 45 },
  'Gym': { x: 20, y: 60 },
  'Art Class': { x: 50, y: 35 },
  'Dog Park': { x: 75, y: 50 },
};

const getPosition = (location: string) => {
  if (locationPositions[location]) return locationPositions[location];
  // Generate deterministic position from string
  let hash = 0;
  for (let i = 0; i < location.length; i++) hash = location.charCodeAt(i) + ((hash << 5) - hash);
  return { x: 15 + (Math.abs(hash) % 70), y: 15 + (Math.abs(hash >> 8) % 70) };
};

const MapPage = () => {
  const [events] = useLocalStorage<CalendarEvent[]>('events', sampleEvents);
  const [connections] = useLocalStorage<Connection[]>('connections', sampleConnections);
  const [filterConnection, setFilterConnection] = useState('');
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

  const filtered = filterConnection
    ? events.filter(e => e.connectionId === filterConnection)
    : events;

  // Unique locations
  const locationEvents = filtered.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    if (e.location) {
      if (!acc[e.location]) acc[e.location] = [];
      acc[e.location].push(e);
    }
    return acc;
  }, {});

  const locations = Object.keys(locationEvents);
  const points = locations.map(l => ({ location: l, ...getPosition(l) }));

  return (
    <div className="mobile-container pb-24">
      <PageHeader title="Map" />

      {/* Filter */}
      <div className="px-5 mb-3">
        <select
          value={filterConnection}
          onChange={e => { setFilterConnection(e.target.value); setSelectedPin(null); }}
          className="w-full px-4 py-3 rounded-xl bg-card text-foreground border border-border outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          <option value="">All connections</option>
          {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Simulated Map */}
      <div className="px-5 mb-4">
        <div className="card-ios relative overflow-hidden" style={{ aspectRatio: '1/1' }}>
          {/* Grid background */}
          <div className="absolute inset-0 bg-secondary">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Grid lines */}
              {Array.from({ length: 10 }, (_, i) => (
                <g key={i}>
                  <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke="hsl(var(--border))" strokeWidth="0.3" />
                  <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="hsl(var(--border))" strokeWidth="0.3" />
                </g>
              ))}
              {/* Roads */}
              <line x1={10} y1={50} x2={90} y2={50} stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" opacity="0.3" />
              <line x1={50} y1={10} x2={50} y2={90} stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" opacity="0.3" />
              <line x1={20} y1={20} x2={80} y2={80} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.2" />
              {/* Connect pins with lines */}
              {points.length > 1 && points.map((p, i) => {
                if (i === 0) return null;
                const prev = points[i - 1];
                return (
                  <line key={i} x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
                    stroke="hsl(var(--primary))" strokeWidth="0.5" strokeDasharray="2,1" opacity="0.5" />
                );
              })}
            </svg>
            {/* Pins */}
            {points.map((p) => (
              <button
                key={p.location}
                onClick={() => setSelectedPin(selectedPin === p.location ? null : p.location)}
                className="absolute transform -translate-x-1/2 -translate-y-full active-scale"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <MapPin
                  size={24}
                  className={`drop-shadow-md transition-ios ${
                    selectedPin === p.location ? 'text-primary scale-125' : 'text-destructive'
                  }`}
                  fill="currentColor"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected pin details or nearby list */}
      <div className="px-5">
        <h3 className="text-section-title mb-3">
          {selectedPin ? selectedPin : 'Nearby Events'}
        </h3>
        <div className="space-y-2">
          {(selectedPin ? (locationEvents[selectedPin] || []) : filtered).map(event => {
            const conn = connections.find(c => c.id === event.connectionId);
            const pos = getPosition(event.location);
            const dist = selectedPin ? '' : `${(Math.sqrt(pos.x * pos.x + pos.y * pos.y) / 20).toFixed(1)} mi`;
            return (
              <div key={event.id} className="card-ios p-4 animate-slide-up">
                {dist && <p className="text-xs font-semibold text-primary mb-1">{dist}</p>}
                <p className="font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.location} · {event.date}</p>
                {conn && <p className="text-xs text-primary mt-0.5">with {conn.name}</p>}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No events to display</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
