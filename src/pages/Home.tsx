import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { db } from "../firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { PLACEHOLDER_IMAGES } from "../utils/placeholders";

const Home = () => {
  const navigate = useNavigate();
  const [featuredBusinesses, setFeaturedBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured businesses
        const businessesSnapshot = await getDocs(
          query(collection(db, "businesses"), limit(6))
        );
        const businessesData = businessesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFeaturedBusinesses(businessesData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-stone-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const HeroSection = () => (
    <section className="relative h-96 bg-gradient-to-r from-rose-600 to-pink-600 flex items-center justify-center text-center text-white rounded-xl mx-4 mb-8">
      <div className="absolute inset-0 bg-black bg-opacity-20 rounded-xl"></div>
      <div className="relative z-10 max-w-2xl px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Discover the best local businesses
        </h2>
        <p className="text-lg mb-8 opacity-90">
          Find hidden gems and support your community. Explore unique shops,
          restaurants, and services nearby.
        </p>
        <button
          onClick={() => navigate("/scroll")}
          className="px-8 py-3 bg-rose-600 text-white rounded-full font-semibold hover:bg-rose-700 transition-colors"
        >
          Get Started
        </button>
      </div>
    </section>
  );

  const FeaturedBusinesses = () => (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 px-4">
        Featured Businesses
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 px-4">
        {featuredBusinesses.map((business: any) => (
          <div
            key={business.id}
            className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer relative"
            onClick={() => {
              if (business.website) {
                window.open(business.website, "_blank");
              }
            }}
          >
            {business.website && (
              <div className="absolute top-2 right-2 bg-rose-600 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                Visit
              </div>
            )}
            <img
              src={
                business.productImage ||
                business.image ||
                PLACEHOLDER_IMAGES.business
              }
              alt={business.businessName}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = PLACEHOLDER_IMAGES.business;
              }}
            />
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                {business.businessName}
              </h3>
              <p className="text-sm text-gray-600">{business.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {business.tags
                  ?.slice(0, 3)
                  .map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const ReadyToScroll = () => (
    <section className="mb-12">
      <div className="mx-4 bg-rose-700 rounded-2xl p-8 text-white text-center">
        <div className="flex justify-center mb-4">
          <Sparkles size={48} className="text-white opacity-80" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Ready to Scroll?</h2>
        <p className="text-lg mb-6 opacity-90">
          Discover amazing local businesses by swiping through our curated
          selection
        </p>
        <button
          onClick={() => navigate("/scroll")}
          className="bg-white text-rose-800 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors text-lg inline-flex items-center gap-2"
        >
          Start Scrolling
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-rose-50 font-sans">
      <main className="max-w-6xl mx-auto py-8">
        <HeroSection />
        <FeaturedBusinesses />
        <ReadyToScroll />
      </main>
    </div>
  );
};

export default Home;
