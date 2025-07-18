import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Heart, X, MapPin, Clock, Phone, Globe } from "lucide-react";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDocs,
  collection,
} from "firebase/firestore";
import { getUserLocation, getDistanceString } from "../utils/locationService";
import LocationPermission from "../components/LocationPermission";

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
        setDistance("Distance N/A");
      }
    };

    calculateDistance();
  }, [location, userLocation]);

  return <span>{distance}</span>;
};

// Business interface for better type safety
interface Business {
  id: string;
  productName: string;
  businessName: string;
  productImage?: string;
  description?: string;
  category?: string;
  productPrice?: number;
  tags?: string[];
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  hours?: string;
  phone?: string;
  website?: string;
}

// Memoized image component for better performance
const BusinessImage = React.memo(
  ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className: string;
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
      <div className={`relative ${className}`}>
        {!isLoaded && !error && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img
          src={
            error ? "https://via.placeholder.com/400x300?text=No+Image" : src
          }
          alt={alt}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      </div>
    );
  }
);

const Scroll = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedBusinesses, setLikedBusinesses] = useState<Business[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [swipeHistory, setSwipeHistory] = useState<{
    liked: { business: Business; tags: string[]; timestamp: Date }[];
    rejected: { business: Business; tags: string[]; timestamp: Date }[];
  }>({
    liked: [],
    rejected: [],
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Preload next images for smoother experience
  useEffect(() => {
    const preloadImages = () => {
      const nextIndex = (currentIndex + 1) % allBusinesses.length;
      const nextBusiness = allBusinesses[nextIndex];
      if (nextBusiness?.productImage) {
        const img = new Image();
        img.src = nextBusiness.productImage;
      }
    };
    preloadImages();
  }, [currentIndex, allBusinesses]);

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
    const fetchBusinesses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Business[];
        setAllBusinesses(fetched);
      } catch (error) {
        console.error("Error fetching businesses:", error);
      }
    };

    fetchBusinesses();
  }, []);

  const currentBusiness = allBusinesses[currentIndex];

  const updateLikedBusiness = useCallback(async (business: Business) => {
    const user = auth.currentUser;
    if (!user) return;

    const uid = user.uid;
    const userRef = doc(db, "users", uid);
    const productName = business.productName;
    const businessName = business.businessName;
    const businessTags = business.tags || [];

    try {
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        // Create new user document
        await setDoc(userRef, {
          uid: uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          likedProducts: [productName],
          likedBusinesses: [businessName],
          likedTags: businessTags,
          preferences: {
            tags: businessTags,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Update existing user document
        const existingData = docSnap.data();
        const currentLikedTags = existingData.likedTags || [];
        const currentPreferenceTags = existingData.preferences?.tags || [];

        // Merge new tags with existing ones (avoiding duplicates)
        const updatedLikedTags = [
          ...new Set([...currentLikedTags, ...businessTags]),
        ];
        const updatedPreferenceTags = [
          ...new Set([...currentPreferenceTags, ...businessTags]),
        ];

        await updateDoc(userRef, {
          likedProducts: arrayUnion(productName),
          likedBusinesses: arrayUnion(businessName),
          likedTags: updatedLikedTags,
          preferences: {
            ...existingData.preferences,
            tags: updatedPreferenceTags,
          },
          updatedAt: new Date(),
        });
      }

      console.log(
        `✅ Updated user preferences for ${uid}:`,
        productName,
        businessName,
        businessTags
      );
    } catch (error) {
      console.error("❌ Error updating customer preferences:", error);
    }
  }, []);

  const handleSwipe = useCallback(
    (direction: string) => {
      if (isAnimating) return;

      setIsAnimating(true);
      setSwipeDirection(direction);

      const businessTags = currentBusiness?.tags || [];
      const timestamp = new Date();

      setTimeout(() => {
        if (direction === "like") {
          setLikedBusinesses((prev) => [...prev, currentBusiness]);
          setSwipeHistory((prev) => ({
            ...prev,
            liked: [
              ...prev.liked,
              { business: currentBusiness, tags: businessTags, timestamp },
            ],
          }));
          updateLikedBusiness(currentBusiness);
        } else {
          setRejectedBusinesses((prev) => [...prev, currentBusiness]);
          setSwipeHistory((prev) => ({
            ...prev,
            rejected: [
              ...prev.rejected,
              { business: currentBusiness, tags: businessTags, timestamp },
            ],
          }));
        }

        setCurrentIndex((prev) => (prev + 1) % allBusinesses.length);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 300);
    },
    [isAnimating, currentBusiness, allBusinesses.length, updateLikedBusiness]
  );

  // Get user's preference tags from swipe history
  const getUserPreferenceTags = useMemo(() => {
    const tagCounts: { [key: string]: number } = {};

    swipeHistory.liked.forEach(({ tags }) => {
      tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [swipeHistory.liked]);

  // Don't render anything if no businesses are loaded yet
  if (!allBusinesses.length || !currentBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading businesses...</p>
        </div>
      </div>
    );
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX); // Changed from clientY to clientX
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX); // Changed from clientY to clientX
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50; // Swipe left = dislike
    const isRightSwipe = distance < -50; // Swipe right = like

    if (isRightSwipe) {
      handleSwipe("like");
    } else if (isLeftSwipe) {
      handleSwipe("dislike");
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Green Certified":
        return "bg-green-100 text-green-800";
      case "Locally Sourced":
        return "bg-blue-100 text-blue-800";
      case "Zero-Waste":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-stone-100">
      {/* Location Permission Banner */}
      <div className="p-4">
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
      </div>

      {/* Main Swipe Area */}
      <div className="relative h-[calc(100vh-80px)] overflow-hidden">
        {/* Instructions */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-sm text-stone-600 text-center">
            ← Swipe left to pass • Swipe right to like →
          </p>
        </div>

        {/* Business Card */}
        <div
          ref={containerRef}
          className={`absolute inset-4 transition-all duration-300 ${
            swipeDirection === "like"
              ? "transform translate-x-full opacity-0"
              : swipeDirection === "dislike"
              ? "transform -translate-x-full opacity-0"
              : ""
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Business Image */}
            <div className="relative h-1/2 overflow-hidden">
              <BusinessImage
                src={
                  currentBusiness?.productImage ||
                  "https://via.placeholder.com/400x300?text=No+Image"
                }
                alt={currentBusiness?.productName || "Product"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

              {/* Category Badge */}
              {currentBusiness?.category && (
                <div
                  className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(
                    currentBusiness.category
                  )}`}
                >
                  {currentBusiness.category}
                </div>
              )}

              {/* Price */}
              {currentBusiness?.productPrice && (
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="text-white text-xs font-semibold">
                    ${currentBusiness.productPrice}
                  </span>
                </div>
              )}
            </div>

            {/* Business Info */}
            <div className="p-6 h-1/2 flex flex-col">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-stone-800 mb-2">
                  {currentBusiness?.productName || "Unnamed Product"}
                </h2>

                <h3 className="text-lg text-stone-600 mb-4">
                  from {currentBusiness?.businessName || "Unknown Business"}
                </h3>

                <div className="flex items-center gap-4 mb-4 text-sm text-stone-600">
                  {currentBusiness?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <DistanceDisplay
                        location={currentBusiness.location}
                        userLocation={userLocation}
                      />
                    </div>
                  )}
                  {currentBusiness?.hours && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {currentBusiness.hours}
                    </div>
                  )}
                </div>

                <p className="text-stone-700 mb-4 leading-relaxed">
                  {currentBusiness?.description || "No description available"}
                </p>

                {currentBusiness?.tags &&
                  Array.isArray(currentBusiness.tags) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentBusiness.tags.map(
                        (tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-stone-100 text-stone-700 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        )
                      )}
                    </div>
                  )}

                <div className="flex items-center gap-4 text-sm text-stone-600">
                  {currentBusiness?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {currentBusiness.phone}
                    </div>
                  )}
                  {currentBusiness?.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      {currentBusiness.website}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-6">
          <button
            onClick={() => handleSwipe("dislike")}
            className="w-16 h-16 bg-white shadow-xl rounded-full flex items-center justify-center hover:bg-red-50 transition-colors group"
            disabled={isAnimating}
          >
            <X className="w-8 h-8 text-red-500 group-hover:text-red-600" />
          </button>

          <button
            onClick={() => handleSwipe("like")}
            className="w-16 h-16 bg-white shadow-xl rounded-full flex items-center justify-center hover:bg-green-50 transition-colors group"
            disabled={isAnimating}
          >
            <Heart className="w-8 h-8 text-green-500 group-hover:text-green-600" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 flex gap-1">
          {allBusinesses.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-rose-500"
                  : index < currentIndex
                  ? "bg-green-500"
                  : "bg-stone-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Swipe Statistics */}
      <div className="fixed top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs">
        <div className="flex items-center gap-2 text-green-600 mb-1">
          <Heart className="w-3 h-3 fill-current" />
          <span>Liked: {swipeHistory.liked.length}</span>
        </div>
        <div className="flex items-center gap-2 text-red-600 mb-1">
          <X className="w-3 h-3" />
          <span>Passed: {swipeHistory.rejected.length}</span>
        </div>
        {getUserPreferenceTags.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-gray-600 mb-1">Top tags:</p>
            <div className="flex flex-wrap gap-1">
              {getUserPreferenceTags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-1 py-0.5 bg-rose-100 text-rose-700 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Liked Businesses Counter */}
      {likedBusinesses.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 fill-current" />
            <span className="font-semibold">{likedBusinesses.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scroll;
