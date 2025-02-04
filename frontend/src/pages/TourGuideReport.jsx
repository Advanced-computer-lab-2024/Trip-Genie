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

const TourGuideItineraryReport = () => {
  const [reportData, setReportData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("Filtered Total");
  const [graphPeriod, setGraphPeriod] = useState("year");
  const [filters, setFilters] = useState({
    itineraryId: "",
    startDate: null,
    endDate: null,
    month: "",
    year: "",
  });
  const [graphData, setGraphData] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [filteredReport, setFilteredReport] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [selectedPeriodRevenue, setSelectedPeriodRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialTotalRevenue, setInitialTotalRevenue] = useState(0);
  const initialGraphDataRef = useRef(null);

  const fetchMyItineraries = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("jwt");

      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/tour-guide/itineraries-report`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setItineraries(
        response.data.itineraryReport.map((itinerary) => ({
          id: itinerary.itinerary._id,
          title: itinerary.itinerary.title,
        }))
      );
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching itineraries:", error);
      setError("Failed to fetch itineraries. Please try again later.");
    }
  };
  const fetchItineraryReport = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("jwt");
      // const { itineraryId, startDate, endDate, month, year } = filters;
      const { itineraryId, month, year, day } = filters;

      const queryParams = new URLSearchParams();
      // console.log("filters", filters);
      if (itineraryId) queryParams.append("selectedItineraries", itineraryId);
      // if (startDate)
      //   queryParams.append("startDate", new Date(startDate).toISOString());
      // if (endDate)
      //   queryParams.append("endDate", new Date(endDate).toISOString());
      // if (!startDate && !endDate && month) {
      //   if (month) queryParams.append("month", month);
      // }
      // if (!startDate && !endDate && year) {
      //   if (year) queryParams.append("year", year);
      // }
      if (year) queryParams.append("year", year);
      if (month) queryParams.append("month", month);
      if (day) queryParams.append("day", day);

      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/tour-guide/itineraries-report?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReportData(response.data);
      if (response.data && response.data.itineraryReport) {
        updateGraphData(response.data.itineraryReport, graphPeriod);

        setTotalRevenue(response.data.totalRevenue || 0);
        setTotalTickets(response.data.totalTickets || 0);
        setSelectedPeriodRevenue(
          calculatePeriodRevenue(response.data.itineraryReport, selectedPeriod)
        );

        setFilteredReport(response.data.itineraryReport);
      } else {
        setError(
          "Invalid data structure received from the server: itineraryReport missing"
        );
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching itinerary report:", error);
      setError("Failed to fetch itinerary report. Please try again later.");
    }
  };

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("jwt");
      const currentYear = new Date().getFullYear();
      const monthlyData = [];

      for (let month = 1; month <= 12; month++) {
        const response = await axios.get(
          `https://trip-genie-apis.vercel.app/tour-guide/itineraries-report?year=${currentYear}&month=${month}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        monthlyData.push(response.data);
      }

      const combinedData = monthlyData.flatMap((data) => data.itineraryReport);
      setReportData({ itineraryReport: combinedData });

      const totalRevenue = monthlyData.reduce(
        (sum, data) => sum + (data.totalRevenue || 0),
        0
      );
      setTotalRevenue(totalRevenue);
      setInitialTotalRevenue(totalRevenue);

      updateGraphData(combinedData, "year");
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading statistics:", error);
      setError("Failed to load statistics. Please try again later.");
    }
  };

  useEffect(() => {
    loadStatistics();
    fetchMyItineraries();
  }, []);

  useEffect(() => {
    fetchItineraryReport();
    fetchMyItineraries();
  }, [filters]);

  useEffect(() => {
    if (reportData && reportData.itineraryReport) {
      updateGraphData(reportData.itineraryReport, graphPeriod);
    }
  }, [graphPeriod, reportData]);

  useEffect(() => {
    if (reportData && reportData.itineraryReport) {
      setSelectedPeriodRevenue(
        calculatePeriodRevenue(reportData.itineraryReport, selectedPeriod)
      );
    }
  }, [selectedPeriod, reportData]);

  const updateGraphData = (reportData, period) => {
    if (!Array.isArray(reportData)) {
      console.error("Invalid report data:", reportData);
      return;
    }
    if (initialGraphDataRef.current) {
      setGraphData(initialGraphDataRef.current);
      return;
    }

    const now = new Date();
    let startDate, dateFormat, groupingFunction, data;

    switch (period) {
      case "week":
        startDate = subDays(now, 6);
        dateFormat = "EEE";
        groupingFunction = (date) => format(date, "yyyy-MM-dd");
        data = Array.from({ length: 7 }, (_, i) => ({
          date: format(addDays(startDate, i), dateFormat),
          tickets: 0,
          revenue: 0,
        }));
        break;
      case "year":
        startDate = startOfYear(now);
        dateFormat = "MMM";
        groupingFunction = (date) => format(date, "yyyy-MM");
        data = Array.from({ length: 12 }, (_, i) => ({
          date: format(addMonths(startDate, i), dateFormat),
          tickets: 0,
          revenue: 0,
        }));
        break;
      case "Filtered Total":
        startDate = subYears(now, 7);
        dateFormat = "yyyy";
        groupingFunction = (date) => format(date, "yyyy");
        data = Array.from({ length: 8 }, (_, i) => ({
          date: format(addYears(startDate, i), dateFormat),
          tickets: 0,
          revenue: 0,
        }));
        break;
    }

    reportData.forEach((item) => {
      const date = new Date(item.itinerary.createdAt);
      if (date >= startDate && date <= now) {
        const key = groupingFunction(date);
        const index = data.findIndex(
          (d) => d.date === format(date, dateFormat)
        );
        if (index !== -1) {
          data[index].tickets += item.tickets;
          data[index].revenue += item.revenue;
        }
      }
    });

    initialGraphDataRef.current = data;
    setGraphData(data);
  };

  const calculatePeriodRevenue = (reportData, period) => {
    if (!Array.isArray(reportData)) return 0;
    const now = new Date();
    return reportData.reduce((sum, item) => {
      const saleDate = new Date(item.itinerary.createdAt);
      switch (period) {
        case "today":
          return (
            sum +
            (saleDate.toDateString() === now.toDateString() ? item.revenue : 0)
          );
        case "week":
          const weekAgo = subDays(now, 7);
          return (
            sum + (saleDate >= weekAgo && saleDate <= now ? item.revenue : 0)
          );
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
        case "Filtered Total":
        default:
          return sum + item.revenue;
      }
    }, 0);
  };

  const resetFilters = () => {
    setFilters({
      itineraryId: "",
      startDate: null,
      endDate: null,
      month: "",
      year: "",
    });
  };

  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  //if (isLoading) return <div className="p-6 text-center">Loading...</div>;

  const fillPercentage = initialTotalRevenue
    ? (totalRevenue / initialTotalRevenue) * 100
    : 0;

  const thisMonthRevenue = calculatePeriodRevenue(
    reportData?.itineraryReport || [],
    "month"
  );
  const lastMonthRevenue = (() => {
    const lastMonth = subMonths(new Date(), 1);
    return (
      reportData?.itineraryReport?.reduce((sum, item) => {
        const saleDate = new Date(item.itinerary.createdAt);
        return (
          sum +
          (saleDate.getMonth() === lastMonth.getMonth() &&
          saleDate.getFullYear() === lastMonth.getFullYear()
            ? item.revenue
            : 0)
        );
      }, 0) || 0
    );
  })();

  const thisMonthChange =
    lastMonthRevenue === 0
      ? 100
      : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

  const isDateRangeSelected = filters.startDate || filters.endDate;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>
      <div className="flex-grow py-6 bg-gray-100">
        <div className="container px-8">
          <div className="grid gap-4 md:grid-cols-12 mb-4">
            {/* Total Revenue */}
            <Card className="md:col-span-4 flex flex-col justify-center items-center h-[300px]">
              <CardHeader className="p-3 w-full">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-[#1A3B47]">
                    Total Revenue
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 flex flex-col justify-center items-center w-full">
                <div className="relative flex items-center justify-center w-48 h-48 mb-8">
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
                    {isLoading ? (
                      <div className="h-4 w-1/2 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    ) : (
                      <span className="text-lg font-bold text-[#1A3B47]">
                        ${totalRevenue?.toFixed(2)}
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

            {/* Revenue Analytics Card */}
            <Card className="md:col-span-8 h-[300px]">
              <CardHeader className="p-3 mb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-bold text-[#1A3B47]">
                    Revenue Analytics
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
                <CardContent className="pl-0">
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
                  Itinerary Report
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
                  value={filters.itineraryId}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, itineraryId: value }))
                  }
                >
                  <SelectTrigger className="w-full mt-4 sm:w-[200px]">
                    <SelectValue placeholder="Select itinerary" />
                  </SelectTrigger>
                  <SelectContent>
                    {itineraries.map((itinerary) => (
                      <SelectItem key={itinerary.id} value={itinerary.id}>
                        {itinerary.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* <div className="flex flex-col w-full sm:w-auto">
                  <Label
                    htmlFor="startDate"
                    className="text-sm text-gray-500 mb-1"
                  >
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full sm:w-[200px]"
                  />
                </div> */}
                {/* <div className="flex flex-col w-full sm:w-auto">
                  <Label
                    htmlFor="endDate"
                    className="text-sm text-gray-500 mb-1"
                  >
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full sm:w-[200px]"
                  />
                </div> */}
                <Select
                  value={filters.year}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, year: value }))
                  }
                  disabled={isDateRangeSelected}
                >
                  <SelectTrigger className="w-full mt-4 sm:w-[200px]">
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
                  // disabled={isDateRangeSelected || !filters.year}
                  disabled={!filters.year}
                >
                  <SelectTrigger className="w-full mt-4 sm:w-[200px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {format(new Date(2000, month - 1, 1), "MMMM")}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.day}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, day: value }))
                  }
                  disabled={!filters.month}
                >
                  <SelectTrigger className="w-full mt-4 sm:w-[200px]">
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
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Itinerary
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
                      {!isLoading && (
                        <motion.tbody
                          key="table-body"
                          className="bg-white divide-y divide-gray-200"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {filteredReport.map((item, index) => (
                            <motion.tr
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{
                                duration: 0.2,
                                delay: index * 0.05,
                              }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.itinerary.title}
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
                              delay: filteredReport.length * 0.05,
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Total
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            -
                          </td> */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {totalTickets}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${totalRevenue.toFixed(2)}
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
    </div>
  );
};

export default TourGuideItineraryReport;
