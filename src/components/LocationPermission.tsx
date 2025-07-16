import React, { useState, useEffect } from "react";
import { MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { getUserLocation } from "../utils/locationService";

interface LocationPermissionProps {
  onLocationGranted: (location: { lat: number; lng: number }) => void;
  onLocationDenied: () => void;
}

const LocationPermission: React.FC<LocationPermissionProps> = ({
  onLocationGranted,
  onLocationDenied,
}) => {
  const [permissionState, setPermissionState] = useState<
    "prompt" | "granted" | "denied" | "loading"
  >("prompt");
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async () => {
    setPermissionState("loading");
    setError(null);

    try {
      const location = await getUserLocation();
      setPermissionState("granted");
      onLocationGranted(location);
    } catch (error: any) {
      setPermissionState("denied");
      if (error.code === 1) {
        setError(
          "Location access was denied. Please enable location permissions in your browser settings."
        );
      } else if (error.code === 2) {
        setError(
          "Location is unavailable. Please check your internet connection."
        );
      } else if (error.code === 3) {
        setError("Location request timed out. Please try again.");
      } else {
        setError(
          "Unable to get your location. Please try again or enter it manually."
        );
      }
      onLocationDenied();
    }
  };

  useEffect(() => {
    // Check if location permission is already granted
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          requestLocation();
        }
      });
    }
  }, []);

  if (permissionState === "granted") {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>Location enabled</span>
      </div>
    );
  }

  if (permissionState === "loading") {
    return (
      <div className="flex items-center gap-2 text-blue-600 text-sm">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Getting your location...</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-900 mb-1">
            Enable Location for Distance Calculation
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            To show accurate distances to businesses, we need access to your
            location. This helps you find nearby sustainable businesses.
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-2 mb-3">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={requestLocation}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700 transition-colors"
            >
              Enable Location
            </button>
            <button
              onClick={onLocationDenied}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
            >
              Skip for Now
            </button>
          </div>

          {permissionState === "denied" && (
            <div className="mt-3 p-2 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">
                <strong>How to enable location:</strong>
                <br />
                1. Click the location icon in your browser's address bar
                <br />
                2. Select "Allow" for location access
                <br />
                3. Refresh the page and try again
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPermission;
