import React, { useState, useRef, useEffect } from "react";
import { Heart, X, MapPin, Clock, Phone, Globe } from "lucide-react";
import { db, auth } from "../firebase"; // adjust path if needed
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDocs,
  collection,
} from "firebase/firestore";

const Scroll = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedBusinesses, setLikedBusinesses] = useState<unknown[]>([]);
  const [rejectedBusinesses, setRejectedBusinesses] = useState<unknown[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allBusinesses, setAllBusinesses] = useState<unknown[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    const fetchBusinesses = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const fetched = snapshot.docs.map((doc) => doc.data());
      setAllBusinesses(fetched);
    };

    fetchBusinesses();
  }, []);

  const currentBusiness = allBusinesses[currentIndex] as any;

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

  const updateLikedBusiness = async (business: any) => {
    const user = auth.currentUser;
    if (!user) return;

    const uid = user.uid;
    const customerRef = doc(db, "customers", uid);
    const productName = business.productName;
    const businessName = business.businessName;
    const businessTags = business.tags || [];

    const docSnap = await getDoc(customerRef);

    if (!docSnap.exists()) {
      await setDoc(customerRef, {
        likedProducts: [productName],
        likedBusinesses: [businessName],
        likedTags: businessTags,
        createdAt: new Date(),
      });
    } else {
      await updateDoc(customerRef, {
        likedProducts: arrayUnion(productName),
        likedBusinesses: arrayUnion(businessName),
        likedTags: arrayUnion(...businessTags),
      });
    }

<<<<<<< HEAD
  const currentBusiness = allBusinesses[currentIndex];
  
const handleSwipe = (direction) => {
=======
    console.log(
      `✅ Updated liked data for ${uid}:`,
      productName,
      businessName,
      businessTags
    );
  };

  const handleSwipe = (direction: string) => {
>>>>>>> 97c61029a10bbad078ce37cbf1faa301247a2b60
    if (isAnimating) return;

    setIsAnimating(true);
    setSwipeDirection(direction);

    setTimeout(() => {
      if (direction === "like") {
        setLikedBusinesses((prev) => [...prev, currentBusiness]);
        updateLikedBusiness(currentBusiness);
      } else {
        setRejectedBusinesses((prev) => [...prev, currentBusiness]);
      }

      setCurrentIndex((prev) => (prev + 1) % allBusinesses.length);
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 300);
  };

<<<<<<< HEAD
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

const handleTouchEnd = () => {
  if (!touchStart || !touchEnd) return;
  
  const distance = touchStart - touchEnd;
  const isLeftSwipe = distance > 50;
  const isRightSwipe = distance < -50;
  
  if (isLeftSwipe) {
    handleSwipe('dislike');     // Left swipe = like
  } else if (isRightSwipe) {
    handleSwipe('like');  // Right swipe = dislike
  }
  
  setTouchStart(0);
  setTouchEnd(0);
};
=======
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > 50;
    const isDownSwipe = distance < -50;

    if (isUpSwipe) {
      handleSwipe("like");
    } else if (isDownSwipe) {
      handleSwipe("dislike");
    }

    setTouchStart(0);
    setTouchEnd(0);
  };
>>>>>>> 97c61029a10bbad078ce37cbf1faa301247a2b60

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
      {/* Main Swipe Area */}
      <div className="relative h-[calc(100vh-80px)] overflow-hidden">
        {/* Instructions */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-sm text-stone-600 text-center">
            ← Swipe left to dislike • Swipe right to like →
          </p>
        </div>

        {/* Business Card */}
        <div
          ref={containerRef}
          className={`absolute inset-4 transition-all duration-300 ${
<<<<<<< HEAD
            swipeDirection === 'like' ? 'transform translate-x-full opacity-0' :
            swipeDirection === 'dislike' ? 'transform -translate-x-full opacity-0' : ''
=======
            swipeDirection === "like"
              ? "transform -translate-y-full opacity-0"
              : swipeDirection === "dislike"
              ? "transform translate-y-full opacity-0"
              : ""
>>>>>>> 97c61029a10bbad078ce37cbf1faa301247a2b60
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
    >
          <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Business Image */}
            <div className="relative h-1/2 overflow-hidden">
              <img
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
                  {currentBusiness?.distance && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {currentBusiness.distance}
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
<<<<<<< HEAD
                index === currentIndex ? 'bg-yellow-500' : 
                index < currentIndex ? 'bg-green-500' : 'bg-stone-300'
=======
                index === currentIndex
                  ? "bg-rose-500"
                  : index < currentIndex
                  ? "bg-green-500"
                  : "bg-stone-300"
>>>>>>> 97c61029a10bbad078ce37cbf1faa301247a2b60
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
