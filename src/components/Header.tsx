import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, User, Settings } from "lucide-react";
import CustomerModal from "./CustomerModal";
import AdminModal from "./Admin";
import AuthModal from "./AuthModal";
import useUserRole from "../useUserRole";

const Header = () => {
  const { user } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
      <header className="flex items-center justify-between px-10 py-4 bg-white border-b border-gray-200">
        {/* Logo and navigation */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center text-white">
            🏠
          </div>
          <h1 className="text-xl font-bold text-gray-900">HomeGrown</h1>
        </div>

        <nav className="flex items-center gap-6">
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

        {/* Actions */}

        {/* Actions */}
        <div className="flex items-center gap-6">
          <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 shadow-sm">
            <Search className="text-gray-400 w-8 h-4 mr-1" />
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
              style={{
                height: 28,
                width: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Settings/Gear button - For business product management */}
          <button
            onClick={() => setShowBusinessModal(true)}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            title="Business Management - Add Products & Business Info"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {/* Admin button - Only visible to admin */}
          {user?.email === "nabira.per1701@gmail.com" && (
            <button
              onClick={() => setShowAdminModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              title="Admin Dashboard - Manage Business Requests"
            >
              Admin
            </button>
          )}

          {/* Profile button - For general login/role selection */}
          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            title="Login - Customer or Business"
          >
            <User className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Profile</span>
          </button>
        </div>
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

      {/* Admin/Settings Modal - Admin-only features */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </>
  );
};

export default Header;
