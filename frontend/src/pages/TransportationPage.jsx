"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import PaymentPopup from "@/components/payment-popup";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import TransportationCard from "@/components/transportationCard";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, parse, set } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { UserGuide } from "@/components/UserGuide";
import { data } from "autoprefixer";

const formSchema = z.object({
  from: z.string().min(1, "From location is required"),
  to: z.string().min(1, "To location is required"),
  vehicleType: z.enum(["Bus", "Car", "Microbus"], {
    required_error: "Vehicle type is required",
  }),
  ticketCost: z.number().min(0, "Ticket cost must be a positive number"),
  timeDeparture: z.date(),
  estimatedDuration: z.number().min(0, "Duration must be a positive number"),
  remainingSeats: z
    .number()
    .int()
    .min(0, "Remaining seats must be a non-negative integer"),
});

const getMaxSeats = (vehicleType) => {
  switch (vehicleType) {
    case "Bus":
      return 50;
    case "Car":
      return 5;
    case "Microbus":
      return 15;
    default:
      return 0;
  }
};

export default function TransportationPage() {
  const [transportations, setTransportations] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [fromLocations, setFromLocations] = useState([]);
  const [toLocations, setToLocations] = useState([]);
  const [selectedFrom, setSelectedFrom] = useState("all");
  const [selectedTo, setSelectedTo] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTransportation, setEditingTransportation] = useState(null);
  const [selectedTransportation, setSelectedTransportation] = useState(null);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("creditCard");
  const [showTransportationBookingDialog, setShowTransportationBookingDialog] =
    useState(false);
  const [showTransportationSuccessDialog, setShowTransportationSuccessDialog] =
    useState(false);
  const [rates, setRates] = useState({});
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [filteredTransportations, setFilteredTransportations] = useState([]);
  const [exceededMax, setExceededMax] = useState(false);
  const transportationsPerPage = 6;
  const [tourist, setTourist] = useState(null);
  const [closing, setClosing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [promoDetails, setPromoDetails] = useState(null);
  const bookingProcessedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [discountedTotal, setDiscountedTotal] = useState(0);

  const handleDiscountedTotalChange = (newTotal) => {
    setDiscountedTotal(newTotal);
  };

  useEffect(() => {
    const fetchTouristData = async () => {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist",
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTourist(response.data);
      } catch (error) {
        console.error("Error fetching tourist data:", error);
      }
    };

    fetchTouristData();
  }, []);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: "",
      to: "",
      vehicleType: "Bus",
      ticketCost: 0,
      timeDeparture: new Date(),
      estimatedDuration: 0,
      remainingSeats: 0,
    },
  });

  useEffect(() => {
    const role = Cookies.get("role");
    setUserRole(role);
    fetchTransportations();
    fetchUserInfo();
    fetchRates();
  }, []);

  const fetchUserInfo = async () => {
    const role = Cookies.get("role") || "guest";
    setUserRole(role);

    if (role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/",
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const currencyId = response.data.preferredCurrency;

        const response2 = await axios.get(
          `https://trip-genie-apis.vercel.app/tourist/getCurrency/${currencyId}`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserPreferredCurrency(response2.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  const fetchRates = async () => {
    try {
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/rates"
      );
      setRates(response.data.rates);
    } catch (error) {
      console.error("Error fetching rates:", error);
    }
  };

  const fetchTransportations = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("jwt");
      const role = Cookies.get("role");
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/${role}/transportations`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTransportations(response.data);
      setFilteredTransportations(response.data);
      setFromLocations([...new Set(response.data.map((t) => t.from))]);
      setToLocations([...new Set(response.data.map((t) => t.to))]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching transportations:", error);
    }
  };

  const handleClear = useCallback(() => {
    setSearchTerm("");
    setSelectedFrom("all");
    setSelectedTo("all");
    setSelectedDate(null);
  }, []);

  const handleSearch = useCallback(() => {
    const termsCar = "PREMIUM SEDAN";
    const termsBus = "SUPER DELUX AIR BUS";
    const termsMicrobus = "LUXURY MINI BUS";

    const today = new Date(); // Get the current date
    today.setHours(0, 0, 0, 0);

    const filtered = transportations.filter((t) => {
      const matchesSearchTerm =
        t.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.vehicleType.toLowerCase() === "car" &&
          termsCar.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.vehicleType.toLowerCase() === "bus" &&
          termsBus.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.vehicleType.toLowerCase() === "microbus" &&
          termsMicrobus.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFrom = selectedFrom === "all" || t.from === selectedFrom;
      const matchesTo = selectedTo === "all" || t.to === selectedTo;

      const departureDate = new Date(t.timeDeparture);
      departureDate.setHours(0, 0, 0, 0); // Reset time to compare only the date part

      const matchesDate =
        !selectedDate ||
        (departureDate >= today &&
          format(departureDate, "yyyy-MM-dd") >=
            format(selectedDate, "yyyy-MM-dd"));

      return matchesSearchTerm && matchesFrom && matchesTo && matchesDate;
    });
    // You might want to do something with the filtered results here
    setFilteredTransportations(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedFrom, selectedTo, selectedDate, transportations]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch, searchTerm, selectedFrom, selectedTo, selectedDate]);

  const displayPrice = (priceUSD) => {
    if (!userPreferredCurrency) return `$${priceUSD}`;
    const rate = rates[userPreferredCurrency.code];
    return `${userPreferredCurrency.symbol}${(priceUSD * rate).toFixed(2)}`;
  };

  const handleTransportationBooking = async (
    paymentMethod,
    seatsToBook,
    date,
    selectedTransportID,
    promoCode
  ) => {
    if (bookingProcessedRef.current) {
      console.log("Booking already processed");
      return;
    }

    setIsBooking(true);
    setBookingError("");
    try {
      bookingProcessedRef.current = true;
      const token = Cookies.get("jwt");
      const response = await axios.post(
        "https://trip-genie-apis.vercel.app/tourist/book-transportation",
        {
          transportationID: selectedTransportID,
          seatsToBook: seatsToBook,
          paymentMethod: paymentMethod,
          promoCode,
        },
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.message === "Transportation booking successful") {
        const updatedTransportations = transportations.map((t) =>
          t._id === selectedTransportation._id
            ? { ...t, remainingSeats: response.data.remainingSeats }
            : t
        );

        setTransportations(updatedTransportations);
        setFilteredTransportations(updatedTransportations);
        const percentageOff = searchParams.get("discountPercentage") || 0;
        const total = response.data.booking.totalCost;
        console.log(total);

        console.log(percentageOff);

        setShowTransportationBookingDialog(false);

        setBookingError(
          response.data.message || "Transportation booking successful"
        );

        setShowTransportationSuccessDialog({
          open: true,
          paymentMethod,
          seatsToBook,
          ticketCost: total / seatsToBook,
          wallet: tourist?.wallet,
          percentageOff: percentageOff,
        });

        fetchTransportations();
      } else {
        setBookingError(
          response.data.message || "Failed to book transportation"
        );
      }
    } catch (error) {
      console.error("Error booking transportation:", error);
      setBookingError(
        error.response?.data?.message || "An error occurred while booking"
      );
    } finally {
      setIsBooking(false);
    }
  };

  useEffect(() => {
    const handleBookingSuccess = async () => {
      const success = searchParams.get("success");
      const quantity = searchParams.get("quantity");
      const selectedDateStr = searchParams.get("selectedDate");
      const sessionId = searchParams.get("session_id");
      const selectedTransportID = searchParams.get("selectedTransportID");
      const promoCode = searchParams.get("promoCode");

      if (sessionId && success === "true") {
        try {
          const response = await axios.get(
            `https://trip-genie-apis.vercel.app/check-payment-status?session_id=${sessionId}`
          );

          console.log("Payment status response:", response.data);

          if (response.data.status === "paid") {
            // Now call handleBooking with the formatted date
            try {
              await handleTransportationBooking(
                "creditCard",
                parseInt(quantity),
                selectedDateStr,
                selectedTransportID,
                promoCode
              );
            } catch (error) {
              console.error("Error handling booking success:", error);
            }
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
        }
      }
    };

    handleBookingSuccess();
  }, [searchParams, selectedTransportation]);

  const handleFinalOK = () => {
    setShowTransportationSuccessDialog(false);
    searchParams.delete("success");
    searchParams.delete("quantity");
    searchParams.delete("selectedDate");
    searchParams.delete("session_id");
    searchParams.delete("selectedTransportID");
    searchParams.delete("promoCode");

    bookingProcessedRef.current = false;

    const newUrl = `${window.location.pathname}`;

    window.history.replaceState(null, "", newUrl);
    setBookingError("");
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleAdd = async (data) => {
    try {
      const token = Cookies.get("jwt");
      const role = Cookies.get("role");
      data.isStandAlone = true;

      const response = await axios.post(
        `https://trip-genie-apis.vercel.app/${role}/transportations`,
        data,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTransportations([...transportations, response.data]);
      setFilteredTransportations([...filteredTransportations, response.data]);

      form.reset({
        from: "",
        to: "",
        vehicleType: "Bus",
        ticketCost: 0,
        timeDeparture: new Date(),
        estimatedDuration: 0,
        remainingSeats: 0,
      });

      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding transportation:", error);
    }
  };

  const handleEdit = async (data) => {
    try {
      const token = Cookies.get("jwt");
      const role = Cookies.get("role");

      const response = await axios.put(
        `https://trip-genie-apis.vercel.app/${role}/transportations/${editingTransportation._id}`,
        data,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedTransportations = transportations.map((t) =>
        t._id === editingTransportation._id ? response.data : t
      );
      setTransportations(updatedTransportations);
      setFilteredTransportations(updatedTransportations);
      form.reset({
        from: "",
        to: "",
        vehicleType: "Bus", // or other default values
        ticketCost: 0,
        timeDeparture: new Date(),
        estimatedDuration: 0,
        remainingSeats: 0,
      });
      setEditingTransportation(null);
    } catch (error) {
      console.error("Error editing transportation:", error);
    }
  };

  const guideSteps = [
    {
      target: "body",
      content:
        "Welcome to the Transportation Booking page! This page allows you to choose appropriate transportation trips.",
      placement: "center",
    },
    {
      target: ".narrowing-down",
      content:
        "Use this section to narrow down the trips according to diffent aspects such as departure location and arrival location.",
      placement: "bottom",
    },
    {
      target: ".transportation-card",
      content: "Each card represents a unique trip with its details.",
      placement: "bottom",
    },
    {
      target: ".book-now-button",
      content:
        "Click here to book the selected trip. Don't forget to choose the number of seats you need and the payment method before confirming the booking!",
      placement: "bottom",
    },
  ];

  const handleDelete = async (id) => {
    try {
      const token = Cookies.get("jwt");
      const role = Cookies.get("role");
      await axios.delete(
        `https://trip-genie-apis.vercel.app/${role}/transportations/${id}`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updatedTransportations = transportations.filter(
        (t) => t._id !== id
      );
      setTransportations(updatedTransportations);
      setFilteredTransportations(updatedTransportations);
    } catch (error) {
      console.error("Error deleting transportation:", error);
    }
  };

  const sortedTransportations = [...filteredTransportations].sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return sortOrder === "asc" ? -1 : 1;
    if (a[sortBy] > b[sortBy]) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const indexOfLastTransportation = currentPage * transportationsPerPage;
  const indexOfFirstTransportation =
    indexOfLastTransportation - transportationsPerPage;
  const currentTransportations = sortedTransportations.slice(
    indexOfFirstTransportation,
    indexOfLastTransportation
  );

  const handleEditClick = (transportation) => {
    setEditingTransportation(transportation);
    form.reset({
      ...transportation,
      timeDeparture: new Date(transportation.timeDeparture),
    });
  };

  const handleEditClose = () => {
    setEditingTransportation(null);
  };

  const DateTimePicker = ({ field }) => {
    const [date, setDate] = useState(field.value);
    const [time, setTime] = useState(format(field.value, "HH:mm"));

    const handleDateChange = (newDate) => {
      setDate(newDate);
      updateDateTime(newDate, time);
    };

    const handleTimeChange = (e) => {
      setTime(e.target.value);
      updateDateTime(date, e.target.value);
    };

    const updateDateTime = (newDate, newTime) => {
      const [hours, minutes] = newTime.split(":");
      const updatedDate = set(newDate, {
        hours: parseInt(hours),
        minutes: parseInt(minutes),
      });
      field.onChange(updatedDate);
    };

    return (
      <div className="flex flex-col space-y-2 ">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground "
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          <Input
            type="time"
            value={time}
            onChange={handleTimeChange}
            className="w-full"
          />
        </div>
      </div>
    );
  };
  const TransportationCardSkeleton = () => {
    return (
      <div>
        {/* <h1 className="text-3xl font-bold mb-2">Transportation History</h1>
        <p className="text-sm text-gray-500 mb-2">Transportation / Attended</p> */}

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array(4)
              .fill()
              .map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-200 rounded-lg shadow-sm border p-4 space-y-4 animate-pulse"
                >
                  {/* Departure Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-start w-1/5">
                      <div className="h-4 w-16 bg-gray-300 rounded"></div>
                      <div className="h-6 w-24 bg-gray-300 rounded mt-2"></div>
                      <div className="flex items-center mt-2">
                        <div className="h-4 w-12 bg-gray-300 rounded"></div>
                      </div>
                    </div>

                    {/* Center Section (Date and Duration) */}
                    <div className="flex flex-col items-center justify-center w-3/5 relative">
                      <div className="absolute h-4 w-24 bg-gray-300 rounded top-1"></div>
                      <div className="absolute h-6 w-28 bg-gray-300 rounded -top-6"></div>
                    </div>

                    {/* Arrival Section */}
                    <div className="flex flex-col items-end w-1/5">
                      <div className="h-4 w-16 bg-gray-300 rounded"></div>
                      <div className="h-6 w-24 bg-gray-300 rounded mt-2"></div>
                      <div className="h-4 w-12 bg-gray-300 rounded mt-2"></div>
                    </div>
                  </div>

                  {/* Vehicle Type and Price Section */}
                  <div className="mt-4 flex justify-between items-center">
                    <div className="h-4 w-32 bg-gray-300 rounded text-center"></div>
                    <div className="flex items-center space-x-4">
                      <div className="h-6 w-16 bg-gray-300 rounded"></div>
                    </div>
                  </div>

                  {/* Skeleton for Dialog (Popup) Content */}
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100">
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-[#1A3B47]">
          Transportation Bookings
        </h1>

        <div className="mb-6 flex flex-wrap gap-4 narrowing-down">
          <Input
            type="text"
            placeholder="Search transportations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs search"
          />
          <Select value={selectedFrom} onValueChange={setSelectedFrom}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="From" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">From</SelectItem>
              {fromLocations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTo} onValueChange={setSelectedTo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">To</SelectItem>
              {toLocations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  handleSearch();
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {/* <Button onClick={handleSearch} className="bg-[#5D9297]">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button> */}
          <Button
            onClick={handleClear}
            className="bg-white text-[#5D9297] hover:text-black !important"
          >
            {" "}
            Clear
          </Button>
          {userRole === "advertiser" && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#1A3B47]">
                  <Plus className="mr-2 h-4 w-4" /> Add Transportation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Transportation</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleAdd)}
                    className="space-y-8 "
                  >
                    <FormField
                      control={form.control}
                      name="from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From</FormLabel>
                          <FormControl>
                            <Input placeholder="From location" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To</FormLabel>
                          <FormControl>
                            <Input placeholder="To location" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Type</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue(
                                "remainingSeats",
                                getMaxSeats(value)
                              );
                            }}
                            defaultValue={field.value}
                          >
                            {" "}
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select vehicle type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Bus">Bus</SelectItem>
                              <SelectItem value="Car">Car</SelectItem>
                              <SelectItem value="Microbus">Microbus</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ticketCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ticket Cost</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ticket cost"
                              {...field}
                              onChange={(e) => field.onChange(+e.target.value)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timeDeparture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departure Time</FormLabel>
                          <FormControl>
                            <DateTimePicker
                              field={field}
                              disablePastminDate={new Date().setDate(
                                new Date().getDate() + 1
                              )} // Setting minimum date to tomorrow
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Estimated duration"
                              {...field}
                              onChange={(e) => field.onChange(+e.target.value)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="remainingSeats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remaining Seats</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Remaining seats"
                              {...field}
                              onChange={(e) => {
                                const value = +e.target.value;
                                const maxSeats = getMaxSeats(
                                  form.getValues("vehicleType")
                                );
                                field.onChange(Math.min(value, maxSeats));
                              }}
                              max={getMaxSeats(form.getValues("vehicleType"))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        type="submit"
                        className="bg-[#1A3B47] hover:bg-[#142B36] text-white px-4 py-2 rounded mt-3"
                      >
                        Add Transportation
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <TransportationCardSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentTransportations.map((transportation) => (
              <div key={transportation._id}>
                <TransportationCard
                  transportation={transportation}
                  userRole={userRole}
                  onEdit={handleEditClick}
                  onDelete={handleDelete}
                  onBook={() => {
                    setSelectedTransportation(transportation);
                    setShowTransportationBookingDialog(true);
                  }}
                  displayPrice={displayPrice}
                />

                {/* Dialog for editing transportation */}
                <Dialog
                  open={editingTransportation === transportation}
                  onOpenChange={(open) => {
                    if (!open) handleEditClose();
                  }}
                >
                  {editingTransportation === transportation && (
                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Transportation</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(handleEdit)}
                          className="space-y-8"
                        >
                          <FormField
                            control={form.control}
                            name="from"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>From</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="From location"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="to"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>To</FormLabel>
                                <FormControl>
                                  <Input placeholder="To location" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="vehicleType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Vehicle Type</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    form.setValue(
                                      "remainingSeats",
                                      getMaxSeats(value)
                                    );
                                  }}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select vehicle type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Bus">Bus</SelectItem>
                                    <SelectItem value="Car">Car</SelectItem>
                                    <SelectItem value="Microbus">
                                      Microbus
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="ticketCost"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ticket Cost</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Ticket cost"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(+e.target.value)
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="timeDeparture"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Departure Time</FormLabel>
                                <FormControl>
                                  <DateTimePicker
                                    field={field}
                                    disablePast
                                    minDate={new Date().setDate(
                                      new Date().getDate() + 1
                                    )} // Setting minimum date to tomorrow
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="estimatedDuration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Estimated Duration (minutes)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Estimated duration"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(+e.target.value)
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="remainingSeats"
                            render={({ field }) => {
                              const maxSeats = getMaxSeats(
                                form.getValues("vehicleType")
                              );
                              const value = +field.value;

                              // Check if the value exceeds maxSeats
                              const isExceedingMax = value > maxSeats;

                              return (
                                <FormItem>
                                  <FormLabel>Remaining Seats</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Remaining seats"
                                      {...field}
                                      onChange={(e) => {
                                        // Remove leading zeros and update the value
                                        const inputValue =
                                          e.target.value.replace(/^0+/, ""); // Remove leading zeros
                                        field.onChange(
                                          inputValue ? +inputValue : ""
                                        ); // Handle empty input
                                      }}
                                      onBlur={() => {
                                        // Adjust the value to maxSeats if it exceeds on blur
                                        if (value > maxSeats) {
                                          field.onChange(maxSeats);
                                        }
                                      }}
                                      max={maxSeats}
                                    />
                                  </FormControl>
                                  {isExceedingMax && (
                                    <p className="text-red-500 text-sm mt-1">
                                      Max {maxSeats} seats allowed.
                                    </p>
                                  )}
                                </FormItem>
                              );
                            }}
                          />

                          <Button type="submit" className="bg-[#1A3B47]">
                            Update Transportation
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  )}
                </Dialog>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center items-center space-x-4">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            className="border-[#388A94] text-[#388A94] hover:bg-[#388A94] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {sortedTransportations.length > 0 ? (
            <span className="text-[#1A3B47]">
              Page {currentPage} of{" "}
              {Math.max(
                1,
                Math.ceil(sortedTransportations.length / transportationsPerPage)
              )}
            </span>
          ) : (
            <span className="text-[#1A3B47]">No transportations available</span>
          )}

          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={
              currentPage ===
              Math.max(
                1,
                Math.ceil(sortedTransportations.length / transportationsPerPage)
              )
            }
            variant="outline"
            className="border-[#388A94] text-[#388A94] hover:bg-[#388A94] hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {userPreferredCurrency &&
          userPreferredCurrency.code &&
          rates &&
          selectedTransportation && (
            <>
              <PaymentPopup
                isOpen={showTransportationBookingDialog}
                onClose={() => setShowTransportationBookingDialog(false)}
                title={`Booking: ${selectedTransportation?.vehicleType} from ${selectedTransportation?.from} to ${selectedTransportation?.to}`}
                items={[
                  {
                    name: selectedTransportation?.vehicleType,
                    price:
                      selectedTransportation.ticketCost *
                      rates[userPreferredCurrency.code] *
                      100,
                  },
                ]} // Convert price to cents
                onWalletPayment={handleTransportationBooking}
                stripeKey={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY}
                onConfirm={handleTransportationBooking}
                priceOne={(
                  selectedTransportation.ticketCost *
                  rates[userPreferredCurrency.code]
                ).toFixed(2)}
                currency={userPreferredCurrency.code}
                symbol={userPreferredCurrency.symbol}
                returnLoc={"https://trip-genie-acl.vercel.app/transportation"}
                error={bookingError}
                setError={setBookingError}
                selectedTransportID={selectedTransportation._id}
                transportationSeats={selectedTransportation.remainingSeats}
                promoDetails={promoDetails}
                setPromoDetails={setPromoDetails}
                onDiscountedTotalChange={handleDiscountedTotalChange}
              />
            </>
          )}
        <Dialog
          open={showTransportationSuccessDialog.open}
          onOpenChange={(isOpen) =>
            setShowTransportationSuccessDialog({
              ...showTransportationSuccessDialog,
              open: isOpen,
            })
          }
        >
          <DialogContent>
            <DialogHeader>
              {bookingError !== "Transportation booking successful" ? (
                <DialogTitle>
                  <div className="flex items-center">
                    <XCircle className="w-6 h-6 text-red-500 mr-2" />
                    Failed to book transportation
                  </div>
                </DialogTitle>
              ) : (
                <>
                  <DialogTitle>
                    <div className="flex items-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                      Transportation booking successful
                    </div>
                  </DialogTitle>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Label className="text-right">You Paid:</Label>
                    {showTransportationSuccessDialog?.paymentMethod ===
                      "Wallet" && (
                      <div>
                        {displayPrice(
                          showTransportationSuccessDialog?.seatsToBook *
                            showTransportationSuccessDialog?.ticketCost *
                            (1 -
                              showTransportationSuccessDialog?.percentageOff /
                                100)
                        )}
                      </div>
                    )}

                    {showTransportationSuccessDialog?.paymentMethod !==
                      "Wallet" && (
                      <div>
                        {displayPrice(
                          showTransportationSuccessDialog?.seatsToBook *
                            showTransportationSuccessDialog?.ticketCost
                        )}
                      </div>
                    )}
                    {showTransportationSuccessDialog?.paymentMethod ===
                      "Wallet" && (
                      <>
                        <Label className="text-right">
                          New Wallet Balance:
                        </Label>
                        <div>
                          {displayPrice(
                            showTransportationSuccessDialog?.wallet -
                              showTransportationSuccessDialog?.seatsToBook *
                                showTransportationSuccessDialog?.ticketCost *
                                (1 -
                                  showTransportationSuccessDialog?.percentageOff /
                                    100)
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="py-4">
                    <p>
                      You have successfully booked{" "}
                      {showTransportationSuccessDialog?.seatsToBook ?? 0}{" "}
                      seat(s).
                    </p>
                  </div>
                  <DialogFooter className="flex justify-end mt-2">
                    <Button
                      onClick={handleFinalOK}
                      className="bg-[#1A3B47] hover:bg-[#3E5963] text-white px-4 py-2 rounded-lg"
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      {(userRole === "guest" || userRole === "tourist") && (
        <UserGuide steps={guideSteps} pageName="itineraries" />
      )}
    </div>
  );
}
