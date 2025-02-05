"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  format,
  subDays,
  subMonths,
  subYears,
  addDays,
  addMonths,
  addYears,
  startOfYear,
} from "date-fns";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdvertiserReport = () => {
  const [salesReport, setSalesReport] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("Filtered Total");
  const [graphPeriod, setGraphPeriod] = useState("year");
  const [filters, setFilters] = useState({
    activity: "",
    day: "",
    month: "",
    year: "",
  });
  const [graphData, setGraphData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialTotalRevenue, setInitialTotalRevenue] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const initialGraphDataRef = useRef(null);

  const getUserRole = () => {
    let role = Cookies.get("jwt");
    if (!role) role = "guest";
    return role;
  };

  const fetchMyActivities = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `http://localhost:4000/advertiser/activities-report`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setActivities(
        response.data.activityReport.map((activity) => ({
          id: activity.activity._id,
          name: activity.activity.name,
        }))
      );
    } catch (error) {
      console.error("Error fetching activities:", error);
      setError("Failed to fetch activities. Please try again later.");
    }
  };

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("jwt");
      const currentYear = new Date().getFullYear();
      const monthlyDataPromises = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        return axios.get(
          `http://localhost:4000/advertiser/activities-report?year=${currentYear}&month=${month}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      });

      const monthlyDataResponses = await Promise.all(monthlyDataPromises);
      const combinedData = monthlyDataResponses.map((response) => ({
        month: response.config.url.split("month=")[1],
        totalRevenue: response.data.totalRevenue,
      }));

      const totalRevenue = combinedData.reduce(
        (sum, item) => sum + item.totalRevenue,
        0
      );
      setInitialTotalRevenue(totalRevenue);

      setSalesReport({
        activityReport: combinedData,
        totalRevenue: totalRevenue,
      });
      setIsDataLoaded(true);

      updateGraphData(combinedData, "year");
    } catch (error) {
      console.error("Error loading statistics:", error);
      setError("Failed to load statistics. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
    fetchMyActivities();
  }, []);

  useEffect(() => {
    if (salesReport && salesReport.activityReport) {
      updateGraphData(salesReport.activityReport, graphPeriod);
    }
  }, [graphPeriod, salesReport]);

  const fetchFilteredData = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("jwt");
      const { activity, day, month, year } = filters;
      const queryParams = new URLSearchParams();
      if (activity) queryParams.append("selectedActivities", activity);
      if (year) queryParams.append("year", year);
      if (month) queryParams.append("month", month);
      if (day) queryParams.append("day", day);

      const response = await axios.get(
        `http://localhost:4000/advertiser/activities-report?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSalesReport(response.data);
      updateGraphData(response.data.activityReport, graphPeriod);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
      setError("Failed to fetch filtered data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isDataLoaded) {
      fetchFilteredData();
    }
  }, [filters, isDataLoaded]);

  const filteredSales = useMemo(() => {
    return (
      salesReport?.activityReport.map((item) => ({
        activity: { name: item.activity?.name || "Unknown" },
        tickets: item.tickets || 0,
        revenue: item.revenue || 0,
      })) || []
    );
  }, [salesReport]);

  const updateGraphData = (salesData, period) => {
    const now = new Date();
    let startDate, dateFormat, data;
    if (initialGraphDataRef.current) {
      setGraphData(initialGraphDataRef.current);
      return;
    }

    switch (period) {
      case "week":
        startDate = subDays(now, 6);
        dateFormat = "EEE";
        data = Array.from({ length: 7 }, (_, i) => ({
          date: format(addDays(startDate, i), dateFormat),
          sales: 0,
          revenue: 0,
        }));
        break;
      case "year":
        startDate = startOfYear(now);
        dateFormat = "MMM";
        data = Array.from({ length: 12 }, (_, i) => ({
          date: format(addMonths(startDate, i), dateFormat),
          sales: 0,
          revenue: 0,
        }));
        break;
      case "Filtered Total":
        startDate = subYears(now, 7);
        dateFormat = "yyyy";
        data = Array.from({ length: 8 }, (_, i) => ({
          date: format(addYears(startDate, i), dateFormat),
          sales: 0,
          revenue: 0,
        }));
        break;
    }

    salesData.forEach((item) => {
      const monthIndex = parseInt(item.month) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        data[monthIndex].revenue = item.totalRevenue;
      }
    });

    initialGraphDataRef.current = data;
    setGraphData(data);
  };

  const calculatePeriodRevenue = (salesData, period) => {
    if (!Array.isArray(salesData)) return 0;
    const now = new Date();
    return salesData.reduce((sum, item) => {
      const saleDate = new Date(now.getFullYear(), parseInt(item.month) - 1);
      switch (period) {
        case "today":
          return sum;
        case "week":
          return sum;
        case "month":
          return (
            sum +
            (saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear()
              ? item.totalRevenue
              : 0)
          );
        case "year":
          return (
            sum +
            (saleDate.getFullYear() === now.getFullYear()
              ? item.totalRevenue
              : 0)
          );
        case "Filtered Total":
        default:
          return sum + item.totalRevenue;
      }
    }, 0);
  };
  const totalFilteredRevenue = filteredSales.reduce(
    (sum, item) => sum + item.revenue,
    0
  );
  const resetFilters = () => {
    setFilters({ activity: "", day: "", month: "", year: "" });
  };

  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  //if (!isDataLoaded) return <div className="p-6 text-center">Loading...</div>;

  const totalRevenue = salesReport?.totalRevenue || 0;
  const selectedPeriodRevenue = calculatePeriodRevenue(
    salesReport?.activityReport || [],
    selectedPeriod
  );
  const fillPercentage = initialTotalRevenue
    ? (totalFilteredRevenue / initialTotalRevenue) * 283
    : 0;

  const thisMonthSales = calculatePeriodRevenue(
    salesReport?.activityReport || [],
    "month"
  );
  const lastMonthSales = (() => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    return (salesReport?.activityReport || []).reduce((sum, item) => {
      const saleDate = new Date(now.getFullYear(), parseInt(item.month) - 1);
      return (
        sum +
        (saleDate.getMonth() === lastMonth.getMonth() &&
        saleDate.getFullYear() === lastMonth.getFullYear()
          ? item.totalRevenue
          : 0)
      );
    }, 0);
  })();

  const thisMonthChange =
    lastMonthSales === 0
      ? 100
      : ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100;

  const totalAttendance = filteredSales.reduce(
    (sum, item) => sum + item.tickets,
    0
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 md:grid-cols-12 mb-8">
          {/* Total Revenue */}
          <Card className="md:col-span-3 flex flex-col justify-center items-center h-[300px]">
            <CardHeader className="p-3 w-full">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#1A3B47]">
                  Total Revenue
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-3 flex flex-col justify-center items-center w-full">
              <div className="relative flex items-center justify-center w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
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
                      strokeDashoffset: 283 - fillPercentage,
                    }}
                    transition={{
                      duration: 1,
                      ease: "easeInOut",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isLoading ? (
                    <div className="h-4 w-1/2 bg-gray-200 rounded mb-4 animate-pulse"></div>
                  ) : (
                    <span className="text-lg font-bold text-[#1A3B47]">
                      ${totalFilteredRevenue.toFixed(2)}
                    </span>
                  )}
                  <span className="text-sm text-[#5D9297]">
                    {selectedPeriod.charAt(0).toUpperCase() +
                      selectedPeriod.slice(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Analytics Card */}
          <Card className="md:col-span-9 h-[300px]">
            <CardHeader className="p-3 mb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold text-[#1A3B47]">
                  Sales Analytics
                </CardTitle>
              </div>
            </CardHeader>
            {isLoading ? (
              <div className="md:col-span-8 bg-transparent">
                <div className="p-3 mb-2"></div>
                <div className="pl-0">
                  {/* Reduced width for the chart skeleton */}
                  <div className="h-[160px] bg-gray-300 rounded animate-pulse mx-auto w-[90%] translate-y-[-30px]"></div>
                </div>
              </div>
            ) : (
              <CardContent className="pl-4 pr-4">
                <div className="h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={graphData}
                      margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#B5D3D1"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#B5D3D1"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#B5D3D1"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          strokeWidth: 2,
                          stroke: "#B5D3D1",
                          fill: "white",
                        }}
                        activeDot={{
                          r: 5,
                          strokeWidth: 2,
                          stroke: "#B5D3D1",
                          fill: "white",
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader className="p-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-[#1A3B47]">
                Sales Report
              </CardTitle>
              <button
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </CardHeader>
          <CardContent className="">
            <div className="flex flex-wrap gap-4 mb-4">
              <Select
                value={filters.activity}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, activity: value }))
                }
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {Array.from(
                    { length: 10 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.month}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, month: value }))
                }
                disabled={!filters.year}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {format(new Date(2000, month - 1, 1), "MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.day}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, day: value }))
                }
                disabled={!filters.month}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tickets Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
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
                    <motion.tbody
                      key="table-body"
                      className="bg-white divide-y divide-gray-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {filteredSales.map((item, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.activity.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.tickets}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${parseFloat(item.revenue).toFixed(2)}
                          </td>
                        </motion.tr>
                      ))}
                      <motion.tr
                        key="total-row"
                        className="bg-gray-50 font-semibold"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.2,
                          delay: filteredSales.length * 0.05,
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Total
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {totalAttendance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${totalFilteredRevenue.toFixed(2)}
                        </td>
                      </motion.tr>
                    </motion.tbody>
                  </AnimatePresence>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvertiserReport;
