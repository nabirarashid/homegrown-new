import React, { useState } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { User, Settings } from "lucide-react";
import Login from "./Login";
import BusinessDashboard from "./BusinessDashboard";
import useUserRole from "../useUserRole";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  showBusinessForm?: boolean;
  requiredRole?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  showBusinessForm = false,
}) => {
  const { user, loading, role } = useUserRole();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Debug logging
  console.log("AuthModal Debug:", {
    user: user?.email,
    loading,
    role,
    showBusinessForm,
  });

  const handleSignOut = async () => {
    if (!user) return;

    try {
      setIsSigningOut(true);

      // Clear the user's role in the database
      await updateDoc(doc(db, "users", user.uid), {
        role: null,
        signedOutAt: new Date(),
      });

      // Sign out from Firebase Auth
      await auth.signOut();

      // Close modal after sign out
      onClose();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleLoginSuccess = () => {
    // Force a page refresh to ensure the useUserRole hook gets the latest data
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div
        className={`bg-white rounded-lg w-full mx-4 max-h-[90vh] overflow-y-auto ${
          showBusinessForm ? "max-w-4xl" : "max-w-md"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            {showBusinessForm ? "Business Management" : "Account"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className={`p-4 ${showBusinessForm ? "p-6" : "p-4"}`}>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
            </div>
          ) : !user ? (
            <Login onLoginSuccess={handleLoginSuccess} />
          ) : (
            <div>
              {/* User is logged in */}
              {showBusinessForm ? (
                // If user is admin, redirect to admin dashboard
                user.email === "nabira.per1701@gmail.com" ? (
                  <div className="text-center py-8">
                    <div className="text-blue-600 mb-4">
                      <Settings className="w-12 h-12 mx-auto mb-2" />
                      <h3 className="text-lg font-semibold">
                        Admin Dashboard Available
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      You are accessing as admin. Use the "Admin" button in the
                      header for the admin dashboard.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                ) : role === "business" ? (
                  // Business users always get their dashboard (which handles approved vs not approved internally)
                  <BusinessDashboard onClose={onClose} />
                ) : role === "customer" ? (
                  <div className="text-center py-8">
                    <div className="text-orange-600 mb-4">
                      <Settings className="w-12 h-12 mx-auto mb-2" />
                      <h3 className="text-lg font-semibold">
                        Business Account Required
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      You're signed in as a customer. To manage a business, you
                      need to sign up with a business account.
                    </p>
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 mr-2 disabled:opacity-50"
                    >
                      {isSigningOut
                        ? "Signing out..."
                        : "Sign Out & Create Business Account"}
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  // Role not set yet or unknown - show business dashboard anyway
                  <BusinessDashboard onClose={onClose} />
                )
              ) : (
                // General profile section
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Welcome, {user.displayName}!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Account type:{" "}
                    <span className="font-medium capitalize">
                      {role || "Not set"}
                    </span>
                  </p>
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mr-2 disabled:opacity-50"
                  >
                    {isSigningOut ? "Signing out..." : "Sign Out"}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
