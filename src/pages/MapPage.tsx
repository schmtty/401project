import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, MoreVertical, Info, Pencil, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PageHeader from '@/components/PageHeader';
import { useEventModal } from '@/contexts/EventModalContext';
import { useConnections } from '@/hooks/useConnections';
import { geocodeLocation } from '@/utils/geocode';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DEFAULT_CENTER: [number, number] = [40.2338, -111.6585]; // Provo, Utah County

type MapStyle = 'clean' | 'satellite';

const MAP_STYLES: Record<MapStyle, { url: string; attribution: string }> = {
  clean: {
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
};

function getPrimaryColor(): string {
  const val = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  return val ? `hsl(${val})` : '#8b5cf6';
}

function createModernMarker(isSelected: boolean) {
  const primaryColor = getPrimaryColor();
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24C32 7.163 24.837 0 16 0z" fill="${primaryColor}"${isSelected ? ' stroke="rgba(0,0,0,0.25)" stroke-width="2"' : ''}/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
}

function MapBounds({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [map, coordinates]);
  return null;
}

function MapZoomToMarker({ coords, active }: { coords: [number, number] | null; active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active && coords) {
      map.setView(coords, 16);
    }
  }, [map, coords, active]);
  return null;
}

const MapPage = () => {
  const navigate = useNavigate();
  const { events, setEvents, openEvent } = useEventModal();
  const [connections] = useConnections();
  const [mapStyle, setMapStyle] = useState<MapStyle>('clean');
  const [showTimeline, setShowTimeline] = useState(true);
  const [filterConnection, setFilterConnection] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [geocoded, setGeocoded] = useState<Record<string, [number, number]>>({});
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filterConnection ? events.filter((e) => e.connectionId === filterConnection) : events),
    [events, filterConnection]
  );

  const eventsWithLocation = useMemo(
    () => filtered.filter((e) => e.location?.trim() || (e.lat != null && e.lng != null)),
    [filtered]
  );

  const getCoordsForEvent = (event: (typeof events)[0]): [number, number] | null => {
    if (event.lat != null && event.lng != null) return [event.lat, event.lng];
    const fromGeocode = event.location?.trim() ? geocoded[event.location.trim()] : null;
    return fromGeocode || null;
  };

  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    eventsWithLocation.forEach((e) => {
      if (e.location?.trim()) locs.add(e.location.trim());
    });
    return [...locs];
  }, [eventsWithLocation]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const results: Record<string, [number, number]> = {};
      for (const loc of uniqueLocations) {
        if (cancelled) return;
        const coord = await geocodeLocation(loc);
        if (coord) results[loc] = [coord.lat, coord.lng];
        if (uniqueLocations.length > 1) await new Promise((r) => setTimeout(r, 1000));
      }
      if (!cancelled) {
        setGeocoded(results);
        setLoading(false);
      }
    };
    setLoading(true);
    load();
    return () => { cancelled = true; };
  }, [uniqueLocations.join(',')]);

  const pointsWithCoords = useMemo(() => {
    return eventsWithLocation
      .map((event) => {
        const coords = getCoordsForEvent(event);
        if (!coords) return null;
        return { event, coords };
      })
      .filter((p): p is { event: (typeof events)[0]; coords: [number, number] } => p !== null)
      .sort((a, b) => a.event.date.localeCompare(b.event.date));
  }, [eventsWithLocation, geocoded]);

  const coordinates = useMemo(() => pointsWithCoords.map((p) => p.coords), [pointsWithCoords]);
  const today = new Date().toISOString().split('T')[0];
  const timelineSegments = useMemo(() => {
    const segments: { positions: [number, number][]; isFuture: boolean }[] = [];
    for (let i = 0; i < pointsWithCoords.length - 1; i++) {
      const nextEvent = pointsWithCoords[i + 1].event;
      segments.push({
        positions: [pointsWithCoords[i].coords, pointsWithCoords[i + 1].coords],
        isFuture: nextEvent.date > today,
      });
    }
    return segments;
  }, [pointsWithCoords, today]);

  const center: [number, number] = useMemo(() => {
    if (coordinates.length === 0) return DEFAULT_CENTER;
    const lat = coordinates.reduce((a, c) => a + c[0], 0) / coordinates.length;
    const lng = coordinates.reduce((a, c) => a + c[1], 0) / coordinates.length;
    return [lat, lng];
  }, [coordinates]);

  const selectedCoords = selectedEvent ? pointsWithCoords.find((p) => p.event.id === selectedEvent)?.coords ?? null : null;

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (selectedEvent === id) setSelectedEvent(null);
    setDeleteConfirmId(null);
  };

  const goToCalendar = (eventId: string, mode: 'view' | 'edit') => {
    navigate(`/calendar?event=${eventId}&mode=${mode}`);
  };

  return (
    <div className="mobile-container pb-24 flex flex-col" style={{ minHeight: '100dvh' }}>
      <PageHeader title="Map" showBack />

      <div className="px-5 py-3 flex-shrink-0 flex flex-wrap gap-3 items-center">
        <select
          value={mapStyle}
          onChange={(e) => setMapStyle(e.target.value as MapStyle)}
          className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-card text-foreground border border-border outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          <option value="clean">Clean</option>
          <option value="satellite">Satellite</option>
        </select>
        {pointsWithCoords.length > 1 && (
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={showTimeline}
              onChange={(e) => setShowTimeline(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-foreground whitespace-nowrap">Timeline</span>
          </label>
        )}
        <select
          value={filterConnection}
          onChange={(e) => {
            setFilterConnection(e.target.value);
            setSelectedEvent(null);
          }}
          className="flex-1 px-4 py-3 rounded-xl bg-card text-foreground border border-border outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          <option value="">All connections</option>
          {connections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="px-5 flex-1 min-h-[300px]">
        <div className="card-ios overflow-hidden rounded-2xl" style={{ height: 'min(70vh, 400px)' }}>
          {loading && coordinates.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-secondary/50">
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={13}
              scrollWheelZoom={true}
              className="w-full h-full rounded-2xl z-0"
              style={{ minHeight: 300 }}
            >
              <TileLayer
                attribution={MAP_STYLES[mapStyle].attribution}
                url={MAP_STYLES[mapStyle].url}
              />
              {coordinates.length > 0 && <MapBounds coordinates={coordinates} />}
              {selectedCoords && <MapZoomToMarker coords={selectedCoords} active={!!selectedEvent} />}
              {showTimeline && timelineSegments.map((seg, i) => (
                <Polyline
                  key={i}
                  positions={seg.positions}
                  pathOptions={{
                    color: getPrimaryColor(),
                    weight: 3,
                    opacity: 0.7,
                    dashArray: seg.isFuture ? '8, 8' : undefined,
                  }}
                />
              ))}
              {pointsWithCoords.map(({ event, coords }) => {
                const conn = connections.find((c) => c.id === event.connectionId);
                const isSelected = selectedEvent === event.id;
                return (
                  <Marker
                    key={event.id}
                    position={coords}
                    icon={createModernMarker(isSelected)}
                    eventHandlers={{
                      click: () => setSelectedEvent(isSelected ? null : event.id),
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-muted-foreground">{event.location || 'Picked on map'}</p>
                        <p className="text-xs">{event.date} · {event.time}</p>
                        {conn && <p className="text-primary text-xs mt-1">with {conn.name}</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>

      <div className="px-5 py-4 flex-shrink-0">
        <h3 className="text-section-title mb-3">Events with locations</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {eventsWithLocation.map((event) => {
            const conn = connections.find((c) => c.id === event.connectionId);
            const coords = getCoordsForEvent(event);
            const isSelected = selectedEvent === event.id;
            return (
              <div
                key={event.id}
                className={`card-ios p-4 animate-slide-up transition-all flex items-start gap-2 ${
                  isSelected ? 'ring-2 ring-primary' : 'cursor-pointer hover:shadow-md'
                }`}
                onClick={() => setSelectedEvent(isSelected ? null : event.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {(event.location || (event.lat != null ? 'Picked on map' : ''))} · {event.date}
                  </p>
                  {conn && <p className="text-xs text-primary mt-0.5">with {conn.name}</p>}
                  {!coords && !event.location && <p className="text-xs text-amber-600 mt-1">Add location to see on map</p>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="tap-target flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => goToCalendar(event.id, 'view')}>
                      <Info size={14} className="mr-2" />
                      View info
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => goToCalendar(event.id, 'edit')}>
                      <Pencil size={14} className="mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteConfirmId(event.id)} className="text-destructive focus:text-destructive">
                      <Trash2 size={14} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
          {eventsWithLocation.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Add events with locations to see them on the map
            </p>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDeleteEvent(deleteConfirmId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MapPage;
