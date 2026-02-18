const GEOCODE_CACHE_KEY = 'area-book-geocode-cache';
const CACHE_DAYS = 30;

interface CachedResult {
  lat: number;
  lon: number;
  expiry: number;
}

function getCache(): Record<string, CachedResult> {
  try {
    const raw = localStorage.getItem(GEOCODE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedResult>;
    const now = Date.now();
    const filtered: Record<string, CachedResult> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v.expiry > now) filtered[k] = v;
    }
    return filtered;
  } catch {
    return {};
  }
}

function setCache(key: string, lat: number, lon: number) {
  const cache = getCache();
  cache[key.toLowerCase().trim()] = {
    lat,
    lon,
    expiry: Date.now() + CACHE_DAYS * 24 * 60 * 60 * 1000,
  };
  try {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

export async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = location.trim();
  if (!trimmed) return null;

  const cache = getCache();
  const cached = cache[trimmed.toLowerCase()];
  if (cached) return { lat: cached.lat, lng: cached.lon };

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'AreaBook2.0/1.0 (Educational Project; datemap@example.com)',
        },
      }
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        setCache(trimmed, lat, lon);
        return { lat, lng: lon };
      }
    }
  } catch {
    // fallback: return null
  }
  return null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'AreaBook2.0/1.0 (Educational Project; datemap@example.com)',
        },
      }
    );
    const data = await res.json();
    const addr = data?.address;
    if (!addr) return null;
    const parts = [
      addr.road || addr.street,
      addr.city || addr.town || addr.village,
      addr.state,
      addr.country,
    ].filter(Boolean);
    return parts.join(', ') || data.display_name || null;
  } catch {
    return null;
  }
}
