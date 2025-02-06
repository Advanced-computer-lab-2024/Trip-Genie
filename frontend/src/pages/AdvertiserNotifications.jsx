"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Gift,
  CreditCard,
  AlertCircle,
  CheckCheck,
  AlarmCheck,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  X,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
} from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast";

export default function AdvertiserNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [visibleNotifications, setVisibleNotifications] = useState(10);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/advertiser/notifications`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );

      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else if (response.data && Array.isArray(response.data.notifications)) {
        setNotifications(response.data.notifications);
      } else {
        setError("Unexpected data format received from server.");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      if (!error.response) {
        setError(
          "Cannot connect to server. Please check if the server is running."
        );
      } else if (error.response.status === 400) {
        setNotifications([]);
      } else {
        setError(
          `Server error: ${
            error.response?.data?.message || "Unknown error occurred"
          }`
        );
      }
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  const markNotificationsAsSeen = async () => {
    try {
      await axios.post(
        `https://trip-genie-apis.vercel.app/advertiser/mark-notifications-seen`,
        {},
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          seen: true,
        }))
      );
      showToast("All notifications marked as read!", "success");
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
      showToast("Error marking notifications as read.", "error");
    }
  };

  const markNotificationAsSeen = async (notificationId) => {
    try {
      await axios.post(
        `https://trip-genie-apis.vercel.app/advertiser/notifications/markAsSeen/${notificationId}`,
        {},
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, seen: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as seen:", error);
    }
  };

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else {
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return date.toLocaleDateString(undefined, options);
    }
  };

  const renderNotificationBody = (body, notification) => {
    const regex = /<b>(.*?)<\/b>/g;
    const parts = body.split(regex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <span
                className="font-bold cursor-pointer text-[#1A3B47] hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  markNotificationAsSeen(notification._id);
                  navigate(notification.link);
                }}
              >
                {part}
              </span>
            </TooltipTrigger>
            <TooltipContent
              style={{
                backgroundColor: "#1A3B47",
                color: "white",
                textAlign: "center",
                padding: "8px",
                borderRadius: "8px",
              }}
            >
              {`Show details for ${part}`}
            </TooltipContent>
          </Tooltip>
        );
      }
      return part;
    });
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Tab filter
    switch (activeTab) {
      case "reminders":
        filtered = filtered.filter((n) => n.tags.includes("reminder"));
        break;
      case "alert":
        filtered = filtered.filter((n) =>
          n.tags.some((tag) => ["birthday", "alert"].includes(tag))
        );
        break;
      case "general":
        break;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title?.toLowerCase().includes(query) ||
          n.body?.toLowerCase().includes(query)
      );
    }

    // Priority filter
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter((n) =>
        selectedPriorities.includes(n.priority)
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((n) =>
        n.tags?.some((tag) => selectedTags.includes(tag))
      );
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter((n) => {
        const notificationDate = new Date(n.date);
        return notificationDate >= selectedDate;
      });
    }

    return filtered.slice(0, visibleNotifications);
  };

  const getTotalCounts = () => {
    const counts = {
      reminders: 0,
      alert: 0,
      general: notifications.length,
    };

    counts.reminders = notifications.filter((n) =>
      n.tags.includes("reminder")
    ).length;
    counts.alert = notifications.filter((n) =>
      n.tags.some((tag) => ["birthday", "alert"].includes(tag))
    ).length;

    return counts;
  };

  const getCounts = () => {
    return {
      reminders: notifications.filter(
        (n) => !n.seen && n.tags.includes("reminder")
      ).length,
      alert: notifications.filter(
        (n) =>
          !n.seen && n.tags.some((tag) => ["birthday", "alert"].includes(tag))
      ).length,
      general: notifications.filter((n) => !n.seen).length,
    };
  };

  const getNotificationIcon = (type) => {
    const iconProps = {
      birthday: {
        icon: CalendarIcon,
        color: "text-purple-500",
        bg: "bg-purple-100",
      },
      payment: {
        icon: CreditCard,
        color: "text-green-500",
        bg: "bg-green-100",
      },
      alert: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-100" },
      offer: { icon: Gift, color: "text-blue-500", bg: "bg-blue-100" },
      reminder: {
        icon: AlarmCheck,
        color: "text-amber-500",
        bg: "bg-amber-100",
      },
    }[type] || { icon: Bell, color: "text-gray-500", bg: "bg-gray-100" };

    const Icon = iconProps.icon;
    return (
      <div
        className={cn(
          "p-2 rounded-full flex items-center justify-center",
          iconProps.bg
        )}
      >
        <Icon className={cn("h-5 w-5", iconProps.color)} />
      </div>
    );
  };

  const getAllTags = () => {
    const tags = new Set();
    notifications.forEach((n) => n.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      default:
        return "bg-white";
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-[#1A3B47] bg-[#B5D3D1] p-4 rounded-lg shadow">
          {error}
        </p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <TooltipProvider>
        <div className=" min-h-screen">
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-sm text-gray-500 mb-6">Settings / Notifications</p>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex gap-6">
              {/* Main Content */}
              <div className="flex-1">
                {/* Search and Actions Row */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                  <div className="grid grid-cols-9 items-center gap-4">
                    {/* Tabs */}
                    <div className="col-span-3">
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid grid-cols-2 bg-white">
                          {/* General Tab */}
                          <TabsTrigger
                            value="general"
                            className={`relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                              activeTab === "general"
                                ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                                : "border-gray-300 text-gray-500 bg-white"
                            }`}
                          >
                            General
                            {getCounts().general > 0 && (
                              <span
                                className={`ml-2 flex items-center justify-center h-5 w-5 text-xs font-semibold rounded-full ${
                                  activeTab === "general"
                                    ? "bg-[#1A3B47] text-white"
                                    : "bg-gray-300 text-gray-800"
                                }`}
                              >
                                {getCounts().general}
                              </span>
                            )}
                          </TabsTrigger>

                          {/* Alert Tab */}
                          <TabsTrigger
                            value="alert"
                            className={`relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                              activeTab === "alert"
                                ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                                : "border-gray-300 text-gray-500 bg-white"
                            }`}
                          >
                            Alerts
                            {getCounts().alert > 0 && (
                              <span
                                className={`ml-2 flex items-center justify-center h-5 w-5 text-xs font-semibold rounded-full ${
                                  activeTab === "alert"
                                    ? "bg-[#1A3B47] text-white"
                                    : "bg-gray-300 text-gray-800"
                                }`}
                              >
                                {getCounts().alert}
                              </span>
                            )}
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Search Bar */}
                    <div className="col-span-4 relative">
                      {!isFocused && !searchQuery && (
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      )}
                      <Input
                        placeholder={
                          !isFocused ? "    Search notifications..." : ""
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="pl-10"
                      />
                    </div>

                    {/* Mark All As Read Button */}
                    <div className="col-span-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-sm text-white bg-[#388A94] hover:bg-[#2e6b77] whitespace-nowrap"
                        onClick={markNotificationsAsSeen}
                        disabled={notifications.length === 0} // Disable button if no notifications
                      >
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark all as read
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {loading ? (
                      [1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex gap-4 p-4 animate-pulse bg-gray-200"
                        >
                          <div className="w-12 h-12 bg-gray-300 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="w-full h-4 bg-gray-300 rounded-md" />
                            <div className="w-3/4 h-4 bg-gray-300 rounded-md" />
                          </div>
                        </div>
                      ))
                    ) : notifications.length === 0 ? (
                      <p className="text-[#1A3B47] p-4 text-center">
                        No notifications at the moment.
                      </p>
                    ) : getFilteredNotifications().length === 0 ? (
                      <div className="bg-white p-8 text-center border-t border-gray-200">
                        <p className="text-gray-500">
                          No notifications match your filters
                        </p>
                      </div>
                    ) : (
                      <>
                        <Accordion
                          type="single"
                          collapsible
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {getFilteredNotifications().map(
                            (notification, index) => (
                              <AccordionItem
                                value={notification._id}
                                key={notification._id}
                              >
                                <AccordionTrigger
                                  onClick={() => {
                                    markNotificationAsSeen(notification._id);
                                    setActiveAccordion((prev) =>
                                      prev === notification._id
                                        ? null
                                        : notification._id
                                    );
                                  }}
                                  className={cn(
                                    "flex items-center gap-4 p-4",
                                    index !== 0 && "border-t border-gray-200",
                                    !notification.seen && "bg-gray-50",
                                    "no-underline hover:underline hover:decoration-transparent"
                                  )}
                                >
                                  {/* Notification Icon */}
                                  <div className="relative flex items-center">
                                    <div
                                      className={cn(
                                        "transition-transform duration-200 ease-in-out",
                                        notification._id === activeAccordion
                                          ? "scale-125"
                                          : "scale-100"
                                      )}
                                    >
                                      {getNotificationIcon(notification.type)}
                                    </div>
                                    {/* Unseen Notification Dot */}
                                    {!notification.seen && (
                                      <div className="absolute bottom-0 left-7 h-3 w-3 rounded-full bg-[#5D9297]" />
                                    )}
                                  </div>

                                  {/* Title and Preview */}
                                  <div className="flex-1 text-left">
                                    <p
                                      className={cn(
                                        "font-medium text-[#1A3B47] transition-all duration-200 ease-in-out",
                                        notification._id === activeAccordion
                                          ? "text-lg font-bold"
                                          : "text-base"
                                      )}
                                    >
                                      {notification.title ||
                                        renderNotificationBody(
                                          notification.body,
                                          notification
                                        )}
                                    </p>
                                    {/* Preview Text */}
                                    {notification._id !== activeAccordion ? (
                                      <p className="text-sm text-gray-500 mt-1"></p>
                                    ) : (
                                      <p className="text-sm text-white mt-1">
                                        {notification.body}
                                      </p>
                                    )}
                                  </div>

                                  {/* Date */}
                                  <p className="text-xs text-gray-400">
                                    {formatDate(notification.date)}
                                  </p>

                                  <div
                                    className={cn(
                                      "flex items-center justify-center rounded-full transition-all duration-200 ease-in-out",
                                      getPriorityColor(notification.priority), // Apply color based on priority
                                      notification._id === activeAccordion
                                        ? "w-auto px-3 py-1 text-xs font-medium text-white border-none scale-100"
                                        : "w-3 h-3 scale-1"
                                    )}
                                  >
                                    {/* Show "Important!" for high priority, "Medium" for medium priority, and nothing for low priority */}
                                    {notification._id === activeAccordion && (
                                      <>
                                        {notification.priority === "high" && (
                                          <span className="text-xs text-white">
                                            Important!
                                          </span> // High priority
                                        )}
                                        {notification.priority === "medium" && (
                                          <span className="text-xs text-white">
                                            Medium Priority
                                          </span> // Medium priority
                                        )}
                                        {/* No text for low priority */}
                                      </>
                                    )}
                                  </div>
                                </AccordionTrigger>

                                <AccordionContent className="p-4 bg-gray-50">
                                  {/* Full Body */}
                                  <div className="text-sm text-[#1A3B47]">
                                    {renderNotificationBody(
                                      notification.body,
                                      notification
                                    )}
                                  </div>
                                  {/* Tags */}
                                  <div className="mt-2 flex items-center gap-2">
                                    {notification.tags?.map((tag, index) => (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-[#B5D3D1] text-[#1A3B47] hover:bg-[#B5D3D1] hover:text-[#1A3B47]"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )
                          )}
                        </Accordion>
                        {visibleNotifications < getTotalCounts()[activeTab] && (
                          <div className="p-4 flex justify-center border-t border-gray-200">
                            <span
                              className="text-[#388A94] cursor-pointer hover:text-[#2e6b77] hover:underline"
                              onClick={() =>
                                setVisibleNotifications((prev) => prev + 15)
                              }
                            >
                              Load more notifications...
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
      <ToastViewport className="fixed top-0 right-0 p-4" />
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
    </ToastProvider>
  );
}
