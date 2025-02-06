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
  getDaysInMonth,
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

const ProductReport = () => {
  const [salesReport, setSalesReport] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("All Time");
  const [graphPeriod, setGraphPeriod] = useState("year");
  const [filters, setFilters] = useState({
    product: "",
    day: "",
    month: "",
    year: "",
  });
  const [graphData, setGraphData] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedPeriodRevenue, setSelectedPeriodRevenue] = useState(0);
  const [initialSelectedPeriodRevenue, setInitialSelectedPeriodRevenue] =
    useState(null);
  const [initialTotalRevenue, setInitialTotalRevenue] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);
  const [thisMonthSales, setThisMonthSales] = useState(0);
  const [lastMonthSales, setLastMonthSales] = useState(0);
  const initialGraphDataRef = useRef(null);
  const [isloading, setisLoading] = useState(false);

  const getUserRole = () => {
    let role = Cookies.get("role");
    if (!role) role = "guest";
    return role;
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
          `https://trip-genie-apis.vercel.app/${role}/sales-report`
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
        .map((response) => response.data.adminProductsSales)
        .flat();

      if (monthlySalesData.length > 0) {
        setSalesReport({ adminProductsSales: monthlySalesData });

        const uniqueProductNames = [
          ...new Set(
            monthlySalesData
              .filter((item) => item.product && item.product.name)
              .map((item) => item.product.name)
          ),
        ];
        setProductNames(uniqueProductNames);

        const totalRevenue = monthlyDataResponses.reduce(
          (sum, response) => sum + (response.data.totalAdminSalesRevenue || 0),
          0
        );
        setTotalRevenue(totalRevenue);

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
          "Invalid data structure received from the server: adminProductsSales missing"
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
        `https://trip-genie-apis.vercel.app/${role}/sales-report`
      );
      if (newFilters.day) url.searchParams.append("day", newFilters.day);
      if (newFilters.month) url.searchParams.append("month", newFilters.month);
      if (newFilters.year) url.searchParams.append("year", newFilters.year);

      const response = await axios.get(url.toString(), {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.adminProductsSales) {
        setSalesReport(response.data);
        let filteredData = response.data.adminProductsSales;

        // Apply product filter in the front-end
        if (newFilters.product) {
          filteredData = filteredData.filter(
            (item) => item.product && item.product.name === newFilters.product
          );
        }

        setFilteredSales(filteredData);
        setTotalRevenue(response.data.totalAdminSalesRevenue);
        setSelectedPeriodRevenue(
          calculatePeriodRevenue(filteredData, selectedPeriod)
        );
      } else {
        setError(
          "Invalid data structure received from the server: adminProductsSales missing"
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
    if (initialSelectedPeriodRevenue === null && salesReport) {
      setInitialSelectedPeriodRevenue(
        calculatePeriodRevenue(salesReport.adminProductsSales, selectedPeriod)
      );
    }
    if (initialTotalRevenue === null && totalRevenue !== 0) {
      setInitialTotalRevenue(totalRevenue);
    }
  }, [salesReport, selectedPeriod, totalRevenue]);

  useEffect(() => {
    fetchFilteredData(filters);
  }, [filters, selectedPeriod]);

  useEffect(() => {
    if (salesReport) {
      updateGraphData(salesReport.adminProductsSales, graphPeriod);
    }
  }, [graphPeriod, salesReport]);

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
      case "All Time":
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
      const date = parseISO(item.createdAt);
      if (date >= startDate && date <= now) {
        const key = format(date, dateFormat);
        const index = data.findIndex((d) => d.date === key);
        if (index !== -1) {
          data[index].sales += item.sales;
          data[index].revenue += item.revenue;
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
      const saleDate = parseISO(item.createdAt);
      switch (period) {
        case "today":
          return (
            sum +
            (saleDate.toDateString() === now.toDateString() ? item.revenue : 0)
          );
        case "week":
          const weekAgo = subDays(now, 7);
          return sum + (saleDate >= weekAgo ? item.revenue : 0);
        case "month":
          return (
            sum +
            (saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear()
              ? item.revenue
              : 0)
          );
        case "year":
          return (
            sum +
            (saleDate.getFullYear() === now.getFullYear() ? item.revenue : 0)
          );
        case "All Time":
        default:
          return sum + item.revenue;
      }
    }, 0);
  };

  const calculateLastMonthSales = (salesData) => {
    const lastMonth = subMonths(new Date(), 1);
    return salesData.reduce((sum, item) => {
      const saleDate = parseISO(item.createdAt);
      return (
        sum +
        (saleDate.getMonth() === lastMonth.getMonth() &&
        saleDate.getFullYear() === lastMonth.getFullYear()
          ? item.revenue
          : 0)
      );
    }, 0);
  };

  const resetFilters = () => {
    setFilters({ product: "", day: "", month: "", year: "" });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    if (key === "year") {
      newFilters.month = "";
      newFilters.day = "";
    } else if (key === "month") {
      newFilters.day = "";
    }
    setFilters(newFilters);
  };

  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  //if (!salesReport) return <div className="p-6 text-center">Loading...</div>;

  const fillPercentage =
    (initialSelectedPeriodRevenue / initialTotalRevenue) * 100;

  const thisMonthChange =
    lastMonthSales === 0
      ? 100
      : ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="">
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
                value={filters.product}
                onValueChange={(value) => handleFilterChange("product", value)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {productNames.map((name, index) => (
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
              <Select
                value={filters.day}
                onValueChange={(value) => handleFilterChange("day", value)}
                disabled={!filters.year || !filters.month}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    {
                      length:
                        filters.year && filters.month
                          ? getDaysInMonth(
                              new Date(
                                parseInt(filters.year),
                                parseInt(filters.month) - 1
                              )
                            )
                          : 31,
                    },
                    (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                {isloading ? (
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
                        {filteredSales.map((item, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.sales}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${item.revenue.toFixed(2)}
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
};

export default ProductReport;
