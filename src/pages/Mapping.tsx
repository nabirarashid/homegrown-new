import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, Minus, Navigation } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getUserLocation } from "../utils/locationService";

interface Business {
  id: string;
  businessName: string;
  description: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  tags?: string[];
}

// Extend Window interface to include Leaflet
declare global {
  interface Window {
    L: any;
  }
}

const Mapping: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filters = [
    { id: "bakery", name: "Bakery", icon: "🥖" },
    { id: "bookstore", name: "Book Store", icon: "📚" },
    { id: "cafe", name: "Cafe", icon: "☕" },
    { id: "clothing", name: "Clothing", icon: "👕" },
    { id: "grocery", name: "Grocery", icon: "🛒" },
    { id: "hairsalon", name: "Hair Salon", icon: "💈" },
    { id: "icecream", name: "Ice Cream Shop", icon: "🍦" },
    { id: "jewelry", name: "Jewelry Store", icon: "💍" },
    { id: "nailSalon", name: "Nail Salon", icon: "💅" },
    { id: "restaurant", name: "Restaurant", icon: "🍽️" },
  ];

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const businessesSnapshot = await getDocs(collection(db, "businesses"));
        const businessesData = businessesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Business[];
        setBusinesses(businessesData);
      } catch (error) {
        console.error("Error fetching businesses:", error);
      }
    };

    fetchBusinesses();
  }, []);

  useEffect(() => {
    const initializeMap = async () => {
      if (mapRef.current && !mapInstanceRef.current) {
        try {
          // Get user location
          let centerLocation = { lat: 43.4456, lng: -79.6876 }; // Default to Oakville
          try {
            const userLocation = await getUserLocation();
            if (userLocation) {
              centerLocation = userLocation;
            }
          } catch (error) {
            console.error("Error getting user location:", error);
          }

          // Load Leaflet CSS
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);

          // Load Leaflet JS
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = () => {
            const L = window.L;

            // Initialize map centered on location
            mapInstanceRef.current = L.map(mapRef.current, {
              zoomControl: false,
              attributionControl: false,
            }).setView([centerLocation.lat, centerLocation.lng], 13);

            // Add OpenStreetMap tiles
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "© OpenStreetMap contributors",
            }).addTo(mapInstanceRef.current);

            // Add markers for businesses with location data
            businesses.forEach((business) => {
              if (business.location) {
                const marker = L.circleMarker(
                  [business.location.lat, business.location.lng],
                  {
                    radius: 8,
                    fillColor: "#e11d48",
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8,
                  }
                ).addTo(mapInstanceRef.current);

                marker.bindPopup(`
                  <div class="p-2">
                    <h3 class="font-semibold text-gray-900">${
                      business.businessName
                    }</h3>
                    <p class="text-sm text-gray-600">${business.description}</p>
                    <p class="text-xs text-gray-500 mt-1">${
                      business.location.address || ""
                    }</p>
                    <div class="flex flex-wrap gap-1 mt-2">
                      ${
                        business.tags
                          ?.slice(0, 3)
                          .map(
                            (tag) =>
                              `<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">${tag}</span>`
                          )
                          .join("") || ""
                      }
                    </div>
                  </div>
                `);
              }
            });
          };
          document.head.appendChild(script);
        } catch (error) {
          console.error("Error initializing map:", error);
        }
      }
    };

    if (businesses.length > 0) {
      initializeMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [businesses]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const goToMyLocation = async () => {
    try {
      const location = await getUserLocation();
      if (location && mapInstanceRef.current) {
        mapInstanceRef.current.setView([location.lat, location.lng], 15);
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Local Map</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={goToMyLocation}
              className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
            >
              <Navigation size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={`px-3 py-2 rounded-full border flex items-center space-x-2 text-sm transition-colors ${
                selectedFilters.includes(filter.id)
                  ? "bg-rose-500 text-white border-rose-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[calc(100vh-200px)]">
        <div ref={mapRef} className="w-full h-full" />

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg overflow-hidden z-[1000]">
          <button
            onClick={handleZoomIn}
            className="block w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors border-b"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={handleZoomOut}
            className="block w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Minus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Mapping;
