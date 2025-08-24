import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useDropzone } from "react-dropzone";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface BusinessFormProps {
  onClose: () => void;
}

const BusinessForm: React.FC<BusinessFormProps> = ({ onClose }) => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [businessImageFile, setBusinessImageFile] = useState<File | null>(null);
  const [businessImageUrl, setBusinessImageUrl] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  interface Business {
    id: string;
    businessName: string;
    status: "approved" | "pending";
    description?: string;
    category?: string;
    address?: string;
    phone?: string;
    website?: string;
    hours?: string;
  }

  const [existingBusinesses, setExistingBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [activeTab, setActiveTab] = useState<"business" | "product">(
    "business"
  );

  const [businessData, setBusinessData] = useState({
    businessName: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    website: "",
    hours: "",
    tags: [] as string[],
  });

  const [productData, setProductData] = useState({
    productName: "",
    description: "",
    productPrice: "",
    category: "",
    inStock: true,
    sustainabilityTags: [] as string[],
    businessId: "",
  });

  const onDrop = (acceptedFiles: File[]) => {
    setImageFile(acceptedFiles[0]);
  };
  const onBusinessImageDrop = (acceptedFiles: File[]) => {
    setBusinessImageFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });
  const {
    getRootProps: getBusinessImageRootProps,
    getInputProps: getBusinessImageInputProps,
    isDragActive: isBusinessImageDragActive,
  } = useDropzone({
    onDrop: onBusinessImageDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  // Fetch existing businesses for product association
  const fetchExistingBusinesses = useCallback(async () => {
    setLoadingBusinesses(true);
    try {
      // Fetch approved businesses (publicly readable)
      const approvedQuery = await getDocs(
        query(collection(db, "businesses"), orderBy("businessName"))
      );

      const approved = approvedQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: "approved" as const,
      })) as Business[];

      // Try to fetch pending businesses (only works if user is admin)
      let pending: Business[] = [];
      try {
        const pendingQuery = await getDocs(
          query(collection(db, "pendingBusinesses"), orderBy("businessName"))
        );

        pending = pendingQuery.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          status: "pending" as const,
        })) as Business[];
      } catch {
        // This is expected for non-admin users
      }

      const allBusinesses = [...approved, ...pending];
      setExistingBusinesses(allBusinesses);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoadingBusinesses(false);
    }
  }, []);

  useEffect(() => {
    fetchExistingBusinesses();
  }, [fetchExistingBusinesses]);

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalBusinessImageUrl = "";
      if (businessImageFile) {
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `businessImages/${user?.uid || "anonymous"}_${Date.now()}_${
            businessImageFile.name
          }`
        );
        await uploadBytes(storageRef, businessImageFile);
        finalBusinessImageUrl = await getDownloadURL(storageRef);
      } else if (businessImageUrl.trim()) {
        finalBusinessImageUrl = businessImageUrl.trim();
      }

      // Add business to "pendingBusinesses" collection for admin approval
      const docRef = await addDoc(collection(db, "pendingBusinesses"), {
        ...businessData,
        image: finalBusinessImageUrl,
        tags: businessData.tags,
        location: {
          address: businessData.address,
          // Coordinates will be geocoded by the mapping service when needed
        },
        submittedBy: user?.uid || "anonymous",
        submitterEmail: user?.email || "anonymous",
        submitterName: user?.displayName || "anonymous",
        status: "pending",
        ownerId: null,
        claimedBy: null,
        createdAt: new Date(),
      });

      setSelectedBusinessId(docRef.id);
      alert("Business submitted for approval! Now you can add products to it.");
      setShowProductForm(true);

      // Reset business form
      setBusinessData({
      businessName: "",
      description: "",
      category: "",
      address: "",
      phone: "",
      website: "",
      hours: "",
      tags: [],
    });
      setBusinessImageFile(null);
      setBusinessImageUrl("");
    } catch (error) {
      console.error("Error submitting business:", error);
      alert("Error submitting business. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = "";
      if (imageFile) {
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `productImages/${user?.uid || "anonymous"}_${Date.now()}_${
            imageFile.name
          }`
        );
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      } else if (imageUrl.trim()) {
        finalImageUrl = imageUrl.trim();
      }

      // Determine which business to use based on current context
      const targetBusinessId = productData.businessId || selectedBusinessId;
      const targetBusinessName = productData.businessId
        ? existingBusinesses.find((b) => b.id === productData.businessId)
            ?.businessName || "Unknown Business"
        : businessData.businessName;

      if (!targetBusinessId) {
        alert("Please select a business first.");
        return;
      }

      // Add product to "pendingProducts" collection for admin approval
      await addDoc(collection(db, "pendingProducts"), {
        ...productData,
        businessId: targetBusinessId,
        businessName: targetBusinessName,
        productPrice: parseFloat(productData.productPrice) || 0,
        productImage: finalImageUrl,
        submittedBy: user?.uid || "anonymous",
        submitterEmail: user?.email || "anonymous",
        submitterName: user?.displayName || "anonymous",
        status: "pending",
        createdAt: new Date(),
      });

      alert("Product submitted for approval!");

      // Reset product form
      setProductData({
        productName: "",
        description: "",
        productPrice: "",
        category: "",
        inStock: true,
        sustainabilityTags: [],
        businessId: "",
      });
      setImageFile(null);
      setImageUrl("");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Add Business or Product
        </h3>
        <p className="text-sm text-gray-600">
          Anyone can add businesses and products. All submissions go to admin
          for approval.
        </p>
      </div>

      {/* Tab Selection */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab("business")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "business"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Add New Business
        </button>
        <button
          onClick={() => setActiveTab("product")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "product"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Add Product to Existing Business
        </button>
      </div>

      {activeTab === "business" && !showProductForm && (
        // Business Form
        <div>
          <h4 className="text-md font-semibold mb-4">Business Information</h4>
          <form onSubmit={handleBusinessSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={businessData.businessName}
                onChange={(e) =>
                  setBusinessData({
                    ...businessData,
                    businessName: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={businessData.description}
                onChange={(e) =>
                  setBusinessData({
                    ...businessData,
                    description: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={businessData.category}
                  onChange={(e) =>
                    setBusinessData({
                      ...businessData,
                      category: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Select category</option>
                  <option value="restaurant">Food</option>
                  <option value="retail">Retail</option>
                  <option value="services">Services</option>
                  <option value="grocery">Grocery</option>
                  <option value="crafts">Crafts</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={businessData.phone}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, phone: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Sustainability Tags */}
            <div className="py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sustainability Tags
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["Green Certified", "Locally Sourced", "Zero-Waste"].map((tag) => (
                  <label key={tag} className="flex items-center gap-3 bg-green-50 rounded-lg px-4 py-3 shadow-sm border border-green-200">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-green-600 focus:ring-green-500"
                      checked={businessData.tags.includes(tag)}
                      onChange={() => {
                        setBusinessData((prev) => {
                          const tags = prev.tags.includes(tag)
                            ? prev.tags.filter((t) => t !== tag)
                            : [...prev.tags, tag];
                          return { ...prev, tags };
                        });
                      }}
                    />
                    <span className="text-base font-medium text-green-800">{tag}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-green-700 mt-3">Select all that apply. These tags help users find sustainable businesses.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                required
                value={businessData.address}
                onChange={(e) =>
                  setBusinessData({ ...businessData, address: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={businessData.website}
                onChange={(e) =>
                  setBusinessData({ ...businessData, website: e.target.value })
                }
                placeholder="https://example.com"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours
              </label>
              <input
                type="text"
                value={businessData.hours}
                onChange={(e) =>
                  setBusinessData({ ...businessData, hours: e.target.value })
                }
                placeholder="e.g., Mon-Fri 9AM-5PM"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Image
              </label>
              <div className="mb-2">
                <input
                  type="url"
                  value={businessImageUrl}
                  onChange={(e) => setBusinessImageUrl(e.target.value)}
                  placeholder="Paste image link (https://...) or upload below"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div
                {...getBusinessImageRootProps()}
                className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-rose-400 transition-colors ${
                  isBusinessImageDragActive ? "border-rose-400 bg-rose-50" : ""
                }`}
              >
                <input {...getBusinessImageInputProps()} />
                {businessImageFile ? (
                  <p className="text-rose-600">
                    Selected: {businessImageFile.name}
                  </p>
                ) : (
                  <div>
                    <p className="text-gray-600">
                      Drag & drop an image here, or click to select
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You can either upload an image file or paste a direct image link
                above. If both are provided, the uploaded file will be used.
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Business"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "product" && (
        // Product Form for existing businesses
        <div>
          <h4 className="text-md font-semibold mb-4">
            Add Product to Existing Business
          </h4>
          {loadingBusinesses ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading businesses...</p>
            </div>
          ) : (
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Business *
                </label>
                <select
                  required
                  value={productData.businessId}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      businessId: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Choose a business...</option>
                  {existingBusinesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.businessName}{" "}
                      {business.status === "pending"
                        ? "(Pending Approval)"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productData.productName}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      productName: e.target.value,
                    })
                  }
                  placeholder="e.g., Organic Apples"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={productData.description}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the product..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="text"
                    value={productData.productPrice}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        productPrice: e.target.value,
                      })
                    }
                    placeholder="e.g., $5.99"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={productData.category}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        category: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Select category...</option>
                    <option value="food">Food & Beverages</option>
                    <option value="clothing">Clothing & Accessories</option>
                    <option value="home">Home & Garden</option>
                    <option value="health">Health & Beauty</option>
                    <option value="services">Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image
                </label>
                <div className="mb-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image link (https://...) or upload below"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-rose-400 transition-colors ${
                    isDragActive ? "border-rose-400 bg-rose-50" : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  {imageFile ? (
                    <p className="text-rose-600">Selected: {imageFile.name}</p>
                  ) : (
                    <div>
                      <p className="text-gray-600">
                        Drag & drop an image here, or click to select
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You can either upload an image file or paste a direct image
                  link above. If both are provided, the uploaded file will be
                  used.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !productData.businessId}
                  className="flex-1 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Product"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {showProductForm && (
        // Product Form (shown after business is submitted)
        <div>
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-md font-semibold text-green-800 mb-1">
              Business Submitted!
            </h4>
            <p className="text-sm text-green-700">
              Now add products to "
              {businessData.businessName || "your business"}". Products will
              also need approval.
            </p>
          </div>

          <h4 className="text-md font-semibold mb-4">Add Products</h4>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={productData.productName}
                onChange={(e) =>
                  setProductData({
                    ...productData,
                    productName: e.target.value,
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
                rows={2}
                value={productData.description}
                onChange={(e) =>
                  setProductData({
                    ...productData,
                    description: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={productData.productPrice}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      productPrice: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={productData.category}
                  onChange={(e) =>
                    setProductData({ ...productData, category: e.target.value })
                  }
                  placeholder="e.g., handmade, ceramic"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sustainability Tags
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["Green Certified", "Locally Sourced", "Zero Waste"].map(
                  (tag) => (
                    <label key={tag} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={productData.sustainabilityTags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProductData({
                              ...productData,
                              sustainabilityTags: [
                                ...productData.sustainabilityTags,
                                tag,
                              ],
                            });
                          } else {
                            setProductData({
                              ...productData,
                              sustainabilityTags:
                                productData.sustainabilityTags.filter(
                                  (t) => t !== tag
                                ),
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{tag}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Image
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-rose-400 transition-colors ${
                  isDragActive ? "border-rose-400 bg-rose-50" : ""
                }`}
              >
                <input {...getInputProps()} />
                {imageFile ? (
                  <p className="text-rose-600">Selected: {imageFile.name}</p>
                ) : (
                  <div>
                    <p className="text-gray-600">
                      Drag & drop an image here, or click to select
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="inStock"
                checked={productData.inStock}
                onChange={(e) =>
                  setProductData({ ...productData, inStock: e.target.checked })
                }
                className="mr-2"
              />
              <label
                htmlFor="inStock"
                className="text-sm font-medium text-gray-700"
              >
                In Stock
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  // Reset everything and close
                  setShowProductForm(false);
                  setSelectedBusinessId("");
                  onClose();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Done
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BusinessForm;
