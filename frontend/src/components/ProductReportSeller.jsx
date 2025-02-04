import React, { useState, useEffect } from "react";
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
import {
  Calendar,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [graphPeriod, setGraphPeriod] = useState("week");
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
  const [totalAppRevenue, setAppTotalRevenue] = useState(0);
  const [selectedPeriodRevenue, setSelectedPeriodRevenue] = useState(0);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUserRole = () => {
    let role = Cookies.get("role");
    if (!role) role = "guest";
    return role;
  };

  useEffect(() => {
    const fetchSalesReport = async () => {
      setIsLoading(true);
      try {
        const token = Cookies.get("jwt");
        const role = getUserRole();
        const { day, month, year } = filters;
        const url = new URL(
          `https://trip-genie-apis.vercel.app/${role}/sales-report`
        );
        if (day) url.searchParams.append("day", day);
        if (month) url.searchParams.append("month", month);
        if (year) url.searchParams.append("year", year);

        const response = await axios.get(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSalesReport(response.data);
        updateGraphData(response.data.sellerProductsSales, graphPeriod);

        const uniqueProductNames = [
          ...new Set(
            response.data.sellerProductsSales
              .filter((item) => item.product && item.product.name)
              .map((item) => item.product.name)
          ),
        ];
        setProductNames(uniqueProductNames);

        setTotalRevenue(response.data.totalSellerSalesRevenue);
        setAppTotalRevenue(response.data.totalSellerSalesRevenue);
        setSelectedPeriodRevenue(
          calculatePeriodRevenue(response.data.sellerProductsSales, "all")
        );

        // Apply product filter in frontend
        const filteredData = filters.product
          ? response.data.sellerProductsSales.filter(
              (item) => item.product && item.product.name === filters.product
            )
          : response.data.sellerProductsSales;
        setFilteredSales(filteredData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching sales report:", error);
        setError("Error fetching sales report");
      }
    };

    fetchSalesReport();
  }, [filters.day, filters.month, filters.year, filters.product, graphPeriod]);

  useEffect(() => {
    if (salesReport) {
      setSelectedPeriodRevenue(
        calculatePeriodRevenue(salesReport.sellerProductsSales, selectedPeriod)
      );
    }
  }, [selectedPeriod, salesReport]);

  useEffect(() => {
    if (salesReport) {
      updateGraphData(salesReport.sellerProductsSales, graphPeriod);
    }
  }, [graphPeriod, salesReport]);

  const updateGraphData = (salesData, period) => {
    const now = new Date();
    let startDate, dateFormat, groupingFunction, data;

    switch (period) {
      case "week":
        startDate = subDays(now, 6);
        dateFormat = "EEE";
        groupingFunction = (date) => format(date, "yyyy-MM-dd");
        data = Array.from({ length: 7 }, (_, i) => ({
          date: format(addDays(startDate, i), dateFormat),
          sales: 0,
          revenue: 0,
        }));
        break;
      case "year":
        startDate = startOfYear(now);
        dateFormat = "MMM";
        groupingFunction = (date) => format(date, "yyyy-MM");
        data = Array.from({ length: 12 }, (_, i) => ({
          date: format(addMonths(startDate, i), dateFormat),
          sales: 0,
          revenue: 0,
        }));
        break;
      case "all":
        startDate = subYears(now, 7);
        dateFormat = "yyyy";
        groupingFunction = (date) => format(date, "yyyy");
        data = Array.from({ length: 8 }, (_, i) => ({
          date: format(addYears(startDate, i), dateFormat),
          sales: 0,
          revenue: 0,
        }));
        break;
    }

    salesData.forEach((item) => {
      const date = new Date(item.product.createdAt);
      if (date >= startDate && date <= now) {
        const key = groupingFunction(date);
        const index = data.findIndex(
          (d) => d.date === format(date, dateFormat)
        );
        if (index !== -1) {
          data[index].sales += item.sales;
          data[index].revenue += item.appRevenue;
        }
      }
    });

    setGraphData(data);
  };

  const calculatePeriodRevenue = (salesData, period) => {
    if (!salesData) return 0;
    const now = new Date();
    return salesData.reduce((sum, item) => {
      const saleDate = new Date(item.product.createdAt);
      console.log(`Sale Date: ${saleDate}, Revenue: ${item.revenue}`);
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
          return sum + (saleDate >= weekAgo ? item.appRevenue : 0);
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
    const searchParams = new URLSearchParams();
    ["day", "month", "year"].forEach((key) => {
      if (newFilters[key]) searchParams.append(key, newFilters[key]);
    });
    navigate(`/product-report?${searchParams.toString()}`);
  };

  const applyProductFilter = (productName) => {
    const filteredData = productName
      ? salesReport.sellerProductsSales.filter(
          (item) => item.product && item.product.name === productName
        )
      : salesReport.sellerProductsSales;
    setFilteredSales(filteredData);
  };

  const LoadingSkeleton = () => {
    return (
      <div className="p-6 bg-gray-100 min-h-screen animate-pulse">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-4 md:grid-cols-12 mb-4">
            {/* Total Revenue Skeleton */}
            <div className="md:col-span-3 bg-white p-4 rounded-lg shadow">
              <div className="h-5 w-1/2 bg-gray-300 mb-4 rounded"></div>
              <div className="flex items-center justify-center w-32 h-32 rounded-full bg-gray-300 mx-auto mb-4"></div>
              <div className="h-4 w-3/4 bg-gray-300 mb-2 rounded mx-auto"></div>
              <div className="h-4 w-1/2 bg-gray-300 rounded mx-auto"></div>
            </div>

            <div className="md:col-span-3 flex flex-col gap-4">
              {/* Monthly Sales Skeleton - This Month */}
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="h-5 w-1/3 bg-gray-300 mb-4 rounded"></div>
                <div className="h-5 w-2/3 bg-gray-300 rounded"></div>
              </div>
              {/* Monthly Sales Skeleton - Last Month */}
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="h-5 w-1/3 bg-gray-300 mb-4 rounded"></div>
                <div className="h-5 w-2/3 bg-gray-300 rounded"></div>
              </div>
            </div>

            {/* Sales Analytics Skeleton */}
            <div className="md:col-span-6 bg-white p-4 rounded-lg shadow">
              <div className="h-5 w-1/4 bg-gray-300 mb-4 rounded"></div>
              <div className="h-48 w-full bg-gray-300 rounded"></div>
            </div>
          </div>

          {/* Sales Report Skeleton */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 w-1/4 bg-gray-300 rounded"></div>
              <div className="h-4 w-1/6 bg-gray-300 rounded"></div>
            </div>
            <div className="grid gap-4 grid-cols-4 mb-4">
              <div className="h-8 bg-gray-300 rounded"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 bg-gray-300 h-5 rounded"></th>
                    <th className="px-6 py-3 bg-gray-300 h-5 rounded"></th>
                    <th className="px-6 py-3 bg-gray-300 h-5 rounded"></th>
                    <th className="px-6 py-3 bg-gray-300 h-5 rounded"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(5)].map((_, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 bg-gray-300 h-5 rounded"></td>
                      <td className="px-6 py-4 bg-gray-300 h-5 rounded"></td>
                      <td className="px-6 py-4 bg-gray-300 h-5 rounded"></td>
                      <td className="px-6 py-4 bg-gray-300 h-5 rounded"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };
  //if (!salesReport) return <div className="p-6 text-center"></div>;

  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  const fillPercentage = (selectedPeriodRevenue / totalAppRevenue) * 100;

  const thisMonthSales = calculatePeriodRevenue(
    salesReport?.sellerProductsSales,
    "month"
  );
  const lastMonthSales = (() => {
    const lastMonth = subMonths(new Date(), 1);
    return salesReport?.sellerProductsSales.reduce((sum, item) => {
      const saleDate = new Date(item.product.createdAt);
      return (
        sum +
        (saleDate?.getMonth() === lastMonth.getMonth() &&
        saleDate?.getFullYear() === lastMonth.getFullYear()
          ? item.appRevenue
          : 0)
      );
    }, 0);
  })();

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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, product: value }))
                }
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
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    year: value,
                    month: "",
                    day: "",
                  }))
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
                  setFilters((prev) => ({ ...prev, month: value, day: "" }))
                }
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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, day: value }))
                }
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      App Revenue
                    </th>
                  </tr>
                </thead>
                {isLoading ? (
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
                              {item.product ? item.product.name : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.sales}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.revenue !== null &&
                                `$${item.revenue.toFixed(2)}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${item.appRevenue.toFixed(2)}
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
