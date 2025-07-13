import { auth, provider, db } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useState } from "react";

interface LoginProps {
  requiredRole?: 'business' | 'customer';
  onLoginSuccess?: (user: any, role: string) => void;
}

export default function Login({ requiredRole, onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'business' | 'customer'>('customer');

  const login = async (role?: 'business' | 'customer') => {
    setLoading(true);
    setError(null);

    try {
      // Configure the provider
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user already has a role
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let userRole = role || selectedRole;
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userRole = userData.role;
        
        // If requiredRole is specified and user doesn't have it, show error
        if (requiredRole && userData.role !== requiredRole) {
          setError(`This feature is only available for ${requiredRole} accounts. You are signed in as a ${userData.role}.`);
          await auth.signOut();
          return;
        }
      } else {
        // New user - set their role
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: userRole,
          createdAt: new Date(),
          preferences: userRole === 'customer' ? { tags: [] } : {},
        });
      }

      console.log(`👤 Logged in as: ${user.displayName} (${userRole})`);
      console.log("✅ Login successful!");
      
      if (onLoginSuccess) {
        onLoginSuccess(user, userRole);
      }
      
    } catch (err: unknown) {
      console.error("❌ Login failed", err);

      // Handle specific error cases
      const error = err as { code?: string; message?: string };
      if (error.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.");
      } else if (error.code === "auth/popup-blocked") {
        setError(
          "Popup was blocked by browser. Please allow popups and try again."
        );
      } else if (error.code === "auth/cancelled-popup-request") {
        setError("Sign-in was cancelled. Please try again.");
      } else {
        setError(`Sign-in failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = (role: 'business' | 'customer') => {
    setSelectedRole(role);
    setShowRoleSelection(false);
    login(role);
  };

  if (showRoleSelection) {
    return (
      <div className="flex flex-col items-center gap-6 p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Account Type</h3>
          <p className="text-sm text-gray-600">This will determine what features you can access</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
          <button
            onClick={() => handleRoleSelection('customer')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-rose-500 hover:bg-rose-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900">Customer</h4>
            </div>
            <p className="text-sm text-gray-600">Browse businesses, get recommendations, save favorites</p>
          </button>
          
          <button
            onClick={() => handleRoleSelection('business')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-rose-500 hover:bg-rose-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2m0 0h4" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900">Business</h4>
            </div>
            <p className="text-sm text-gray-600">Add your business, manage products, reach customers</p>
          </button>
        </div>
        
        <button
          onClick={() => setShowRoleSelection(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {requiredRole && (
        <div className="text-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {requiredRole === 'business' ? 'Business Owner Login' : 'Customer Login'}
          </h3>
          <p className="text-gray-600">
            {requiredRole === 'business' 
              ? 'Sign in to manage your business and products'
              : 'Sign in to save favorites and get personalized recommendations'
            }
          </p>
        </div>
      )}
      
      <button
        onClick={() => requiredRole ? login(requiredRole) : setShowRoleSelection(true)}
        disabled={loading}
        className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>

      {error && (
        <div className="text-red-600 text-sm text-center max-w-md">{error}</div>
      )}
    </div>
  );
}