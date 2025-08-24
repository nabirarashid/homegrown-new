import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  setDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Check,
  X,
  Building,
  Package,
  Award,
  ExternalLink,
  Search,
} from "lucide-react";
interface PendingBusiness {
  id: string;
  businessName: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  hours: string;
  location: { address: string; lat: number; lng: number };
  submittedBy: string;
  submitterEmail: string;
  submitterName: string;
  status: "pending";
  createdAt: { toDate: () => Date };
  source: string;
}

interface PendingProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sustainabilityTags: string[];
  inStock: boolean;
  productImage: string;
  businessId: string;
  businessName: string;
  submittedBy: string;
  submitterEmail: string;
  submitterName: string;
  submittedByOwner?: boolean;
  status: "pending";
  createdAt: { toDate: () => Date };
}

interface ClaimRequest {
  id: string;
  businessId: string;
  businessName: string;
  claimedBy: string;
  claimerEmail: string;
  claimerName: string;
  message: string;
  businessEmail: string;
  verificationDocs: string;
  status: "pending";
  createdAt: { toDate: () => Date };
}

const AdminDashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "businesses" | "products" | "claims"
  >("businesses");
  const [searchTerm, setSearchTerm] = useState("");

  const [pendingBusinesses, setPendingBusinesses] = useState<PendingBusiness[]>(
    []
  );
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);

  useEffect(() => {
    if (user) {
      // Debug: Log user info for security check
      console.log("Admin component - User email:", user.email);
      console.log(
        "Admin component - Is admin?",
        user.email === "nabira.per1701@gmail.com"
      );
      fetchAllPendingItems();
    }
  }, [user]);

  // Safety check: ensure only admin can access
  const isAdmin = user?.email === "nabira.per1701@gmail.com";

  if (user && !isAdmin) {
    console.error(
      "SECURITY: Non-admin user accessed admin dashboard:",
      user.email
    );
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-red-500 mb-4">
          <span className="text-4xl">🚫</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Access Restricted
        </h3>
        <p className="text-gray-600">
          This dashboard is only available to administrators.
        </p>
      </div>
    );
  }

  const fetchAllPendingItems = async () => {
    try {
      // Fetch pending businesses
      const businessesQuery = query(
        collection(db, "pendingBusinesses"),
        orderBy("createdAt", "desc")
      );
      const businessesSnapshot = await getDocs(businessesQuery);
      const businessesData = businessesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PendingBusiness[];
      setPendingBusinesses(businessesData);

      // Fetch pending products
      const productsQuery = query(
        collection(db, "pendingProducts"),
        orderBy("createdAt", "desc")
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map((doc) => {
        const data = doc.data();
        // Map productName to name for compatibility
        return {
          id: doc.id,
          ...data,
          name: data.productName || data.name || "Unnamed Product",
          price:
            typeof data.productPrice === "number"
              ? data.productPrice
              : data.price,
        };
      }) as PendingProduct[];
      setPendingProducts(productsData);

      // Fetch claim requests
      const claimsQuery = query(
        collection(db, "businessClaimRequests"),
        where("status", "==", "pending")
      );
      const claimsSnapshot = await getDocs(claimsQuery);
      const claimsData = claimsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ClaimRequest[];
      setClaimRequests(claimsData);
    } catch (error) {
      console.error("Error fetching pending items:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveBusiness = async (business: PendingBusiness) => {
    try {
      setLoading(true);

      // Move to main businesses collection
      await setDoc(doc(db, "businesses", business.id), {
        ...business,
        status: "active",
        approvedAt: new Date(),
        approvedBy: user?.uid,
      });

      // Remove from pending
      await deleteDoc(doc(db, "pendingBusinesses", business.id));

      // Note: Could update contributor's count here if needed
      // const contributorDoc = doc(db, "customers", business.submittedBy);

      alert("Business approved and added to active listings!");
      await fetchAllPendingItems();
    } catch (error) {
      console.error("Error approving business:", error);
      alert("Error approving business. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const rejectBusiness = async (businessId: string) => {
    if (
      !confirm(
        "Are you sure you want to reject this business? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await deleteDoc(doc(db, "pendingBusinesses", businessId));
      alert("Business rejected and removed.");
      await fetchAllPendingItems();
    } catch (error) {
      console.error("Error rejecting business:", error);
      alert("Error rejecting business. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const approveProduct = async (product: PendingProduct) => {
    try {
      setLoading(true);

      // Move to main products collection
      await setDoc(doc(db, "products", product.id), {
        ...product,
        status: "active",
        approvedAt: new Date(),
        approvedBy: user?.uid,
      });

      // Remove from pending
      await deleteDoc(doc(db, "pendingProducts", product.id));

      alert("Product approved and added to active listings!");
      await fetchAllPendingItems();
    } catch (error) {
      console.error("Error approving product:", error);
      alert("Error approving product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const rejectProduct = async (productId: string) => {
    if (
      !confirm(
        "Are you sure you want to reject this product? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await deleteDoc(doc(db, "pendingProducts", productId));
      alert("Product rejected and removed.");
      await fetchAllPendingItems();
    } catch (error) {
      console.error("Error rejecting product:", error);
      alert("Error rejecting product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const approveClaim = async (claim: ClaimRequest) => {
    if (!user) return;

    try {
      console.log("Admin - Approving claim:", claim);

      // Update the business document to mark as claimed
      const businessRef = doc(db, "businesses", claim.businessId);
      await updateDoc(businessRef, {
        status: "claimed",
        ownerId: claim.claimedBy, // Set the owner ID
        claimedBy: claim.claimedBy, // Also set claimedBy for query compatibility
        claimedAt: new Date().toISOString(),
        approvedBy: user.uid,
        approvedAt: new Date().toISOString(),
      });

      console.log("Admin - Updated business document");

      // Update the user's role to business
      const userRef = doc(db, "users", claim.claimedBy);
      await updateDoc(userRef, {
        role: "business",
        businessId: claim.businessId,
        updatedAt: new Date().toISOString(),
      });

      console.log("Admin - Updated user role");

      // Delete the claim request
      await deleteDoc(doc(db, "businessClaimRequests", claim.id));

      console.log("Admin - Deleted claim request");

      // Remove from local state
      setClaimRequests((prev) => prev.filter((c) => c.id !== claim.id));

      console.log("Admin - Claim approval complete");
      alert("Claim approved successfully!");
    } catch (error) {
      console.error("Error approving claim:", error);
      alert("Error approving claim. Please try again.");
    }
  };

  const rejectClaim = async (claimId: string) => {
    if (
      !confirm(
        "Are you sure you want to reject this claim? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await updateDoc(doc(db, "businessClaimRequests", claimId), {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: user?.uid,
      });
      alert("Claim rejected.");
      await fetchAllPendingItems();
    } catch (error) {
      console.error("Error rejecting claim:", error);
      alert("Error rejecting claim. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = pendingBusinesses.filter(
    (business) =>
      (business.businessName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (business.category || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (business.submitterName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const filteredProducts = pendingProducts.filter(
    (product) =>
      (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.businessName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (product.submitterName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const filteredClaims = claimRequests.filter(
    (claim) =>
      (claim.businessName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (claim.claimerName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Approve community contributions</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Pending Businesses
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {pendingBusinesses.length}
              </p>
            </div>
            <Building className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Pending Products
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {pendingProducts.length}
              </p>
            </div>
            <Package className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-amber-900">
                Claim Requests
              </h3>
              <p className="text-3xl font-bold text-amber-600">
                {claimRequests.length}
              </p>
            </div>
            <Award className="w-12 h-12 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            {
              id: "businesses",
              label: "Businesses",
              count: pendingBusinesses.length,
            },
            {
              id: "products",
              label: "Products",
              count: pendingProducts.length,
            },
            { id: "claims", label: "Claims", count: claimRequests.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as "businesses" | "products" | "claims")
              }
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-rose-500 text-rose-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-200 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === "businesses" && (
        <div className="space-y-4">
          {filteredBusinesses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Building className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No pending businesses</p>
            </div>
          ) : (
            filteredBusinesses.map((business) => (
              <div
                key={business.id}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {business.businessName}
                    </h3>
                    <p className="text-gray-600 mb-3">{business.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                      <div>
                        <p>
                          <strong>Category:</strong> {business.category}
                        </p>
                        <p>
                          <strong>Address:</strong> {business.address}
                        </p>
                        {business.phone && (
                          <p>
                            <strong>Phone:</strong> {business.phone}
                          </p>
                        )}
                        {business.website && (
                          <p>
                            <strong>Website:</strong>{" "}
                            <a
                              href={business.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {business.website}
                            </a>
                          </p>
                        )}
                      </div>
                      <div>
                        <p>
                          <strong>Submitted by:</strong>{" "}
                          {business.submitterName}
                        </p>
                        <p>
                          <strong>Email:</strong> {business.submitterEmail}
                        </p>
                        <p>
                          <strong>Submitted:</strong>{" "}
                          {business.createdAt.toDate().toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Source:</strong> {business.source}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => approveBusiness(business)}
                      className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => rejectBusiness(business.id)}
                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                      title="Reject"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No pending products</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4 flex-1">
                    {product.productImage && (
                      <img
                        src={product.productImage}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        <span className="text-2xl font-bold text-green-600">
                          $
                          {typeof product.price === "number"
                            ? product.price.toFixed(2)
                            : "N/A"}
                        </span>
                        {product.submittedByOwner && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Owner Submitted
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 mb-3">
                        {product.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                        <div>
                          <p>
                            <strong>Business:</strong> {product.businessName}
                          </p>
                          <p>
                            <strong>Category:</strong> {product.category}
                          </p>
                          <p>
                            <strong>In Stock:</strong>{" "}
                            {product.inStock ? "Yes" : "No"}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Submitted by:</strong>{" "}
                            {product.submitterName}
                          </p>
                          <p>
                            <strong>Email:</strong> {product.submitterEmail}
                          </p>
                          <p>
                            <strong>Submitted:</strong>{" "}
                            {product.createdAt.toDate().toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {product.sustainabilityTags &&
                        product.sustainabilityTags.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-500 mb-1">
                              <strong>Sustainability Tags:</strong>
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {product.sustainabilityTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => approveProduct(product)}
                      className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => rejectProduct(product.id)}
                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                      title="Reject"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "claims" && (
        <div className="space-y-4">
          {filteredClaims.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Award className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No pending claims</p>
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Claim for "{claim.businessName}"
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                      <div>
                        <p>
                          <strong>Claimant:</strong> {claim.claimerName}
                        </p>
                        <p>
                          <strong>Email:</strong> {claim.claimerEmail}
                        </p>
                        <p>
                          <strong>Business Email:</strong> {claim.businessEmail}
                        </p>
                        <p>
                          <strong>Submitted:</strong>{" "}
                          {claim.createdAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Verification Message:
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-700">{claim.message}</p>
                      </div>
                    </div>

                    {claim.verificationDocs && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Verification Documents:
                        </h4>
                        <a
                          href={claim.verificationDocs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Documents
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => approveClaim(claim)}
                      className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                      title="Approve Claim"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => rejectClaim(claim.id)}
                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                      title="Reject Claim"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
