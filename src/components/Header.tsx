import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, User, Settings } from 'lucide-react';
import AdminModal from './Admin';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/scroll', label: 'Scroll' },
    { path: '/mapping', label: 'Map' },
    { path: '/recommendations', label: 'Recommendations' },
    { path: '/sustainable', label: 'Sustainable' },
  ];

  return (
    <>
      <header className="flex items-center justify-between px-10 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <h1 className="text-xl font-bold text-gray-900">HomeGrown</h1>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-rose-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-rose-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          
          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <Heart className="w-5 h-5 text-gray-600" />
          </button>

          <button 
            onClick={() => setIsAdminModalOpen(true)}
            className="p-2 bg-rose-600 rounded-full hover:bg-rose-700 transition-colors"
            title="Admin Panel"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
          
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      </header>

      {/* Admin Modal */}
      <AdminModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
      />
    </>
  )
}

export default Header