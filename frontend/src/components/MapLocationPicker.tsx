import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode } from '@/utils/geocode';

const DEFAULT_CENTER: [number, number] = [40.2338, -111.6585];

function MapClickHandler({
  marker,
  onSelect,
}: {
  marker: [number, number] | null;
  onSelect: (lat: number, lng: number, address: string | null) => void;
}) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      onSelect(lat, lng, address);
    },
  });

  if (!marker) return null;
  return <Marker position={marker} />;
}

function MapContent({ onSelect }: { onSelect: (lat: number, lng: number, address: string | null) => void }) {
  const [marker, setMarker] = useState<[number, number] | null>(null);

  const handleSelect = (lat: number, lng: number, address: string | null) => {
    setMarker([lat, lng]);
    onSelect(lat, lng, address);
  };

  return (
    <>
      <MapClickHandler marker={marker} onSelect={handleSelect} />
    </>
  );
}

interface MapLocationPickerProps {
  onSelect: (lat: number, lng: number, address: string | null) => void;
  onClose: () => void;
}

export default function MapLocationPicker({ onSelect, onClose }: MapLocationPickerProps) {
  const [pending, setPending] = useState<{ lat: number; lng: number; address: string | null } | null>(null);

  const handleSelect = (lat: number, lng: number, address: string | null) => {
    setPending({ lat, lng, address });
  };

  const handleConfirm = () => {
    if (pending) {
      onSelect(pending.lat, pending.lng, pending.address);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Pick location on map</h3>
        <button onClick={onClose} className="tap-target text-muted-foreground">
          Cancel
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          className="w-full h-full"
          style={{ minHeight: 300 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapContent onSelect={handleSelect} />
        </MapContainer>
      </div>
      {pending && (
        <div className="p-4 border-t border-border space-y-2">
          <p className="text-sm text-muted-foreground">{pending.address || `${pending.lat.toFixed(4)}, ${pending.lng.toFixed(4)}`}</p>
          <button onClick={handleConfirm} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium">
            Use this location
          </button>
        </div>
      )}
      {!pending && <p className="p-4 text-sm text-muted-foreground">Tap on the map to select a location</p>}
    </div>
  );
}
