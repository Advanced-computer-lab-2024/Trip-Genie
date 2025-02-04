import { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, XCircle, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast";
import Cookies from "js-cookie";

export function ViewComplaints({ onSelectComplaint }) {
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");
  const [dateSortOrder, setDateSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [openComplaintId, setOpenComplaintId] = useState(null);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const token = Cookies.get("jwt");
        let role = Cookies.get("role") || "guest";
        const api = `https://trip-genie-apis.vercel.app/${role}/complaints`;
        const response = await axios.get(api, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setComplaints(response.data);
        setError(null);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching complaints:", err);
        showToast(
          "Failed to fetch complaints. Please try again later.",
          "error"
        );
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const toggleAccordion = (id) => {
    setOpenComplaintId(openComplaintId === id ? null : id);
  };

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  const toggleDateSort = () => {
    setDateSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  const sortComplaints = (complaintsToSort) => {
    return complaintsToSort.sort((a, b) => {
      if (dateSortOrder === "asc") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  };

  const filteredComplaints = complaints
    .filter(
      (complaint) =>
        activeTab === "all" || complaint.status.toLowerCase() === activeTab
    )
    .sort((a, b) => {
      if (dateSortOrder === "asc") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  if (loading) {
    return (
      <div>
        <div className="animate-pulse">
          <div className="bg-white border rounded-md shadow-md p-6">
            <Tabs className="mb-4 w-full">
              <TabsList className="grid grid-cols-3 bg-white w-full">
                {["all", "pending", "resolved"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className={`rounded-none relative flex items-center justify-center px-3 py-2 font-medium ${
                      activeTab === tab
                        ? "text-[#1A3B47] border-b-2 border-[#1A3B47]"
                        : "text-gray-500 border-b border-gray-400"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-md p-2">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-6 w-24 bg-gray-300 rounded-md"></div>
                    <div className="h-6 w-16 bg-gray-300 rounded-md"></div>
                  </div>
                  <div className="h-5 w-3/4 bg-gray-300 rounded-md"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <ToastProvider>
      <div>
        <div className="">
          <div className="bg-white border rounded-md shadow-md p-6">
            <div className="grid grid-cols-1 items-center gap-4 mb-6">
              <div className="flex justify-between items-center w-full">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => {
                    setActiveTab(value);
                    setStatus(value);
                  }}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 bg-white w-full">
                    {["all", "pending", "resolved"].map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className={`rounded-none relative flex items-center justify-center px-3 py-2 font-medium ${
                          activeTab === tab
                            ? "text-[#1A3B47] border-b-2 border-[#1A3B47]"
                            : "text-gray-500 border-b border-gray-400"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <Button
                  onClick={toggleDateSort}
                  variant="outline"
                  className="flex items-center gap-2 ml-4"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  Sort by Date ({dateSortOrder === "asc" ? "Oldest" : "Newest"})
                </Button>
              </div>
            </div>
            {filteredComplaints.length === 0 ? (
              <p className="text-center text-gray-600">No complaints found.</p>
            ) : (
              filteredComplaints.map((complaint) => (
                <div key={complaint._id} className="mb-4">
                  <div
                    className={`cursor-pointer border rounded-md p-4 transition-all duration-300 ${
                      openComplaintId === complaint._id
                        ? "bg-gray-50 shadow-md"
                        : "bg-white shadow-sm"
                    }`}
                    onClick={() => toggleAccordion(complaint._id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-teal-800">
                          {complaint.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {format(new Date(complaint.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">
                          {complaint.replies?.length === 1
                            ? "1 reply"
                            : `${complaint.replies?.length || 0} replies`}
                        </p>
                        <div
                          className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                            openComplaintId === complaint._id
                              ? `${
                                  complaint.status === "pending"
                                    ? "bg-[#F88C33] text-white px-3 py-1"
                                    : "bg-[#388A94] text-white px-3 py-1"
                                } text-sm font-medium`
                              : `${
                                  complaint.status === "pending"
                                    ? "bg-[#F88C33] text-white"
                                    : "bg-[#388A94] text-white"
                                } w-4 h-4`
                          }`}
                        >
                          {openComplaintId === complaint._id
                            ? `${complaint.status
                                .charAt(0)
                                .toUpperCase()}${complaint.status
                                .slice(1)
                                .toLowerCase()}`
                            : ""}
                        </div>
                      </div>
                    </div>
                    {openComplaintId !== complaint._id && (
                      <p className="text-sm text-gray-500 mt-2">
                        {complaint.body.substring(0, 30)}...
                      </p>
                    )}
                    {openComplaintId === complaint._id && (
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-gray-700">{complaint.body}</p>
                        <span
                          onClick={() => onSelectComplaint(complaint._id)}
                          className="text-sm text-[#5D9297] cursor-pointer hover:text-[#1A3B47] hover:underline mr-2 mt-2"
                        >
                          Reply To Complaint
                        </span>
                      </div>
                    )}
                    {openComplaintId === complaint._id && (
                      <div className="mt-2">
                        {complaint.replies?.map((reply, index) => (
                          <div
                            key={index}
                            className="bg-gray-100 p-2 rounded-md mb-2 text-sm text-gray-700"
                          >
                            {reply.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {isToastOpen && (
        <Toast
          onOpenChange={setIsToastOpen}
          open={isToastOpen}
          duration={1500}
          className={toastType === "success" ? "bg-green-100" : "bg-red-100"}
        >
          <div className="flex items-center">
            {toastType === "success" ? (
              <CheckCircle className="text-green-500 mr-2" />
            ) : (
              <XCircle className="text-red-500 mr-2" />
            )}
            <div>
              <ToastTitle>
                {toastType === "success" ? "Success" : "Error"}
              </ToastTitle>
              <ToastDescription>{toastMessage}</ToastDescription>
            </div>
          </div>
          <ToastClose />
        </Toast>
      )}
      <ToastViewport className="fixed top-0 right-0 p-4" />
    </ToastProvider>
  );
}

export default ViewComplaints;
