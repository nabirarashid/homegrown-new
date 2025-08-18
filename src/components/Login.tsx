import { auth, provider, db } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useState } from "react";

interface LoginProps {
  requiredRole?: "business" | "customer";
  onLoginSuccess?: (role: "business" | "customer") => void;
}

export default function Login({ requiredRole, onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(!requiredRole);

  const handleLogin = async (role?: "business" | "customer") => {
    setLoading(true);
    setError(null);
    const finalRole = role || "customer"; // Default to customer for community contributors

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        // New user - create document with their selected role
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: finalRole,
          createdAt: new Date(),
          contributionCount: 0, // Track community contributions
        });

        // Create role-specific document
        const collectionName = finalRole === "business" ? "businessUsers" : "customerUsers";
        await setDoc(doc(db, collectionName, user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          contributionCount: 0,
          joinedAt: new Date(),
          // Business-specific fields
          ...(finalRole === "business" && {
            claimedBusinesses: [], // Array of business IDs they've claimed
            pendingClaims: [], // Array of pending claim request IDs
          }),
          // Customer-specific fields  
          ...(finalRole === "customer" && {
            businessesAdded: 0, // Count of businesses they've submitted
            productsAdded: 0, // Count of products they've submitted
            helpfulVotes: 0, // Future: community voting system
          }),
        });
      } else {
        // Existing user - update their role if different (allow role switching)
        const currentRole = userDoc.data().role;
        if (currentRole !== finalRole) {
          await setDoc(
            doc(db, "users", user.uid),
            {
              role: finalRole,
              updatedAt: new Date(),
            },
            { merge: true }
          );

          // Create new role-specific document if needed
          const newCollectionName = finalRole === "business" ? "businessUsers" : "customerUsers";
          const newUserDoc = await getDoc(doc(db, newCollectionName, user.uid));
          
          if (!newUserDoc.exists()) {
            await setDoc(doc(db, newCollectionName, user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              contributionCount: 0,
              roleChangedAt: new Date(),
              // Add role-specific default fields
              ...(finalRole === "business" && {
                claimedBusinesses: [],
                pendingClaims: [],
              }),
              ...(finalRole === "customer" && {
                businessesAdded: 0,
                productsAdded: 0,
                helpfulVotes: 0,
              }),
            });
          }
        }
      }

      onLoginSuccess?.(finalRole);
    } catch (err) {
      setError("Failed to sign in. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Role selection screen (shown when no specific role required)
  if (showRoleSelection) {
    return (
      <div className="flex flex-col items-center gap-6 p-6 max-w-2xl mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Welcome to the Community! 🌱
          </h3>
          <p className="text-gray-600 mb-4">
            Choose how you'd like to participate. Don't worry - you can always change this later!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <button
            onClick={() => handleLogin("customer")}
            disabled={loading}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-2xl">🌟</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900">Community Explorer</h4>
            </div>
            <p className="text-gray-600 mb-4">
              Perfect for discovering and contributing to local sustainable businesses
            </p>
            <div className="text-sm text-gray-500">
              <p className="flex items-center gap-2 mb-1">
                ✅ Add businesses and products to the platform
              </p>
              <p className="flex items-center gap-2 mb-1">
                ✅ Help build the community database
              </p>
              <p className="flex items-center gap-2">
                ✅ Discover sustainable local options
              </p>
            </div>
          </button>

          <button
            onClick={() => handleLogin("business")}
            disabled={loading}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left disabled:opacity-50 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">🏪</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900">Business Owner</h4>
            </div>
            <p className="text-gray-600 mb-4">
              Own a business? Claim your listing and manage your presence
            </p>
            <div className="text-sm text-gray-500">
              <p className="flex items-center gap-2 mb-1">
                ✅ Claim your business listing
              </p>
              <p className="flex items-center gap-2 mb-1">
                ✅ Add and manage your products
              </p>
              <p className="flex items-center gap-2">
                ✅ Update business information
              </p>
            </div>
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>
            By signing up, you're helping build a community-driven platform for sustainable local businesses.
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <span>Setting up your account...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Standard login screen (when specific role is required)
  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {requiredRole === "business" ? "Business Login" : "Join the Community"}
        </h3>
        <p className="text-gray-600">
          {requiredRole === "business"
            ? "Sign in to claim and manage your business listings"
            : "Sign in to start contributing to our sustainable business community"}
        </p>
      </div>

      <div className="w-full">
        <button
          onClick={() => handleLogin(requiredRole)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 group"
        >
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium">
              {loading ? "Signing in..." : "Continue with Google"}
            </span>
          </div>
        </button>
      </div>

      {error && (
        <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="text-center text-xs text-gray-500">
        <p>
          {requiredRole === "business" 
            ? "Don't own a business? You can still join as a community explorer to add businesses and products!"
            : "Own a business? You can claim listings and manage them after signing up!"
          }
        </p>
      </div>
    </div>
  );
}