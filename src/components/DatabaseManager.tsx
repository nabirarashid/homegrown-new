import React, { useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  addDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Trash2, Plus, MapPin, AlertCircle } from "lucide-react";

// Sample businesses for Oakville, Ontario
const oakvilleBusinesses = [
  {
    businessName: "Green Leaf Organics",
    description: "Organic produce and sustainable goods",
    tags: ["Green Certified", "Organic", "Local"],
    rating: 4.8,
    location: {
      lat: 43.4456,
      lng: -79.6876,
      address: "123 Lakeshore Rd W, Oakville, ON",
    },
    productName: "Fresh Organic Vegetables",
    productImage:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop",
    category: "Food",
    productPrice: 15.99,
    hours: "8:00 AM - 8:00 PM",
    phone: "(905) 555-0123",
    website: "https://greenleaforganics.ca",
  },
  {
    businessName: "Eco Market",
    description: "Zero waste grocery store with bulk items",
    tags: ["Zero Waste", "Eco-Friendly", "Bulk"],
    rating: 4.6,
    location: { lat: 43.45, lng: -79.68, address: "456 Kerr St, Oakville, ON" },
    productName: "Bulk Organic Grains",
    productImage:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    category: "Food",
    productPrice: 8.5,
    hours: "9:00 AM - 7:00 PM",
    phone: "(905) 555-0234",
    website: "https://ecomarket.ca",
  },
  {
    businessName: "Local Artisan Bakery",
    description: "Fresh baked goods using local ingredients",
    tags: ["Locally Sourced", "Artisan", "Fresh"],
    rating: 4.9,
    location: {
      lat: 43.44,
      lng: -79.69,
      address: "789 Trafalgar Rd, Oakville, ON",
    },
    productName: "Artisan Sourdough Bread",
    productImage:
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop",
    category: "Food",
    productPrice: 6.99,
    hours: "6:00 AM - 6:00 PM",
    phone: "(905) 555-0345",
    website: "https://artisanbakery.ca",
  },
  {
    businessName: "Sustainable Goods Store",
    description: "Eco-friendly products for sustainable living",
    tags: ["Sustainable", "Eco-Friendly", "Green"],
    rating: 4.7,
    location: {
      lat: 43.435,
      lng: -79.675,
      address: "321 Third Line, Oakville, ON",
    },
    productName: "Bamboo Kitchen Set",
    productImage:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    category: "Home",
    productPrice: 24.99,
    hours: "10:00 AM - 8:00 PM",
    phone: "(905) 555-0456",
    website: "https://sustainablegoods.ca",
  },
  {
    businessName: "Fresh Farm Market",
    description: "Local farmers market with seasonal produce",
    tags: ["Locally Sourced", "Farm Fresh", "Seasonal"],
    rating: 4.5,
    location: {
      lat: 43.452,
      lng: -79.678,
      address: "654 Speers Rd, Oakville, ON",
    },
    productName: "Seasonal Fruit Basket",
    productImage:
      "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&h=300&fit=crop",
    category: "Food",
    productPrice: 18.99,
    hours: "7:00 AM - 6:00 PM",
    phone: "(905) 555-0567",
    website: "https://freshfarmmarket.ca",
  },
  {
    businessName: "Zero Waste Shop",
    description: "Package-free shopping for everyday essentials",
    tags: ["Zero Waste", "Package-Free", "Sustainable"],
    rating: 4.8,
    location: {
      lat: 43.448,
      lng: -79.685,
      address: "987 Cornwall Rd, Oakville, ON",
    },
    productName: "Reusable Glass Containers",
    productImage:
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
    category: "Home",
    productPrice: 12.99,
    hours: "9:00 AM - 7:00 PM",
    phone: "(905) 555-0678",
    website: "https://zerowasteshop.ca",
  },
  {
    businessName: "Organic Wellness Cafe",
    description: "Organic coffee and healthy meals",
    tags: ["Organic", "Healthy", "Fair Trade"],
    rating: 4.6,
    location: {
      lat: 43.447,
      lng: -79.682,
      address: "147 Navy St, Oakville, ON",
    },
    productName: "Organic Fair Trade Coffee",
    productImage:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
    category: "Food",
    productPrice: 4.5,
    hours: "6:00 AM - 9:00 PM",
    phone: "(905) 555-0789",
    website: "https://organicwellnesscafe.ca",
  },
  {
    businessName: "Local Pottery Studio",
    description: "Handcrafted ceramics and pottery classes",
    tags: ["Artisan", "Handmade", "Local"],
    rating: 4.7,
    location: {
      lat: 43.455,
      lng: -79.67,
      address: "258 Cross Ave, Oakville, ON",
    },
    productName: "Handmade Ceramic Mug",
    productImage:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    category: "Crafts",
    productPrice: 22.99,
    hours: "10:00 AM - 6:00 PM",
    phone: "(905) 555-0890",
    website: "https://potterystudio.ca",
  },
  {
    businessName: "Farmers Market Vendor",
    description: "Fresh seasonal produce from local farms",
    tags: ["Locally Sourced", "Farm Fresh", "Seasonal"],
    rating: 4.4,
    location: {
      lat: 43.441,
      lng: -79.695,
      address: "369 Dundas St W, Oakville, ON",
    },
    productName: "Organic Honey",
    productImage:
      "https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?w=400&h=300&fit=crop",
    category: "Food",
    productPrice: 9.99,
    hours: "8:00 AM - 4:00 PM",
    phone: "(905) 555-0901",
    website: "https://farmersmarketvendor.ca",
  },
  {
    businessName: "Eco-Friendly Cleaners",
    description: "Green cleaning services for homes and offices",
    tags: ["Eco-Friendly", "Green Certified", "Non-toxic"],
    rating: 4.9,
    location: {
      lat: 43.438,
      lng: -79.688,
      address: "741 Dorval Dr, Oakville, ON",
    },
    productName: "Eco Cleaning Service",
    productImage:
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=300&fit=crop",
    category: "Services",
    productPrice: 89.99,
    hours: "8:00 AM - 6:00 PM",
    phone: "(905) 555-1012",
    website: "https://ecocleaners.ca",
  },
];

const DatabaseManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const recreateBusinesses = async () => {
    setIsLoading(true);
    setError(null);
    setLogs([]);

    try {
      addLog("🚀 Starting business recreation with Oakville locations...");

      // Step 1: Delete all existing businesses
      addLog("🗑️ Deleting all existing businesses...");
      const businessesSnapshot = await getDocs(collection(db, "businesses"));
      const deletePromises = businessesSnapshot.docs.map((docRef) =>
        deleteDoc(docRef.ref)
      );
      await Promise.all(deletePromises);
      addLog(
        `✅ Deleted ${businessesSnapshot.docs.length} existing businesses`
      );

      // Step 2: Delete all existing products
      addLog("🗑️ Deleting all existing products...");
      const productsSnapshot = await getDocs(collection(db, "products"));
      const deleteProductPromises = productsSnapshot.docs.map((docRef) =>
        deleteDoc(docRef.ref)
      );
      await Promise.all(deleteProductPromises);
      addLog(`✅ Deleted ${productsSnapshot.docs.length} existing products`);

      // Step 3: Create new businesses with Oakville locations
      addLog("🏪 Creating new businesses with Oakville locations...");

      for (const business of oakvilleBusinesses) {
        // Add to businesses collection
        await addDoc(collection(db, "businesses"), {
          ...business,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Also add to products collection for backward compatibility
        await addDoc(collection(db, "products"), {
          ...business,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        addLog(
          `✅ Created business: ${business.businessName} at ${business.location.address}`
        );
      }

      addLog(
        "🎉 All businesses recreated successfully with Oakville locations!"
      );
      addLog(`📍 Total businesses created: ${oakvilleBusinesses.length}`);
      addLog("🌍 All locations are now in Oakville, Ontario");
    } catch (error: any) {
      setError(`Error recreating businesses: ${error.message}`);
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Database Manager
            </h1>
            <p className="text-gray-600">
              Recreate all businesses with Oakville, Ontario locations
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">
            Preview: New Businesses ({oakvilleBusinesses.length})
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
            {oakvilleBusinesses.map((business, index) => (
              <div key={index} className="mb-2 text-sm">
                <strong>{business.businessName}</strong> -{" "}
                {business.location.address}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={recreateBusinesses}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete All & Recreate with Oakville Locations
              </>
            )}
          </button>
        </div>

        {logs.length > 0 && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            <h3 className="text-white font-bold mb-2">Execution Log:</h3>
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseManager;
