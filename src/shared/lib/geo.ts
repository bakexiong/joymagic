/**
 * IP Geolocation utilities
 */

interface GeoLocation {
  country_code: string;
  country_name: string;
  isRestricted: boolean;
}

const CACHE_KEY = 'user_geo_location';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT_MS = 3000;

async function safeFetchJson(url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Get user's geolocation from IP address
 * Uses ipapi.co free service (1000 requests/day limit)
 */
export async function getUserGeoLocation(): Promise<GeoLocation | null> {
  // Check cache first
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        if (age < CACHE_DURATION) {
          return data.location;
        }
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }
  }

  try {
    // Fetch from ipapi.co (fail open on network/CORS issues)
    const data = await safeFetchJson('https://ipapi.co/json/');
    if (!data) {
      return null;
    }

    // Load restricted countries list (fail open)
    const restrictedData = await safeFetchJson('/countrylist.json');
    const restrictedCodes =
      restrictedData?.tier3_countries?.map((c: any) => c.code) ?? [];

    const location: GeoLocation = {
      country_code: data.country_code || 'UNKNOWN',
      country_name: data.country_name || 'Unknown',
      isRestricted: restrictedCodes.includes(data.country_code)
    };

    // Cache the result
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        location,
        timestamp: Date.now()
      }));
    }

    return location;
  } catch (error) {
    // Fail open - avoid blocking users if the lookup fails (network/CORS/offline)
    console.warn('Failed to get geolocation (skipping restriction check):', (error as any)?.message);
    // On error, allow access (fail open to avoid false positives)
    return null;
  }
}

/**
 * Clear cached geolocation (for testing)
 */
export function clearGeoCache() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
}
