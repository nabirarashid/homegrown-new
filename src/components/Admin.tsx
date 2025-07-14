// src/components/AdminModal.tsx
import React, { useState, useEffect } from "react";
import Login from "./Login";
import AddBusiness from "./addingBusiness";
import AddProduct from "./addProducts";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'business' | 'product'>('business');
  const [roleLoading, setRoleLoading] = useState(true);

  // Fetch user role when user changes
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setUserRole(null);
      }
      setRoleLoading(false);
    };

    fetchUserRole();
  }, [user]);

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
            <h2 className="text-2xl font-bold text-gray-900">Business Admin Panel</h2>
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
            {loading || roleLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-900">Loading...</div>
              </div>
            ) : !user ? (
              <div className="max-w-md mx-auto">
                <Login 
                  requiredRole="business"
                  onLoginSuccess={(user, role) => {
                    setUserRole(role);
                  }}
                />
              </div>
            ) : userRole !== 'business' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600 mb-4">
                  This feature is only available for business accounts. You are currently signed in as a customer.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => auth.signOut()}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                  >
                    Sign Out
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Welcome & Sign Out */}
                <div className="text-center pb-4 border-b border-gray-100">
                  <p className="text-gray-900 mb-2">Welcome, {user.displayName}!</p>
                  <div className="flex items-center justify-center gap-4">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Business Account
                    </span>
                    <button
                      onClick={() => auth.signOut()}
                      className="px-4 py-2 text-rose-600 hover:text-rose-700 font-medium transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
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