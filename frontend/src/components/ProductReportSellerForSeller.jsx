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
  const [totalRevenueAfterCommission, setTotalRevenueAfterCommission] =
    useState(0);
  const [selectedPeriodRevenue, setSelectedPeriodRevenue] = useState(0);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        const url = new URL(
          `https://trip-genie-apis.vercel.app/${role}/sales-report`
        );

        ["day", "month", "year"].forEach((key) => {
          if (filters[key]) url.searchParams.append(key, filters[key]);
        });

        const response = await axios.get(url.toString(), {
          credentials: "include",
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
        setTotalRevenueAfterCommission(
          response.data.totalRevenueAfterCommission
        );
        setSelectedPeriodRevenue(
          calculatePeriodRevenue(response.data.sellerProductsSales, "all")
        );

        const filteredData = filters.product
          ? response.data.sellerProductsSales.filter(
              (item) => item.product && item.product.name === filters.product
            )
          : response.data.sellerProductsSales;
        setFilteredSales(filteredData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching sales report:", error);
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
          data[index].revenue += item.revenueAfterCommission;
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
      switch (period) {
        case "today":
          return (
            sum +
            (saleDate.toDateString() === now.toDateString()
              ? item.revenueAfterCommission
              : 0)
          );
        case "week":
          const weekAgo = subDays(now, 7);
          return sum + (saleDate >= weekAgo ? item.revenueAfterCommission : 0);
        case "month":
          return (
            sum +
            (saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear()
              ? item.revenueAfterCommission
              : 0)
          );
        case "year":
          return (
            sum +
            (saleDate.getFullYear() === now.getFullYear()
              ? item.revenueAfterCommission
              : 0)
          );
        case "all":
        default:
          return sum + item.revenueAfterCommission;
      }
    }, 0);
  };

  const resetFilters = () => {
    setFilters({ product: "", day: "", month: "", year: "" });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (key === "year") {
        newFilters.month = "";
        newFilters.day = "";
      } else if (key === "month") {
        newFilters.day = "";
      }
      return newFilters;
    });
  };

  //if (!salesReport) return <div className="p-6 text-center">Loading...</div>;

  const fillPercentage =
    (selectedPeriodRevenue / totalRevenueAfterCommission) * 100;

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
        (saleDate.getMonth() === lastMonth.getMonth() &&
        saleDate.getFullYear() === lastMonth.getFullYear()
          ? item.revenueAfterCommission
          : 0)
      );
    }, 0);
  })();

  const thisMonthChange =
    lastMonthSales === 0
      ? 100
      : ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100;

  const totalSales = filteredSales.reduce((sum, item) => sum + item.sales, 0);
  const totalFilteredRevenue = filteredSales.reduce(
    (sum, item) => sum + item.revenue,
    0
  );
  const totalFilteredRevenueAfterCommission = filteredSales.reduce(
    (sum, item) => sum + item.revenueAfterCommission,
    0
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className=""></div>
      </div>
      <div className="container p-8">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue After Commission
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
                              ${item.revenueAfterCommission.toFixed(2)}
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
                            -
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Total:{totalSales}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Total: ${totalFilteredRevenue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Total: $
                            {totalFilteredRevenueAfterCommission.toFixed(2)}
                          </td>
                        </motion.tr>
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
