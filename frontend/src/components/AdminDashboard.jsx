import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart,
  Activity,
  Gift,
  Map,
  Archive,
  Package,
  Compass,
  Landmark,
  Tag,
  CalendarIcon,
  CreditCard,
  AlertCircle,
  AlarmCheck,
  Bell,
  LineChart,
  Boxes,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";

// import { UserGrowthChart } from "./UserStats";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, set } from "date-fns";

function UserGrowthChart() {
  const [yearlyData, setYearlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchYearlyData();
  }, []);

  const fetchYearlyData = async () => {
    try {
      const token = Cookies.get("jwt");
      const currentYear = new Date().getFullYear();
      const monthlyData = [];

      for (let month = 0; month < 12; month++) {
        const response = await axios.get(
          `https://trip-genie-apis.vercel.app/admin/users-report?month=${
            month + 1
          }&year=${currentYear}`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        monthlyData.push({
          month: format(new Date(currentYear, month), "MMM"),
          users: response.data.total || 0,
        });
      }

      setYearlyData(monthlyData);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={yearlyData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#B5D3D1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#B5D3D1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#B5D3D1"
            fillOpacity={1}
            fill="url(#colorUsers)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Dashboard({ setActiveTab }) {
  const [notifications, setNotifications] = useState([]);
  const [adminInfo, setAdminInfo] = useState(null);
  const [pageVisits, setPageVisits] = useState(0);
  const [pageVisitsToday, setPageVisitsToday] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSellerRevenue, setTotalSellerRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  // const [totalRevenueLastMonth, setTotalRevenueLastMonth] = useState(0);

  useEffect(() => {
    Promise.all([
      fetchNotifications(),
      fetchAdminInfo(),
      fetchPageVisits(),
      fetchSalesReport(),
    ]);
  }, []);

  // fetch https://trip-genie-apis.vercel.app/admin/sales-report

  // const fetchSalesReportLastMonth = async () => {
  //   try {
  //     // last month number
  //     const lastMonth = (new Date().getMonth() - 1);
  //     if (lastMonth = 0) {
  //       lastMonth = 12;
  //     }
  //     // get year of last month
  //     const lastMonthYear = new Date().getFullYear();
  //     if (lastMonth = 12) {
  //       lastMonthYear = lastMonthYear - 1;
  //     }

  //     const response = await axios.get( `https://trip-genie-apis.vercel.app/admin/sales-report?month=${lastMonth}&year=${lastMonthYear}`,
  //       {  credentials: "include", headers: { Authorization: `Bearer ${Cookies.get("jwt")}` } }
  //     );
  //     setTotalRevenueLastMonth(response.data.totalAdminSalesRevenue);
  //   } catch (error) {
  //     console.error("Error fetching sales report:", error);
  //   }
  // };

  const fetchSalesReport = async () => {
    try {
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/admin/sales-report",
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setTotalRevenue(response.data.totalAdminSalesRevenue);
      setTotalSellerRevenue(response.data.totalSellerSalesRevenue);

      // sum of item.sales from the response
      const sumSales = response.data.adminProductsSales.reduce(
        (acc, item) => acc + item.sales,
        0
      );
      setTotalSales(sumSales);
    } catch (error) {
      console.error("Error fetching sales report:", error);
    }
  };

  const fetchPageVisits = async () => {
    try {
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/visit-count"
      );
      setPageVisits(response.data.visitCount.count);
      setPageVisitsToday(response.data.visitCount.dailyCount);
    } catch (error) {
      console.error("Error fetching page visits:", error);
    }
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
        <Icon className={cn("h-4 w-4", iconProps.color)} />
      </div>
    );
  };

  const fetchNotifications = async () => {
    try {
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
      } else {
        console.error("Unexpected data format received from server.");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
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

  const getInitials = (name) => {
    if (!name) return "";
    const initials = name
      .split(" ")
      .map((word) => word[0])
      .join("");
    return initials.slice(0, 2).toUpperCase();
  };

  const handleReportClick = (reportId) => {
    setActiveTab(reportId);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 space-y-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="view">View</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#1A3B47]">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-[#5D9297]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#388A94]">
                    ${totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-[#1A3B47]">Your Sales Revenue</p>
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#1A3B47]">
                    Total Sales
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-[#5D9297]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#388A94]">
                    {totalSales.toLocaleString()}
                  </div>
                  <p className="text-xs text-[#1A3B47]">number of your sales</p>
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#1A3B47]">
                    Seller Revenue
                  </CardTitle>
                  <Users className="h-4 w-4 text-[#5D9297]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#388A94]">
                    ${totalSellerRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-[#1A3B47]">
                    10% of all seller sales
                  </p>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#1A3B47]">
                    Total Page Visits
                  </CardTitle>
                  <LineChart className="h-4 w-4 text-[#5D9297]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#388A94]">
                    {pageVisits.toLocaleString()}
                  </div>
                  <p className="text-xs text-[#1A3B47]">
                    +{pageVisitsToday.toLocaleString()} today
                  </p>
                </CardContent>
              </Card>
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="text-[#1A3B47]">User Info</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback className="bg-[#B5D3D1] text-[#1A3B47]">
                      {getInitials(adminInfo?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-[#1A3B47]">
                      {adminInfo?.username || "John Doe"}
                    </h3>
                    {adminInfo?.email && (
                      <p className="text-sm text-[#5D9297]">
                        {adminInfo.email}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>User Statistcs Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <UserGrowthChart />
                </CardContent>
              </Card>
              <Card className="col-span-1 h-[300px]" id="notifications-card">
                <CardHeader className="flex">
                  <CardTitle className="flex justify-between items-center">
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <Button
                        variant="ghost"
                        className="text-sm text-[#388A94] p-2"
                        onClick={() => setActiveTab("notifications")}
                      >
                        View All
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[180px]">
                    {notifications.length === 0 ? (
                      <p className="text-[#1A3B47] bg-gray-100 p-4 rounded-lg shadow text-center">
                        No notifications at the moment.
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {notifications.map((notification, index) => (
                          <li
                            key={index}
                            className="p-3 hover:bg-gray-50 transition-colors relative cursor-pointer flex items-center gap-2"
                            onClick={() => {
                              markNotificationAsSeen(notification._id);
                              setActiveTab("notifications");
                            }}
                          >
                            {/* Icon */}
                            {getNotificationIcon(notification.type)}

                            {/* Notification Details */}
                            <div className="ml-4 flex-1">
                              <p className="text-sm text-[#1A3B47] mb-1">
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: notification.body,
                                  }}
                                ></div>
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(notification.date).toLocaleDateString(
                                  undefined,
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>

                            {/* "New" Badge */}
                            {!notification.seen && (
                              <span className="absolute top-2 right-2 bg-[#F88C33] text-white text-xs px-2 py-1 rounded-full">
                                New
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="view" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>View Content</CardTitle>
                <CardDescription>Select a view to display.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <button
                    onClick={() => handleReportClick("manage-activities")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Activity className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>All Activities</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("manage-itineraries")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Compass className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>All Itineraries</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("manage-products")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Package className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>All Products</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("my-products")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Gift className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>My Products</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("archived-products")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Archive className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Archived Products</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("historical-places")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Landmark className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Historical Places</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Content</CardTitle>
                <CardDescription>Select a management option.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <button
                    onClick={() => handleReportClick("review-registration")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Users className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Review Registration</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("manage-accounts")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Users className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Manage Accounts</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("add-admin-governor")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Users className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Add Admin/Governor</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("manage-categories")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Tag className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Manage Categories</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("manage-tags")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Tag className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Manage Tags</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("create-promo-code")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Tag className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Create Promo Code</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("manage-activities")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Activity className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Manage Activities</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("manage-itineraries")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Compass className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Manage Itineraries</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports Content</CardTitle>
                <CardDescription>Select a report to view.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <button
                    onClick={() => handleReportClick("itinerary-sales-report")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <BarChart className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Itineraries Report</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("activity-reports")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Activity className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Activities Report</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("my-product-sales-report")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Gift className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>My Products Sales Report</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("my-product-stock-report")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Boxes className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>My Products Stock Report</span>
                  </button>
                  <button
                    onClick={() =>
                      handleReportClick("seller-product-sales-report")
                    }
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Users className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>Seller's Products Report</span>
                  </button>
                  <button
                    onClick={() => handleReportClick("user-stats")}
                    className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <BarChart className="h-12 w-12 mb-2 text-[#388A94]" />
                    <span>User Statistics</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
