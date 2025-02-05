import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeleteConfirmation from "@/components/ui/deletionConfirmation";

const AllPromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [openPromoCodeId, setOpenPromoCodeId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promoCodeToDelete, setPromoCodeToDelete] = useState(null);

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  useEffect(() => {
    const fetchPromoCodes = async () => {
      try {
        setLoading(true);
        const token = Cookies.get("jwt");
        let role = Cookies.get("role") || "guest";
        const api = `http://localhost:4000/${role}/promo-code`;
        const response = await axios.get(api, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLoading(false);
        setPromoCodes(response.data.promoCodes || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching promo codes:", err);
        showToast(
          "Failed to fetch promo codes. Please try again later.",
          "error"
        );
        setLoading(false);
      }
    };

    fetchPromoCodes();
  }, []);

  const filteredPromoCodes = Array.isArray(promoCodes)
    ? promoCodes.filter(
        (promoCode) =>
          activeTab === "all" || promoCode.status.toLowerCase() === activeTab
      )
    : [];

  const toggleAccordion = (id) => {
    setOpenPromoCodeId(openPromoCodeId === id ? null : id);
  };

  const handleEdit = async (id) => {
    try {
      const token = Cookies.get("jwt");
      const api = `http://localhost:4000/promo-code/${id}`;
      await axios.put(
        api,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showToast("Promo code edited successfully.", "success");
    } catch (err) {
      console.error("Error editing promo code:", err);
      showToast("Failed to edit promo code. Please try again later.", "error");
    }
  };

  const handleDeleteClick = (promoCode) => {
    setPromoCodeToDelete(promoCode);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (promoCodeToDelete) {
      try {
        const token = Cookies.get("jwt");
        const api = `http://localhost:4000/admin/promo-code/${promoCodeToDelete._id}`;
        await axios.delete(api, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPromoCodes(
          promoCodes.filter(
            (promoCode) => promoCode._id !== promoCodeToDelete._id
          )
        );
        showToast("Promo code deleted successfully.", "success");
      } catch (err) {
        console.error("Error deleting promo code:", err);
        showToast(
          "Failed to delete promo code. Please try again later.",
          "error"
        );
      }
      setShowDeleteModal(false);
      setPromoCodeToDelete(null);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const token = Cookies.get("jwt");
      const api = `http://localhost:4000/admin/promo-code/${id}`;
      await axios.put(
        api,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPromoCodes(
        promoCodes.map((promoCode) =>
          promoCode._id === id ? { ...promoCode, status: newStatus } : promoCode
        )
      );
      showToast(`Promo code status updated to ${newStatus}.`, "success");
    } catch (err) {
      console.error("Error updating promo code status:", err);
      showToast(
        "Failed to update promo code status. Please try again later.",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <div>
        <div className="animate-pulse">
          <div className="bg-white border rounded-md shadow-md p-6">
            <Tabs className=" mb-4 w-full">
              <TabsList className="grid grid-cols-3 bg-white w-full">
                <TabsTrigger
                  value="all"
                  className={`rounded-none relative flex items-center justify-center px-3 py-2 font-medium ${
                    activeTab === "all"
                      ? "text-[#1A3B47] border-b-2 border-[#1A3B47]"
                      : "text-gray-500 border-b border-gray-400"
                  }`}
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className={`rounded-none relative flex items-center justify-center px-3 py-2 font-medium ${
                    activeTab === "active"
                      ? "text-[#388A94] border-b-2 border-[#388A94]"
                      : "text-gray-500 border-b border-gray-400"
                  }`}
                >
                  Active
                </TabsTrigger>
                <TabsTrigger
                  value="inactive"
                  className={`rounded-none relative flex items-center justify-center px-3 py-2 font-medium ${
                    activeTab === "inactive"
                      ? "text-[#F88C33] border-b-2 border-[#F88C33]"
                      : "text-gray-500 border-b border-gray-400"
                  }`}
                >
                  Inactive
                </TabsTrigger>
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
        <div className="bg-white border rounded-md shadow-md p-6 mb-40">
          <div className="grid grid-cols-1 items-center gap-4 mb-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 bg-white w-full">
                <TabsTrigger
                  value="all"
                  className={`rounded-none relative flex items-center justify-center px-3 py-2 font-medium ${
                    activeTab === "all"
                      ? "text-[#1A3B47] border-b-2 border-[#1A3B47]"
                      : "text-gray-500 border-b border-gray-400"
                  }`}
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className={`rounded-none relative flex items-center justify-center px-3 py-2 font-medium ${
                    activeTab === "active"
                      ? "text-[#388A94] border-b-2 border-[#388A94]"
                      : "text-gray-500 border-b border-gray-400"
                  }`}
                >
                  Active
                </TabsTrigger>
                <TabsTrigger
                  value="inactive"
                  className={`rounded-none relative flex items-center justify-center px-3 py-2 font-medium ${
                    activeTab === "inactive"
                      ? "text-[#F88C33] border-b-2 border-[#F88C33]"
                      : "text-gray-500 border-b border-gray-400"
                  }`}
                >
                  Inactive
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {filteredPromoCodes.length === 0 ? (
            <p className="text-center text-gray-600">No promo codes found.</p>
          ) : (
            filteredPromoCodes.map((promoCode) => (
              <div key={promoCode._id} className="mb-4">
                <div
                  className={`cursor-pointer border rounded-md p-4 transition-all duration-300 ${
                    openPromoCodeId === promoCode._id
                      ? "bg-gray-50 shadow-md"
                      : "bg-white shadow-sm"
                  }`}
                  onClick={() => toggleAccordion(promoCode._id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-teal-800">
                        {promoCode.code}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                          promoCode.status === "inactive"
                            ? "bg-[#F88C33] text-white"
                            : "bg-[#388A94] text-white"
                        } ${
                          openPromoCodeId === promoCode._id
                            ? "px-3 py-1"
                            : "w-4 h-4"
                        } text-sm font-medium`}
                      >
                        {openPromoCodeId === promoCode._id
                          ? `${promoCode.status
                              .charAt(0)
                              .toUpperCase()}${promoCode.status
                              .slice(1)
                              .toLowerCase()}`
                          : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      {promoCode.percentOff}% off
                    </p>
                    {openPromoCodeId === promoCode._id && (
                      <div className="flex gap-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(promoCode._id, promoCode.status);
                          }}
                          className="text-sm text-[#5D9297] cursor-pointer hover:text-[#1A3B47] hover:underline mr-2"
                        >
                          {promoCode.status === "active"
                            ? "Set Inactive"
                            : "Set Active"}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(promoCode);
                          }}
                          className="text-sm text-[#5D9297] cursor-pointer hover:text-[#1A3B47] hover:underline"
                        >
                          Delete
                        </span>
                      </div>
                    )}
                  </div>
                  {openPromoCodeId === promoCode._id && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Usage limit: {promoCode.usage_limit}
                      </p>
                      <p className="text-sm text-gray-500">
                        Times used: {promoCode.timesUsed}
                      </p>
                      <p className="text-sm text-gray-500">
                        Start date:{" "}
                        {new Date(
                          promoCode.dateRange.start
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        End date:{" "}
                        {new Date(promoCode.dateRange.end).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {isToastOpen && (
        <Toast
          onOpenChange={setIsToastOpen}
          open={isToastOpen}
          duration={3000} // Set the duration to 3000 milliseconds (3 seconds)
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
      <DeleteConfirmation
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        itemType="promo code"
        onConfirm={handleConfirmDelete}
      />
    </ToastProvider>
  );
};

export { AllPromoCodes };
