import React, { useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useDropzone } from "react-dropzone";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface BusinessFormProps {
  onClose: () => void;
}

const BusinessForm: React.FC<BusinessFormProps> = ({ onClose }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    setImageFile(acceptedFiles[0]);
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    multiple: false,
  });

  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    website: "",
    hours: "",
  });

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    inStock: true,
    website: "",
  });

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Update business document
      await setDoc(
        doc(db, "businesses", user.uid),
        {
          ...formData,
          uid: user.uid,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      alert("Business information updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating business:", error);
      alert("Error updating business information");
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let uploadedImageUrl = "";
      if (imageFile) {
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `productImages/${user.uid}_${Date.now()}_${imageFile.name}`
        );
        await uploadBytes(storageRef, imageFile);
        uploadedImageUrl = await getDownloadURL(storageRef);
      }

      // Add product to products collection
      const productId = Date.now().toString(); // Simple ID generation

      await setDoc(doc(db, "products", productId), {
        ...productData,
        businessId: user.uid,
        price: parseFloat(productData.price),
        createdAt: new Date(),
        productImage: uploadedImageUrl,
      });

      alert("Product added successfully!");
      setProductData({
        name: "",
        description: "",
        price: "",
        category: "",
        inStock: true,
        website: "",
      });
      setImageFile(null);
      setImageFile(null);
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Business Information Form */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Business Information</h3>
        <form onSubmit={handleBusinessSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                <option value="">Select category</option>
                <option value="restaurant">Restaurant</option>
                <option value="retail">Retail</option>
                <option value="services">Services</option>
                <option value="grocery">Grocery</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Business Info"}
          </button>
        </form>
      </div>

      {/* Product Form */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Add Product</h3>
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={productData.name}
              onChange={(e) =>
                setProductData({ ...productData, name: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={productData.description}
              onChange={(e) =>
                setProductData({ ...productData, description: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={productData.price}
                onChange={(e) =>
                  setProductData({ ...productData, price: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                required
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website (optional)
            </label>
            <input
              type="url"
              value={productData.website}
              onChange={(e) =>
                setProductData({ ...productData, website: e.target.value })
              }
              placeholder="https://example.com"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
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
          <div
            {...getRootProps()}
            className="border-dashed border-2 p-4 mb-2 cursor-pointer"
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the product image here ...</p>
            ) : (
              <p>Drag and drop product image here, or click to select</p>
            )}
            {imageFile && <p>Selected: {imageFile.name}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BusinessForm;
