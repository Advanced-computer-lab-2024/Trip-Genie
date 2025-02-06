"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Cookies from "js-cookie";
import { Search, Trash2 } from "lucide-react";
import DeleteConfirmation from "@/components/ui/deletionConfirmation";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";
import { CheckCircle, XCircle } from "lucide-react";

export function DeleteAccount() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRole, setActiveRole] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { id: "all", label: "All Users" },
    { id: "admin", label: "Admins" },
    { id: "tourist", label: "Tourists" },
    { id: "governor", label: "Governors" },
    { id: "seller", label: "Sellers" },
    { id: "tourGuide", label: "Tour Guides" },
    { id: "advertiser", label: "Advertisers" },
  ];

  const fetchUsers = async (role) => {
    setIsLoading(true);
    try {
      const token = Cookies.get("jwt");
      const url = "https://trip-genie-apis.vercel.app/admin/userbyrole";
      const response = await axios.get(url, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
        params: { role: role === "all" ? undefined : role },
      });
      if (response.data) {
        const allUsers = Array.isArray(response.data.allUsers)
          ? response.data.allUsers
          : response.data.users || [];
        setUsers(allUsers);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error getting users:", error);
      showToast("Failed to load users. Please try again.", "error");
    }
  };

  useEffect(() => {
    fetchUsers(activeRole);
  }, [activeRole]);

  const showToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
    setTimeout(() => setIsToastOpen(false), 3000);
  };

  const handleDelete = async (id) => {
    try {
      const token = Cookies.get("jwt");
      const userToDelete = users.find((user) => user._id === id);
      if (!userToDelete) {
        showToast("User not found.", "error");
        return;
      }
      const userRole = userToDelete.role;
      if (!userRole) {
        showToast("Cannot delete user: role is undefined.", "error");
        return;
      }
      const url = `https://trip-genie-apis.vercel.app/admin/${userRole}s/${id}`;
      const response = await axios.delete(url, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if ([200, 204, 201].includes(response.status)) {
        await fetchUsers(activeRole);
        showToast("Account deleted successfully.", "success");
      } else {
        showToast("Failed to delete account.", "error");
      }
    } catch (error) {
      console.error("Failed to delete account", error);
      showToast("Error occurred while deleting account.", "error");
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      await handleDelete(userToDelete._id);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ToastProvider>
      <div className="space-y-6">
        <Tabs
          defaultValue={activeRole}
          onValueChange={setActiveRole}
          className="w-full"
        >
          <TabsList className="grid grid-cols-7 w-full bg-[#F0F4F5]">
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
              <div className="relative w-full mb-6">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5D9297]" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-[#B5D3D1] focus:ring-[#388A94] w-full"
                  style={{ textIndent: "0.5rem" }}
                />
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <div
                        key={`skeleton-${index}`}
                        className="animate-pulse flex justify-between items-center border border-gray-300 p-4 rounded-lg"
                      >
                        <div className="w-1/4 h-6 bg-gray-300 rounded-md"></div>
                        <div className="w-1/3 h-6 bg-gray-300 rounded-md"></div>
                        <div className="w-1/6 h-6 bg-gray-300 rounded-md"></div>
                        <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                      </div>
                    ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center text-[#1A3B47]/60 py-8">
                  No users found. Please try a different search.
                </div>
              ) : (
                <Table className="[&_tr]:h-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium p-3">
                        Username
                      </TableHead>
                      <TableHead className="font-medium p-3">Email</TableHead>
                      <TableHead className="font-medium p-3">Role</TableHead>
                      <TableHead className="text-right p-3">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium p-3">
                          {user.username}
                        </TableCell>
                        <TableCell className="font-medium p-3">
                          {user.email}
                        </TableCell>
                        <TableCell className="font-medium p-3">
                          {user.role}
                        </TableCell>
                        <TableCell className="text-right p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
                            className="text-[#388A94] hover:text-[#2e6b77] hover:bg-[#B5D3D1]/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          ))}
        </Tabs>
        <DeleteConfirmation
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          itemType="account"
          onConfirm={handleConfirmDelete}
        />
      </div>

      <ToastViewport />
      {isToastOpen && (
        <Toast
          onOpenChange={setIsToastOpen}
          open={isToastOpen}
          duration={3000}
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

export default DeleteAccount;
