import React, { useState } from "react";
import Login from "./Login";
import AddBusiness from "./addingBusiness";
import AddProduct from "./addProducts";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState<'business' | 'product'>('business');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-900">Loading...</div>
              </div>
            ) : !user ? (
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Access Required</h3>
                  <p className="text-gray-600">Please log in to access admin features</p>
                </div>
                <Login />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Welcome & Sign Out */}
                <div className="text-center pb-4 border-b border-gray-100">
                  <p className="text-gray-900 mb-2">Welcome, {user.displayName}!</p>
                  <button
                    onClick={() => auth.signOut()}
                    className="px-4 py-2 text-rose-600 hover:text-rose-700 font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('business')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'business'
                        ? 'bg-white text-rose-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Add Business
                  </button>
                  <button
                    onClick={() => setActiveTab('product')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'product'
                        ? 'bg-white text-rose-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Add Product
                  </button>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                  {activeTab === 'business' ? <AddBusiness /> : <AddProduct />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;