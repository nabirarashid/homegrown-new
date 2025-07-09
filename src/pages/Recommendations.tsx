import React, { useState } from 'react';
import { Search, Heart, User, Star } from 'lucide-react';

const Recommendations = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['Food', 'Wellness', 'Vintage', 'All'];

  const featuredBusiness = {
    name: "The Cozy Corner Cafe",
    rating: 4.5,
    reviews: 234,
    distance: "0.3 mi",
    description: "Cozy cafe with a warm atmosphere, serving delicious coffee and pastries.",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=300&fit=crop",
    isSponsored: true
  };

  const trendingBusiness = {
    name: "Serenity Spa",
    rating: 4.8,
    reviews: 156,
    distance: "0.5 mi",
    description: "Relaxing spa offering a variety of treatments to rejuvenate your mind and body.",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=300&fit=crop",
    isSponsored: true
  };

  const suggestions = [
    {
      id: 1,
      name: "Retro Threads",
      rating: 4.6,
      reviews: 120,
      distance: "0.7 mi",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop"
    },
    {
      id: 2,
      name: "Art Haven",
      rating: 4.7,
      reviews: 89,
      distance: "0.9 mi",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"
    },
    {
      id: 3,
      name: "The Book Nook",
      rating: 4.9,
      reviews: 201,
      distance: "1.1 mi",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop"
    }
  ];

  const CategoryFilters = () => (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => setSelectedCategory(category)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === category
              ? 'bg-rose-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );

  const BusinessCard = ({ business, layout = 'horizontal' }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${
      layout === 'horizontal' ? 'flex flex-col md:flex-row' : 'flex flex-col'
    }`}>
      <img 
        src={business.image} 
        alt={business.name}
        className={`object-cover ${
          layout === 'horizontal' 
            ? 'w-full md:w-1/2 h-48 md:h-auto' 
            : 'w-full h-48'
        } rounded-t-lg ${layout === 'horizontal' ? 'md:rounded-l-lg md:rounded-tr-none' : ''}`}
      />
      
      <div className={`p-6 ${layout === 'horizontal' ? 'flex-1' : ''}`}>
        {business.isSponsored && (
          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded mb-2">
            Sponsored
          </span>
        )}
        
        <h3 className="text-lg font-bold text-gray-900 mb-2">{business.name}</h3>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-700">{business.rating}</span>
          </div>
          <span className="text-sm text-gray-500">·</span>
          <span className="text-sm text-gray-500">{business.reviews} reviews</span>
          <span className="text-sm text-gray-500">·</span>
          <span className="text-sm text-gray-500">{business.distance}</span>
        </div>
        
        <p className="text-gray-600 text-sm">{business.description}</p>
      </div>
    </div>
  );

  const SmallBusinessCard = ({ business }) => (
    <div className="flex-shrink-0 w-60 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <img 
        src={business.image} 
        alt={business.name}
        className="w-full h-48 object-cover rounded-t-lg"
      />
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{business.name}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span>{business.rating}</span>
          </div>
          <span>·</span>
          <span>{business.reviews} reviews</span>
          <span>·</span>
          <span>{business.distance}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-rose-50 font-sans">
      <CategoryFilters />
      
      <main className="max-w-6xl mx-auto py-6 px-4">
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Because you liked...</h2>
          <BusinessCard business={featuredBusiness} layout="horizontal" />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trending businesses nearby</h2>
          <BusinessCard business={trendingBusiness} layout="horizontal" />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">You might also like</h2>
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