// Enhanced geocoding service with multiple fallback options
// Using browser-friendly APIs that support CORS

interface GeocodingResult {
  lat: number;
  lng: number;
}

// Cache for geocoded addresses to avoid repeated API calls
const geocodeCache = new Map<string, GeocodingResult | null>();

/**
 * Geocode an address using multiple fallback services
 * Returns { lat, lng } or null if not found
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address) return null;
  // Check cache first
  const cacheKey = address.toLowerCase().trim();
  if (geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey);
    return cached === undefined ? null : cached;
  }

  const methods = [
    () => geocodeWithPositionStack(address),
    () => geocodeWithMapBox(address),
    () => geocodeWithOpenCage(address),
    () => geocodeWithLocationIQ(address),
    () => geocodeWithNominatimProxy(address),
    () => geocodeWithApproximateLocation(address)
  ];

  for (const method of methods) {
    try {
      const result = await method();
      if (result) {
        console.log(`✅ Successfully geocoded: ${address} -> ${result.lat}, ${result.lng}`);
        geocodeCache.set(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.warn(`Geocoding method failed for ${address}:`, error);
      continue;
    }
  }

  console.warn(`❌ All geocoding methods failed for: ${address}`);
  geocodeCache.set(cacheKey, null);
  return null;
}

/**
 * Method 1: PositionStack (Free tier: 25,000 requests/month)
 * Sign up at https://positionstack.com/ for free API key
 */
async function geocodeWithPositionStack(address: string): Promise<GeocodingResult | null> {
  // You'll need to get a free API key and replace 'YOUR_API_KEY'
  const API_KEY = process.env.REACT_APP_POSITIONSTACK_API_KEY;
  if (!API_KEY) return null;

  const url = `http://api.positionstack.com/v1/forward?access_key=${API_KEY}&query=${encodeURIComponent(address)}&limit=1`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.data && data.data.length > 0) {
    return {
      lat: parseFloat(data.data[0].latitude),
      lng: parseFloat(data.data[0].longitude),
    };
  }
  return null;
}

/**
 * Method 2: Mapbox Geocoding (Free tier: 100,000 requests/month)
 * Sign up at https://mapbox.com/ for free API key
 */
async function geocodeWithMapBox(address: string): Promise<GeocodingResult | null> {
  const API_KEY = process.env.REACT_APP_MAPBOX_API_KEY;
  if (!API_KEY) return null;

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${API_KEY}&limit=1`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    const [lng, lat] = data.features[0].center;
    return { lat, lng };
  }
  return null;
}

/**
 * Method 3: OpenCage Geocoding (Free tier: 2,500 requests/day)
 * Sign up at https://opencagedata.com/ for free API key
 */
async function geocodeWithOpenCage(address: string): Promise<GeocodingResult | null> {
  const API_KEY = process.env.REACT_APP_OPENCAGE_API_KEY;
  if (!API_KEY) return null;

  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${API_KEY}&limit=1&no_annotations=1`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.results && data.results.length > 0) {
    return {
      lat: data.results[0].geometry.lat,
      lng: data.results[0].geometry.lng,
    };
  }
  return null;
}

/**
 * Method 4: LocationIQ (Free tier: 5,000 requests/day)
 * Sign up at https://locationiq.com/ for free API key
 */
async function geocodeWithLocationIQ(address: string): Promise<GeocodingResult | null> {
  const API_KEY = process.env.REACT_APP_LOCATIONIQ_API_KEY;
  if (!API_KEY) return null;

  const url = `https://us1.locationiq.com/v1/search.php?key=${API_KEY}&q=${encodeURIComponent(address)}&format=json&limit=1`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data && data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  }
  return null;
}

/**
 * Method 5: Nominatim with CORS proxy (fallback)
 */
async function geocodeWithNominatimProxy(address: string): Promise<GeocodingResult | null> {
  // Using a CORS proxy service - replace with your own proxy if needed
  const proxyUrl = 'https://corsproxy.io/?';
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const url = proxyUrl + encodeURIComponent(nominatimUrl);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'YourAppName/1.0'
    }
  });
  const data = await response.json();
  
  if (data && data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  }
  return null;
}

/**
 * Method 6: Approximate location based on known cities/areas (last resort)
 */
async function geocodeWithApproximateLocation(address: string): Promise<GeocodingResult | null> {
  const lowerAddress = address.toLowerCase();
  
  // Add more locations as needed
  const approximateLocations: Record<string, GeocodingResult> = {
    'oakville': { lat: 43.4675, lng: -79.6877 },
    'toronto': { lat: 43.6532, lng: -79.3832 },
    'mississauga': { lat: 43.5890, lng: -79.6441 },
    'hamilton': { lat: 43.2557, lng: -79.8711 },
    'burlington': { lat: 43.3255, lng: -79.7990 },
    'milton': { lat: 43.5183, lng: -79.8774 },
    'brampton': { lat: 43.7315, lng: -79.7624 },
    'vaughan': { lat: 43.8361, lng: -79.4985 },
    'markham': { lat: 43.8561, lng: -79.3370 },
    'richmond hill': { lat: 43.8828, lng: -79.4403 },
  };

  for (const [city, coords] of Object.entries(approximateLocations)) {
    if (lowerAddress.includes(city)) {
      console.log(`📍 Using approximate location for ${city}`);
      return coords;
    }
  }

  return null;
}

/**
 * Clear the geocoding cache (useful for testing)
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear();
}

/**
 * Get cache statistics
 */
export function getGeocodeStats(): { cached: number; total: number } {
  const cached = Array.from(geocodeCache.values()).filter(v => v !== null).length;
  return { cached, total: geocodeCache.size };
}