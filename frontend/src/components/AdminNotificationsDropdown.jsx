"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Gift,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCheck,
  AlarmCheck,
} from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

export function NotificationsDropdownAdmin({
  setActiveTabNav,
  handleNotificationClick,
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasUnseenNotifications, setHasUnseenNotifications] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const navigate = useNavigate();

  const [visibleNotifications, setVisibleNotifications] = useState(10); // Number of notifications to show

  useEffect(() => {
    checkUnseenNotifications();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      markNotificationsAsSeen();
    }
  }, [isOpen]);

  const checkUnseenNotifications = async () => {
    try {
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/admin/unseen-notifications`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setHasUnseenNotifications(response.data.hasUnseen);
    } catch (error) {
      console.error("Error checking unseen notifications:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/admin/notifications`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );

      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else if (response.data && Array.isArray(response.data.notifications)) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setTimeout(() => {
        // After 3 seconds, set loading to false
        setLoading(false);
      }, 1000);
    }
  };

  const markNotificationsAsSeen = async () => {
    try {
      await axios.post(
        `https://trip-genie-apis.vercel.app/admin/mark-dropdown-opened`,
        {},
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );

      setHasUnseenNotifications(false);
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
    }
  };

  const markNotificationAsSeen = async (notificationId) => {
    try {
      await axios.post(
        `https://trip-genie-apis.vercel.app/admin/notifications/markAsSeen/${notificationId}`,
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

  const markAllAsSeen = async () => {
    try {
      await axios.post(
        `https://trip-genie-apis.vercel.app/admin/mark-notifications-seen`,
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
      setHasUnseenNotifications(false);
    } catch (error) {
      console.error("Error marking all notifications as seen:", error);
    }
  };

  const openNotification = (notification) => {
    setSelectedNotification(notification);
    if (!notification.seen) {
      markNotificationAsSeen(notification._id);
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
                  console.log(`Notification clicked: ${part}`);
                  const productId = notification.link.split("/").pop();
                  console.log(`Product ID: ${productId}`);
                  setActiveTab("manage-products");
                  setSelectedProductId(productId); // Set selectedProductId instead of navigating
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
                padding: "8px", // Optional: for better padding around the text
                borderRadius: "8px", // Optional: rounded corners for the tooltip
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
    switch (activeTab) {
      case "reminders":
        return notifications
          .filter((n) => n.tags.includes("reminder"))
          .slice(0, visibleNotifications); // Limit to visibleNotifications
      case "alert":
        return notifications
          .filter((n) =>
            n.tags.some((tag) => ["alert", "out_of_stock"].includes(tag))
          )
          .slice(0, visibleNotifications); // Limit to visibleNotifications
      case "general":
      default:
        return notifications.slice(0, visibleNotifications); // Limit to visibleNotifications
    }
  };

  const getCounts = () => {
    return {
      reminders: notifications.filter(
        (n) => !n.seen && n.tags.includes("reminder")
      ).length,
      alert: notifications.filter(
        (n) =>
          !n.seen &&
          n.tags.some((tag) => ["out_of_stock", "alert"].includes(tag))
      ).length,
      general: notifications.filter((n) => !n.seen).length,
    };
  };

  const getNotificationIcon = (type) => {
    const iconProps = {
      birthday: {
        icon: Calendar,
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

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#1A3B47] hover:bg-white/10 p-2 rounded-full transition-colors duration-200 mr-2 relative"
          >
            <Bell className="h-6 w-6 " />
            {hasUnseenNotifications && (
              <span className="absolute top-1 right-2 block h-3 w-3 rounded-full bg-red-500" />
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[440px] p-0" align="end">
          <div className="flex items-center justify-between p-3">
            <h2 className="text-lg font-medium ">Notifications</h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-muted-foreground"
                onClick={markAllAsSeen}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
              {/* <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => navigate("/tourist-notifications")}
            >
              View all notifications
            </Button> */}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between px-4 py-2 bg-white">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-white">
                <TabsTrigger
                  value="general"
                  className={`relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                    activeTab === "general"
                      ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none "
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
                {/* <TabsTrigger
        value="reminders"
        className={`relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${activeTab === 'reminders'
          ? 'border-[#1A3B47] text-[#1A3B47] border-b-2 '
          : 'border-gray-300 text-gray-500 bg-white'
        }`}
      >
        Reminders
        {getCounts().reminders > 0 && (
          <span
            className={`ml-2 flex items-center justify-center h-5 w-5 text-xs font-semibold rounded-full ${activeTab === 'reminders' ? 'bg-[#1A3B47] text-white' : 'bg-gray-300 text-gray-800'
              }`}
          >
            {getCounts().reminders}
          </span>
        )}
      </TabsTrigger> */}
              </TabsList>
            </Tabs>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="space-y-4">
                {/* Grey Tabs for loading */}

                {/* Skeleton List of Notifications */}
                <div className="space-y-2 px-4 py-2">
                  <div className="flex gap-4 p-4 animate-pulse bg-gray-200 rounded-md">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="w-full h-4 bg-gray-300 rounded-md"></div>
                      <div className="w-3/4 h-4 bg-gray-300 rounded-md"></div>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 animate-pulse bg-gray-200 rounded-md">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="w-full h-4 bg-gray-300 rounded-md"></div>
                      <div className="w-3/4 h-4 bg-gray-300 rounded-md"></div>
                    </div>
                  </div>
                  {/* Add more skeleton items as needed */}
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-[#1A3B47] p-4 text-center">
                No notifications at the moment.
              </p>
            ) : (
              <div>
                {/* Check if filtered notifications are empty */}
                {getFilteredNotifications().length === 0 ? (
                  <div className="text-center p-4 text-sm text-muted-foreground">
                    <p>No notifications available for this tab.</p>
                  </div>
                ) : (
                  getFilteredNotifications().map((notification, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-4 p-4 hover:bg-muted/50 cursor-pointer relative",
                        !notification.seen && "bg-muted/30"
                      )}
                      onClick={() => setActiveTabNav("notifications")}
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 space-y-1">
                        <p className="text-base font-medium">
                          {notification.title ||
                            renderNotificationBody(
                              notification.body,
                              notification
                            )}
                        </p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(notification.date)}
                          </p>
                        </div>
                      </div>
                      {!notification.seen && (
                        <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-orange-500" />
                      )}
                    </div>
                  ))
                )}

                {/* Display "X more notifications" message */}
                <div className="text-sm text-muted-foreground text-center p-4">
                  {notifications.length > 10 &&
                    getFilteredNotifications().length === 10 && (
                      <span className="font-medium">
                        And {notifications.length - 10} more notifications.{" "}
                      </span>
                    )}
                  <span
                    className="text-[#388A94] cursor-pointer hover:underline"
                    onClick={() => setActiveTabNav("notifications")}
                  >
                    Click here to view all.
                  </span>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>

        {selectedNotification && (
          <Dialog
            open={!!selectedNotification}
            onOpenChange={() => setSelectedNotification(null)}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{selectedNotification.title}</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                <div className="space-y-2">
                  <div>
                    {renderNotificationBody(
                      selectedNotification.body,
                      selectedNotification
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedNotification.date)}
                  </p>

                  {/* Priority Section */}
                  {selectedNotification.priority && (
                    <div className="mt-2">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          selectedNotification.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : selectedNotification.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {selectedNotification.priority}
                      </span>
                    </div>
                  )}

                  {/* Display Tags if available */}
                  {selectedNotification.tags &&
                    selectedNotification.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedNotification.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs font-medium bg-gray-200 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </DialogDescription>
            </DialogContent>
          </Dialog>
        )}
      </Popover>
    </TooltipProvider>
  );
}
