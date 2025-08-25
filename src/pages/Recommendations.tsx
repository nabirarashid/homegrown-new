import { useState, useEffect } from "react";
import { TrendingUp, Sparkles, MapPin } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { getDistanceString, getUserLocation } from "../utils/locationService";
import LocationPermission from "../components/LocationPermission";
import { PLACEHOLDER_IMAGES } from "../utils/placeholders";
import { geocodeAddress } from "../utils/geocodeAddress";

// Enhanced Distance display component with loading states
const DistanceDisplay: React.FC<{
  location: { lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
}> = ({ location, userLocation }) => {
  const [distance, setDistance] = useState<string>("...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateDistance = async () => {
      setLoading(true);
      try {
        if (userLocation && location) {
          const distanceString = await getDistanceString(location, userLocation);
          setDistance(distanceString);
        } else {
          setDistance("Location needed");
        }
      } catch (error) {
        console.error("Distance calculation error:", error);
        setDistance("N/A");
      } finally {
        setLoading(false);
      }
    };

    calculateDistance();
  }, [location, userLocation]);

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <MapPin className="w-3 h-3 animate-pulse" />
        <span className="animate-pulse">...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <MapPin className="w-3 h-3" />
      <span>{distance}</span>
    </div>
  );
};

interface Business {
  id: string;
  businessName: string;
  description: string;
  category: string;
  tags: string[];
  image?: string;
  productImage?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  website?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  isSponsored?: boolean;
  isLiked?: boolean;
  matchScore?: number;
  matchingTags?: string[];
  geocodingStatus?: 'pending' | 'success' | 'failed' | 'cached';
}

interface UserPreferences {
  likedTags: string[];
  likedBusinesses: string[];
  preferences: {
    tags: string[];
  };
}

