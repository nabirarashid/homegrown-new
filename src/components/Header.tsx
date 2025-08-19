import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, User } from "lucide-react";
import CustomerModal from "./CustomerModal";
import AdminModal from "./Admin";
import AuthModal from "./AuthModal";
import useUserRole from "../useUserRole";
import { useEffect } from "react";
import { query, collection, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const Header = () => {
  const { user, role } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [hasClaimedBusiness, setHasClaimedBusiness] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user has a claimed business
  useEffect(() => {
    const checkClaimedBusiness = async () => {
      if (user && role === "business") {
        try {
          const claimedQuery = query(
            collection(db, "businesses"),
            where("claimedBy", "==", user.uid),
            where("status", "==", "claimed")
          );
          const claimedSnapshot = await getDocs(claimedQuery);
          setHasClaimedBusiness(!claimedSnapshot.empty);
        } catch (error) {
          console.error("Error checking claimed business:", error);
        }
      } else {
        setHasClaimedBusiness(false);
      }
    };

    checkClaimedBusiness();
  }, [user, role]);

  const handleSearch = () => {
    if (searchQuery.trim() !== "") {
      navigate(`/search-results?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/scroll", label: "Scroll" },
    { path: "/mapping", label: "Map" },
    { path: "/recommendations", label: "Recommendations" },
    { path: "/sustainable", label: "Sustainable" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200 w-full">
        <div className="flex items-center justify-between px-4 py-2 sm:px-10 sm:py-4">
          {/* Logo & Hamburger */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-rose-600 rounded-full flex items-center justify-center text-white text-xl shadow">
              🏠
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">HomeGrown</h1>
          </div>
          {/* Hamburger for mobile */}
          <button
            className="sm:hidden ml-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 focus:outline-none"
            onClick={() => setNavOpen((prev) => !prev)}
            aria-label="Open navigation menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          {/* Desktop nav & actions */}
          <div className="hidden sm:flex items-center gap-6">
            <nav className="flex items-center gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-rose-600 text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-rose-600"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {/* Search */}
            <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 shadow-sm">
              <Search className="text-gray-400 w-5 h-5 mr-1" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="bg-transparent outline-none text-sm px-1 w-24"
              />
              <button
                onClick={handleSearch}
                className={`ml-1 p-1 rounded-full transition-colors ${
                  searchQuery.trim() === ""
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-rose-600 text-white hover:bg-rose-700"
                }`}
                disabled={searchQuery.trim() === ""}
                style={{ height: 28, width: 28, display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            {/* Business/Claim/Admin/Profile buttons */}
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setShowBusinessModal(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                title="Add a new business to the platform"
              >
                Add Business
              </button>
              {role === "business" && hasClaimedBusiness ? (
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  title="Manage your business"
                >
                  Manage Business
                </button>
              ) : role === "business" && !hasClaimedBusiness ? (
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  title="Claim your business listing"
                >
                  Claim Business
                </button>
              ) : null}
              {user?.email === "nabira.per1701@gmail.com" && (
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  title="Admin Dashboard - Manage Business Requests"
                >
                  Admin
                </button>
              )}
              <button
                onClick={() => setShowCustomerModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm"
                title="Login - Customer or Business"
              >
                <User className="w-4 h-4 text-white" />
                <span className="font-medium text-white">Profile</span>
              </button>
            </div>
          </div>
        </div>
        {/* Mobile nav menu (hamburger) */}
        {navOpen && (
          <div className="sm:hidden bg-white border-t border-gray-200 shadow-md px-4 py-3 flex flex-col gap-3 animate-slideDown">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-rose-600 text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-rose-600"
                  }`}
                  onClick={() => setNavOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 shadow-sm">
                <Search className="text-gray-400 w-5 h-5 mr-1" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  className="bg-transparent outline-none text-sm px-1 w-full"
                />
                <button
                  onClick={handleSearch}
                  className={`ml-1 p-1 rounded-full transition-colors ${
                    searchQuery.trim() === ""
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-rose-600 text-white hover:bg-rose-700"
                  }`}
                  disabled={searchQuery.trim() === ""}
                  style={{ height: 28, width: 28, display: "flex", alignItems: "center", justifyContent: "center" }}
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => { setShowBusinessModal(true); setNavOpen(false); }}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                title="Add a new business to the platform"
              >
                Add Business
              </button>
              {role === "business" && hasClaimedBusiness ? (
                <button
                  onClick={() => { setShowClaimModal(true); setNavOpen(false); }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  title="Manage your business"
                >
                  Manage Business
                </button>
              ) : role === "business" && !hasClaimedBusiness ? (
                <button
                  onClick={() => { setShowClaimModal(true); setNavOpen(false); }}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  title="Claim your business listing"
                >
                  Claim Business
                </button>
              ) : null}
              {user?.email === "nabira.per1701@gmail.com" && (
                <button
                  onClick={() => { setShowAdminModal(true); setNavOpen(false); }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  title="Admin Dashboard - Manage Business Requests"
                >
                  Admin
                </button>
              )}
              <button
                onClick={() => { setShowCustomerModal(true); setNavOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm"
                title="Login - Customer or Business"
              >
                <User className="w-4 h-4 text-white" />
                <span className="font-medium text-white">Profile</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Profile Modal - General login with role selection */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
      />
      {/* Business Modal - For business management */}
      <AuthModal
        isOpen={showBusinessModal}
        onClose={() => setShowBusinessModal(false)}
        showBusinessForm={true}
      />
      {/* Claim Business Modal - For business claiming */}
      <AuthModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        showBusinessDashboard={true}
      />
      {/* Admin/Settings Modal - Admin-only features */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg w-full mx-4 max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Admin Dashboard</h2>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <AdminModal />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
