import { getDistance } from "geolib";

interface Location {
  lat: number;
  lng: number;
}

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Get user's current location
 */
export const getUserLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

/**
 * Calculate distance between two locations
 */
export const calculateDistance = (
  location1: Location,
  location2: Location
): number => {
  return getDistance(
    { latitude: location1.lat, longitude: location1.lng },
    { latitude: location2.lat, longitude: location2.lng }
  );
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  }
};

/**
 * Get distance string between user location and business location
 */
export const getDistanceString = async (
  businessLocation: Location,
  userLocation?: Location
): Promise<string> => {
  try {
    const currentUserLocation = userLocation || (await getUserLocation());
    const distanceInMeters = calculateDistance(
      currentUserLocation,
      businessLocation
    );
    return formatDistance(distanceInMeters);
  } catch (error) {
    console.error("Error calculating distance:", error);
    return "Distance N/A";
  }
};

/**
 * Sort businesses by distance from user location
 */
export const sortBusinessesByDistance = async <
  T extends { location?: Location }
>(
  businesses: T[],
  userLocation?: Location
): Promise<T[]> => {
  try {
    const currentUserLocation = userLocation || (await getUserLocation());

    return businesses.sort((a, b) => {
      if (!a.location && !b.location) return 0;
      if (!a.location) return 1;
      if (!b.location) return -1;

      const distanceA = calculateDistance(currentUserLocation, a.location);
      const distanceB = calculateDistance(currentUserLocation, b.location);

      return distanceA - distanceB;
    });
  } catch (error) {
    console.error("Error sorting businesses by distance:", error);
    return businesses;
  }
};
