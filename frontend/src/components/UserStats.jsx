import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { format, subMonths } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function UserStats() {
  const [stats, setStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState({
    currentMonth: null,
    lastMonth: null,
  });
  const [filteredStats, setFilteredStats] = useState(null);
  const [filters, setFilters] = useState({
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState("total");

  // Fetch all-time stats
  useEffect(() => {
    fetchAllTimeStats();
  }, []);

  // Fetch monthly stats and yearly data
  useEffect(() => {
    fetchMonthlyStats();
  }, []);

  // Fetch filtered stats when filters change
  useEffect(() => {
    fetchFilteredStats();
  }, [filters]);

  const fetchAllTimeStats = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/admin/users-report",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(response.data);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("jwt");
      const currentDate = new Date();
      const lastMonth = subMonths(currentDate, 1);

      // Get current month stats
      const currentMonthResponse = await axios.get(
        `https://trip-genie-apis.vercel.app/admin/users-report?month=${
          currentDate.getMonth() + 1
        }&year=${currentDate.getFullYear()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Get last month stats
      const lastMonthResponse = await axios.get(
        `https://trip-genie-apis.vercel.app/admin/users-report?month=${
          lastMonth.getMonth() + 1
        }&year=${lastMonth.getFullYear()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMonthlyStats({
        currentMonth: currentMonthResponse.data,
        lastMonth: lastMonthResponse.data,
      });

      setIsLoading(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchFilteredStats = async () => {
    setIsLoading(true);
    try {
      setIsFiltering(true);
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/admin/users-report?month=${filters.month}&year=${filters.year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFilteredStats(response.data);
      setIsFiltering(false);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching filtered stats:", err);
      setIsFiltering(false);
    }
  };

  const calculateChange = (current, previous) => {
    if (!previous || previous.total === 0) return current?.total > 0 ? 100 : 0;
    return ((current?.total - previous.total) / previous.total) * 100;
  };

  //if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  const monthlyChange = calculateChange(
    monthlyStats.currentMonth,
    monthlyStats.lastMonth
  );

  // Use filteredStats for the bottom table, but keep using stats for the top cards
  const tableData = [
    { type: "Tourists", count: filteredStats?.tourist || 0 },
    { type: "Tour Guides", count: filteredStats?.tourGuide || 0 },
    { type: "Sellers", count: filteredStats?.seller || 0 },
    { type: "Advertisers", count: filteredStats?.advertiser || 0 },
    { type: "Governors", count: filteredStats?.governor || 0 },
    { type: "Admins", count: filteredStats?.admin || 0 },
  ];

  const userTypes = [
    "total",
    "tourist",
    "tourGuide",
    "seller",
    "advertiser",
    "governor",
    "admin",
  ];

  const selectedUserCount = stats?.[selectedUserType] || 0;
  const totalUsers = stats?.total || 0;
  const fillPercentage = totalUsers
    ? (selectedUserCount / totalUsers) * 100
    : 0;

  const resetFilters = () => {
    setFilters({
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="">
        <div className="grid gap-4 md:grid-cols-12 mb-4">
          {/* Total Users Card */}
          <Card className="md:col-span-4 flex flex-col justify-center items-center">
            <CardHeader className="p-3 w-full">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#1A3B47]">
                  Total Users
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-[100px] h-7 text-[#388A94] focus:ring-0 focus:ring-offset-0"
                    >
                      <span className="mr-1">
                        {selectedUserType.charAt(0).toUpperCase() +
                          selectedUserType.slice(1)}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[100px]">
                    {userTypes.map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onSelect={() => setSelectedUserType(type)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            {isLoading ? (
              <CardContent className="p-3 flex flex-col justify-center items-center w-full">
                <div className="relative flex items-center justify-center w-32 h-32">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#E6DCCF"
                      strokeWidth="10"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#1A3B47"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      strokeDashoffset="283"
                      initial={{ strokeDashoffset: 283 }}
                      animate={{
                        strokeDashoffset: 283 - (283 * fillPercentage) / 100,
                      }}
                      transition={{
                        duration: 1,
                        ease: "easeInOut",
                      }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-[#1A3B47]">
                      <div className="h-4 w-1/2 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    </span>
                    <div className="h-4 w-1/2 mx-auto bg-gray-200 rounded mb-4 animate-pulse -mt-4"></div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <p className="text-base text-[#5D9297]">% of total</p>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-3 flex flex-col justify-center items-center w-full">
                <div className="relative flex items-center justify-center w-32 h-32">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#E6DCCF"
                      strokeWidth="10"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#1A3B47"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      strokeDashoffset="283"
                      initial={{ strokeDashoffset: 283 }}
                      animate={{
                        strokeDashoffset: 283 - (283 * fillPercentage) / 100,
                      }}
                      transition={{
                        duration: 1,
                        ease: "easeInOut",
                      }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-[#1A3B47]">
                      {selectedUserCount}
                    </span>
                    <span className="text-sm text-[#5D9297]">
                      {selectedUserType.charAt(0).toUpperCase() +
                        selectedUserType.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <p className="text-base text-[#5D9297]">
                    {fillPercentage.toFixed(1)}% of total
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* User Growth Chart */}
          <Card className="md:col-span-8">
            <CardHeader className="p-3">
              <CardTitle className="text-lg font-bold text-[#1A3B47]">
                User Growth
              </CardTitle>
            </CardHeader>

            <CardContent>
              <UserGrowthChart />
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats Table */}
        <Card>
          <CardHeader className="p-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-[#1A3B47]">
                Monthly New Users
              </CardTitle>
              <button
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <Select
                value={filters.year}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, year: value }))
                }
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => (
                    <SelectItem
                      key={i}
                      value={(new Date().getFullYear() - i).toString()}
                    >
                      {new Date().getFullYear() - i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.month}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, month: value }))
                }
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {format(new Date(2024, i), "MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                {isLoading ? (
                  <thead className="bg-gray-50">
                    {/* 6 more rows of pulsing lines with more space and bigger size */}
                    {[...Array(6)].map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        {[1, 2, 3].map((i) => (
                          <th key={i} className="px-6 py-3">
                            <div className="h-6 w-full bg-gray-300 rounded animate-pulse mb-4"></div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                ) : (
                  <AnimatePresence mode="wait">
                    {!isFiltering && (
                      <motion.tbody
                        key="table-body"
                        className="bg-white divide-y divide-gray-200"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {tableData.map((item, index) => (
                          <motion.tr
                            key={item.type}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {filteredStats?.total
                                ? (
                                    (item.count / filteredStats.total) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              %
                            </td>
                          </motion.tr>
                        ))}
                      </motion.tbody>
                    )}
                  </AnimatePresence>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function UserGrowthChart() {
  const [yearlyData, setYearlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchYearlyData();
  }, []);

  const fetchYearlyData = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("jwt");
      const currentYear = new Date().getFullYear();
      const monthlyData = [];

      for (let month = 0; month < 12; month++) {
        const response = await axios.get(
          `https://trip-genie-apis.vercel.app/admin/users-report?month=${
            month + 1
          }&year=${currentYear}`,
          { headers: { Authorization: `Bearer ${token}` } }
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

  //if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="h-[200px]">
      {isLoading ? (
        <div className="md:col-span-8 bg-transparent">
          <div className="p-3 mb-2"></div>
          <div className="pl-0">
            {/* Reduced width for the chart skeleton */}
            <div className="h-[160px] bg-gray-300 rounded animate-pulse mx-auto w-[90%] translate-y-[-30px]"></div>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
