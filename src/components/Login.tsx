// src/components/Login.tsx
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
  const [selectedRole, setSelectedRole] = useState<"business" | "customer">(
    "customer"
  );

  const handleLogin = async (role?: "business" | "customer") => {
    setLoading(true);
    setError(null);
    const finalRole = role || selectedRole;

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
        });

        // Create role-specific document
        const collectionName =
          finalRole === "business" ? "businesses" : "customers";
        await setDoc(doc(db, collectionName, user.uid), {
          uid: user.uid,
          // ...other role-specific fields
        });
      } else {
        // Existing user - update their role if it's different
        const currentRole = userDoc.data().role;
        if (currentRole !== finalRole) {
          await setDoc(
            doc(db, "users", user.uid),
            {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: finalRole,
              updatedAt: new Date(),
            },
            { merge: true }
          );

          // Create role-specific document if it doesn't exist
          const collectionName =
            finalRole === "business" ? "businesses" : "customers";
          await setDoc(
            doc(db, collectionName, user.uid),
            {
              uid: user.uid,
              // ...other role-specific fields
            },
            { merge: true }
          );
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

  // Role selection screen
  if (showRoleSelection) {
    return (
      <div className="flex flex-col items-center gap-6 p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Choose Your Account Type
          </h3>
          <p className="text-sm text-gray-600">
            This determines what features you can access
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
          <button
            onClick={() => {
              setSelectedRole("customer");
              handleLogin("customer");
            }}
            disabled={loading}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-rose-500 hover:bg-rose-50 transition-colors text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                👤
              </div>
              <h4 className="font-medium text-gray-900">Customer</h4>
            </div>
            <p className="text-sm text-gray-600">
              Browse businesses, save favorites
            </p>
          </button>

          <button
            onClick={() => {
              setSelectedRole("business");
              handleLogin("business");
            }}
            disabled={loading}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-rose-500 hover:bg-rose-50 transition-colors text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                🏢
              </div>
              <h4 className="font-medium text-gray-900">Business</h4>
            </div>
            <p className="text-sm text-gray-600">
              Add your business and products
            </p>
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

  // Standard login screen
  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {requiredRole && (
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {requiredRole === "business" ? "Business Login" : "Customer Login"}
          </h3>
          <p className="text-gray-600">
            {requiredRole === "business"
              ? "Sign in to manage your business"
              : "Sign in to browse local businesses"}
          </p>
        </div>
      )}

      <button
        onClick={() => handleLogin(requiredRole)}
        disabled={loading}
        className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
