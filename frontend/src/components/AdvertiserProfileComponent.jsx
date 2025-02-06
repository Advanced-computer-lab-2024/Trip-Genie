"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Mail, User, Phone, Globe, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageCropper } from "@/components/ImageCropper";
import { Modal } from "@/components/Modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PasswordChanger from "@/components/Passwords";

const convertUrlToBase64 = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

const SkeletonLoader = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Account</h1>
      <p className="text-sm text-gray-500 mb-2">
        Settings and Privacy / Account
      </p>
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-8">
              <CardContent className="py-6">
                <div className="flex items-center justify-center">
                  <div className="w-1/3 flex flex-col items-center">
                    <div className="relative mb-4">
                      <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-center mb-2">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="w-24 h-6 bg-gray-200 rounded-md animate-pulse"></div>
                      </div>
                      <p className="w-32 h-4 bg-gray-200 rounded-md animate-pulse mt-1"></p>
                    </div>
                    <Separator />
                    <div className="flex flex-col w-full max-w-[200px]">
                      <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse mt-2"></div>
                      <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse mt-2"></div>
                    </div>
                  </div>
                  <div className="border-r border-gray-200 h-[260px] mx-2"></div>
                  <div className="w-2/3 pl-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-32 h-6 bg-gray-200 rounded-md animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-32 h-6 bg-gray-200 rounded-md animate-pulse"></div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                      <div className="w-3/4 h-6 bg-gray-200 rounded-md animate-pulse"></div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                      <div className="w-3/4 h-6 bg-gray-200 rounded-md animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-4">
              <CardHeader className="flex">
                <div className="w-full flex justify-between items-center animate-pulse">
                  <div className="w-32 h-4 bg-gray-200 rounded-md"></div>
                  <div className="w-20 h-6 bg-gray-200 rounded-md"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col max-h-[230px] overflow-y-auto">
                  <div className="space-y-4 p-4">
                    {[...Array(5)].map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 animate-pulse"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="w-40 h-4 bg-gray-200 rounded-md"></div>
                          <div className="w-24 h-3 bg-gray-200 rounded-md"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export function AdvertiserProfileComponent() {
  const [advertiser, setAdvertiser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedAdvertiser, setEditedAdvertiser] = useState(null);
  const [validationMessages, setValidationMessages] = useState({});
  const [logo, setLogo] = useState(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [base64Image, setBase64Image] = useState(null);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const getUserRole = () => Cookies.get("role") || "guest";

  useEffect(() => {
    const fetchAdvertiserProfile = async () => {
      try {
        const token = Cookies.get("jwt");
        const role = getUserRole();
        const api = `https://trip-genie-apis.vercel.app/${role}`;
        const response = await axios.get(api, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdvertiser(response.data);
        setEditedAdvertiser(response.data);
        setLogo(response.data.logo);

        if (response.data.logo && response.data.logo.url) {
          convertUrlToBase64(response.data.logo.url).then((base64) => {
            setBase64Image(base64);
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setTimeout(() => setLoading(false), 1000);
      }
    };

    fetchAdvertiserProfile();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/advertiser/notifications`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setNotifications(response.data.notifications.slice(0, 5));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedAdvertiser((prev) => ({ ...prev, [name]: value }));
    setValidationMessages((prev) => ({ ...prev, [name]: "" }));
  };

  const handleUpdateClick = () => {
    setShowModal(true);
    setDropdownOpen(false);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleImageCropped = (newImage) => {
    setNewImage(newImage);
  };

  const handleFirstSave = () => {
    setLogo(newImage);
    setShowModal(false);
  };

  const handleDiscard = () => {
    setEditedAdvertiser(advertiser);
    setLogo(advertiser.logo);
    setIsEditing(false);
  };

  const isValidURL = (string) => {
    const res = string.match(
      /^(https?:\/\/|ftp:\/\/|www\.)[^\s/$.?#].[^\s]*$/i
    );
    return res !== null;
  };

  const validateFields = () => {
    const { email, username, name, hotline, website } = editedAdvertiser;
    const messages = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hotlineRegex = /^\d{5}$/;

    if (!name) messages.name = "Name is required.";
    if (!username) messages.username = "Username is required.";
    if (!email) {
      messages.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      messages.email = "Invalid email format.";
    }
    if (!hotline) {
      messages.hotline = "Hotline is required.";
    } else if (hotline.length !== 5 || !/^\d+$/.test(hotline)) {
      messages.hotline = "Hotline should be 5 digits only.";
    }

    if (website && !isValidURL(website)) {
      messages.website = "Invalid website format.";
    }

    setValidationMessages(messages);
    return Object.keys(messages).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateFields()) return;

    try {
      const token = Cookies.get("jwt");
      const role = getUserRole();

      setDropdownOpen(false);

      const { email, username, name, hotline, website, description } =
        editedAdvertiser;
      const formData = new FormData();
      formData.append("name", name);
      logo && formData.append("logo", JSON.stringify(logo));
      formData.append("username", username);
      formData.append("email", email);
      formData.append("hotline", hotline);
      formData.append("description", description || "");
      formData.append("website", website || "");

      const api = `https://trip-genie-apis.vercel.app/${role}`;
      const response = await axios.put(api, formData, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.statusText === "OK") {
        setAdvertiser(response.data.advertiser);
        setIsEditing(false);
        setError("");
        showToast("Profile updated successfully");
      }
    } catch (err) {
      if (err.response?.data?.message === "Email already exists") {
        setValidationMessages({ email: "Email already exists" });
      } else if (err.response?.data?.message === "Username already exists") {
        setValidationMessages({ username: "Username already exists" });
      } else {
        setError(err.message);
        showToast("An error occurred while updating profile", "error");
      }
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  const handlePasswordChangeSuccess = (message) => {
    setIsPasswordModalOpen(false);
    showToast(message, "success");
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold">
          No advertiser profile information is available.
        </p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div>
        <h1 className="text-3xl font-bold mb-2">Account</h1>
        <p className="text-sm text-gray-500 mb-2">
          Settings and Privacy / Account
        </p>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Profile Picture and Info Card - 8 columns */}
            <Card className="col-span-8 h-full">
              <CardContent className="py-6">
                <div className="flex items-center justify-center">
                  {/* Profile Picture Section */}
                  <div className="w-1/3 flex flex-col items-center">
                    <div className="relative mb-4">
                      <button
                        className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center relative"
                        onClick={() => {
                          if (isEditing) {
                            setDropdownOpen(!isDropdownOpen);
                          } else {
                            setIsImageViewerOpen(true);
                          }
                        }}
                        disabled={!logo && !isEditing}
                      >
                        {logo ? (
                          <img
                            src={logo.url || logo}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-gray-400" />
                        )}
                        {isEditing && (
                          <div className="h-24 w-24 absolute bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs text-center">
                              Edit Profile Picture
                            </span>
                          </div>
                        )}
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-32">
                          <ul className="py-2">
                            {logo && (
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-center"
                                onClick={() => {
                                  setIsImageViewerOpen(true);
                                  setDropdownOpen(false);
                                }}
                              >
                                View
                              </li>
                            )}
                            {isEditing && (
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-center"
                                onClick={handleUpdateClick}
                              >
                                Update
                              </li>
                            )}
                            {isEditing && logo && (
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500 text-center"
                                onClick={() => {
                                  setLogo(null);
                                  setDropdownOpen(false);
                                }}
                              >
                                Delete
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-center mb-2">
                      <div className="flex flex-col items-center gap-2">
                        {isEditing ? (
                          <div className="flex flex-col items-center">
                            <Input
                              type="text"
                              name="username"
                              value={editedAdvertiser.username}
                              onChange={handleInputChange}
                              className={
                                validationMessages.username
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {validationMessages.username && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationMessages.username}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center">
                              {advertiser.isAccepted ? (
                                <CheckCircle className="w-5 h-5 text-[#388A94]" />
                              ) : (
                                <X className="w-5 h-5 text-[#F88C33]" />
                              )}
                              <h2 className="text-xl font-bold ml-1">
                                {advertiser.username}
                              </h2>
                            </div>
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="flex flex-col items-center mt-2">
                          <Input
                            type="email"
                            name="email"
                            value={editedAdvertiser.email}
                            onChange={handleInputChange}
                            className={
                              validationMessages.email ? "border-red-500" : ""
                            }
                          />
                          {validationMessages.email && (
                            <p className="text-red-500 text-xs mt-1">
                              {validationMessages.email}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">
                          {advertiser.email}
                        </p>
                      )}
                    </div>
                    <Separator />
                    {isEditing ? (
                      <div className="flex flex-col w-full max-w-[200px] ">
                        <Button
                          onClick={handleUpdate}
                          className="w-full mt-2 bg-[#388A94] hover:bg-[#2e6b77]"
                        >
                          Update
                        </Button>
                        <Button
                          onClick={handleDiscard}
                          variant="outline"
                          className="w-full mt-2 hover:bg-gray-200 bg-gray-100"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="w-full mt-2 text-sm hover:bg-gray-200 bg-gray-100"
                        >
                          Edit Profile
                        </Button>
                        <Button
                          onClick={() => setIsPasswordModalOpen(true)}
                          className="p-2 w-full mt-2 bg-[#1A3B47]"
                        >
                          Change Password
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="border-r border-gray-200 h-[260px] mx-2"></div>
                  <div className="w-2/3 pl-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        {isEditing ? (
                          <div>
                            <Input
                              type="text"
                              name="name"
                              value={editedAdvertiser.name}
                              onChange={handleInputChange}
                              className={
                                validationMessages.name ? "border-red-500" : ""
                              }
                            />
                            {validationMessages.name && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationMessages.name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-medium">
                            {advertiser.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Hotline</p>
                        {isEditing ? (
                          <div>
                            <Input
                              type="text"
                              name="hotline"
                              value={editedAdvertiser.hotline}
                              onChange={handleInputChange}
                              className={
                                validationMessages.hotline
                                  ? "border-red-500"
                                  : ""
                              }
                              maxLength={5}
                            />
                            {validationMessages.hotline && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationMessages.hotline}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-medium">
                            {advertiser.hotline}
                          </p>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-gray-500">Website</p>
                      {isEditing ? (
                        <div>
                          <Input
                            type="text"
                            name="website"
                            value={editedAdvertiser.website}
                            onChange={handleInputChange}
                            className={
                              validationMessages.website ? "border-red-500" : ""
                            }
                          />
                          {validationMessages.website && (
                            <p className="text-red-500 text-xs mt-1">
                              {validationMessages.website}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm font-medium">
                          {advertiser.website}
                        </p>
                      )}
                    </div>
                    <Separator />
                    <div className="">
                      <p className="text-xs text-gray-500">Agency Overview</p>
                      {isEditing ? (
                        <Textarea
                          id="description"
                          name="description"
                          value={editedAdvertiser.description || ""}
                          onChange={handleInputChange}
                          rows={7}
                          placeholder="Introduce your agency, share your values, and highlight your expertise."
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {advertiser.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-4 h-full">
              <CardHeader className="flex">
                <CardTitle className="flex justify-between items-center">
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      className="text-sm text-[#388A94] p-2"
                      onClick={() =>
                        (window.location.href = "/account/notifications")
                      }
                    >
                      View All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col max-h-[290px] overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="space-y-4 p-4">
                      {[...Array(5)].map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 animate-pulse"
                        >
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex flex-col gap-2">
                            <div className="w-40 h-4 bg-gray-200 rounded-md"></div>
                            <div className="w-24 h-3 bg-gray-200 rounded-md"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="text-[#1A3B47] p-4 text-center">
                      No notifications at the moment.
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {notifications.map((notification, index) => (
                        <li
                          key={index}
                          className="p-2 hover:bg-gray-50 transition-colors relative cursor-pointer flex flex-col gap-1"
                          onClick={() =>
                            (window.location.href = "/account/notifications")
                          }
                        >
                          <div
                            className="text-[#1A3B47] text-sm truncate"
                            dangerouslySetInnerHTML={{
                              __html: notification.body.slice(0, 30) + "...",
                            }}
                          ></div>
                          <p className="text-xs text-gray-500">
                            {formatDate(notification.date)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ToastViewport className="fixed top-0 right-0 p-4" />
      <Modal show={showModal} onClose={closeModal}>
        <h2 className="text-lg font-bold mb-4">Update Profile Picture</h2>
        <ImageCropper
          onImageCropped={handleImageCropped}
          currentImage={logo ? (logo.public_id ? base64Image : logo) : null}
        />
        <div className="mt-4 flex justify-end space-x-2">
          <Button
            onClick={handleFirstSave}
            className="bg-[#1A3B47] hover:bg-[#142B36] text-white px-4 py-2 rounded"
          >
            Save
          </Button>
          <Button
            onClick={closeModal}
            variant="destructive"
            className="bg-[#A3A3A3] hover:bg-[#7E7E7E] text-white px-4 py-2 rounded"
          >
            Close
          </Button>
        </div>
      </Modal>
      <Modal
        show={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        isImageViewer={true}
        imageUrl={logo?.url || logo}
      />
      <Modal
        show={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      >
        <PasswordChanger onSuccess={handlePasswordChangeSuccess} />
      </Modal>
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
              <X className="text-red-500 mr-2" />
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
