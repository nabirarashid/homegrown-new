import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyAZzZs4PIHqZTTvOsZl6ZwjqGjlvNMXEZs",
  authDomain: "homegrown-2ed3f.firebaseapp.com",
  projectId: "homegrown-2ed3f",
  storageBucket: "homegrown-2ed3f.firebasestorage.app",
  messagingSenderId: "866037506815",
  appId: "1:866037506815:web:7b3f0c8e5e8c9f8e8f8e8f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

async function recreateBusinessesWithOakvilleLocations() {
  try {
    console.log("🚀 Starting business recreation with Oakville locations...");

    // Step 1: Delete all existing businesses
    console.log("🗑️ Deleting all existing businesses...");
    const businessesSnapshot = await getDocs(collection(db, "businesses"));
    const deletePromises = businessesSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);
    console.log(
      `✅ Deleted ${businessesSnapshot.docs.length} existing businesses`
    );

    // Step 2: Delete all existing products (if any)
    console.log("🗑️ Deleting all existing products...");
    const productsSnapshot = await getDocs(collection(db, "products"));
    const deleteProductPromises = productsSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(deleteProductPromises);
    console.log(`✅ Deleted ${productsSnapshot.docs.length} existing products`);

    // Step 3: Create new businesses with Oakville locations
    console.log("🏪 Creating new businesses with Oakville locations...");

    for (const business of oakvilleBusinesses) {
      // Add to businesses collection
      const businessDoc = await addDoc(collection(db, "businesses"), {
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

      console.log(
        `✅ Created business: ${business.businessName} at ${business.location.address}`
      );
    }

    console.log(
      "🎉 All businesses recreated successfully with Oakville locations!"
    );
    console.log(`📍 Total businesses created: ${oakvilleBusinesses.length}`);
    console.log("🌍 All locations are now in Oakville, Ontario");
  } catch (error) {
    console.error("❌ Error recreating businesses:", error);
  }
}

// Run the recreation
recreateBusinessesWithOakvilleLocations();
