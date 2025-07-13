import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Navigation, ChevronDown, Gift } from 'lucide-react';

const Mapping = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const filters = [
    { id: 'open', label: 'Open Now' },
    { id: 'sustainable', label: 'Sustainable' },
    { id: 'local', label: 'Local Favourites' },
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'shops', label: 'Shops' },
    { id: 'cafes', label: 'Cafes' }
  ];

  const mockBusinesses = [
    { id: 1, name: 'Green Leaf Cafe', lat: 43.6532, lng: -79.3832, type: 'cafe', sustainable: true },
    { id: 2, name: 'Local Artisan Shop', lat: 43.6500, lng: -79.3800, type: 'shop', local: true },
    { id: 3, name: 'Fresh Market', lat: 43.6580, lng: -79.3900, type: 'restaurant', open: true },
    { id: 4, name: 'Eco Store', lat: 43.6450, lng: -79.3750, type: 'shop', sustainable: true },
    { id: 5, name: 'Corner Bistro', lat: 43.6520, lng: -79.3780, type: 'restaurant', local: true }
  ];

  useEffect(() => {
    // Import Leaflet dynamically to avoid SSR issues
    const initializeMap = async () => {
      if (mapRef.current && !mapInstanceRef.current) {
        try {
          // Load Leaflet CSS
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);

          // Load Leaflet JS
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => {
            const L = window.L;
            
            // Initialize map centered on Toronto
            mapInstanceRef.current = L.map(mapRef.current, {
              zoomControl: false,
              attributionControl: false
            }).setView([43.6532, -79.3832], 13);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstanceRef.current);

            // Add custom markers
            mockBusinesses.forEach(business => {
              const marker = L.circleMarker([business.lat, business.lng], {
                radius: 8,
                fillColor: '#e11d48',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
              }).addTo(mapInstanceRef.current);

              marker.bindPopup(`
                <div class="p-2">
                  <h3 class="font-semibold text-gray-900">${business.name}</h3>
                  <p class="text-sm text-gray-600 capitalize">${business.type}</p>
                </div>
              `);
            });
          };
          document.head.appendChild(script);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

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

  const handleLocationClick = () => {
    if (mapInstanceRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstanceRef.current.setView([latitude, longitude], 15);
        },
        () => {
          alert('Unable to get your location');
        }
      );
    }
  };

  const toggleFilter = (filterId) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <div className="min-h-screen bg-rose-50 font-sans">
      <main className="max-w-6xl mx-auto py-8">
        {/* Map Container */}
        <div className="relative bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-8 mx-4">
          {/* Search Bar Overlay */}
          <div className="absolute top-6 left-6 right-6 z-20">
            <div className="flex items-center bg-white rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center justify-center pl-4 text-gray-600">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search for businesses or locations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-20 right-6 z-20 flex flex-col gap-2">
            <div className="flex flex-col">
              <button
                onClick={handleZoomIn}
                className="w-10 h-10 bg-white rounded-t-lg shadow-md border border-gray-100 flex items-center justify-center hover:shadow-lg transition-shadow"
              >
                <Plus size={20} className="text-gray-900" />
              </button>
              <button
                onClick={handleZoomOut}
                className="w-10 h-10 bg-white rounded-b-lg shadow-md border border-gray-100 flex items-center justify-center hover:shadow-lg transition-shadow"
              >
                <Minus size={20} className="text-gray-900" />
              </button>
            </div>
            <button
              onClick={handleLocationClick}
              className="w-10 h-10 bg-white rounded-lg shadow-md border border-gray-100 flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <Navigation size={20} className="text-gray-900" />
            </button>
          </div>

          {/* Map */}
          <div
            ref={mapRef}
            className="w-full h-96 bg-gray-100 z-0"
          />
        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap gap-3 mb-8 px-4">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedFilters.includes(filter.id)
                  ? 'bg-rose-600 text-white shadow-md hover:bg-rose-700'
                  : 'bg-white text-gray-900 hover:shadow-md border border-gray-100'
              }`}
            >
              {filter.label}
              <ChevronDown size={16} className={selectedFilters.includes(filter.id) ? 'text-white' : 'text-gray-900'} />
            </button>
          ))}
        </div>

        {/* Business Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 px-4">
          {mockBusinesses.map(business => (
            <div key={business.id} className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{business.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{business.type}</p>
                  </div>
                  <div className="flex gap-1">
                    {business.sustainable && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Eco</span>
                    )}
                    {business.local && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Local</span>
                    )}
                    {business.open && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">Open</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {'★'.repeat(4)}{'☆'.repeat(1)}
                    <span className="text-sm text-gray-600 ml-1">4.0</span>
                  </div>
                  <button className="text-rose-600 text-sm font-medium hover:underline">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8">
          <button className="w-14 h-14 bg-rose-600 rounded-full shadow-lg flex items-center justify-center hover:bg-rose-700 transition-colors">
            <Gift size={24} className="text-white" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Mapping;