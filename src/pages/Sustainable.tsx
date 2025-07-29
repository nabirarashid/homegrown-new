import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { getDistanceString, getUserLocation } from "../utils/locationService";
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

async function searchBusiness(searchQuery: string): Promise<Business[]> {
  const queryLower = searchQuery.toLowerCase();
  const productsRef = collection(db, "products"); // "products" is your Firestore collection name
  const snapshot = await getDocs(productsRef);

  const businesses: Business[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Business[];

  return businesses.filter(business =>
    business.businessName.toLowerCase().includes(queryLower) ||
    business.description.toLowerCase().includes(queryLower)
  );
}


interface Business {
  id: string;
  businessName: string;
  description: string;
  image?: string;
  productImage?: string;
  tags?: string[];
  rating?: number;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

const SustainableShoppingPage = () => {
  const [searchResults, setSearchResults] = useState<Business[] | null>(null);
  const [mainSearchQuery, setMainSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [greenCertifiedBusinesses, setGreenCertifiedBusinesses] = useState<
    Business[]
  >([]);
  const [locallySourcedBusinesses, setLocallySourcedBusinesses] = useState<
    Business[]
  >([]);
  const [zeroWasteBusinesses, setZeroWasteBusinesses] = useState<Business[]>(
    []
  );
  const [otherSustainableBusinesses, setOtherSustainableBusinesses] = useState<
    Business[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Get user location on component mount
  useEffect(() => {
    const requestLocation = async () => {
      try {
        const location = await getUserLocation();
        setUserLocation(location);
        setLocationPermission("granted");
      } catch (error) {
        console.error("Error getting user location:", error);
        setLocationPermission("prompt");
      }
    };

    requestLocation();
  }, []);

  useEffect(() => {
    const fetchSustainableBusinesses = async () => {
      try {
        // Fetch all businesses first
        const businessesSnapshot = await getDocs(collection(db, "businesses"));
        const allBusinesses = businessesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Business[];

        // Filter businesses by EXACT sustainability tags
        const greenCertified = allBusinesses.filter((business: Business) =>
          business.tags?.some(
            (tag: string) =>
              tag.toLowerCase() === "green certified" ||
              tag.toLowerCase() === "green-certified" ||
              tag.toLowerCase() === "certified green"
          )
        );

        const locallySourced = allBusinesses.filter((business: Business) =>
          business.tags?.some(
            (tag: string) =>
              tag.toLowerCase() === "locally sourced" ||
              tag.toLowerCase() === "locally-sourced" ||
              tag.toLowerCase() === "local sourced"
          )
        );

        const zeroWaste = allBusinesses.filter((business: Business) =>
          business.tags?.some(
            (tag: string) =>
              tag.toLowerCase() === "zero waste" ||
              tag.toLowerCase() === "zero-waste" ||
              tag.toLowerCase() === "zero waste certified"
          )
        );

        // Get other sustainable businesses (not in the main three categories)
        const otherSustainable = allBusinesses.filter((business: Business) => {
          const businessTags =
            business.tags?.map((tag: string) => tag.toLowerCase()) || [];
          const isInMainCategories = businessTags.some(
            (tag: string) =>
              tag === "green certified" ||
              tag === "green-certified" ||
              tag === "certified green" ||
              tag === "locally sourced" ||
              tag === "locally-sourced" ||
              tag === "local sourced" ||
              tag === "zero waste" ||
              tag === "zero-waste" ||
              tag === "zero waste certified"
          );

          // Include if it has other sustainability tags but isn't in main categories
          const hasOtherSustainableTags = businessTags.some(
            (tag: string) =>
              tag.includes("organic") ||
              tag.includes("eco") ||
              tag.includes("sustainable") ||
              tag.includes("green") ||
              tag.includes("local") ||
              tag.includes("farm") ||
              tag.includes("artisan") ||
              tag.includes("eco-friendly") ||
              tag.includes("natural")
          );

          return !isInMainCategories && hasOtherSustainableTags;
        });

        setGreenCertifiedBusinesses(greenCertified);
        setLocallySourcedBusinesses(locallySourced);
        setZeroWasteBusinesses(zeroWaste);
        setOtherSustainableBusinesses(otherSustainable);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching sustainable businesses:", error);
        setLoading(false);
      }
    };

    fetchSustainableBusinesses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sustainable businesses...</p>
        </div>
      </div>
    );
  }

  const BusinessCard = ({ business }: { business: Business }) => (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-2xl aspect-square mb-4 bg-gradient-to-br from-stone-100 to-stone-200">
        <img
          src={
            business.productImage ||
            business.image ||
            "https://via.placeholder.com/400x400?text=Business"
          }
          alt={business.businessName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          style={{ minHeight: "200px" }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-stone-800 text-lg leading-tight group-hover:text-rose-700 transition-colors duration-300">
          {business.businessName}
        </h3>
        <p className="text-stone-600 text-sm leading-relaxed">
          {business.description || "No description available"}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {business.tags?.slice(0, 3).map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
        {business.rating && (
          <div className="text-sm text-gray-500 mt-2">
            ⭐ {business.rating} •{" "}
            {business.location ? (
              <DistanceDisplay
                location={business.location}
                userLocation={userLocation}
              />
            ) : (
              "Distance N/A"
            )}
          </div>
        )}
      </div>
    </div>
  );

  const SectionHeader = ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-stone-800 mb-2">{title}</h2>
      {subtitle && <p className="text-stone-600">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-stone-50 to-rose-100">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Location Permission Banner */}
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

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-6 leading-tight">
            Sustainable Choices
          </h1>
          <p className="text-stone-600 text-lg mb-8 max-w-2xl mx-auto">
            Discover eco-friendly businesses that care about our planet. Support
            local, sustainable commerce in your community.
          </p>

          {/* Main Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for businesses"
              value={mainSearchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setMainSearchQuery(value);
                if (value.trim() === "") {
                  setSearchResults(null);  // Clear results if search box is empty
                } else {
                  searchBusiness(value).then(setSearchResults);
                }
              }}
              
              className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-sm rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-lg transition-all"
            />
          </div>
        </div>

        {/* Search Results Section */}
        {searchResults && (
          <section className="mb-16">
            <SectionHeader
              title={`Search Results for "${mainSearchQuery}"`}
              subtitle={`${searchResults.length} businesses found`}
            />
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {searchResults.map((business: Business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            ) : (
              <p className="text-center text-stone-600">No businesses found.</p>
            )}
          </section>
        )}


        {/* Green Certified Section */}
        <section className="mb-16">
          <SectionHeader
            title="Green Certified"
            subtitle="Businesses with verified environmental certifications"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {greenCertifiedBusinesses.map((business: Business) => (
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
            {locallySourcedBusinesses.map((business: Business) => (
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
            {zeroWasteBusinesses.map((business: Business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </section>

        {/* Other Sustainable Businesses */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-800 mb-4">
              Other Sustainable Businesses
            </h2>
            <p className="text-stone-600 text-lg leading-relaxed max-w-2xl mx-auto">
              Discover more businesses committed to sustainable practices,
              including organic products, eco-friendly services, and
              environmentally conscious operations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherSustainableBusinesses.map((business: Business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SustainableShoppingPage;