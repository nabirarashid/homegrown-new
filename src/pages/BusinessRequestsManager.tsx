import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { Mail, Phone, Building, Clock, Check, X, Eye } from "lucide-react";

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
  createdAt: Date | { toDate(): Date };
  processedAt?: Date | { toDate(): Date };
}

const BusinessRequestsManager: React.FC = () => {
  const [requests, setRequests] = useState<BusinessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [selectedRequest, setSelectedRequest] =
    useState<BusinessRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const requestsQuery = query(
        collection(db, "businessRequests"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(requestsQuery);
      const requestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BusinessRequest[];
      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: BusinessRequest) => {
    if (!confirm(`Approve business request for ${request.businessName}?`))
      return;

    try {
      // Update request status
      await updateDoc(doc(db, "businessRequests", request.id), {
        status: "approved",
        processedAt: new Date(),
      });

      // TODO: You might want to automatically create a business entry here
      // and update the user's role to "business"

      alert(
        "Request approved! Remember to manually set up their business account."
      );
      await fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Error approving request. Please try again.");
    }
  };

  const handleReject = async (request: BusinessRequest) => {
    const reason = prompt("Reason for rejection (optional):");

    try {
      await updateDoc(doc(db, "businessRequests", request.id), {
        status: "rejected",
        processedAt: new Date(),
        rejectionReason: reason || "",
      });

      alert("Request rejected.");
      await fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Error rejecting request. Please try again.");
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm("Delete this request permanently?")) return;

    try {
      await deleteDoc(doc(db, "businessRequests", requestId));
      await fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Error deleting request. Please try again.");
    }
  };

  const filteredRequests = requests.filter(
    (request) => filter === "all" || request.status === filter
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (timestamp: Date | { toDate(): Date } | undefined) => {
    if (!timestamp) return "N/A";
    const date = (timestamp as any).toDate
      ? (timestamp as any).toDate()
      : timestamp;
    return (
      (date as Date).toLocaleDateString() +
      " " +
      (date as Date).toLocaleTimeString()
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Business Requests Manager
          </h1>
          <p className="text-gray-600">
            Review and manage business access requests from users.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Requests
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter((r) => r.status === "pending").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter((r) => r.status === "approved").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter((r) => r.status === "rejected").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {["all", "pending", "approved", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as typeof filter)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === status
                      ? "border-rose-500 text-rose-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="ml-2 text-xs bg-gray-100 rounded-full px-2 py-1">
                    {status === "all"
                      ? requests.length
                      : requests.filter((r) => r.status === status).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {filter !== "all" ? filter : ""} requests found
              </h3>
              <p className="text-gray-500">
                {filter === "pending"
                  ? "All caught up! No pending requests to review."
                  : "No requests match the current filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                              <Building className="w-5 h-5 text-rose-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.businessName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.message
                                ? request.message.slice(0, 50) + "..."
                                : "No message"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.ownerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.userEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {request.email}
                          </div>
                          {request.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {request.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(request)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(request)}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(request.id)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Request Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold">Request Details</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.businessName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Owner Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.ownerName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.email}
                  </p>
                </div>
                {selectedRequest.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRequest.phone}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    User Email (Firebase)
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.userEmail}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Submitted
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedRequest.createdAt)}
                  </p>
                </div>
                {selectedRequest.message && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedRequest.message}
                    </p>
                  </div>
                )}

                {selectedRequest.status === "pending" && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest);
                        setSelectedRequest(null);
                      }}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Approve Request
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedRequest);
                        setSelectedRequest(null);
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      Reject Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessRequestsManager;
