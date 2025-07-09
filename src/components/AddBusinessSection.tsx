import React from 'react'
import { ArrowRight } from 'lucide-react';

const AddBusinessSection = () => {
  return (
    <section className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-8 mx-4 mb-12">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Get your business listed in minutes
          </h2>
          <p className="text-gray-600 mb-6">
            Reach more customers and grow your business with LocalSpot. It's quick, easy, and free to get started.
          </p>
          <button className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-50 transition-colors shadow-sm">
            Add Your Business
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1">
          <img 
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=300&fit=crop"
            alt="Business owner"
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      </div>
    </section>
  )
}

export default AddBusinessSection