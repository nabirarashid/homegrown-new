import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Heart, User, Settings } from "lucide-react";
import CustomerModal from "./CustomerModal";
import AdminModal from "./Admin";



const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
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
  <div className="flex items-center gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          <button
            onClick={handleSearch}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchQuery.trim() === ""
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-rose-600 text-white hover:bg-rose-700"
            }`}
            disabled={searchQuery.trim() === ""}
          >
            Search
          </button>

          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <Heart className="w-5 h-5 text-gray-600" />
          </button>

          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <Heart className="w-5 h-5 text-gray-600" />
          </button>

          {/* Settings/Gear button - For business product management */}
          <button
            onClick={() => setShowAdminModal(true)}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            title="Business Management - Add Products & Business Info"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

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

      {/* Admin/Settings Modal - Business-only features */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </>
  );
};

export default Header;
