import React, { useState, useEffect, useRef } from 'react';
import { Search, Menu, User, Heart, X, Star, MapPin, Clock, Phone, Globe } from 'lucide-react';

const SwipeableBusinessDiscovery = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedBusinesses, setLikedBusinesses] = useState([]);
  const [rejectedBusinesses, setRejectedBusinesses] = useState([]);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const allBusinesses = [
    {
      id: 1,
      name: "The Green Bean Cafe",
      category: "Green Certified",
      description: "Cozy cafe with organic coffee and vegan options. We source our beans directly from sustainable farms and use compostable packaging.",
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=800&fit=crop",
      rating: 4.8,
      distance: "0.3 miles",
      hours: "6am - 9pm",
      tags: ["Organic", "Vegan", "Fair Trade"],
      phone: "(555) 123-4567",
      website: "greenbeaneco.com"
    },
    {
      id: 2,
      name: "EcoClean Laundry",
      category: "Green Certified",
      description: "Eco-friendly laundry service using plant-based detergents. We use 90% less water than traditional methods.",
      image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&h=800&fit=crop",
      rating: 4.6,
      distance: "0.7 miles",
      hours: "7am - 8pm",
      tags: ["Plant-based", "Water-saving", "Eco-friendly"],
      phone: "(555) 234-5678",
      website: "ecoclean.com"
    },
    {
      id: 3,
      name: "Sustainable Style Boutique",
      category: "Green Certified",
      description: "Fashion boutique with sustainable and ethically sourced clothing. Every piece tells a story of conscious creation.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=800&fit=crop",
      rating: 4.9,
      distance: "1.2 miles",
      hours: "10am - 7pm",
      tags: ["Ethical", "Sustainable", "Handmade"],
      phone: "(555) 345-6789",
      website: "sustainablestyle.com"
    },
    {
      id: 4,
      name: "Farm Fresh Market",
      category: "Locally Sourced",
      description: "Market with produce from local farms within 50 miles. Supporting local agriculture and seasonal eating.",
      image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=800&fit=crop",
      rating: 4.7,
      distance: "0.5 miles",
      hours: "8am - 6pm",
      tags: ["Local", "Seasonal", "Organic"],
      phone: "(555) 456-7890",
      website: "farmfreshlocal.com"
    },
    {
      id: 5,
      name: "Artisan Bakery",
      category: "Locally Sourced",
      description: "Bakery using locally sourced ingredients and traditional methods. Fresh bread baked daily with love.",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=800&fit=crop",
      rating: 4.8,
      distance: "0.8 miles",
      hours: "5am - 3pm",
      tags: ["Artisan", "Local", "Fresh"],
      phone: "(555) 567-8901",
      website: "artisanbakery.com"
    },
    {
      id: 6,
      name: "Craft Brewery",
      category: "Locally Sourced",
      description: "Brewery with craft beers made from local hops and grains. Small batch brewing with big flavor.",
      image: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=600&h=800&fit=crop",
      rating: 4.5,
      distance: "1.5 miles",
      hours: "12pm - 11pm",
      tags: ["Craft", "Local", "Small-batch"],
      phone: "(555) 678-9012",
      website: "localcraftbrew.com"
    },
    {
      id: 7,
      name: "Refill Station",
      category: "Zero-Waste",
      description: "Store where you can refill household products to reduce waste. Bring your containers and save the planet.",
      image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=600&h=800&fit=crop",
      rating: 4.6,
      distance: "0.9 miles",
      hours: "9am - 7pm",
      tags: ["Zero-waste", "Refill", "Eco-friendly"],
      phone: "(555) 789-0123",
      website: "refillstation.com"
    },
    {
      id: 8,
      name: "Repair Shop",
      category: "Zero-Waste",
      description: "Shop specializing in repairing electronics and appliances. Extend the life of your favorite devices.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&h=800&fit=crop",
      rating: 4.7,
      distance: "1.1 miles",
      hours: "10am - 6pm",
      tags: ["Repair", "Electronics", "Sustainable"],
      phone: "(555) 890-1234",
      website: "repairshop.com"
    },
    {
      id: 9,
      name: "Secondhand Store",
      category: "Zero-Waste",
      description: "Store selling pre-owned clothing and goods. One person's treasure is another's sustainable choice.",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=800&fit=crop",
      rating: 4.4,
      distance: "0.6 miles",
      hours: "11am - 8pm",
      tags: ["Pre-owned", "Vintage", "Affordable"],
      phone: "(555) 901-2345",
      website: "secondhandstore.com"
    }
  ];

  const currentBusiness = allBusinesses[currentIndex];

  const handleSwipe = (direction) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSwipeDirection(direction);
    
    setTimeout(() => {
      if (direction === 'like') {
        setLikedBusinesses(prev => [...prev, currentBusiness]);
      } else {
        setRejectedBusinesses(prev => [...prev, currentBusiness]);
      }
      
      setCurrentIndex(prev => (prev + 1) % allBusinesses.length);
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 300);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > 50;
    const isDownSwipe = distance < -50;
    
    if (isUpSwipe) {
      handleSwipe('like');
    } else if (isDownSwipe) {
      handleSwipe('dislike');
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Green Certified': return 'bg-green-100 text-green-800';
      case 'Locally Sourced': return 'bg-blue-100 text-blue-800';
      case 'Zero-Waste': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">You've seen all businesses!</h2>
          <p className="text-stone-600 mb-4">Check back later for new discoveries</p>
          <button 
            onClick={() => setCurrentIndex(0)}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-semibold transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-stone-100">
      {/* Main Swipe Area */}
      <div className="relative h-[calc(100vh-80px)] overflow-hidden">
        {/* Instructions */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-sm text-stone-600 text-center">
            ↑ Swipe up to like • ↓ Swipe down to pass
          </p>
        </div>

        {/* Business Card */}
        <div 
          ref={containerRef}
          className={`absolute inset-4 transition-all duration-300 ${
            swipeDirection === 'like' ? 'transform -translate-y-full opacity-0' :
            swipeDirection === 'dislike' ? 'transform translate-y-full opacity-0' : ''
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Business Image */}
            <div className="relative h-1/2 overflow-hidden">
              <img 
                src={currentBusiness.image} 
                alt={currentBusiness.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              
              {/* Category Badge */}
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(currentBusiness.category)}`}>
                {currentBusiness.category}
              </div>
              
              {/* Rating */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-white text-xs font-semibold">{currentBusiness.rating}</span>
              </div>
            </div>

            {/* Business Info */}
            <div className="p-6 h-1/2 flex flex-col">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-stone-800 mb-2">{currentBusiness.name}</h2>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-stone-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {currentBusiness.distance}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentBusiness.hours}
                  </div>
                </div>
                
                <p className="text-stone-700 mb-4 leading-relaxed">
                  {currentBusiness.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentBusiness.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-stone-100 text-stone-700 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-stone-600">
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {currentBusiness.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {currentBusiness.website}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-6">
          <button 
            onClick={() => handleSwipe('dislike')}
            className="w-16 h-16 bg-white shadow-xl rounded-full flex items-center justify-center hover:bg-red-50 transition-colors group"
            disabled={isAnimating}
          >
            <X className="w-8 h-8 text-red-500 group-hover:text-red-600" />
          </button>
          
          <button 
            onClick={() => handleSwipe('like')}
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
                index === currentIndex ? 'bg-rose-500' : 
                index < currentIndex ? 'bg-green-500' : 'bg-stone-300'
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

export default SwipeableBusinessDiscovery;