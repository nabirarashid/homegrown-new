import React, { useState } from 'react';
import { Search, Menu, User } from 'lucide-react';

const SustainableShoppingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mainSearchQuery, setMainSearchQuery] = useState('');

  const greenCertifiedBusinesses = [
    {
      id: 1,
      name: "The Green Bean Cafe",
      description: "Cozy cafe with organic coffee and vegan options.",
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop"
    },
    {
      id: 2,
      name: "EcoClean Laundry",
      description: "Eco-friendly laundry service using plant-based detergents.",
      image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=400&fit=crop"
    },
    {
      id: 3,
      name: "Sustainable Style Boutique",
      description: "Fashion boutique with sustainable and ethically sourced clothing.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop"
    }
  ];

  const locallySourcedBusinesses = [
    {
      id: 4,
      name: "Farm Fresh Market",
      description: "Market with produce from local farms.",
      image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=400&fit=crop"
    },
    {
      id: 5,
      name: "Artisan Bakery",
      description: "Bakery using locally sourced ingredients.",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop"
    },
    {
      id: 6,
      name: "Craft Brewery",
      description: "Brewery with craft beers made from local hops.",
      image: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=400&h=400&fit=crop"
    }
  ];

  const zeroWasteBusinesses = [
    {
      id: 7,
      name: "Refill Station",
      description: "Store where you can refill household products to reduce waste.",
      image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop"
    },
    {
      id: 8,
      name: "Repair Shop",
      description: "Shop specializing in repairing electronics and appliances.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=400&fit=crop"
    },
    {
      id: 9,
      name: "Secondhand Store",
      description: "Store selling pre-owned clothing and goods.",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"
    }
  ];

  const BusinessCard = ({ business }) => (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-2xl aspect-square mb-4 bg-gradient-to-br from-stone-100 to-stone-200">
        <img 
          src={business.image} 
          alt={business.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-stone-800 text-lg leading-tight group-hover:text-rose-700 transition-colors duration-300">
          {business.name}
        </h3>
        <p className="text-stone-600 text-sm leading-relaxed">
          {business.description}
        </p>
      </div>
    </div>
  );

  const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-stone-800 mb-2">{title}</h2>
      {subtitle && <p className="text-stone-600">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-stone-50 to-rose-100">      

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-6 leading-tight">
            Sustainable Choices
          </h1>
          <p className="text-stone-600 text-lg mb-8 max-w-2xl mx-auto">
            Discover eco-friendly businesses that care about our planet. Support local, sustainable commerce in your community.
          </p>
          
          {/* Main Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for businesses"
              value={mainSearchQuery}
              onChange={(e) => setMainSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-sm rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-lg transition-all"
            />
          </div>
        </div>

        {/* Green Certified Section */}
        <section className="mb-16">
          <SectionHeader 
            title="Green Certified" 
            subtitle="Businesses with verified environmental certifications"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {greenCertifiedBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </section>

        {/* Locally Sourced Section */}
        <section className="mb-16">
          <SectionHeader 
            title="Locally Sourced" 
            subtitle="Supporting local farmers and suppliers"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {locallySourcedBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </section>

        {/* Zero-Waste Section */}
        <section className="mb-16">
          <SectionHeader 
            title="Zero-Waste" 
            subtitle="Businesses committed to reducing waste"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {zeroWasteBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </section>
      </div>      
    </div>
  );
};

export default SustainableShoppingPage;