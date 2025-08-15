import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Edit3, Package, Building, Award, Save, X, Trash2 } from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Business {
  id: string;
  businessName: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  hours: string;
  email: string;
  ownerId?: string;
  status: "pending" | "active" | "claimed";
  claimedBy?: string;
  claimedAt?: Date | null;
}

interface Product {
  id: string;
  productName: string;
  description?: string;
  productPrice: number;
  category?: string;
  sustainabilityTags?: string[];
  inStock?: boolean;
  productImage?: string;
  businessId?: string;
  businessName?: string;
  ownerId?: string;
  status?: "pending" | "active";
  createdAt?: Date;
}

const BusinessDashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [claimedBusiness, setClaimedBusiness] = useState<Business | null>(null);
  const [availableBusinesses, setAvailableBusinesses] = useState<Business[]>(
    []
  );
  const [businessProducts, setBusinessProducts] = useState<Product[]>([]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );
  const [userPendingClaims, setUserPendingClaims] = useState<string[]>([]); // Track user's pending claims
  
  // Product editing states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editedProductData, setEditedProductData] = useState({
    productName: "",
    description: "",
    productPrice: 0,
    category: "",
    inStock: true,
  });

  // Claim form data
  const [claimData, setClaimData] = useState({
    message: "",
    businessEmail: "",
    verificationDocs: null as File | null,
  });

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        console.log("BusinessDashboard - Fetching data for user:", user.uid);
        
        // Check for claimed business
        const claimedQuery = query(
          collection(db, "businesses"),
          where("claimedBy", "==", user.uid),
          where("status", "==", "claimed")
        );
        const claimedSnapshot = await getDocs(claimedQuery);
        console.log("BusinessDashboard - Found claimed businesses:", claimedSnapshot.docs.length);
        
        // Check for user's pending claims
        const userClaimsQuery = query(
          collection(db, "businessClaimRequests"),
          where("claimedBy", "==", user.uid)
        );
        const userClaimsSnapshot = await getDocs(userClaimsQuery);
        const pendingClaimIds = userClaimsSnapshot.docs.map(doc => doc.data().businessId);
        setUserPendingClaims(pendingClaimIds);
        console.log("BusinessDashboard - User pending claims:", pendingClaimIds);
        
        if (!claimedSnapshot.empty) {
          const businessData = claimedSnapshot.docs[0].data() as Business;
          businessData.id = claimedSnapshot.docs[0].id;
          console.log("BusinessDashboard - Claimed business data:", businessData);
          
          setClaimedBusiness(businessData);
          // Fetch products for this business
          console.log("BusinessDashboard - Fetching products for business ID:", businessData.id);
          
          // Try different query strategies to find products
          console.log("BusinessDashboard - Trying businessId query...");
          const productsQuery = query(
            collection(db, "products"),
            where("businessId", "==", businessData.id)
          );
          const productsSnapshot = await getDocs(productsQuery);
          console.log("BusinessDashboard - Found products with businessId:", productsSnapshot.docs.length);
          
          // Also try businessName query
          console.log("BusinessDashboard - Trying businessName query...");
          const productsNameQuery = query(
            collection(db, "products"),
            where("businessName", "==", businessData.businessName)
          );
          const productsNameSnapshot = await getDocs(productsNameQuery);
          console.log("BusinessDashboard - Found products with businessName:", productsNameSnapshot.docs.length);
          
          // Also try ownerId query
          console.log("BusinessDashboard - Trying ownerId query...");
          const productsOwnerQuery = query(
            collection(db, "products"),
            where("ownerId", "==", user.uid)
          );
          const productsOwnerSnapshot = await getDocs(productsOwnerQuery);
          console.log("BusinessDashboard - Found products with ownerId:", productsOwnerSnapshot.docs.length);
          
          // Let's see all products and their structure
          console.log("BusinessDashboard - Getting all products to debug...");
          const allProductsSnapshot = await getDocs(collection(db, "products"));
          console.log("BusinessDashboard - Total products in collection:", allProductsSnapshot.docs.length);
          allProductsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`Product: ${data.productName || data.name}, BusinessId: ${data.businessId}, BusinessName: ${data.businessName}, OwnerId: ${data.ownerId}, Status: ${data.status}`);
          });
          
          // Use the query that actually returns results
          let finalProductsData: Product[] = [];
          if (productsSnapshot.docs.length > 0) {
            finalProductsData = productsSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Product[];
          } else if (productsNameSnapshot.docs.length > 0) {
            finalProductsData = productsNameSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Product[];
          } else if (productsOwnerSnapshot.docs.length > 0) {
            finalProductsData = productsOwnerSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Product[];
          }
          
          console.log("BusinessDashboard - Final products data:", finalProductsData.length);
          setBusinessProducts(finalProductsData);
          
          // Clear available businesses since user has claimed business
          setAvailableBusinesses([]);
        } else if (pendingClaimIds.length > 0) {
          // User has pending claims, don't show available businesses
          console.log("BusinessDashboard - User has pending claims, not showing available businesses");
          setClaimedBusiness(null);
          setAvailableBusinesses([]);
        } else {
          console.log("BusinessDashboard - No claimed business found, fetching available businesses");
          setClaimedBusiness(null);
          
          // Get all pending claim requests to filter out businesses with pending claims
          const allPendingClaimsSnapshot = await getDocs(collection(db, "businessClaimRequests"));
          const businessesWithPendingClaims = new Set(
            allPendingClaimsSnapshot.docs.map(doc => doc.data().businessId)
          );
          console.log("BusinessDashboard - Businesses with pending claims:", businessesWithPendingClaims.size);
          
          // Show all businesses that are unclaimed or active but not claimed
          const businessesSnapshot = await getDocs(collection(db, "businesses"));
          console.log("BusinessDashboard - Total businesses found:", businessesSnapshot.docs.length);
          
          const availableData = businessesSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Business))
            .filter((b) => {
              // Show if status is 'active' and not claimed and doesn't have pending claims
              const status = b.status || "active";
              const hasPendingClaim = businessesWithPendingClaims.has(b.id);
              const isAvailable = status === "active" && !b.ownerId && !b.claimedBy && !hasPendingClaim;
              console.log(`Business ${b.businessName}: status=${status}, ownerId=${b.ownerId}, claimedBy=${b.claimedBy}, hasPendingClaim=${hasPendingClaim}, available=${isAvailable}`);
              return isAvailable;
            });
          console.log("BusinessDashboard - Available businesses after filtering:", availableData.length);
          setAvailableBusinesses(availableData);
        }
      } catch (error) {
        console.error("Error fetching business data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBusinessData();
    }
  }, [user]); // Only depend on user

  // Product editing functions
  const startEditingProduct = (product: Product) => {
    setEditingProduct(product);
    setEditedProductData({
      productName: product.productName || "",
      description: product.description || "",
      productPrice: product.productPrice || 0,
      category: product.category || "",
      inStock: product.inStock !== false,
    });
  };

  const cancelEditingProduct = () => {
    setEditingProduct(null);
    setEditedProductData({
      productName: "",
      description: "",
      productPrice: 0,
      category: "",
      inStock: true,
    });
  };

  const saveProductChanges = async () => {
    if (!editingProduct || !user) return;

    try {
      const productRef = doc(db, "products", editingProduct.id);
      await updateDoc(productRef, {
        productName: editedProductData.productName,
        description: editedProductData.description,
        productPrice: editedProductData.productPrice,
        category: editedProductData.category,
        inStock: editedProductData.inStock,
        updatedAt: new Date(),
      });

      // Update local state
      setBusinessProducts(prev => 
        prev.map(p => 
          p.id === editingProduct.id 
            ? { 
                ...p, 
                ...editedProductData,
              }
            : p
        )
      );

      alert("Product updated successfully!");
      cancelEditingProduct();
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product. Please try again.");
    }
  };

  const deleteProduct = async (productId: string, productName: string) => {
    if (!user) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      // Delete from products collection
      await deleteDoc(doc(db, "products", productId));

      // Update local state
      setBusinessProducts(prev => prev.filter(p => p.id !== productId));

      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product. Please try again.");
    }
  };

  // Separate function for manual refresh
  const refreshBusinessData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      console.log("BusinessDashboard - Manual refresh for user:", user.uid);
      
      // Check for claimed business
      const claimedQuery = query(
        collection(db, "businesses"),
        where("claimedBy", "==", user.uid),
        where("status", "==", "claimed")
      );
      const claimedSnapshot = await getDocs(claimedQuery);
      
      // Check for user's pending claims
      const userClaimsQuery = query(
        collection(db, "businessClaimRequests"),
        where("claimedBy", "==", user.uid)
      );
      const userClaimsSnapshot = await getDocs(userClaimsQuery);
      const pendingClaimIds = userClaimsSnapshot.docs.map(doc => doc.data().businessId);
      setUserPendingClaims(pendingClaimIds);
      
      if (!claimedSnapshot.empty) {
        const businessData = claimedSnapshot.docs[0].data() as Business;
        businessData.id = claimedSnapshot.docs[0].id;
        setClaimedBusiness(businessData);
        
        // Fetch products for this business
        console.log("BusinessDashboard - Manual refresh - Fetching products for business ID:", businessData.id);
        
        // Try different query strategies
        const productsQuery = query(
          collection(db, "products"),
          where("businessId", "==", businessData.id)
        );
        const productsSnapshot = await getDocs(productsQuery);
        
        const productsNameQuery = query(
          collection(db, "products"),
          where("businessName", "==", businessData.businessName)
        );
        const productsNameSnapshot = await getDocs(productsNameQuery);
        
        const productsOwnerQuery = query(
          collection(db, "products"),
          where("ownerId", "==", user.uid)
        );
        const productsOwnerSnapshot = await getDocs(productsOwnerQuery);
        
        // Use the query that returns results
        let finalProductsData: Product[] = [];
        if (productsSnapshot.docs.length > 0) {
          finalProductsData = productsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
        } else if (productsNameSnapshot.docs.length > 0) {
          finalProductsData = productsNameSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
        } else if (productsOwnerSnapshot.docs.length > 0) {
          finalProductsData = productsOwnerSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
        }
        
        console.log("BusinessDashboard - Manual refresh - Final products:", finalProductsData.length);
        setBusinessProducts(finalProductsData);
        setAvailableBusinesses([]);
      } else if (pendingClaimIds.length > 0) {
        setClaimedBusiness(null);
        setAvailableBusinesses([]);
      } else {
        setClaimedBusiness(null);
        
        // Get all pending claim requests to filter out businesses with pending claims
        const allPendingClaimsSnapshot = await getDocs(collection(db, "businessClaimRequests"));
        const businessesWithPendingClaims = new Set(
          allPendingClaimsSnapshot.docs.map(doc => doc.data().businessId)
        );
        
        // Show all businesses that are unclaimed or active but not claimed
        const businessesSnapshot = await getDocs(collection(db, "businesses"));
        const availableData = businessesSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Business))
          .filter((b) => {
            const status = b.status || "active";
            const hasPendingClaim = businessesWithPendingClaims.has(b.id);
            return status === "active" && !b.ownerId && !b.claimedBy && !hasPendingClaim;
          });
        setAvailableBusinesses(availableData);
      }
    } catch (error) {
      console.error("Error refreshing business data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleClaimBusiness = async (business: Business) => {
    setSelectedBusiness(business);
    setShowClaimForm(true);
  };

  const submitClaimRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedBusiness) return;

    try {
      setLoading(true);

      // Upload verification documents if provided
      let docsUrl = "";
      if (claimData.verificationDocs) {
        const storage = getStorage();
        const docsRef = ref(
          storage,
          `verification/${user.uid}_${Date.now()}_${
            claimData.verificationDocs.name
          }`
        );
        const snapshot = await uploadBytes(docsRef, claimData.verificationDocs);
        docsUrl = await getDownloadURL(snapshot.ref);
      }

      // Submit claim request
      await addDoc(collection(db, "businessClaimRequests"), {
        businessId: selectedBusiness.id,
        businessName: selectedBusiness.businessName,
        claimedBy: user.uid,
        claimerEmail: user.email,
        claimerName: user.displayName,
        message: claimData.message,
        businessEmail: claimData.businessEmail,
        verificationDocs: docsUrl,
        status: "pending",
        createdAt: new Date(),
      });

      alert("Claim request submitted! We'll review and contact you soon.");
      setShowClaimForm(false);
      setSelectedBusiness(null);
      setClaimData({
        message: "",
        businessEmail: "",
        verificationDocs: null,
      });
      
      // Refresh the business data to remove the claimed business from available list
      refreshBusinessData();
    } catch (error) {
      console.error("Error submitting claim:", error);
      alert("Error submitting claim request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Show pending claims status
  if (userPendingClaims.length > 0 && !claimedBusiness) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <div className="text-2xl">⏳</div>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Claim Pending Approval
          </h3>
          <p className="text-gray-600">
            Your business claim request has been submitted and is awaiting admin review.
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="text-yellow-800 font-medium mb-2">What happens next?</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Our team will review your claim request</li>
            <li>• We may contact you for additional verification</li>
            <li>• You'll be notified once your claim is approved</li>
            <li>• After approval, you'll have full access to manage your business</li>
          </ul>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => {
              // Refresh to check for updates
              refreshBusinessData();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Check Status
          </button>
        </div>
      </div>
    );
  }

  // Show claim form
  if (showClaimForm && selectedBusiness) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <Award className="w-12 h-12 mx-auto text-rose-600 mb-2" />
          <h3 className="text-xl font-semibold text-gray-900">
            Claim "{selectedBusiness.businessName}"
          </h3>
          <p className="text-gray-600">
            Provide verification to claim ownership of this business
          </p>
        </div>

        <form onSubmit={submitClaimRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Email *
            </label>
            <input
              type="email"
              required
              value={claimData.businessEmail}
              onChange={(e) =>
                setClaimData({ ...claimData, businessEmail: e.target.value })
              }
              placeholder="Your official business email"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This should match your business domain if possible
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Message *
            </label>
            <textarea
              rows={4}
              required
              value={claimData.message}
              onChange={(e) =>
                setClaimData({ ...claimData, message: e.target.value })
              }
              placeholder="Explain why you should own this business. Include details about your role, business license info, etc."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Documents (Optional)
            </label>
            <input
              type="file"
              onChange={(e) =>
                setClaimData({
                  ...claimData,
                  verificationDocs: e.target.files?.[0] || null,
                })
              }
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Business license, utility bill, official documents, etc.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowClaimForm(false);
                setSelectedBusiness(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Claim"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Show claimed business dashboard
  if (claimedBusiness) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Business Info Header */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {claimedBusiness.businessName}
                </h2>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                  CLAIMED
                </span>
              </div>
              <p className="text-gray-600">{claimedBusiness.description}</p>
              <div className="text-sm text-gray-500 mt-2">
                <span>📧 {claimedBusiness.email}</span>
                {claimedBusiness.phone && (
                  <span className="ml-4">📞 {claimedBusiness.phone}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {businessProducts.length}
              </div>
              <div className="text-sm text-gray-500">Active Products</div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Your Products
          </h3>

          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can edit existing products, but new
              products still need admin approval.
            </p>
          </div>

          {businessProducts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                No Products Yet
              </h4>
              <p className="text-gray-600 mb-4">
                Products added to your business will appear here once approved
                by admin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businessProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {editingProduct?.id === product.id ? (
                    // Edit form
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Name
                        </label>
                        <input
                          type="text"
                          value={editedProductData.productName}
                          onChange={(e) =>
                            setEditedProductData({
                              ...editedProductData,
                              productName: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editedProductData.productPrice}
                          onChange={(e) =>
                            setEditedProductData({
                              ...editedProductData,
                              productPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={editedProductData.description}
                          onChange={(e) =>
                            setEditedProductData({
                              ...editedProductData,
                              description: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editedProductData.inStock}
                            onChange={(e) =>
                              setEditedProductData({
                                ...editedProductData,
                                inStock: e.target.checked,
                              })
                            }
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">In Stock</span>
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={saveProductChanges}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditingProduct}
                          className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal view
                    <>
                      {product.productImage && (
                        <img
                          src={product.productImage}
                          alt={product.productName || "Product"}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}

                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {product.productName || "Unnamed Product"}
                        </h4>
                        <span className="text-lg font-bold text-green-600">
                          ${(product.productPrice || 0).toFixed(2)}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description || "No description available"}
                      </p>

                      {/* Sustainability Tags */}
                      {product.sustainabilityTags &&
                        product.sustainabilityTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {product.sustainabilityTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            product.inStock !== false
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.inStock !== false ? "In Stock" : "Out of Stock"}
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditingProduct(product)}
                            className="p-1 text-gray-600 hover:text-rose-600"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id, product.productName)}
                            className="p-1 text-gray-600 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show available businesses to claim
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <Building className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Claim Your Business
        </h3>
        <p className="text-gray-600">
          Find and claim your business from the approved listings below
        </p>
      </div>

      {availableBusinesses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No businesses available to claim yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableBusinesses.map((business) => (
            <div
              key={business.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {business.businessName}
              </h4>
              <p className="text-gray-600 text-sm mb-3">
                {business.description}
              </p>

              <div className="text-sm text-gray-500 mb-4">
                <div>📍 {business.address}</div>
                <div>🏷️ {business.category}</div>
                {business.phone && <div>📞 {business.phone}</div>}
              </div>

              <button
                onClick={() => handleClaimBusiness(business)}
                className="w-full bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
              >
                Claim This Business
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessDashboard;
