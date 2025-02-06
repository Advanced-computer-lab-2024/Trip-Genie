import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XCircle, CheckCircle, ArrowUpDown } from "lucide-react";
import { FaPlus } from "react-icons/fa";
import FileComplaintForm from "@/components/FileComplaintForm";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MyComplaintsComponent() {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReplies, setSelectedReplies] = useState([]);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [openComplaintId, setOpenComplaintId] = useState(null);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [dateSortOrder, setDateSortOrder] = useState("desc");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  const fetchComplaints = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/tourist/complaints",
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComplaints(response.data);
      setTimeout(() => setIsLoading(false), 1000);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      showToast("Failed to fetch complaints. Please try again later.", "error");
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "text-[#5D9297]";
      case "pending":
        return "text-[#F88C33]";
      default:
        return "text-red-800";
    }
  };

  const getDotColor = (status) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "text-teal-800 text-2xl";
      case "pending":
        return "text-orange-500 text-2xl";
      default:
        return "text-red-800 text-2xl";
    }
  };

  const getPriorityColor = (status) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "bg-teal-800";
      case "pending":
        return "bg-orange-500";
      default:
        return "bg-red-800";
    }
  };
  const handleComplaintFiled = (newComplaint) => {
    setComplaints((prevComplaints) => [newComplaint, ...prevComplaints]);
    setActiveTab("pending");
  };

  const openForm = () => setIsFormOpen(true);
  const closeForm = () => setIsFormOpen(false);

  const openReplies = (replies) => {
    setSelectedReplies(replies);
    setIsRepliesOpen(true);
  };

  const closeReplies = () => setIsRepliesOpen(false);

  const toggleAccordion = (id) => {
    setOpenComplaintId(openComplaintId === id ? null : id);
  };

  const toggleDateSort = () => {
    setDateSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-2">Complaints</h1>
        <p className="text-sm text-gray-500 mb-2">
          Help and Support / Complaints
        </p>

        <div className="container mx-auto px-4 py-8 animate-pulse">
          <div className="bg-white border rounded-md shadow-md p-6">
            <div className="grid grid-cols-4 items-center gap-4 mb-6">
              <div className="col-span-3 flex items-center gap-4">
                <div className="w-full h-8 bg-gray-200  rounded-md"></div>
              </div>
              <div>
                <div className="w-32 h-10 bg-gray-200 rounded-md"></div>
              </div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((index) => (
                <div key={index} className="h-24 bg-gray-200 rounded-md p-2">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-6 w-24 bg-gray-300  rounded-md"></div>
                    <div className="h-6 w-16 bg-gray-300  rounded-md"></div>
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

  const filteredComplaints = complaints
    .filter(
      (complaint) =>
        (complaint.status?.toLowerCase() || "pending") === activeTab
    )
    .sort((a, b) => {
      if (dateSortOrder === "asc") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  return (
    <ToastProvider>
      <div>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Complaints</h1>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Help and Support / Complaints
          </p>
          <div className="bg-white border rounded-md shadow-md p-6">
            <div className="grid grid-cols-5 items-center gap-4 mb-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="col-span-3"
              >
                <TabsList className="grid grid-cols-2 bg-white w-full">
                  <TabsTrigger
                    value="pending"
                    className={`rounded-none relative flex items-center justify-center px-3 py-2 font-medium ${
                      activeTab === "pending"
                        ? "text-[#1A3B47] border-b-2 border-[#1A3B47]"
                        : "text-gray-500 border-b border-gray-400"
                    }`}
                  >
                    Pending
                  </TabsTrigger>
                  <TabsTrigger
                    value="resolved"
                    className={`rounded-none relative flex items-center justify-center px-3 py-2 font-medium ${
                      activeTab === "resolved"
                        ? "text-[#1A3B47] border-b-2 border-[#1A3B47]"
                        : "text-gray-500 border-b border-gray-400"
                    }`}
                  >
                    Resolved
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                onClick={toggleDateSort}
                className="bg-[#388A94] hover:bg-[#2e6b77] text-white py-2 px-4 rounded-md text-sm font-medium shadow-sm"
              >
                Sort by Date ({dateSortOrder === "asc" ? "Oldest" : "Newest"})
              </Button>
              <Button
                onClick={openForm}
                className="col-span-1 bg-[#388A94] hover:bg-[#2e6b77] text-white py-2 px-4 rounded-md text-sm font-medium shadow-sm"
              >
                File a Complaint
              </Button>
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
                        <p className="text-xs text-gray-500">
                          {new Date(complaint.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
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
                        {complaint.body?.substring(0, 30)}
                        {complaint.body?.length > 30 ? "..." : ""}
                      </p>
                    )}
                    {openComplaintId === complaint._id && (
                      <div className="mt-2">
                        <p className="text-gray-700">{complaint.body}</p>
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
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {isFormOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <FileComplaintForm
                closeForm={closeForm}
                showToast={showToast}
                onComplaintFiled={handleComplaintFiled}
              />
            </div>
          )}

          {isToastOpen && (
            <Toast
              onOpenChange={setIsToastOpen}
              open={isToastOpen}
              duration={1500}
              className={
                toastType === "success" ? "bg-green-100" : "bg-red-100"
              }
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
        </div>
      </div>
    </ToastProvider>
  );
}
