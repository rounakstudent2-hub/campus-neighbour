import { User } from '../types';

export interface LocationInfo {
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

/**
 * Deterministically resolves the Indian state name according to user coordinates,
 * 6-digit Indian PIN code prefix, locality, or city keywords.
 */
export function detectStateFromLocation(info: LocationInfo | null | undefined): string {
  if (!info) return 'Karnataka';

  // 1. Explicit state provided
  if (info.state && typeof info.state === 'string' && info.state.trim().length > 0) {
    return info.state.trim();
  }

  // 2. PIN code prefix mapping (First 2 digits for Postal Index Number in India)
  const pin = (info.pincode || '').toString().trim();
  if (pin.length >= 2) {
    const p2 = parseInt(pin.substring(0, 2), 10);
    if (p2 === 11) return 'Delhi';
    if (p2 >= 12 && p2 <= 13) return 'Haryana';
    if (p2 >= 14 && p2 <= 16) return 'Punjab';
    if (p2 === 17) return 'Himachal Pradesh';
    if (p2 >= 18 && p2 <= 19) return 'Jammu and Kashmir';
    if (p2 >= 20 && p2 <= 28) return 'Uttar Pradesh';
    if (p2 >= 30 && p2 <= 34) return 'Rajasthan';
    if (p2 >= 36 && p2 <= 39) return 'Gujarat';
    if (p2 >= 40 && p2 <= 44) return 'Maharashtra';
    if (p2 >= 45 && p2 <= 49) return 'Madhya Pradesh';
    if (p2 >= 50 && p2 <= 53) return 'Telangana';
    if (p2 >= 56 && p2 <= 59) return 'Karnataka';
    if (p2 >= 60 && p2 <= 64) return 'Tamil Nadu';
    if (p2 >= 67 && p2 <= 69) return 'Kerala';
    if (p2 >= 70 && p2 <= 74) return 'West Bengal';
    if (p2 >= 75 && p2 <= 77) return 'Odisha';
    if (p2 === 78) return 'Assam';
    if (p2 >= 80 && p2 <= 85) return 'Bihar';
  }

  // 3. Known Locality / City keywords
  const text = `${info.locality || ''} ${info.city || ''}`.toLowerCase();
  if (
    text.includes('newtown') ||
    text.includes('new town') ||
    text.includes('rajarhat') ||
    text.includes('kolkata') ||
    text.includes('salt lake') ||
    text.includes('action area') ||
    text.includes('howrah') ||
    text.includes('durgapur') ||
    text.includes('siliguri') ||
    text.includes('nadia')
  ) {
    return 'West Bengal';
  }
  if (
    text.includes('indiranagar') ||
    text.includes('koramangala') ||
    text.includes('hsr') ||
    text.includes('whitefield') ||
    text.includes('bengaluru') ||
    text.includes('bangalore') ||
    text.includes('mysore') ||
    text.includes('electronic city')
  ) {
    return 'Karnataka';
  }
  if (
    text.includes('mumbai') ||
    text.includes('pune') ||
    text.includes('thane') ||
    text.includes('andheri') ||
    text.includes('bandra') ||
    text.includes('navi mumbai')
  ) {
    return 'Maharashtra';
  }
  if (
    text.includes('delhi') ||
    text.includes('new delhi') ||
    text.includes('ncr') ||
    text.includes('dwarka') ||
    text.includes('connaught') ||
    text.includes('hauz khas')
  ) {
    return 'Delhi';
  }
  if (text.includes('gurgaon') || text.includes('gurugram') || text.includes('faridabad')) {
    return 'Haryana';
  }
  if (text.includes('noida') || text.includes('lucknow')) {
    return 'Uttar Pradesh';
  }
  if (text.includes('hyderabad') || text.includes('secunderabad') || text.includes('gachibowli') || text.includes('hitec')) {
    return 'Telangana';
  }
  if (text.includes('chennai') || text.includes('adyar') || text.includes('t nagar')) {
    return 'Tamil Nadu';
  }

  // 4. Geolocation coordinates bounding box
  if (info.lat && info.lng) {
    const lat = info.lat;
    const lng = info.lng;
    if (lat >= 21.5 && lat <= 27.5 && lng >= 85.5 && lng <= 89.9) return 'West Bengal';
    if (lat >= 11.5 && lat <= 18.5 && lng >= 74.0 && lng <= 78.5) return 'Karnataka';
    if (lat >= 18.5 && lat <= 20.5 && lng >= 72.5 && lng <= 73.5) return 'Maharashtra';
    if (lat >= 28.3 && lat <= 28.9 && lng >= 76.8 && lng <= 77.4) return 'Delhi';
  }

  return 'Karnataka';
}

/**
 * Returns the exact state for a user combining user record and live location.
 */
export function getUserState(user?: User | null, userLocation?: LocationInfo | null): string {
  if (user?.state && user.state.trim().length > 0) {
    return user.state.trim();
  }

  if (user) {
    const fromUser = detectStateFromLocation({
      locality: user.locality,
      city: user.city,
      pincode: user.pincode,
      lat: user.latitude,
      lng: user.longitude,
      state: user.state
    });
    if (fromUser) return fromUser;
  }

  if (userLocation) {
    return detectStateFromLocation(userLocation);
  }

  return 'West Bengal';
}
