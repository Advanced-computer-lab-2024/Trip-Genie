import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";
import { Bell, LogOut, Mail, CheckCircle, X } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import { NotificationsDropdownAdmin } from "@/components/AdminNotificationsDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";

import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardContent } from "./DashboardContent";
import logo from "@/assets/images/TGlogo.svg";
import PasswordChanger from "@/components/Passwords";
import "@/styles/Modal.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const DashboardCard = ({ title, value, subtitle, icon }) => (
  <Card className="bg-white border-[#B5D3D1] border">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-[#1A3B47]">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-[#1A3B47]">{value}</div>
      <p className="text-xs text-[#388A94]">{subtitle}</p>
    </CardContent>
  </Card>
);

const tabs = [
  { id: "dashboard", title: "Dashboard", icon: "Home" },
  {
    id: "accounts",
    title: "Accounts",
    icon: "Users",
    subItems: [
      { id: "review-registration", title: "Review Registration" },
      { id: "manage-accounts", title: "Manage Accounts" },
      { id: "add-admin-governor", title: "Add Admin/Governor" },
    ],
  },
  { id: "complaints", title: "Complaints", icon: "MessageSquare" },
  { id: "notifications", title: "Notifications", icon: "Bell" },
  {
    id: "giftshop",
    title: "Gift Shop",
    icon: "Gift",
    subItems: [
      { id: "create-promo-code", title: "Create Promo Code" },
      { id: "manage-products", title: "Manage Products" },
    ],
  },
  {
    id: "activities",
    title: "Activities",
    icon: "Activity",
    subItems: [
      { id: "manage-categories", title: "Manage Categories" },
      { id: "manage-tags", title: "Manage Tags" },
      { id: "manage-activities", title: "Manage Activities" },
    ],
  },
  { id: "manage-itineraries", title: "Manage Itineraries", icon: "Map" },
  {
    id: "product",
    title: "Product",
    icon: "Gift",
    subItems: [
      { id: "my-products", title: "My Products" },
      { id: "create-product", title: "Create Product" },
      { id: "archived-products", title: "Archived Products" },
      { id: "manage-products", title: "Manage Products" },
    ],
  },
  { id: "historical-places", title: "Historical Places", icon: "Map" },
  {
    id: "reports",
    title: "Sales Reports",
    icon: "BarChart",
    subItems: [
      { id: "itinerary-sales-report", title: "Itineraries Report" },
      { id: "activity-reports", title: "Activities Report" },
      { id: "my-product-sales-report", title: "My Products Sales Report" },
      { id: "my-product-stock-report", title: "My Products Stock Report" },
      { id: "seller-product-sales-report", title: "Seller's Products Report" },
      { id: "user-stats", title: "User Statistics" },
    ],
  },
  {
    id: "promo-code-management",
    title: "Promo Codes",
    icon: "Tag",
    subItems: [
      { id: "all-promo-codes", title: "All Promo Codes" },
      { id: "create-promo-code", title: "Create Promo Code" },
    ],
  },
];

const getInitials = (name) => {
  if (!name) return "";
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("");
  return initials.slice(0, 2).toUpperCase();
};

