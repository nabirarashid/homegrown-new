import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Plus,
  Edit3,
  Trash2,
  Package,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sustainabilityTags?: string[]; // New sustainability tags
  inStock: boolean;
  productImage?: string;
  businessId: string;
  businessName: string;
  website?: string;
  createdAt: any;
}

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
  ownerId: string;
}

const BusinessDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showRequestAccess, setShowRequestAccess] = useState(false);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "", // This will be product tags/categories, not business category
    sustainabilityTags: [] as string[], // New sustainability tags
    inStock: true,
  });
  const [productImage, setProductImage] = useState<File | null>(null);

  // Request access form state
  const [requestForm, setRequestForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    message: "",
    category: "",
    description: "",
    hours: "",
    address: "",
    website: "",
    lat: "",
    lng: "",
  });

  const onDrop = (acceptedFiles: File[]) => {
    setProductImage(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  useEffect(() => {
    if (user) {
      fetchBusinessData();
    }
  }, [user]);

  const fetchBusinessData = async () => {
    if (!user) return;

    try {
      // Check if user owns a business
      const businessQuery = query(
        collection(db, "businesses"),
        where("ownerId", "==", user.uid)
      );
      const businessSnapshot = await getDocs(businessQuery);

      if (!businessSnapshot.empty) {
        const businessData = businessSnapshot.docs[0].data() as Business;
        businessData.id = businessSnapshot.docs[0].id;
        setBusiness(businessData);

        // Fetch products for this business
        const productsQuery = query(
          collection(db, "products"),
          where("businessId", "==", businessData.id)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Error fetching business data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !business) return;

    try {
      setLoading(true);
      let imageUrl = "";

      // Upload image if provided
      if (productImage) {
        const storage = getStorage();
        const imageRef = ref(
          storage,
          `products/${Date.now()}_${productImage.name}`
        );
        const snapshot = await uploadBytes(imageRef, productImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      // Add product to Firestore
      await addDoc(collection(db, "products"), {
        ...productForm,
        price: parseFloat(productForm.price),
        productImage: imageUrl,
        businessId: business.id,
        businessName: business.businessName,
        createdAt: new Date(),
      });

      // Reset form and refresh products
      setProductForm({
        name: "",
        description: "",
        price: "",
        category: "",
        sustainabilityTags: [],
        inStock: true,
      });
      setProductImage(null);
      setShowAddProduct(false);
      await fetchBusinessData();
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setLoading(true);
      let imageUrl = editingProduct.productImage || "";

      // Upload new image if provided
      if (productImage) {
        const storage = getStorage();
        const imageRef = ref(
          storage,
          `products/${Date.now()}_${productImage.name}`
        );
        const snapshot = await uploadBytes(imageRef, productImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      // Update product in Firestore
      await updateDoc(doc(db, "products", editingProduct.id), {
        ...productForm,
        price: parseFloat(productForm.price),
        productImage: imageUrl,
      });

      // Reset form and refresh products
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        category: "",
        sustainabilityTags: [],
        inStock: true,
      });
      setProductImage(null);
      await fetchBusinessData();
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteDoc(doc(db, "products", productId));
      await fetchBusinessData();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // Add request to a "businessRequests" collection
      await addDoc(collection(db, "businessRequests"), {
        ...requestForm,
        location: {
          address: requestForm.address,
          lat: requestForm.lat ? parseFloat(requestForm.lat) : null,
          lng: requestForm.lng ? parseFloat(requestForm.lng) : null,
        },
        userId: user.uid,
        userEmail: user.email,
        status: "pending",
        createdAt: new Date(),
      });

      alert("Your request has been submitted! We'll contact you soon.");
      setShowRequestAccess(false);
      setRequestForm({
        businessName: "",
        ownerName: "",
        email: "",
        phone: "",
        message: "",
        category: "",
        description: "",
        hours: "",
        address: "",
        website: "",
        lat: "",
        lng: "",
      });
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Error submitting request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      sustainabilityTags: product.sustainabilityTags || [],
      inStock: product.inStock,
    });
    setShowAddProduct(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (!business && !showRequestAccess) {
    return (
      <div className="text-center py-8">
        <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Business Found
        </h3>
        <p className="text-gray-600 mb-6">
          You don't have a business registered yet. Would you like to request
          access to manage a business?
        </p>
        <button
          onClick={() => setShowRequestAccess(true)}
          className="bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700 transition-colors"
        >
          Request Business Access
        </button>
      </div>
    );
  }

  if (showRequestAccess) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <Mail className="w-12 h-12 mx-auto text-rose-600 mb-2" />
          <h3 className="text-xl font-semibold text-gray-900">
            Request Business Access
          </h3>
          <p className="text-gray-600">
            Fill out this form and we'll contact you to set up your business
            account.
          </p>
        </div>

        <form onSubmit={handleRequestAccess} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={requestForm.businessName}
              onChange={(e) =>
                setRequestForm({ ...requestForm, businessName: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={requestForm.ownerName}
              onChange={(e) =>
                setRequestForm({ ...requestForm, ownerName: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={requestForm.email}
              onChange={(e) =>
                setRequestForm({ ...requestForm, email: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={requestForm.phone}
              onChange={(e) =>
                setRequestForm({ ...requestForm, phone: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <input
              type="text"
              required
              value={requestForm.category}
              onChange={(e) =>
                setRequestForm({ ...requestForm, category: e.target.value })
              }
              placeholder="e.g., Crafts, Food & Beverage, Services"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Description *
            </label>
            <textarea
              rows={3}
              required
              value={requestForm.description}
              onChange={(e) =>
                setRequestForm({ ...requestForm, description: e.target.value })
              }
              placeholder="Describe your business and what you offer..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Hours *
            </label>
            <input
              type="text"
              required
              value={requestForm.hours}
              onChange={(e) =>
                setRequestForm({ ...requestForm, hours: e.target.value })
              }
              placeholder="e.g., 10:00 AM - 6:00 PM"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Website
            </label>
            <input
              type="url"
              value={requestForm.website}
              onChange={(e) =>
                setRequestForm({ ...requestForm, website: e.target.value })
              }
              placeholder="https://yourwebsite.com"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Address *
            </label>
            <input
              type="text"
              required
              value={requestForm.address}
              onChange={(e) =>
                setRequestForm({ ...requestForm, address: e.target.value })
              }
              placeholder="Full business address"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={requestForm.lat}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, lat: e.target.value })
                }
                placeholder="43.455"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={requestForm.lng}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, lng: e.target.value })
                }
                placeholder="-79.67"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Message
            </label>
            <textarea
              rows={3}
              value={requestForm.message}
              onChange={(e) =>
                setRequestForm({ ...requestForm, message: e.target.value })
              }
              placeholder="Any additional information..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowRequestAccess(false);
                onClose();
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
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Business Info Header */}
      <div className="bg-gradient-to-r from-rose-50 to-stone-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {business?.businessName}
            </h2>
            <p className="text-gray-600">{business?.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {business?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {business.phone}
                </span>
              )}
              {business?.website && (
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-rose-600"
                  >
                    Website
                  </a>
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-rose-600">
              {products.length}
            </div>
            <div className="text-sm text-gray-500">Products</div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Your Products</h3>
        <button
          onClick={() => setShowAddProduct(true)}
          className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Add/Edit Product Form */}
      {showAddProduct && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h4>

          <form
            onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Tags/Categories
                </label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm({ ...productForm, category: e.target.value })
                  }
                  placeholder="e.g., handmade, ceramic, pottery"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sustainability Tags
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {["Green Certified", "Locally Sourced", "Zero Waste"].map((tag) => (
                  <label key={tag} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={productForm.sustainabilityTags.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProductForm({
                            ...productForm,
                            sustainabilityTags: [...productForm.sustainabilityTags, tag]
                          });
                        } else {
                          setProductForm({
                            ...productForm,
                            sustainabilityTags: productForm.sustainabilityTags.filter(t => t !== tag)
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    description: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
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
                {productImage ? (
                  <p className="text-rose-600">Selected: {productImage.name}</p>
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
                checked={productForm.inStock}
                onChange={(e) =>
                  setProductForm({ ...productForm, inStock: e.target.checked })
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
                  setShowAddProduct(false);
                  setEditingProduct(null);
                  setProductForm({
                    name: "",
                    description: "",
                    price: "",
                    category: "",
                    sustainabilityTags: [],
                    inStock: true,
                  });
                  setProductImage(null);
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
                {loading
                  ? "Saving..."
                  : editingProduct
                  ? "Update Product"
                  : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Products Yet
          </h3>
          <p className="text-gray-600">
            Add your first product to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {product.productImage && (
                <img
                  src={product.productImage}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}

              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                <span className="text-lg font-bold text-rose-600">
                  ${product.price.toFixed(2)}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.description}
              </p>

              {/* Sustainability Tags */}
              {product.sustainabilityTags && product.sustainabilityTags.length > 0 && (
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
                    product.inStock
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEditProduct(product)}
                    className="p-1 text-gray-600 hover:text-rose-600"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-1 text-gray-600 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessDashboard;
