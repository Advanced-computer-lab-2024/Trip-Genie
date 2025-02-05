import React, { useState } from "react";
import {
  BarChart,
  Users,
  Gift,
  Activity,
  MessageSquare,
  Map,
  LogOut,
  Home,
  ChevronDown,
  Bell,
  Tag,
  X,
} from "lucide-react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/TGlogo.svg";

const tabs = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: Home,
  },
  {
    id: "accounts",
    title: "Accounts",
    icon: Users,
    subItems: [
      { id: "review-registration", title: "Review Registration" },
      { id: "manage-accounts", title: "Manage Accounts" },
      { id: "add-admin-governor", title: "Add Admin/Governor" },
    ],
  },
  {
    id: "product-management",
    title: "Product Management",
    icon: Gift,
    subItems: [
      { id: "my-products", title: "My Products" },
      { id: "manage-products", title: "All Products" },
      { id: "archived-products", title: "Archived Products" },
      { id: "create-product", title: "Create Product" },
    ],
  },
  {
    id: "activities-management",
    title: "Activities Management",
    icon: Activity,
    subItems: [
      { id: "manage-activities", title: "All Activities" },
      { id: "manage-categories", title: "Manage Categories" },
      { id: "manage-tags", title: "Manage Tags" },
    ],
  },
  {
    id: "itineraries",
    title: "Itineraries",
    icon: Map,
    subItems: [{ id: "manage-itineraries", title: "All Itineraries" }],
  },
  {
    id: "historical-places",
    title: "Historical Places",
    icon: Map,
  },
  {
    id: "promo-code-management",
    title: "Promo Codes",
    icon: Tag,
    subItems: [
      { id: "all-promo-codes", title: "All Promo Codes" },
      { id: "create-promo-code", title: "Create Promo Code" },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    icon: BarChart,
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
    id: "complaints",
    title: "Complaints",
    icon: MessageSquare,
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
  },
];

export function DashboardSidebar({
  className,
  defaultCollapsed = false,
  activeTab,
  setActiveTab,
  onToggleCollapse,
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [openMenu, setOpenMenu] = useState(null);
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] =
    useState(false);
  const navigate = useNavigate();

  const toggleMenu = (menuId) => {
    setOpenMenu(openMenu === menuId ? null : menuId);
  };

  const getTransitionDelay = (index) => {
    return `${index * 100}ms`;
  };

  const handleLogoutClick = () => {
    setIsLogoutConfirmationOpen(true);
  };

  const handleConfirmLogout = async () => {
    console.log("Logging out...");
    try {
      const response = await fetch("http://localhost:4000/auth/logout");

      if (response.ok) {
        Cookies.remove("jwt");
        Cookies.remove("role");
        console.log("Logged out successfully");
        setActiveTab("dashboard");
        localStorage.setItem("activeTab", "dashboard");
        navigate("/login");
        window.location.reload();
      } else {
        console.error("Logout failed.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onToggleCollapse(!isCollapsed);
  };

  const handleTabClick = (tabId) => {
    console.log(`Tab clicked: ${tabId}`);
    setActiveTab(tabId);
    if (
      tabId.startsWith("itinerary-sales-report") ||
      tabId.startsWith("activity-reports") ||
      tabId.startsWith("my-product-sales-report") ||
      tabId.startsWith("my-product-stock-report") ||
      tabId.startsWith("seller-product-sales-report") ||
      tabId.startsWith("user-stats")
    ) {
      setOpenMenu("reports");
    }
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen flex flex-col bg-[#1A3B47] ${
        isCollapsed ? "w-16" : "w-64"
      } transition-all duration-300 ease-in-out ${className}`}
      style={{ zIndex: 1000 }}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#1A3B47]/20">
        {!isCollapsed && (
          <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
        )}
        <button
          className={`text-white hover:bg-white/10 p-2 rounded-md transition-all duration-200 ${
            isCollapsed ? "w-full flex justify-center" : ""
          }`}
          onClick={handleToggleCollapse}
        >
          <div className="flex flex-col items-center justify-center w-6 h-6">
            <div className="w-4 h-0.5 bg-white mb-1"></div>
            <div className="w-4 h-0.5 bg-white mb-1"></div>
            <div className="w-4 h-0.5 bg-white"></div>
          </div>
          <span className="sr-only">Toggle sidebar</span>
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-custom">
        <div className="p-2 space-y-1">
          {tabs.map((tab) => (
            <React.Fragment key={tab.id}>
              {tab.subItems ? (
                <div>
                  <button
                    className={`flex items-center w-full p-2 rounded-md transition-all duration-200 text-white hover:bg-white/10 ${
                      activeTab === tab.id ? "bg-white/20" : ""
                    }`}
                    onClick={() => toggleMenu(tab.id)}
                  >
                    <tab.icon
                      className={`h-5 w-5 min-w-[1.25rem] ${
                        isCollapsed ? "" : "mr-3"
                      }`}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left truncate">
                          {tab.title}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            openMenu === tab.id ? "transform rotate-180" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>
                  <div
                    className={`pl-7 space-y-1 overflow-hidden transition-all duration-500 ease-in-out ${
                      openMenu === tab.id && !isCollapsed
                        ? "max-h-96"
                        : "max-h-0"
                    }`}
                  >
                    {tab.subItems.map((subItem, index) => (
                      <button
                        key={subItem.id}
                        className={`flex items-center w-full p-2 rounded-md transition-all duration-500 ease-in-out text-white/70 hover:text-white hover:bg-white/10 ${
                          activeTab === subItem.id
                            ? "bg-white/20 text-white"
                            : ""
                        }`}
                        style={{ transitionDelay: getTransitionDelay(index) }}
                        onClick={() => handleTabClick(subItem.id)}
                      >
                        <span className="truncate">{subItem.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  className={`flex items-center w-full p-2 rounded-md transition-all duration-200 text-white hover:bg-white/10 ${
                    activeTab === tab.id ? "bg-white/20" : ""
                  }`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <tab.icon
                    className={`h-5 w-5 min-w-[1.25rem] ${
                      isCollapsed ? "" : "mr-3"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{tab.title}</span>
                  )}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-[#1A3B47]/20 p-2">
        <hr className="my-2 border-white" />
        <button
          className={`w-full flex items-center justify-start text-white hover:bg-white/10 p-2 rounded-md transition-all duration-200 ${
            isCollapsed ? "justify-center" : ""
          }`}
          onClick={handleLogoutClick}
        >
          <LogOut
            className={`h-5 w-5 min-w-[1.25rem] ${isCollapsed ? "" : "mr-3"}`}
          />
          {!isCollapsed && <span className="truncate">Logout</span>}
        </button>
      </div>

      {/* Logout Confirmation Popup */}
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
    </div>
  );
}
