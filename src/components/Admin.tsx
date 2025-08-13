import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc,
  addDoc
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { 
  Check, 
  X,
  Mail,
  Phone,
  Building,
  User,
  Clock
} from "lucide-react";

interface BusinessRequest {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  message: string;
  userId: string;
  userEmail: string;
  status: "pending" | "approved" | "rejected";
  createdAt: { toDate: () => Date };
}

const AdminDashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<BusinessRequest[]>([]);

  useEffect(() => {
    if (user) {
      fetchBusinessRequests();
    }
  }, [user]);

  const fetchBusinessRequests = async () => {
    try {
      const requestsSnapshot = await getDocs(collection(db, "businessRequests"));
      const requestsData = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BusinessRequest[];
      
      // Sort by creation date, newest first
      requestsData.sort((a, b) => b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime());
      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching business requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (request: BusinessRequest) => {
    try {
      setLoading(true);
      
      // Create business document
      await addDoc(collection(db, "businesses"), {
        businessName: request.businessName,
        description: "", // Can be filled later
        category: "", // Can be filled later
        address: "", // Can be filled later
        phone: request.phone,
        website: "", // Can be filled later
        hours: "", // Can be filled later
        email: request.email,
        ownerId: request.userId,
        createdAt: new Date(),
        approvedAt: new Date(),
        approvedBy: user?.uid
      });

      // Update request status
      await updateDoc(doc(db, "businessRequests", request.id), {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: user?.uid
      });

      alert(`Business "${request.businessName}" has been approved!`);
      await fetchBusinessRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Error approving request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (request: BusinessRequest) => {
    if (!confirm(`Are you sure you want to reject "${request.businessName}"?`)) return;

    try {
      await updateDoc(doc(db, "businessRequests", request.id), {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: user?.uid
      });

      alert(`Business request for "${request.businessName}" has been rejected.`);
      await fetchBusinessRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Error rejecting request. Please try again.");
    }
  };

  const handleDeleteRequest = async (request: BusinessRequest) => {
    if (!confirm(`Are you sure you want to delete this request permanently?`)) return;

    try {
      await deleteDoc(doc(db, "businessRequests", request.id));
      alert("Request deleted successfully.");
      await fetchBusinessRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Error deleting request. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-600">Manage business registration requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">
                {requests.filter(r => r.status === "pending").length}
              </div>
              <div className="text-sm text-yellow-700">Pending Requests</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-900">
                {requests.filter(r => r.status === "approved").length}
              </div>
              <div className="text-sm text-green-700">Approved</div>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-900">
                {requests.filter(r => r.status === "rejected").length}
              </div>
              <div className="text-sm text-red-700">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Yet</h3>
          <p className="text-gray-600">Business registration requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Building className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.businessName}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === "pending" 
                        ? "bg-yellow-100 text-yellow-800"
                        : request.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{request.ownerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{request.email}</span>
                    </div>
                    {request.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{request.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{request.createdAt?.toDate().toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {request.message && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{request.message}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  {request.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApproveRequest(request)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteRequest(request)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <X className="w-5 h-5" />
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

const AdminModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [user] = useAuthState(auth);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg w-full mx-4 max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Admin Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {user?.email === "nabira.per1701@gmail.com" ? (
            <AdminDashboard />
          ) : (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <Building className="w-12 h-12 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Admin Access Required</h3>
              </div>
              <p className="text-gray-600 mb-4">
                You need administrator privileges to access this section.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