export function Dashboard() {
  const [hasUnseenNotificationsAdmin, setHasUnseenNotificationsAdmin] =
    useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "dashboard";
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] =
    useState(false);
  const [notificationId, setNotificationId] = useState(null);

  useEffect(() => {
    console.log(`Active tab changed: ${activeTab}`);
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  const checkUnseenNotificationsAdmin = async () => {
    try {
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/admin/unseen-notifications`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setHasUnseenNotificationsAdmin(response.data.hasUnseen);
    } catch (error) {
      console.error("Error checking unseen notifications:", error);
      setHasUnseenNotificationsAdmin(false);
    }
  };

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/admin/admin-info",
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setAdminInfo(response.data);
      } catch (error) {
        console.error("Error fetching admin info:", error);
      }
    };

    fetchAdminInfo();
    checkUnseenNotificationsAdmin();
  }, []);

  const handleToggleCollapse = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleLogoutClick = () => {
    setIsLogoutConfirmationOpen(true);
    setIsDropdownOpen(false);
  };

  const handleConfirmLogout = async () => {
    console.log("Logging out...");
    try {
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/auth/logout"
      );
      if (response.ok) {
        localStorage.removeItem("role");
        localStorage.removeItem("jwt");
        Cookies.remove("jwt");
        Cookies.remove("role");
        console.log("Logged out successfully");
        setActiveTab("dashboard");
        localStorage.setItem("activeTab", "dashboard");
        window.location.href = "/login";
      } else {
        console.error("Logout failed.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleReportClick = (reportId) => {
    setActiveTab(reportId);
  };

  const handleChangePasswordClick = () => {
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handlePasswordChangeSuccess = (message) => {
    setIsModalOpen(false);
    showToast("Your password has been successfully updated.", "success");
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const showToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  return (
    <div>
      <ToastProvider>
        <div className="text-[#1A3B47] p-2 border-b bg-gray-100 border-gray-300">
          <div className="flex justify-end items-center">
            {adminInfo && (
              <DropdownMenu
                open={isDropdownOpen}
                onOpenChange={setIsDropdownOpen}
              >
                <DropdownMenuTrigger
                  className="focus:outline-none group"
                  onClick={handleDropdownToggle}
                >
                  <div className="flex items-center space-x-2 p-2 rounded-full transition-colors duration-200 group-hover:bg-[#B5D3D1]">
                    <span className="mr-2 text-[#1A3B47]">
                      {adminInfo.username}
                    </span>
                    <Avatar
                      className="h-8 w-8 !bg-[#388A94] text-white"
                      style={{ backgroundColor: "#388A94" }}
                    >
                      <AvatarFallback className="bg-transparent">
                        {getInitials(adminInfo.username)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white shadow-lg rounded-md p-2"
                >
                  <div className="flex items-center space-x-2 p-2">
                    <Avatar className="h-12 w-12 bg-[#388A94] text-white">
                      <AvatarFallback className="text-lg bg-transparet">
                        {getInitials(adminInfo.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-[#1A3B47]">
                        {adminInfo.username}
                      </p>
                      <p className="text-sm text-[#5D9297]">Administrator</p>
                    </div>
                  </div>
                  {adminInfo.email && (
                    <div className="flex items-center justify-center mt-2 text-[#1A3B47]">
                      <Mail className="mr-2 h-4 w-4" />
                      <p className="text-xs">{adminInfo.email}</p>
                    </div>
                  )}
                  <DropdownMenuItem
                    className="w-full text-[#1A3B47] hover:bg-[#B5D3D1] transition-colors duration-200 border border-gray-300 text-center mt-2"
                    onClick={handleChangePasswordClick}
                  >
                    <span className="w-full text-center">Change Password</span>
                  </DropdownMenuItem>
                  <Separator className="my-2" />
                  <DropdownMenuItem
                    className="w-full text-[#1A3B47] hover:bg-[#B5D3D1] transition-colors duration-200"
                    onClick={handleLogoutClick}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <NotificationsDropdownAdmin
              setActiveTabNav={setActiveTab}
              handleNotificationClick={setNotificationId}
            />
          </div>
        </div>
        <div className="flex bg-gray-100 relative">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onToggleCollapse={handleToggleCollapse}
          />
          <div
            className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? "ml-16" : "ml-64"
            }`}
          >
            <main className="flex-1 overflow-y-auto transition-all duration-1000 ease-in-out transform">
              <DashboardContent
                activeTab={activeTab}
                tabs={tabs}
                setActiveTab={setActiveTab}
                notificationId={notificationId}
              />
            </main>
            <footer className="sticky text-[#1A3B47] p-2 border-t border-gray-300 bg-white">
              <div className="text-center">
                © {new Date().getFullYear()} Trip Genie. All rights reserved .
              </div>
            </footer>
          </div>
        </div>
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <button
                  className="close-button"
                  onClick={() => setIsModalOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <PasswordChanger onSuccess={handlePasswordChangeSuccess} />
              </div>
            </div>
          </div>
        )}
        <ToastViewport />
        {isToastOpen && (
          <Toast
            onOpenChange={setIsToastOpen}
            open={isToastOpen}
            duration={2000}
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
        {isLogoutConfirmationOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsLogoutConfirmationOpen(false)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Are you sure you want to log out?
              </h3>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsLogoutConfirmationOpen(false)}
                  type="button"
                  className="px-4 py-2 text-sm text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  type="button"
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </ToastProvider>
    </div>
  );
}
