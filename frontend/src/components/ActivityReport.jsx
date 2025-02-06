"use client";

import React, { useState, useEffect, useRef } from "react";
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
  parseISO,
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

const ActivityReport = () => {
  const [salesReport, setSalesReport] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [graphPeriod, setGraphPeriod] = useState("year");
  const [filters, setFilters] = useState({
    activity: "",
    month: "",
    year: "",
  });
  const [graphData, setGraphData] = useState([]);
  const [activityNames, setActivityNames] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalAppRevenue, setTotalAppRevenue] = useState(0);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);
  const [initialTotalRevenue, setInitialTotalRevenue] = useState(0);
  const [thisMonthSales, setThisMonthSales] = useState(0);
  const [lastMonthSales, setLastMonthSales] = useState(0);
  const [initialTotalCommissionRevenue, setInitialTotalCommissionRevenue] =
    useState(0);
  const initialGraphDataRef = useRef(null);
  const [selectedPeriodRevenue, setSelectedPeriodRevenue] = useState(0);
  const [isloading, setisLoading] = useState(false);

  const getUserRole = () => {
    let role = Cookies.get("role");
    if (!role) role = "guest";
    return role;
  };

  const calculateTotals = () => {
    return filteredSales.reduce(
      (acc, item) => {
        acc.ticketsSold += Math.round(item.totalRevenue / item.activity.price);
        acc.revenue += parseFloat(item.totalRevenue);
        acc.commissionRevenue += parseFloat(item.appRevenue);
        return acc;
      },
      { ticketsSold: 0, revenue: 0, commissionRevenue: 0 }
    );
  };

  const loadStatistics = async () => {
    setisLoading(true);
    try {
      const token = Cookies.get("jwt");
      const role = getUserRole();
      const currentYear = new Date().getFullYear();
      const monthlyDataPromises = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const url = new URL(
          `https://trip-genie-apis.vercel.app/${role}/activities-report`
        );
        url.searchParams.append("year", currentYear);
        url.searchParams.append("month", month);
        return axios.get(url.toString(), {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      });

      const monthlyDataResponses = await Promise.all(monthlyDataPromises);
      const monthlySalesData = monthlyDataResponses
        .map((response) => response.data.activitiesSales)
        .flat();

      if (monthlySalesData.length > 0) {
        setSalesReport({ activitiesSales: monthlySalesData });

        const uniqueActivityNames = [
          ...new Set(monthlySalesData.map((item) => item.activity.name)),
        ];
        setActivityNames(uniqueActivityNames);

        const totalRevenue = monthlyDataResponses.reduce(
          (sum, response) => sum + (response.data.totalActivitiesRevenue || 0),
          0
        );
        const totalAppRevenue = monthlyDataResponses.reduce(
          (sum, response) =>
            sum + (response.data.totalActivitiesAppRevenue || 0),
          0
        );
        setTotalRevenue(totalRevenue);
        setTotalAppRevenue(totalAppRevenue);
        setInitialTotalRevenue(totalAppRevenue);
        setInitialTotalCommissionRevenue(calculateTotals().commissionRevenue);
        setSelectedPeriodRevenue(
          calculatePeriodRevenue(monthlySalesData, "all")
        );

        setFilteredSales(monthlySalesData);

        // Calculate this month and last month sales
        const thisMonthSales = calculatePeriodRevenue(
          monthlySalesData,
          "month"
        );
        const lastMonthSales = calculateLastMonthSales(monthlySalesData);
        setThisMonthSales(thisMonthSales);
        setLastMonthSales(lastMonthSales);

        // Process graph data
        updateGraphData(monthlySalesData, "year");
      } else {
        setError(
          "Invalid data structure received from the server: activitiesSales missing"
        );
      }
      setisLoading(false);
    } catch (error) {
      console.error("Error fetching sales report:", error);
      setError("Failed to fetch sales report. Please try again later.");
    }
  };

  const fetchFilteredData = async (newFilters) => {
    setisLoading(true);
    try {
      const token = Cookies.get("jwt");
      const role = getUserRole();
      const url = new URL(
        `https://trip-genie-apis.vercel.app/${role}/activities-report`
      );
      if (newFilters.month) url.searchParams.append("month", newFilters.month);
      if (newFilters.year) url.searchParams.append("year", newFilters.year);

      const response = await axios.get(url.toString(), {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.activitiesSales) {
        setSalesReport(response.data);
        let filteredData = response.data.activitiesSales;

        // Apply activity filter in the front-end
        if (newFilters.activity) {
          filteredData = filteredData.filter(
            (item) =>
              item.activity && item.activity.name === newFilters.activity
          );
        }

        setFilteredSales(filteredData);
        // updateGraphData(filteredData, graphPeriod);
      } else {
        setError(
          "Invalid data structure received from the server: activitiesSales missing"
        );
      }
      setisLoading(false);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
      setError("Failed to fetch filtered data. Please try again later.");
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    fetchFilteredData(filters);
  }, [filters]);

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
      case "all":
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
      const date = parseISO(item.activity.createdAt);
      if (date >= startDate && date <= now) {
        const key = format(date, dateFormat);
        const index = data.findIndex((d) => d.date === key);
        if (index !== -1) {
          data[index].sales += 1;
          data[index].revenue += item.appRevenue;
        }
      }
    });
    initialGraphDataRef.current = data;
    setGraphData(data);
  };

  const calculatePeriodRevenue = (salesData, period) => {
    if (!Array.isArray(salesData)) return 0;
    const now = new Date();
    return salesData.reduce((sum, item) => {
      const saleDate = parseISO(item.activity.createdAt);
      switch (period) {
        case "today":
          return (
            sum +
            (saleDate.toDateString() === now.toDateString()
              ? item.appRevenue
              : 0)
          );
        case "week":
          const weekAgo = subDays(now, 7);
          return (
            sum + (saleDate >= weekAgo && saleDate <= now ? item.appRevenue : 0)
          );
        case "month":
          return (
            sum +
            (saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear()
              ? item.appRevenue
              : 0)
          );
        case "year":
          return (
            sum +
            (saleDate.getFullYear() === now.getFullYear() ? item.appRevenue : 0)
          );
        case "all":
        default:
          return sum + item.appRevenue;
      }
    }, 0);
  };

  const calculateLastMonthSales = (salesData) => {
    const lastMonth = subMonths(new Date(), 1);
    return salesData.reduce((sum, item) => {
      const saleDate = parseISO(item.activity.createdAt);
      return (
        sum +
        (saleDate.getMonth() === lastMonth.getMonth() &&
        saleDate.getFullYear() === lastMonth.getFullYear()
          ? item.appRevenue
          : 0)
      );
    }, 0);
  };

  const resetFilters = () => {
    setFilters({ activity: "", month: "", year: "" });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    if (key === "year") {
      newFilters.month = "";
    }
    setFilters(newFilters);
  };
  const ActivityReportSkeleton = () => {
    return (
      <div className="bg-gray-100 min-h-screen p-6">
        <div className="grid gap-4 md:grid-cols-12 mb-4">
          {/* Total Revenue Skeleton */}
          <Card className="md:col-span-4 flex flex-col justify-center items-center">
            <CardHeader className="p-3 w-full">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-300 bg-gray-300 rounded w-1/2 h-6"></CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 flex flex-col justify-center items-center w-full">
              <div className="relative flex items-center justify-center w-40 h-40">
                <div className="w-full h-full rounded-full bg-gray-200"></div>
              </div>
              <div className="text-center mt-4">
                <p className="text-base font-semibold bg-gray-300 rounded w-3/4 h-4 mx-auto"></p>
              </div>
            </CardContent>
          </Card>

          {/* Sales Analytics Skeleton */}
          <Card className="md:col-span-8">
            <CardHeader className="p-3 mb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold bg-gray-300 rounded w-1/3 h-6"></CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pl-0">
              <div className="h-[200px] bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Report Skeleton */}
        <Card>
          <CardHeader className="p-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold bg-gray-300 rounded w-1/4 h-6"></CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-full sm:w-[200px] h-10 bg-gray-200 rounded"
                ></div>
              ))}
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[1, 2, 3, 4].map((i) => (
                      <th key={i} className="px-6 py-3">
                        <div className="bg-gray-300 rounded w-full h-4"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <tr key={row} className="bg-white">
                      {[1, 2, 3, 4].map((cell) => (
                        <td key={cell} className="px-6 py-4">
                          <div className="bg-gray-200 rounded w-full h-4"></div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  //if (!salesReport) return <div className="p-6 text-center">{ActivityReportSkeleton}</div>;
  //if(isloading) return <div className="p-6 text-center">{ActivityReportSkeleton}</div>;
  const thisMonthChange =
    lastMonthSales === 0
      ? 100
      : ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100;

  return (
    <div className=" bg-gray-100 min-h-screen">
      <div className="">
        <div className="grid gap-4 md:grid-cols-12 mb-4">
          {/* Total Revenue */}
          <Card className="md:col-span-4 flex flex-col justify-center items-center">
            <CardHeader className="p-3 w-full">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#1A3B47]">
                  Total Revenue
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 flex flex-col justify-center items-center w-full">
              <div className="relative flex items-center justify-center w-40 h-40">
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
                      strokeDashoffset:
                        283 -
                        (283 * calculateTotals().commissionRevenue) /
                          initialTotalCommissionRevenue,
                    }}
                    transition={{
                      duration: 1,
                      ease: "easeInOut",
                    }}
                  />
                </svg>
                {isloading ? (
                  <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="h-4 w-1/2 bg-gray-200 rounded mb-4 animate-pulse"></div>

                      <span className="text-sm text-[#5D9297]">
                        Filtered Total
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-[#1A3B47]">
                      ${calculateTotals().commissionRevenue.toFixed(2)}
                    </span>
                    <span className="text-sm text-[#5D9297]">
                      Filtered Total
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center mt-4">
                <p className="text-base font-semibold text-[#1A3B47]">
                  Total Commission Revenue
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sales Analytics Card */}
          <Card className="md:col-span-8">
            <CardHeader className="p-3 mb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold text-[#1A3B47]">
                  Sales Analytics
                </CardTitle>
              </div>
            </CardHeader>
            {isloading ? (
              <div className="md:col-span-8 bg-transparent">
                <div className="p-3 mb-2"></div>
                <div className="pl-0">
                  {/* Reduced width for the chart skeleton */}
                  <div className="h-[160px] bg-gray-300 rounded animate-pulse mx-auto w-[90%] translate-y-[-30px]"></div>
                </div>
              </div>
            ) : (
              <CardContent className="pl-0">
                <div className="h-[200px]">
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
                onValueChange={(value) => handleFilterChange("activity", value)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent>
                  {activityNames.map((name, index) => (
                    <SelectItem key={index} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.year}
                onValueChange={(value) => handleFilterChange("year", value)}
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
                onValueChange={(value) => handleFilterChange("month", value)}
                disabled={!filters.year}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tickets Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission Revenue
                    </th>
                  </tr>
                </thead>
                {isloading ? (
                  <thead className="bg-gray-50">
                    {/* 6 more rows of pulsing lines with more space and bigger size */}
                    {[...Array(6)].map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        {[1, 2, 3, 4].map((i) => (
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
                              {Math.round(
                                item.totalRevenue / item.activity.price
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${parseFloat(item.totalRevenue).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${parseFloat(item.appRevenue).toFixed(2)}
                            </td>
                          </motion.tr>
                        ))}
                        {filteredSales.length > 0 && (
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
                              -
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Total {calculateTotals().ticketsSold}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Total ${calculateTotals().revenue.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Total $
                              {calculateTotals().commissionRevenue.toFixed(2)}
                            </td>
                          </motion.tr>
                        )}
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
};

export default ActivityReport;
