/**
 * Reverse geocoding helper using OpenStreetMap Nominatim
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ locality: string; pincode: string; address?: string; city?: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};

    const locality =
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.road ||
      addr.city_district ||
      addr.village ||
      addr.town ||
      addr.city ||
      '';

    const pincode = addr.postcode || '';
    const city = addr.city || addr.town || addr.state_district || 'Bengaluru';
    const address = [addr.house_number, addr.road, addr.suburb || addr.neighbourhood]
      .filter(Boolean)
      .join(', ');

    return { locality, pincode, address, city };
  } catch (e) {
    console.warn('Reverse geocoding error or timeout:', e);
    return null;
  }
}

export interface GeolocationResult {
  lat: number;
  lng: number;
  locality?: string;
  pincode?: string;
  address?: string;
  city?: string;
}

/**
 * Request browser GPS location and optionally reverse-geocode
 */
export function getCurrentCoordinates(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        let msg = 'Location request timed out or unavailable.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access or type manually.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}
