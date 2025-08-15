import { useState, useEffect } from "react";
import { Star, TrendingUp, Sparkles } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { getDistanceString, getUserLocation } from "../utils/locationService";
import LocationPermission from "../components/LocationPermission";
import { PLACEHOLDER_IMAGES } from "../utils/placeholders";

// Distance display component
const DistanceDisplay: React.FC<{
  location: { lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
}> = ({ location, userLocation }) => {
  const [distance, setDistance] = useState<string>("...");

  useEffect(() => {
    const calculateDistance = async () => {
      try {
        if (userLocation) {
          const distanceString = await getDistanceString(
            location,
            userLocation
          );
          setDistance(distanceString);
        } else {
          setDistance("Location needed");
        }
      } catch (error) {
        setDistance("N/A");
      }
    };

    calculateDistance();
  }, [location, userLocation]);

  return <span>{distance}</span>;
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
  const [featuredBusiness, setFeaturedBusiness] = useState<Business | null>(
    null
  );
  const [suggestions, setSuggestions] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [personalizedRecommendations, setPersonalizedRecommendations] =
    useState<Business[]>([]);

  // Get user location on component mount
  useEffect(() => {
    const requestLocation = async () => {
      try {
        const location = await getUserLocation();
        setUserLocation(location);
        setLocationPermission("granted");
      } catch (error) {
        console.error("Error getting user location:", error);
        setLocationPermission("prompt");
      }
    };

    requestLocation();
  }, []);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const user = auth.currentUser;
      if (!user) return;

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
        // Fetch user preferences first
        const preferences = await fetchUserPreferences();

        // Fetch businesses from database
        const businessesSnapshot = await getDocs(collection(db, "businesses"));
        const allBusinesses = businessesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Business[];

        // If user has preferences, create personalized recommendations
        if (preferences && preferences.preferences?.tags?.length > 0) {
          const userTags = preferences.preferences.tags;

          // Score businesses based on tag matches
          const scoredBusinesses = allBusinesses.map((business) => {
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

          // Sort by match score and take top recommendations
          const topRecommendations = scoredBusinesses
            .filter((business) => business.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 6);

          setPersonalizedRecommendations(topRecommendations);

          // Set featured business from personalized recommendations
          if (topRecommendations.length > 0) {
            setFeaturedBusiness({
              ...topRecommendations[0],
              isSponsored: true,
            });
          }

          // Set trending business from personalized recommendations
          if (topRecommendations.length > 1) {
            // Could set additional featured content here if needed
          }
        } else {
          // Fallback to regular recommendations if no preferences
          if (allBusinesses.length > 0) {
            setFeaturedBusiness({
              ...allBusinesses[0],
              isSponsored: true,
            });
          }

          if (allBusinesses.length > 1) {
            // Could set additional featured content here if needed
          }
        }

        // Set general suggestions
        const suggestionData = allBusinesses.map((business) => ({
          ...business,
          category: business.category || "General",
          isLiked:
            preferences?.likedBusinesses?.includes(business.businessName) ||
            false,
        }));

        setSuggestions(suggestionData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

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
      <img
        src={
          business.productImage || business.image || PLACEHOLDER_IMAGES.business
        }
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

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-700">
              {business.rating || "N/A"}
            </span>
          </div>
          <span className="text-sm text-gray-500">·</span>
          <span className="text-sm text-gray-500">
            {business.reviews || 0} reviews
          </span>
          <span className="text-sm text-gray-500">·</span>
          <span className="text-sm text-gray-500">
            {business.location ? (
              <DistanceDisplay
                location={business.location}
                userLocation={userLocation}
              />
            ) : (
              "N/A"
            )}
          </span>
        </div>

        <p className="text-gray-600 text-sm">{business.description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
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
        src={business.productImage || PLACEHOLDER_IMAGES.business}
        alt={business.businessName}
        className="w-full h-48 object-cover rounded-t-lg"
      />
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">
          {business.businessName}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span>{business.rating || "N/A"}</span>
          </div>
          <span>·</span>
          <span>{business.reviews || 0} reviews</span>
          <span>·</span>
          <span>
            {business.location ? (
              <DistanceDisplay
                location={business.location}
                userLocation={userLocation}
              />
            ) : (
              "N/A"
            )}
          </span>
        </div>
      </div>
    </div>
  );

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
                  {business.matchingTags &&
                    business.matchingTags.length > 0 && (
                      <div className="absolute bottom-2 right-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded mb-2">
                        {business.matchingTags.length} match
                        {business.matchingTags.length > 1 ? "es" : ""}
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

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Featured Business
          </h2>
          {featuredBusiness && (
            <BusinessCard business={featuredBusiness} layout="horizontal" />
          )}
        </section>

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
