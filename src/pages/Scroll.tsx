import React, { useState, useRef, useEffect, useCallback } from "react";
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
      } catch {
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
  productPrice?: number | string;
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

// Helper function to validate URLs
const isValidUrl = (string: string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Enhanced BusinessImage component with better error handling and caching
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
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 2;

    // Reset states when src changes
    useEffect(() => {
      setIsLoaded(false);
      setError(false);
      setRetryCount(0);
    }, [src]);

    const handleError = useCallback(() => {
      console.log(`Image failed to load: ${src}, retry count: ${retryCount}`);
      
      if (src !== PLACEHOLDER_IMAGES.noImage && retryCount < maxRetries) {
        // Add a small delay before retry to handle temporary network issues
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          setError(false);
          setIsLoaded(false);
        }, 1000 * (retryCount + 1)); // Exponential backoff
      } else {
        setError(true);
      }
    }, [src, retryCount, maxRetries]);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      setError(false);
    }, []);

    // Create a unique key to force re-render on retry
    //const imageKey = `${src}-${retryCount}`;

    const finalImgSrc = error ? PLACEHOLDER_IMAGES.noImage : src;

    return (
      <div className={`relative ${className}`}>
        {!isLoaded && !error && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {error && retryCount >= maxRetries && (
          <div className="absolute inset-0 bg-gray-200 flex flex-col items-center justify-center">
            <div className="text-gray-500 text-sm mb-2">Image unavailable</div>
            <button 
              onClick={() => {
                setRetryCount(0);
                setError(false);
                setIsLoaded(false);
              }}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
            >
              Retry
            </button>
          </div>
        )}
        
        <img
        src={finalImgSrc}
        alt={alt}
        className={`${className} transition-opacity duration-500`}
        style={{ opacity: isLoaded ? 1 : 0 }}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        //crossOrigin="anonymous"
        //referrerPolicy="no-referrer-when-downgrade"
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Enhanced image preloading with better cache management
  useEffect(() => {
    const preloadImages = () => {
      // Preload next 3 images instead of just 1
      const imagesToPreload = 3;
      const preloadPromises: Promise<void>[] = [];
      
      for (let i = 1; i <= imagesToPreload; i++) {
        const nextIndex = (currentIndex + i) % allBusinesses.length;
        const nextBusiness = allBusinesses[nextIndex];
        
        if (nextBusiness?.productImage && 
            nextBusiness.productImage !== PLACEHOLDER_IMAGES.noImage &&
            isValidUrl(nextBusiness.productImage)) {
          const preloadPromise = new Promise<void>((resolve, reject) => {
            const img = new Image();
            
            // Add timeout to prevent hanging
            const timeoutId = setTimeout(() => {
              console.warn(`Image preload timeout: ${nextBusiness.productImage}`);
              reject(new Error('Timeout'));
            }, 10000); // 10 second timeout
            
            img.onload = () => {
              clearTimeout(timeoutId);
              console.log(`✅ Preloaded image ${i}: ${nextBusiness.productImage}`);
              resolve();
            };
            
            img.onerror = (error) => {
              clearTimeout(timeoutId);
              console.warn(`❌ Failed to preload image ${i}: ${nextBusiness.productImage}`, error);
              reject(error);
            };
            
            // Add headers for better compatibility
            img.crossOrigin = "anonymous";
            img.referrerPolicy = "no-referrer-when-downgrade";
            img.src = nextBusiness.productImage || "";
          });
          
          preloadPromises.push(preloadPromise);
        }
      }
      
      // Log preloading results
      if (preloadPromises.length > 0) {
        Promise.allSettled(preloadPromises).then(results => {
          const successful = results.filter(result => result.status === 'fulfilled').length;
          const failed = results.length - successful;
          console.log(`Preloaded ${successful}/${results.length} images (${failed} failed)`);
        });
      }
    };
    
    // Only preload if we have businesses loaded
    if (allBusinesses.length > 0) {
      preloadImages();
    }
  }, [currentIndex, allBusinesses]);

  // Debug logging for current business
  useEffect(() => {
    // Only log if currentBusiness is defined
    if (allBusinesses.length > 0 && currentIndex >= 0 && currentIndex < allBusinesses.length) {
      const currentBusiness = allBusinesses[currentIndex];
      if (currentBusiness) {
        console.log(`Current business ${currentIndex}:`, {
          id: currentBusiness.id,
          productName: currentBusiness.productName,
          hasImage: !!currentBusiness.productImage,
          imageUrl: currentBusiness.productImage,
          imageUrlValid: currentBusiness.productImage ? isValidUrl(currentBusiness.productImage) : false
        });
      }
    }
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

  // Enhanced business fetching with image validation
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        let fetched: Array<Record<string, unknown>> = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // For each product, fetch its business info and merge, ensuring all required fields exist
        const mergedBusinesses: Business[] = await Promise.all(
          fetched.map(async (product) => {
            let businessInfo: Partial<Business> = {};
            if (typeof product.businessId === "string") {
              try {
                const businessDoc = await getDoc(doc(db, "businesses", product.businessId));
                if (businessDoc.exists()) {
                  businessInfo = businessDoc.data();
                }
              } catch {
                // ignore
              }
            }
            // Defensive helpers
            const safeString = (val: unknown, fallback = "") => typeof val === "string" ? val : fallback;
            const safeArray = (val: unknown, fallback: string[] = []) => Array.isArray(val) ? (val as string[]) : fallback;
            const safeLocation = (loc: unknown) => {
              if (
                loc && typeof loc === "object" &&
                "lat" in loc && typeof (loc as { lat: unknown }).lat === "number" &&
                "lng" in loc && typeof (loc as { lng: unknown }).lng === "number"
              ) {
                return {
                  lat: (loc as { lat: number }).lat,
                  lng: (loc as { lng: number }).lng,
                  address: safeString((loc as { address?: string }).address)
                };
              }
              return undefined;
            };
            const merged: Business = {
              id: safeString(product.id, ""),
              productName: safeString(product.productName, safeString(businessInfo.productName, "Unnamed Product")),
              businessName: safeString(product.businessName, safeString(businessInfo.businessName, "Unknown Business")),
              productImage: safeString(product.productImage, safeString(businessInfo.productImage)),
              description: safeString(product.description, safeString(businessInfo.description)),
              category: safeString(product.category, safeString(businessInfo.category)),
              productPrice:
                typeof product.productPrice === "number"
                  ? product.productPrice
                  : typeof product.productPrice === "string" && product.productPrice.trim() !== ""
                    ? (() => {
                        const cleaned = product.productPrice.replace(/[$,]/g, "");
                        return !isNaN(parseFloat(cleaned))
                          ? parseFloat(cleaned)
                          : product.productPrice;
                      })()
                    : typeof businessInfo.productPrice === "number"
                      ? businessInfo.productPrice
                      : typeof businessInfo.productPrice === "string" && businessInfo.productPrice.trim() !== ""
                        ? (() => {
                            const cleaned = businessInfo.productPrice.replace(/[$,]/g, "");
                            return !isNaN(parseFloat(cleaned))
                              ? parseFloat(cleaned)
                              : businessInfo.productPrice;
                          })()
                        : undefined,
              tags: safeArray(product.tags, safeArray(businessInfo.tags)),
              location: safeLocation(product.location) || safeLocation(businessInfo.location),
              hours: safeString(product.hours, safeString(businessInfo.hours)),
              phone: safeString(product.phone, safeString(businessInfo.phone)),
              website: safeString(product.website, safeString(businessInfo.website)),
            };
            return merged;
          })
        );

        // Validate and clean image URLs
        const validatedBusinesses = mergedBusinesses.map(business => {
          if (business.productImage && business.productImage !== PLACEHOLDER_IMAGES.noImage) {
            try {
              new URL(business.productImage);
              return business;
            } catch {
              console.warn(`Invalid image URL for ${business.productName}: ${business.productImage}`);
              return {
                ...business,
                productImage: PLACEHOLDER_IMAGES.noImage
              };
            }
          }
          return business;
        });

        // Shuffle array
        for (let i = validatedBusinesses.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [validatedBusinesses[i], validatedBusinesses[j]] = [validatedBusinesses[j], validatedBusinesses[i]];
        }

        console.log(`Loaded ${validatedBusinesses.length} businesses`);
        setAllBusinesses(validatedBusinesses);
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
    const productName = business.productName || "Unnamed Product";
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

      setTimeout(() => {
        if (direction === "like") {
          setLikedBusinesses((prev) => [...prev, currentBusiness]);
          updateLikedBusiness(currentBusiness);
        }
        setCurrentIndex((prev) => (prev + 1) % allBusinesses.length);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 300);
    },
    [isAnimating, currentBusiness, allBusinesses.length, updateLikedBusiness]
  );

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
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
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

  // Debug function to test all image URLs (remove in production)
  const testAllImageUrls = async () => {
    console.log('Testing all image URLs...');
    const results = await Promise.allSettled(
      allBusinesses.map(async (business, index) => {
        if (!business.productImage || business.productImage === PLACEHOLDER_IMAGES.noImage) {
          return { index, status: 'no-image', url: business.productImage };
        }
        
        return new Promise((resolve, reject) => {
          const img = new Image();
          const timeoutId = setTimeout(() => reject(new Error('timeout')), 5000);
          
          img.onload = () => {
            clearTimeout(timeoutId);
            resolve({ index, status: 'success', url: business.productImage });
          };
          
          img.onerror = () => {
            clearTimeout(timeoutId);
            reject({ index, status: 'error', url: business.productImage });
          };
          
          img.crossOrigin = "anonymous";
          img.src = business.productImage || "";
        });
      })
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Image URL Test Results: ${successful} successful, ${failed} failed`);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ Business ${index} image failed:`, allBusinesses[index].productName, result.reason);
      }
    });
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

      {/* Debug button - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <button 
            onClick={testAllImageUrls}
            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            Test Images
          </button>
        </div>
      )}

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
                  currentBusiness?.productImage || PLACEHOLDER_IMAGES.noImage
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
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                <span className="text-white text-xs font-semibold">
                  {typeof currentBusiness?.productPrice === "number"
                    ? `$${currentBusiness.productPrice.toFixed(2)}`
                    : typeof currentBusiness?.productPrice === "string" && currentBusiness.productPrice.trim() !== ""
                      ? currentBusiness.productPrice
                      : "Check Store"}
                </span>
              </div>
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

                {currentBusiness?.tags && Array.isArray(currentBusiness.tags) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentBusiness.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-medium border border-rose-200 shadow-sm"
                        style={{ letterSpacing: "0.02em", minWidth: "2.5rem", textAlign: "center" }}
                      >
                        {tag}
                      </span>
                    ))}
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