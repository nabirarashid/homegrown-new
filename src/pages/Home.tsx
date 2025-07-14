import React from 'react';
import AddBusinessSection from '../components/AddBusinessSection';
import { useNavigate } from 'react-router-dom';

const Home = () => {

  const navigate = useNavigate();

  const featuredBusinesses = [
    {
      id: 1,
      name: "The Cozy Corner Cafe",
      description: "A charming cafe with delicious pastries and coffee.",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=400&fit=crop"
    },
    {
      id: 2,
      name: "Pages & Prose Bookstore",
      description: "A haven for book lovers with a wide selection of genres.",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop"
    },
    {
      id: 3,
      name: "Crafted Creations",
      description: "Unique handmade crafts and gifts from local artists.",
      image: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=400&fit=crop"
    }
  ];

  const categories = [
    {
      name: "Restaurants",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop"
    },
    {
      name: "Retail",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop"
    },
    {
      name: "Services",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=400&fit=crop"
    },
    {
      name: "Entertainment",
      image: "https://images.unsplash.com/photo-1489599363714-43c6b98b9c41?w=400&h=400&fit=crop"
    }
  ];

  const HeroSection = () => (
    <section className="relative h-96 bg-gradient-to-r from-rose-600 to-pink-600 flex items-center justify-center text-center text-white rounded-xl mx-4 mb-8">
      <div className="absolute inset-0 bg-black bg-opacity-20 rounded-xl"></div>
      <div className="relative z-10 max-w-2xl px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Discover the best local businesses
        </h2>
        <p className="text-lg mb-8 opacity-90">
          Find hidden gems and support your community. Explore unique shops, restaurants, and services nearby.
        </p>
        <button onClick={() => navigate("/scroll")} className="px-8 py-3 bg-rose-600 text-white rounded-full font-semibold hover:bg-rose-700 transition-colors">
          Get Started
        </button>
      </div>
    </section>
  );

  const FeaturedBusinesses = () => (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 px-4">Featured Businesses</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 px-4">
        {featuredBusinesses.map((business) => (
          <div key={business.id} className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <img 
              src={business.image} 
              alt={business.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{business.name}</h3>
              <p className="text-sm text-gray-600">{business.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const Categories = () => (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 px-4">Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
        {categories.map((category) => (
          <div key={category.name} className="group cursor-pointer">
            <img 
              src={category.image} 
              alt={category.name}
              className="w-full aspect-square object-cover rounded-lg group-hover:shadow-md transition-shadow"
            />
            <p className="mt-3 font-medium text-gray-900 text-center">{category.name}</p>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-rose-50 font-sans">      
      <main className="max-w-6xl mx-auto py-8">
        <HeroSection />
        <FeaturedBusinesses />
        <Categories />
        <AddBusinessSection />
      </main>
    </div>
  );
};

export default Home;