const Recommendations = () => {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  // Removed featuredBusiness state
  const [suggestions, setSuggestions] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<Business[]>([]);

  // Get user location on component mount
  useEffect(() => {
    const requestLocation = async () => {
      try {
        const location = await getUserLocation();
        setUserLocation(location);
        setLocationPermission("granted");
      } catch (error) {
        console.error("Error getting user location:", error);
        setLocationPermission("denied");
      }
    };

    requestLocation();
  }, []);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const user = auth.currentUser;
      if (!user) return null;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserPreferences;
          setUserPreferences(data);
          return data;
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
      return null;
    };

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        
        // Fetch user preferences first
        const preferences = await fetchUserPreferences();

        // Fetch businesses from database
        const businessesSnapshot = await getDocs(collection(db, "businesses"));
        let allBusinesses = businessesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          geocodingStatus: 'pending' as const
        })) as Business[];

        console.log(`📍 Starting geocoding for ${allBusinesses.length} businesses...`);
        setGeocodingProgress({ current: 0, total: allBusinesses.length });

        // Enhanced geocoding with progress tracking and error handling
        const geocodedBusinesses = await Promise.allSettled(
          allBusinesses.map(async (business, index) => {
            try {
              // Update progress
              setGeocodingProgress(prev => ({ ...prev, current: index + 1 }));

              if (business.address && (!business.location || !business.location.lat || !business.location.lng)) {
                console.log(`📍 Geocoding ${business.businessName}: ${business.address}`);
                
                const geo = await geocodeAddress(business.address);
                if (geo) {
                  return {
                    ...business,
                    location: { ...geo, address: business.address },
                    geocodingStatus: 'success' as const
                  };
                } else {
                  console.warn(`❌ Failed to geocode ${business.businessName}: ${business.address}`);
                  return {
                    ...business,
                    geocodingStatus: 'failed' as const
                  };
                }
              } else if (business.location?.lat && business.location?.lng) {
                return {
                  ...business,
                  geocodingStatus: 'cached' as const
                };
              }
              
              return business;
            } catch (error) {
              console.error(`❌ Geocoding error for ${business.businessName}:`, error);
              return {
                ...business,
                geocodingStatus: 'failed' as const
              };
            }
          })
        );

        // Process results and separate successful vs failed geocoding
        const processedBusinesses = geocodedBusinesses.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.error(`❌ Promise rejected for business ${index}:`, result.reason);
            return allBusinesses[index]; // Return original business data
          }
        });

        const successfulGeocode = processedBusinesses.filter(b => b.geocodingStatus === 'success').length;
        const cachedGeocode = processedBusinesses.filter(b => b.geocodingStatus === 'cached').length;
        const failedGeocode = processedBusinesses.filter(b => b.geocodingStatus === 'failed').length;
        
        console.log(`📊 Geocoding complete: ${successfulGeocode} new, ${cachedGeocode} cached, ${failedGeocode} failed`);

        // If user has preferences, create personalized recommendations
        if (preferences && preferences.preferences?.tags?.length > 0) {
          const userTags = preferences.preferences.tags;
          const scoredBusinesses = processedBusinesses.map((business) => {
            const businessTags = business.tags || [];
            const matchingTags = businessTags.filter((tag) =>
              userTags.includes(tag)
            );
            const score = matchingTags.length;
            return {
              ...business,
              matchScore: score,
              matchingTags,
            };
          });
          
          const topRecommendations = scoredBusinesses
            .filter((business) => business.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 6);
          
          setPersonalizedRecommendations(topRecommendations);
          console.log(`✨ Generated ${topRecommendations.length} personalized recommendations`);
        }

        // Set up regular suggestions
        const suggestionData = processedBusinesses.map((business) => ({
          ...business,
          category: business.category || "General",
          isLiked: preferences?.likedBusinesses?.includes(business.businessName) || false,
        }));

        setSuggestions(suggestionData);
        
  // Removed featured business selection logic

      } catch (error) {
        console.error("❌ Error fetching recommendations:", error);
      } finally {
        setLoading(false);
        setGeocodingProgress({ current: 0, total: 0 });
      }
    };

    fetchRecommendations();
  }, []);

  const BusinessCard = ({
    business,
    layout = "horizontal",
  }: {
    business: Business;
    layout?: string;
  }) => (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer relative ${
        layout === "horizontal" ? "flex flex-col md:flex-row" : "flex flex-col"
      }`}
      onClick={() => {
        if (business.website) {
          window.open(business.website, "_blank");
        }
      }}
    >
      {business.website && (
        <div className="absolute top-2 right-2 bg-rose-600 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
          Visit
        </div>
      )}
      
  {/* Geocoding status indicator removed */}

      <img
        src={business.productImage || business.image || PLACEHOLDER_IMAGES.business}
        alt={business.businessName}
        className={`object-cover ${
          layout === "horizontal"
            ? "w-full md:w-1/2 h-48 md:h-auto"
            : "w-full h-48"
        } rounded-t-lg ${
          layout === "horizontal" ? "md:rounded-l-lg md:rounded-tr-none" : ""
        }`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = PLACEHOLDER_IMAGES.business;
        }}
      />

      <div className={`p-6 ${layout === "horizontal" ? "flex-1" : ""}`}>
        {business.isSponsored && (
          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded mb-2">
            Sponsored
          </span>
        )}

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {business.businessName}
        </h3>

        <div className="flex items-center gap-2 mb-3 flex-wrap text-sm">
          {business.location ? (
            <DistanceDisplay
              location={business.location}
              userLocation={userLocation}
            />
          ) : (
            <span className="text-gray-500">Location N/A</span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-3">{business.description}</p>

        {business.address && (
          <p className="text-gray-500 text-xs mb-3">{business.address}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {business.tags?.slice(0, 3).map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const SmallBusinessCard = ({ business }: { business: Business }) => (
    <div
      className="flex-shrink-0 w-60 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer relative"
      onClick={() => {
        if (business.website) {
          window.open(business.website, "_blank");
        }
      }}
    >
      {business.website && (
        <div className="absolute top-2 right-2 bg-rose-600 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
          Visit
        </div>
      )}
      <img
        src={business.productImage || business.image || PLACEHOLDER_IMAGES.business}
        alt={business.businessName}
        className="w-full h-48 object-cover rounded-t-lg"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = PLACEHOLDER_IMAGES.business;
        }}
      />
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">
          {business.businessName}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          {business.location ? (
            <DistanceDisplay
              location={business.location}
              userLocation={userLocation}
            />
          ) : (
            <span>Location N/A</span>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-stone-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-stone-600 mb-2">Loading recommendations...</p>
          {geocodingProgress.total > 0 && (
            <div className="max-w-xs mx-auto">
              <div className="bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                Processing locations: {geocodingProgress.current} / {geocodingProgress.total}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-stone-50 to-rose-100 font-sans">
      <main className="max-w-6xl mx-auto py-6 px-4">
        {/* Location Permission Banner */}
        {locationPermission === "prompt" && (
          <LocationPermission
            onLocationGranted={(location) => {
              setUserLocation(location);
              setLocationPermission("granted");
            }}
            onLocationDenied={() => {
              setLocationPermission("denied");
            }}
          />
        )}

        {/* Personalized Recommendations Section */}
        {personalizedRecommendations.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-rose-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Personalized for You
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Based on your preferences from businesses you've liked
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalizedRecommendations.slice(0, 4).map((business) => (
                <div key={business.id} className="relative">
                  <BusinessCard business={business} layout="vertical" />
                  {business.matchingTags && business.matchingTags.length > 0 && (
                    <div className="absolute bottom-4 right-4 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                      {business.matchingTags.length} match{business.matchingTags.length > 1 ? "es" : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* User Preference Tags */}
        {userPreferences && userPreferences.preferences?.tags?.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Your Preferences
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {userPreferences.preferences.tags
                .slice(0, 8)
                .map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          </section>
        )}

  {/* Featured Business Section removed */}

        {/* All Suggestions Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            You might also like
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
      {suggestions.map((business) => (
        <SmallBusinessCard key={business.id} business={business} />
      ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Recommendations;