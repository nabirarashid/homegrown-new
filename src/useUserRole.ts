// src/hooks/useUserRole.ts
import { useEffect, useState, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

type UserRole = "business" | "customer" | null;

export default function useUserRole() {
  const [user, loading] = useAuthState(auth);
  const [role, setRole] = useState<UserRole>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const fetchUserRole = useCallback(async () => {
    if (user) {
      setRoleLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("User data from database:", userData);
          const userRole = userData.role as UserRole;
          console.log("Setting role to:", userRole);
          setRole(userRole);
        } else {
          console.log("User document does not exist");
          setRole(null);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      }
      setRoleLoading(false);
    } else {
      // User is null (signed out) - immediately clear role
      setRole(null);
      setRoleLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Reset roleLoading when user changes
    if (loading) {
      setRoleLoading(true);
    } else {
      fetchUserRole();
    }
  }, [user, loading, fetchUserRole]);

  // Function to manually refresh the role
  const refreshRole = useCallback(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  return { user, loading: loading || roleLoading, role, refreshRole };
}
