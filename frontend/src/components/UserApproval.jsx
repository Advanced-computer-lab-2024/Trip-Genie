"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";
import {
  Check,
  X,
  Mail,
  User,
  UserX,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import DeleteConfirmation from "@/components/ui/deletionConfirmation";
import ApprovalConfirmation from "@/components/ui/approvalConfirmation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UserApproval() {
  const [advertisers, setAdvertisers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [tourGuides, setTourGuides] = useState([]);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserRole, setSelectedUserRole] = useState(null);
  const [activeRole, setActiveRole] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { id: "all", label: "All Users" },
    { id: "advertiser", label: "Advertisers" },
    { id: "seller", label: "Sellers" },
    { id: "tourGuide", label: "Tour Guides" },
  ];

  const filteredUsers = (role) => {
    if (role === "all") {
      return [...advertisers, ...sellers, ...tourGuides];
    }
    if (role === "advertiser") {
      return advertisers;
    }
    if (role === "seller") {
      return sellers;
    }
    if (role === "tourGuide") {
      return tourGuides;
    }
    return [];
  };

  const openApprovalDialog = (user, role) => {
    setSelectedUser(user);
    setSelectedUserRole(role);
    setIsApprovalDialogOpen(true);
  };

  const confirmApproval = async () => {
    if (selectedUser && selectedUserRole) {
      await approveUser(selectedUser._id, selectedUserRole);
      closeApprovalDialog();
    }
  };

  const closeApprovalDialog = () => {
    setSelectedUser(null);
    setSelectedUserRole(null);
    setIsApprovalDialogOpen(false);
  };

  useEffect(() => {
    fetchAdvertisers();
    fetchSellers();
    fetchTourGuides();
  }, []);

  const fetchFile = async (filename) => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `http://localhost:4000/admin/files/${filename}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      const blobUrl = URL.createObjectURL(response.data);
      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error("Failed to fetch the file", err);
    }
  };

  const fetchAdvertisers = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "http://localhost:4000/admin/unaccepted-advertiser",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAdvertisers(Array.isArray(response.data) ? response.data : []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch advertisers", err);
      setError("Failed to fetch advertisers");
    }
  };

  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "http://localhost:4000/admin/unaccepted-seller",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSellers(Array.isArray(response.data) ? response.data : []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch sellers", err);
      setError("Failed to fetch sellers");
    }
  };

  const fetchTourGuides = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "http://localhost:4000/admin/unaccepted-tourguide",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTourGuides(Array.isArray(response.data) ? response.data : []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch tour guides", err);
      setError("Failed to fetch tour guides");
    }
  };

  const showToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
    setTimeout(() => setIsToastOpen(false), 3000); // Close toast after 3 seconds
  };

  const handleConfirm = async (action, user, role) => {
    if (action === "approve") {
      await approveUser(user._id, role);
    } else {
      await rejectUser(user, role);
    }
    setConfirmDialogOpen(true);
  };

  const approveUser = async (userId, role) => {
    try {
      const token = Cookies.get("jwt");
      await axios.put(
        `http://localhost:4000/admin/approve-${role}/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`Successfully approved the ${role}.`, "success");
      // Re-fetch the user type list after approval
      role === "advertiser"
        ? fetchAdvertisers()
        : role === "seller"
        ? fetchSellers()
        : fetchTourGuides();
    } catch (err) {
      showToast(`Failed to approve ${role}`, "error");
      console.error(err);
    }
  };

  const rejectUser = async (user, role) => {
    try {
      const token = Cookies.get("jwt");
      await axios.delete(
        `http://localhost:4000/admin/reject/${role}s/${user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showToast(`Successfully rejected the ${role}.`, "success");
      // Re-fetch the user type list after rejection
      if (role === "advertiser") {
        fetchAdvertisers();
      } else if (role === "seller") {
        fetchSellers();
      } else {
        fetchTourGuides();
      }
    } catch (err) {
      showToast(`Failed to reject ${role}`, "error");
      console.error(err);
    }
  };

  const handleDeleteClick = (user, role) => {
    setUserToDelete({ ...user, role });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      await rejectUser(userToDelete, userToDelete.role);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <>
        {/* Category Skeletons */}
        <div className="grid grid-cols-4 gap-0 mb-6">
          {["All Users", "Advertiser", "Seller", "Tour Guides"].map(
            (category, index) => (
              <div
                key={`category-${index}`}
                className="bg-gray-200  shadow-md p-3 flex flex-col justify-center items-center animate-pulse"
              ></div>
            )
          )}
        </div>

        {/* Skeleton User Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <motion.div
                key={`skeleton-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-gray-200 shadow-md animate-pulse rounded-lg">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      {/* Large Circle on the Left */}
                      <div className="h-16 w-16 rounded-full bg-gray-300"></div>

                      {/* Smaller Circles on the Right */}
                      <div className="flex space-x-2 relative -top-3">
                        <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                        <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                      </div>
                    </div>

                    <div className="h-4 w-3/4 bg-gray-300 rounded-md ml-0"></div>
                    <div className="h-4 w-1/2 bg-gray-300 rounded-md ml-0"></div>
                    <div className="h-8 w-full bg-gray-300 rounded-md mx-auto mt-4"></div>
                    <div className="h-8 w-full bg-gray-300 rounded-md mx-auto "></div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>
      </>
    );
  }

  const renderUserCards = (users) =>
    users.map((user) => {
      const userRole = advertisers.some((a) => a._id === user._id)
        ? "advertiser"
        : sellers.some((s) => s._id === user._id)
        ? "seller"
        : "tourGuide";

      return (
        <motion.div
          key={user._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="relative overflow-hidden bg-white shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                <Button
                  onClick={() => handleDeleteClick(user, userRole)}
                  className="text-red-500 hover:text-red-600 active:text-red-700 active:transform active:scale-95 transition-all duration-200 p-2"
                  variant="ghost"
                >
                  <X className="h-5 w-5" />
                </Button>
                <div className="h-5 border-l border-gray-300"></div>
                <Button
                  onClick={() => openApprovalDialog(user, userRole)}
                  className="text-green-500 hover:text-green-600 active:text-green-700 active:transform active:scale-95 transition-all duration-200 p-2"
                  variant="ghost"
                >
                  <Check className="h-5 w-5" />
                </Button>
              </div>
              <div className="">
                <div className="flex flex-col items-start">
                  <Avatar className="h-12 w-12 bg-[#B5D3D1] mb-4">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture.url}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-[#1A3B47] font-semibold">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h3 className="font-bold text-lg text-[#1A3B47] mt-2">
                    {user.name}
                  </h3>
                  <div className="space-y-2 text-sm text-[#5D9297] mt-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{user.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <Badge
                        variant="secondary"
                        className="bg-[#388A94]/10 text-[#388A94]"
                      >
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start space-y-2 mt-4">
                {user.files?.IDFilename && (
                  <Button
                    onClick={() => fetchFile(user.files.IDFilename)}
                    className="w-full bg-white text-[#2D6F77] border border-[#2D6F77] hover:bg-[#2D6F77] hover:text-teal hover:font-bold active:bg-[#1A3B47] active:transform active:scale-95 transition-all duration-200 py-1 rounded-md text-sm"
                    variant="outline"
                  >
                    View ID Document
                  </Button>
                )}
                {user.files?.taxationRegistryCardFilename && (
                  <Button
                    onClick={() =>
                      fetchFile(user.files.taxationRegistryCardFilename)
                    }
                    className="w-full bg-white text-[#2D6F77] border border-[#2D6F77] hover:bg-[#2D6F77] hover:text-teal hover:font-bold active:bg-[#1A3B47] active:transform active:scale-95 transition-all duration-200 py-1 rounded-md text-sm"
                    variant="outline"
                  >
                    View Taxation Registry Card
                  </Button>
                )}
                {user.files?.certificatesFilenames &&
                  user.files.certificatesFilenames.length > 0 &&
                  user.files.certificatesFilenames.map(
                    (certificate, certIndex) => (
                      <Button
                        key={certIndex}
                        onClick={() => fetchFile(certificate)}
                        className="w-full bg-white text-[#2D6F77] border border-[#2D6F77] hover:bg-[#2D6F77] hover:text-teal hover:font-bold active:bg-[#1A3B47] active:transform active:scale-95 transition-all duration-200 py-1 rounded-md text-sm"
                        variant="outline"
                      >
                        View Certificate {certIndex + 1}
                      </Button>
                    )
                  )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    });

  return (
    <ToastProvider>
      <div className="flex flex-col mb-16">
        <Tabs
          defaultValue={activeRole}
          onValueChange={setActiveRole}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 w-full bg-[#F0F4F5]">
            {roles.map((role) => (
              <TabsTrigger
                key={role.id}
                value={role.id}
                className={`rounded-none relative flex items-center justify-center px-3 py-2 font-medium ${
                  activeRole === role.id
                    ? "text-[#1A3B47] border-b-2 border-[#1A3B47]"
                    : "text-gray-500 border-b border-gray-400 hover:text-[#1A3B47] transition-colors"
                }`}
              >
                {role.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {roles.map((role) => (
            <TabsContent key={role.id} value={role.id} className="mt-6">
              {filteredUsers(role.id).length === 0 ? (
                <div className="flex items-center justify-center h-24 sm:h-32">
                  <p className="text-base sm:text-lg text-[#003f66] text-center px-4">
                    No users to Accept/Reject. Please check again later!
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-auto">
                  {renderUserCards(filteredUsers(role.id))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <DeleteConfirmation
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          itemType="registered account"
          onConfirm={handleConfirmDelete}
        />

        <ApprovalConfirmation
          isOpen={isApprovalDialogOpen}
          onClose={closeApprovalDialog}
          itemType="user"
          onConfirm={confirmApproval}
        />
      </div>

      <ToastViewport />
      {isToastOpen && (
        <Toast
          onOpenChange={setIsToastOpen}
          open={isToastOpen}
          duration={3000} // Automatically close after 3 seconds
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
    </ToastProvider>
  );
}
