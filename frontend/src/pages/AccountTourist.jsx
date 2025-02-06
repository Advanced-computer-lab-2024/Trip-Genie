import React, { useState, useEffect, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  CreditCard,
  MapPin,
  ShoppingBag,
  User,
  Car,
  Wallet,
  ShoppingCartIcon,
  Lock,
  AlertTriangle,
  Settings,
  HistoryIcon,
  Calendar,
  HelpCircle,
  Eye,
  MessageSquare,
  LogOut,
  Trash2,
  XCircle,
  CheckCircle,
  Heart,
  DollarSign,
  FileText,
  HomeIcon,
  Plane,
  Hotel,
  Bookmark,
  ChevronLeft,
  CircleDot,
  Clock,
  PlaneLanding,
  PlaneTakeoff,
  Ticket,
  Bell,
  Wallet2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Popup from "@/components/popup";
import "@/styles/Popup.css";
import Sidebar from "@/components/Sidebar";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PasswordChanger from "@/components/Passwords";
import { TouristProfileComponent } from "@/components/touristProfile";
import FileComplaintForm from "@/components/FileComplaintForm";
import TravelPreferences from "@/components/TouristPreferences";
import TouristActivities from "@/pages/TouristActivities";
import TouristItineraries from "@/pages/TouristItineraries";
import TouristWalletPage from "@/pages/TouristWalletPage";
import { Link } from "react-router-dom";
import OrdersPage from "@/pages/touristOrders";

import FAQ from "@/pages/FAQs";
import TouristAttendedActivities from "@/pages/TouristAttended";
import TouristAttendedItineraries from "@/pages/TouristAttendedItineraries";

import UpcomingTransportation from "@/pages/TransportationUpcomming";
import HistoryTransportation from "@/pages/TransportationHistory";
import AddCard from "@/pages/AddCard";
import ShippingAddress from "@/pages/AddShippingAddress";
import ShoppingCart from "@/components/touristCart.jsx";
import WishlistPage from "@/components/touristWishlist.jsx";
import { MyComplaintsComponent } from "@/components/myComplaints";
import { AdvertiserProfileComponent } from "@/components/AdvertiserProfileComponent";
import { SellerProfileComponent } from "@/components/SellerProfileComponent";
import { TourGuideProfileComponent } from "@/components/tourGuideProfile";
import TGNotificationsPage from "@/pages/TourGuideNotifications.jsx";
import SellerNotificationsPage from "@/pages/SellerNotifications.jsx";
import AdvertiserNotificationsPage from "@/pages/AdvertiserNotifications.jsx";
import NotificationsPage from "@/pages/TouristNotifications.jsx";
import Savedactivites from "@/components/Savedactivites";
import Saveditineraries from "@/components/Saveditineraries";
import ProductReportSeller from "../components/ProductReportSellerForSeller.jsx";
import TouristActivitiesPage from "@/pages/TouristActivitiesPage";
import TouristItinerariesPage from "@/pages/TouristItinerariesPage";
import TouristTransportationPage from "./TouristTransportationPage";

import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";
import DeleteConfirmation from "@/components/ui/deletionConfirmation";
import StockReport from "./StockReport.jsx";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail } from "lucide-react";

const getInitials = (name) => {
  if (!name) return "";
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("");
  return initials.slice(0, 2).toUpperCase();
};

// Sub-components
const AccountInfo = ({ user }) => {
  switch (user.role) {
    case "advertiser":
      return <AdvertiserProfileComponent />;
    case "seller":
      return <SellerProfileComponent />;
    case "tour-guide":
      return <TourGuideProfileComponent />;
    case "tourist":
      return <TouristProfileComponent tourist={user} />;
    default:
      return (
        <div>
          <h2 className="text-2xl font-bold mb-4">Account Information</h2>
          <p>
            <strong>Name:</strong> {user.username}
          </p>
          {/* make the user role not seperated by hyphen and first letter capital */}
          <p>
            <strong>Role:</strong>{" "}
            {user.role.charAt(0).toUpperCase() +
              user.role.slice(1).replace("-", " ")}
          </p>
        </div>
      );
  }
};

const Notifications = ({ user }) => {
  console.log("heree");
  switch (user.role) {
    case "advertiser":
      return <AdvertiserNotificationsPage />;
    case "seller":
      return <SellerNotificationsPage />;
    case "tour-guide":
      return <TGNotificationsPage />;
    case "tourist":
      return <NotificationsPage />;
    default:
      return (
        <div>
          <h2 className="text-2xl font-bold mb-4">Notifications</h2>
          <p>
            <strong>Name:</strong> {user.username}
          </p>
          {/* make the user role not seperated by hyphen and first letter capital */}
          <p>
            <strong>Role:</strong>{" "}
            {user.role.charAt(0).toUpperCase() +
              user.role.slice(1).replace("-", " ")}
          </p>
        </div>
      );
  }
};

const ExternalFlightBookings = ({ user }) => {
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [toastMessage, setToastMessage] = useState("");
  const [exchangeRates, setExchangeRates] = useState(null);
  const [tourist, setTourist] = useState(null);
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [currencies, setCurrencies] = useState(null);
  const [selectedTab, setSelectedTab] = useState("upcoming");

  const showToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setIsToastOpen(true);
  };

  const fetchCurrencies = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/currencies",
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch currencies");
      }
      const data = await response.json();
      setCurrencies(data);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  };

  const convertPrice = (price, fromCurrency, toCurrency) => {
    if (!exchangeRates || !fromCurrency || !toCurrency) {
      return price;
    }
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    return ((price * toRate) / fromRate).toFixed(2);
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch("https://trip-genie-apis.vercel.app/rates");
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      const data = await response.json();
      setExchangeRates(data.rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  };

  const fetchUserInfo = async () => {
    const role = Cookies.get("role") || "guest";

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
        setTourist(response.data);
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

  useEffect(() => {
    Promise.all([
      fetchUserInfo(),
      fetchExchangeRate(),
      fetchCurrencies(),
      fetchFlights(),
    ]);
  }, []);

  const fetchFlights = async () => {
    try {
      const token = Cookies.get("jwt");
      const [flightsResponse] = await Promise.all([
        axios.get("https://trip-genie-apis.vercel.app/tourist/my-flights", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://trip-genie-apis.vercel.app/tourist/", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      console.log(flightsResponse.data);

      setFlights(flightsResponse.data);
      setIsLoading(false);
    } catch (err) {
      setError("Failed to fetch flight bookings or currency information");
      setIsLoading(false);
    }
  };

  const handleCancelFlight = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.post(
        `https://trip-genie-apis.vercel.app/tourist/cancel-flight/${selectedFlight}`,
        {},
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        const refundedAmount = response.data.data.refundedAmount;
        const newWalletBalance = response.data.data.newWalletBalance;
        console.log(refundedAmount, newWalletBalance);
        const refundConverted = convertPrice(
          refundedAmount,
          "USD",
          userPreferredCurrency.code
        );
        const newWalletBalanceConverted = convertPrice(
          newWalletBalance,
          "USD",
          userPreferredCurrency.code
        );
        showToast(
          "success",
          `Booking cancelled. Refunded amount: ${userPreferredCurrency.symbol} ${refundConverted}. New wallet balance: ${userPreferredCurrency.symbol} ${newWalletBalanceConverted}`
        );
        setIsDialogOpen(false);
        fetchFlights();
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to cancel the flight booking.");
    }
  };

  if (error) return <div>{error}</div>;

  const calculateDuration = (departureDate, arrivalDate) => {
    const departure = new Date(departureDate);
    const arrival = new Date(arrivalDate);

    const durationInMillis = arrival - departure; // Difference in milliseconds
    const hours = Math.floor(durationInMillis / (1000 * 60 * 60)); // Convert to hours
    const minutes = Math.floor(
      (durationInMillis % (1000 * 60 * 60)) / (1000 * 60)
    ); // Convert to minutes

    return `${hours}h ${minutes}m`;
  };

  const filteredFlights = flights.filter((flight) => {
    const departureDate = flight.returnDepartureDate || flight.departureDate;
    return selectedTab === "upcoming"
      ? new Date(departureDate) > new Date()
      : new Date(departureDate) <= new Date();
  });

  return (
    <ToastProvider>
      <div className="bg-gray-100 max-w-7xl gap-4 ">
        <h1 className="text-3xl font-bold mb-2">Flight Bookings</h1>
        <p className="text-sm text-gray-500 mb-2">My Bookings / Flights</p>

        <div className="container mx-auto px-4 py-4">
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex mb-4">
              <button
                className={`relative w-full flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                  selectedTab === "upcoming"
                    ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                    : "border-gray-300 text-gray-500 bg-white"
                }`}
                onClick={() => setSelectedTab("upcoming")}
              >
                Upcoming Trips
              </button>
              <button
                className={` w-full relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                  selectedTab === "attended"
                    ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                    : "border-gray-300 text-gray-500 bg-white"
                }`}
                onClick={() => setSelectedTab("attended")}
              >
                Past Trips
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-white p-6 mb-4 rounded-lg shadow-lg">
                      <div className="flex justify-between items-center mb-6">
                        <div className="w-32 h-5 bg-gray-200 rounded-md"></div>{" "}
                        {/* Flight Number */}
                        <div className="w-20 h-6 bg-gray-200 rounded-md"></div>{" "}
                        {/* Seat Type */}
                      </div>
                      <div className="flex">
                        {/* Left section (3/4) */}
                        <div className="w-3/4 pr-6 border-r flex flex-col">
                          <div className="mb-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="w-20 h-3 bg-gray-200 rounded-md"></div>{" "}
                                {/* Depart text */}
                                <div className="w-32 h-6 bg-gray-200 rounded-md"></div>{" "}
                                {/* Departure Time */}
                                <div className="w-24 h-3 bg-gray-200 rounded-md"></div>{" "}
                                {/* Departure Date */}
                                <div className="w-20 h-3 bg-gray-200 rounded-md"></div>{" "}
                                {/* From Airport */}
                              </div>

                              <div className="flex-1 flex flex-col items-center mx-4">
                                <div className="w-20 h-8 bg-white rounded-full"></div>{" "}
                                {/* Plane Icon */}
                                <div className="w-full border-t-2 border-dashed border-gray-300 mt-4"></div>
                                <div className="w-20 h-8 bg-white rounded-full mt-4"></div>{" "}
                                {/* Plane Icon */}
                              </div>

                              <div className="space-y-1">
                                <div className="w-20 h-3 bg-gray-200 rounded-md"></div>{" "}
                                {/* Arrive text */}
                                <div className="w-32 h-6 bg-gray-200 rounded-md"></div>{" "}
                                {/* Arrival Time */}
                                <div className="w-24 h-3 bg-gray-200 rounded-md"></div>{" "}
                                {/* Arrival Date */}
                                <div className="w-20 h-3 bg-gray-200 rounded-md"></div>{" "}
                                {/* To Airport */}
                              </div>
                            </div>
                          </div>
                          {/* Return Flight if exists */}
                          {false && (
                            <div className="pt-6 border-t">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="w-20 h-3 bg-gray-200 rounded-md"></div>{" "}
                                  {/* Depart text */}
                                  <div className="w-32 h-6 bg-gray-200 rounded-md"></div>{" "}
                                  {/* Departure Time */}
                                  <div className="w-24 h-3 bg-gray-200 rounded-md"></div>{" "}
                                  {/* Departure Date */}
                                  <div className="w-20 h-3 bg-gray-200 rounded-md"></div>{" "}
                                  {/* From Airport */}
                                </div>

                                <div className="flex-1 flex flex-col items-center mx-4">
                                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>{" "}
                                  {/* Plane Icon */}
                                  <div className="w-full border-t-2 border-dashed border-gray-300 mt-4"></div>
                                  <div className="w-10 h-10 bg-gray-200 rounded-full mt-4"></div>{" "}
                                  {/* Plane Icon */}
                                </div>

                                <div className="space-y-1">
                                  <div className="w-20 h-3 bg-gray-200 rounded-md"></div>{" "}
                                  {/* Arrive text */}
                                  <div className="w-32 h-6 bg-gray-200 rounded-md"></div>{" "}
                                  {/* Arrival Time */}
                                  <div className="w-24 h-3 bg-gray-200 rounded-md"></div>{" "}
                                  {/* Arrival Date */}
                                  <div className="w-20 h-3 bg-gray-200 rounded-md"></div>{" "}
                                  {/* To Airport */}
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Important Notices */}
                          <div className="mt-6 space-y-2">
                            <div className="flex bg-gray-100 px-4 py-2 rounded-md">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>{" "}
                                {/* Icon */}
                                <div className="w-48 h-3 bg-gray-200 rounded-md"></div>{" "}
                                {/* Notice Text */}
                              </div>

                              <div className="border-l-2 border-gray-300 h-10 mx-4"></div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>{" "}
                                {/* Icon */}
                                <div className="w-48 h-3 bg-gray-200 rounded-md"></div>{" "}
                                {/* Notice Text */}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right section (1/4) */}
                        <div className="w-1/4 pl-6 space-y-6">
                          <div>
                            <div className="w-32 h-3 bg-gray-200 rounded-md"></div>{" "}
                            {/* Name */}
                            <div className="w-24 h-3 bg-gray-200 rounded-md mt-2"></div>{" "}
                            {/* Email */}
                          </div>
                          <div>
                            <div className="w-32 h-3 bg-gray-200 rounded-md"></div>{" "}
                            {/* Tickets Booked */}
                            <div className="w-24 h-3 bg-gray-200 rounded-md mt-2"></div>{" "}
                            {/* Price */}
                          </div>
                          <div className="w-full h-10 bg-gray-200 rounded-md"></div>{" "}
                          {/* Cancel Button */}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredFlights.length === 0 ? (
              <div className="text-center space-y-4 py-12">
                <h2 className="text-2xl font-semibold text-gray-600">
                  No {selectedTab} flight bookings yet
                </h2>
                <p className="text-gray-500">
                  Start booking your flights to see the world!
                </p>
                <Link to="/flights">
                  <Button className="mt-4 bg-[#388A94] text-white">
                    {" "}
                    Start Booking
                  </Button>
                </Link>
              </div>
            ) : (
              filteredFlights.map((flight, index) => (
                <Card key={index} className="p-6 mb-4">
                  {/* Header */}
                  <div className="flex justify-between items-cente mb-6">
                    <div className="text-lg">
                      <span className="font-semibold text-[#1A3B47]">
                        Flight Number
                      </span>
                      <span className="text-base ml-1  text-[#5D9297]">
                        {flight.flightType}
                        {flight.flightID}
                      </span>
                    </div>

                    <span className="text-sm text-[#388A94] font-semibold bg-[#C6E0DD] px-3 py-1 rounded-full">
                      {flight.seatType}
                    </span>
                  </div>

                  <div className="flex">
                    {/* Left section (3/4) */}
                    <div
                      className={`w-3/4 pr-6 border-r flex flex-col ${
                        !flight.returnDepartureDate ? "justify-center" : ""
                      }`}
                    >
                      {" "}
                      {/* Outbound Flight */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Depart</div>
                            <div className="text-3xl font-bold text-[#1A3B47]">
                              {new Date(
                                flight.departureDate
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(
                                flight.departureDate
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {flight.from}
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col items-center mx-4">
                            <div className="w-full flex items-center gap-2">
                              <PlaneTakeoff className="h-5 w-5 text-[#388A94] shrink-0 mb-1" />
                              <div className="w-full border-t-2 border-dashed border-[#388A94] relative">
                                <span className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white px-2">
                                  {calculateDuration(
                                    flight.departureDate,
                                    flight.arrivalDate
                                  )}{" "}
                                  {/* Calculate duration */}
                                </span>
                              </div>
                              <PlaneLanding className="h-5 w-5 text-[#388A94] shrink-0 mb-1" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Arrive</div>
                            <div className="text-3xl font-bold text-[#1A3B47]">
                              {new Date(flight.arrivalDate).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(
                                flight.arrivalDate
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {flight.to}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Return Flight if exists */}
                      {flight.returnDepartureDate && (
                        <div className="pt-6 border-t">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-500">
                                Depart
                              </div>
                              <div className="text-3xl font-bold text-[#1A3B47]">
                                {new Date(
                                  flight.returnDepartureDate
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(
                                  flight.returnDepartureDate
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {flight.to}
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center mx-4">
                              <div className="w-full flex items-center gap-2">
                                <PlaneTakeoff className="h-5 w-5 text-[#388A94] shrink-0 mb-1" />
                                <div className="w-full border-t-2 border-dashed border-[#388A94] relative">
                                  <span className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white px-2">
                                    {calculateDuration(
                                      flight.returnDepartureDate,
                                      flight.returnArrivalDate
                                    )}{" "}
                                    {/* Calculate duration */}
                                  </span>
                                </div>
                                <PlaneLanding className="h-5 w-5 text-[#388A94] shrink-0 mb-1" />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-sm text-gray-500">
                                Arrive
                              </div>
                              <div className="text-3xl font-bold text-[#1A3B47]">
                                {new Date(
                                  flight.returnArrivalDate
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(
                                  flight.returnArrivalDate
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {flight.from}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Important Notices */}
                      <div className="mt-6 space-y-2">
                        <div className="flex bg-gray-100 px-4 py-2 rounded-md">
                          {/* First section */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Ticket className="h-10 w-10" />
                            <span>
                              Show e-tickets and passenger identities during
                              check-in
                            </span>
                          </div>

                          {/* Divider line */}
                          <div className="border-l-2 border-gray-300 h-10 mx-4"></div>

                          {/* Second section */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-10 w-10" />
                            <span>
                              Please be at the boarding gate at least 30 minutes
                              before boarding time
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right section (1/4) */}
                    <div className="w-1/4 pl-6 space-y-6">
                      <div>
                        <div className="text-sm text-gray-500">Name</div>
                        <span className="text-[#1A3B47]">
                          {user?.fname && user?.lname
                            ? `${user.fname} ${user.lname}`
                            : "Passenger Name"}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium text-[#1A3B47]">
                          {user?.email || "passenger@email.com"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Tickets Booked
                        </div>
                        <div className="font-medium text-[#1A3B47]">
                          {flight.numberOfTickets}
                        </div>
                      </div>
                      <div className="flex flex-col ap-2">
                        <div className="text-sm text-gray-500">Price:</div>
                        <div className="text-4xl font-bold text-[#1A3B47]">
                          {userPreferredCurrency?.symbol}
                          {convertPrice(
                            flight.price,
                            "USD",
                            userPreferredCurrency?.code
                          )}{" "}
                        </div>
                      </div>
                      {selectedTab === "upcoming" && (
                        <Button
                          variant="outline"
                          className="w-full text-base bg-red-500 text-white hover:bg-red-600"
                          onClick={() => {
                            setSelectedFlight(flight._id);
                            setIsDialogOpen(true);
                          }}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}

            {/* Confirmation Dialog */}
            <DeleteConfirmation
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              itemType="flight booking"
              onConfirm={handleCancelFlight}
            />

            {/* Toast Notification */}
            {isToastOpen && (
              <Toast
                onOpenChange={setIsToastOpen}
                open={isToastOpen}
                duration={5000}
                className={
                  toastType === "success" ? "bg-green-100" : "bg-red-100"
                }
              >
                <div className="flex items-center">
                  {toastType === "success" ? (
                    <CheckCircle className="text-green-500 mr-2" />
                  ) : (
                    <XCircle className="text-red-500 mr-2" />
                  )}
                  <div>
                    <ToastTitle>
                      {toastType === "success" ? "Success" : "Error"}
                    </ToastTitle>
                    <ToastDescription>{toastMessage}</ToastDescription>
                  </div>
                </div>
                <ToastClose />
              </Toast>
            )}
            <ToastViewport />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
};

const ExternalHotelBookings = ({ user }) => {
  const [hotels, setHotels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preferredCurrency, setPreferredCurrency] = useState({
    code: "USD",
    symbol: "$",
  });
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [toastMessage, setToastMessage] = useState("");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [tourist, setTourist] = useState(null);
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [exchangeRates, setExchangeRates] = useState(null);
  const [currencies, setCurrencies] = useState(null);
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const navigate = useNavigate();

  const fetchCurrencies = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/currencies",
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch currencies");
      }
      const data = await response.json();
      setCurrencies(data);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  };

  const HotelBookingsSkeleton = () => {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-2">Hotel Bookings</h1>
        <p className="text-sm text-gray-500 mb-2">My Bookings / Hotels</p>

        <div className="container mx-auto px-4 py-6">
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex mb-4">
              <button
                className={`relative w-full flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                  selectedTab === "upcoming"
                    ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                    : "border-gray-300 text-gray-500 bg-white"
                }`}
                onClick={() => setSelectedTab("upcoming")}
              >
                Upcoming Reservations
              </button>
              <button
                className={` w-full relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                  selectedTab === "attended"
                    ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                    : "border-gray-300 text-gray-500 bg-white"
                }`}
                onClick={() => setSelectedTab("attended")}
              >
                Past Reservations
              </button>
            </div>
            {/* Skeleton for two hotel booking cards */}
            {Array(2)
              .fill(null)
              .map((_, index) => (
                <div
                  key={index}
                  className="mb-6 border rounded-lg shadow-sm bg-white p-6 animate-pulse"
                >
                  {/* Header Section */}
                  <div className="mb-6">
                    <div className="h-6 bg-gray-300 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  </div>

                  {/* Card Content */}
                  <div className="grid grid-cols-2 gap-10">
                    {/* Left Side */}
                    <div className="col-span-1 border-r-2 border-gray-300 pr-6 space-y-6">
                      <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="col-span-1 space-y-6">
                      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                      <div className="flex items-center space-x-4">
                        <div className="h-10 bg-gray-300 rounded w-1/4"></div>
                        <div className="h-8 bg-gray-300 rounded w-1/6"></div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info Section */}
                  <div className="mt-6 flex items-center bg-gray-100 px-4 py-4 rounded-md">
                    {/* First Section */}
                    <div className="flex items-center space-x-4">
                      <div className="h-3 w-3 p-4 bg-gray-300 rounded-full"></div>
                      <div className="h-6 w-48 bg-gray-300 rounded w-1/3"></div>
                    </div>

                    <div className="border-l-2 border-gray-300 h-8 mx-6"></div>

                    {/* Second Section */}
                    <div className="flex items-center space-x-4">
                      <div className="h-3 w-3 p-4 bg-gray-300 rounded-full"></div>
                      <div className="h-6 w-96 bg-gray-300 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const showToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setIsToastOpen(true);
  };

  // convert price that takes any currency and converts it to any currency using exchange rates
  const convertPrice = (price, fromCurrency, toCurrency) => {
    if (!exchangeRates || !fromCurrency || !toCurrency) {
      return price;
    }
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    return ((price * toRate) / fromRate).toFixed(2);
  };

  const getUserRole = () => Cookies.get("role") || "guest";

  const fetchUserInfo = async () => {
    const role = Cookies.get("role") || "guest";

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
        setTourist(response.data);
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

  useEffect(() => {
    Promise.all([
      fetchUserInfo(),
      fetchExchangeRate(),
      fetchCurrencies(),
      fetchHotels(),
    ]);
  }, []);

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch("https://trip-genie-apis.vercel.app/rates");
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      const data = await response.json();
      setExchangeRates(data.rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  };

  const fetchHotels = async () => {
    try {
      const token = Cookies.get("jwt");
      const [hotelsResponse, currencyResponse] = await Promise.all([
        axios.get("https://trip-genie-apis.vercel.app/tourist/my-hotels", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://trip-genie-apis.vercel.app/tourist/", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setHotels(hotelsResponse.data);

      setIsLoading(false);
    } catch (err) {
      setError("Failed to fetch hotel bookings or currency information");
      setIsLoading(false);
    }
  };

  const handleCancelHotel = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.post(
        `https://trip-genie-apis.vercel.app/tourist/cancel-hotel/${selectedHotel}`,
        {},
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        const refundedAmount = response.data.data.refundedAmount;
        const newWalletBalance = response.data.data.newWalletBalance;
        console.log(refundedAmount, newWalletBalance);
        const refundConverted = convertPrice(
          refundedAmount,
          "USD",
          userPreferredCurrency.code
        );
        const newWalletBalanceConverted = convertPrice(
          newWalletBalance,
          "USD",
          userPreferredCurrency.code
        );
        showToast(
          "success",
          `Booking cancelled. Refunded amount: ${userPreferredCurrency.symbol} ${refundConverted}. New wallet balance: ${userPreferredCurrency.symbol}${newWalletBalanceConverted}`
        );
        setIsDialogOpen(false);
        fetchHotels();
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to cancel the hotel booking.");
    }
  };

  if (isLoading)
    return (
      <div>
        <HotelBookingsSkeleton />
      </div>
    );
  if (error) return <div>{error}</div>;

  const filteredHotels = hotels.filter((hotel) => {
    return selectedTab === "upcoming"
      ? new Date(hotel.checkinDate) > new Date()
      : new Date(hotel.checkinDate) <= new Date();
  });

  return (
    <ToastProvider>
      <div>
        <h1 className="text-3xl font-bold mb-2">Hotel Bookings</h1>
        <p className="text-sm text-gray-500 mb-2">My Bookings / Hotels</p>

        <div className="container mx-auto px-4 py-4">
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex mb-4">
              <button
                className={`relative w-full flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                  selectedTab === "upcoming"
                    ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                    : "border-gray-300 text-gray-500 bg-white"
                }`}
                onClick={() => setSelectedTab("upcoming")}
              >
                Upcoming Reservations
              </button>
              <button
                className={` w-full relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                  selectedTab === "attended"
                    ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                    : "border-gray-300 text-gray-500 bg-white"
                }`}
                onClick={() => setSelectedTab("attended")}
              >
                Past Reservations
              </button>
            </div>

            {filteredHotels.length === 0 ? (
              <div className="text-center space-y-4 py-12">
                <h2 className="text-2xl font-semibold text-gray-600">
                  No {selectedTab === "upcoming" ? "upcoming" : "attended"}{" "}
                  hotel reservations yet
                </h2>
                <p className="text-gray-500">
                  {selectedTab === "upcoming"
                    ? "Start booking your hotels to enjoy your stay!"
                    : "You haven't attended any hotel reservations yet."}
                </p>
                {selectedTab === "upcoming" && (
                  <Link to="/hotels">
                    <Button className="mt-4 bg-[#388A94] text-white">
                      Start Booking
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              filteredHotels.map((hotel, index) => (
                <Card key={index} className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-[#1A3B47] font-bold">
                      Hotel Booking at {hotel.hotelName}
                    </CardTitle>
                    <CardDescription className="font-semibold">
                      Hotel ID: {hotel.hotelID}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="grid grid-cols-2 gap-10">
                    {/* Vertical Separator */}
                    <div className="col-span-1 border-r-2 border-gray-300 ">
                      {/* Left Side Content */}
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <p className="text-xl font-semibold text-[#1A3B47]">
                            {hotel.roomName}{" "}
                            <span className="font-normal">x</span>{" "}
                            {hotel.numberOfRooms}
                          </p>
                        </div>

                        {/* Info in 2 rows */}
                        <div className="">
                          <p className="text-gray-600 mb-3">
                            Check-in on{" "}
                            <span className="font-bold">
                              {new Date(hotel.checkinDate).toLocaleDateString()}
                            </span>
                          </p>
                          <p className="text-gray-600 mb-3">
                            Check-out on{" "}
                            <span className="font-bold">
                              {new Date(
                                hotel.checkoutDate
                              ).toLocaleDateString()}
                            </span>
                          </p>
                          <p className="text-gray-600 mb-3">
                            <span className="font-bold">
                              {hotel.numberOfAdults}
                            </span>{" "}
                            <span className="font-normal">Adult(s)</span>
                          </p>

                          <p className="text-gray-600">
                            Paid Via{" "}
                            <span className="font-bold">
                              {hotel.paymentType || "Credit Card"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Side Content */}
                    <div className="col-span-1 space-y-6 pl-10">
                      <div className="text-gray-600">
                        <p className="font-normal">Name:</p>
                        <p className="font-bold">
                          {tourist.fname} {tourist.lname}
                        </p>
                      </div>
                      <div className="text-gray-600">
                        <p className="font-normal">Email:</p>
                        <p className="font-bold">{tourist.email}</p>
                      </div>

                      {/* Booking price with cancel button */}
                      <div className="flex items-center space-x-4">
                        <p className="text-4xl font-semibold">
                          {userPreferredCurrency.symbol +
                            convertPrice(
                              hotel.price,
                              "USD",
                              userPreferredCurrency.code
                            )}
                        </p>
                        {selectedTab === "upcoming" && (
                          <button
                            onClick={() => {
                              setSelectedHotel(hotel._id);
                              setIsDialogOpen(true);
                            }}
                            className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-md focus:outline-none"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  {/* Additional Info Section */}
                  <div className="space-y-2 p-4">
                    <div className="flex bg-gray-100 px-4 py-2 rounded-md">
                      {/* First Section */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Ticket className="h-10 w-10" />
                        <span>
                          Show your booking confirmation and ID during check-in
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="border-l-2 border-gray-300 h-10 mx-4"></div>

                      {/* Second Section */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-10 w-10" />
                        <span>
                          Please check in at least 1 hour before your scheduled
                          check-in time to ensure smooth processing and room
                          availability.
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}

            {/* Confirmation Dialog */}
            <DeleteConfirmation
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              itemType="hotel booking"
              onConfirm={handleCancelHotel}
            />

            {/* Toast Notification */}
            {isToastOpen && (
              <Toast
                onOpenChange={setIsToastOpen}
                open={isToastOpen}
                duration={5000}
                className={
                  toastType === "success" ? "bg-green-100" : "bg-red-100"
                }
              >
                <div className="flex items-center">
                  {toastType === "success" ? (
                    <CheckCircle className="text-green-500 mr-2" />
                  ) : (
                    <XCircle className="text-red-500 mr-2" />
                  )}
                  <div>
                    <ToastTitle>
                      {toastType === "success" ? "Success" : "Error"}
                    </ToastTitle>
                    <ToastDescription>{toastMessage}</ToastDescription>
                  </div>
                </div>
                <ToastClose />
              </Toast>
            )}
            <ToastViewport />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
};

const Upcoming = ({ user }) => {
  switch (user.role) {
    case "tourist":
      return <TouristActivities />;
    case "tourism-governor":
      return (
        <div className="p-4 text-center">
          Activity management is handled in the admin dashboard.
        </div>
      );
    case "seller":
      return (
        <div className="p-4 text-center">
          Manage your listings in the seller dashboard.
        </div>
      );
    case "advertiser":
      return (
        <div className="p-4 text-center">
          View your ad campaigns in the advertiser dashboard.
        </div>
      );
    case "tour-guide":
      return (
        <div className="p-4 text-center">
          Check your upcoming tours in the tour guide dashboard.
        </div>
      );
    default:
      return (
        <div className="p-4 text-center">
          No upcoming activities available for {user.role}.
        </div>
      );
  }
};

const Cart = ({ user }) => {
  if (user.role === "tourist") {
    return <ShoppingCart />;
  } else {
    return <div>Cart not available for {user.role}</div>;
  }
};

const Wishlist = ({ user }) => {
  if (user.role === "tourist") {
    return <WishlistPage />;
  } else {
    return <div>Wishlist not available for {user.role}</div>;
  }
};

const History = ({ user }) => {
  if (user.role === "tourist") {
    return <TouristActivitiesPage />;
  } else {
    return <div>History not available for {user.role}</div>;
  }
};

const HistoryItineraries = ({ user }) => {
  if (user.role === "tourist") {
    return <TouristItinerariesPage />;
  } else {
    return <div>History not available for {user.role}</div>;
  }
};

const UpcommingTransportationBooking = ({ user }) => {
  if (user.role === "tourist") {
    return <TouristTransportationPage />;
  } else {
    return (
      <div>Upcomming Transportations are not available for {user.role}</div>
    );
  }
};

const UpcomingItineraries = ({ user }) => {
  if (user.role === "tourist") {
    return <TouristItineraries />;
  } else {
    return <div>Upcomming Itineraries are not available for {user.role}</div>;
  }
};

const HistoryTransportationBooking = ({ user }) => {
  if (user.role === "tourist") {
    return <HistoryTransportation />;
  } else {
    return (
      <div>Upcomming Transportations are not available for {user.role}</div>
    );
  }
};

const Complaint = () => <FileComplaintForm />;

const Preferences = ({ user }) => {
  if (user.role === "tourist") {
    return <TravelPreferences />;
  } else {
    return <div>Preferences not available for {user.role}</div>;
  }
};

const WalletHistoryComponent = ({ user }) => {
  if (user.role === "tourist") {
    return <TouristWalletPage />;
  } else {
    return <div>Wallet History not available for {user.role}</div>;
  }
};

const FAQs = () => <FAQ />;

const RedeemPoints = ({ user, onRedeemPoints }) => {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState(null);
  const [redeemSuccess, setRedeemSuccess] = useState(null);
  const [rates, setRates] = useState({});
  const [currencies, setCurrencies] = useState([]);
  const [preferredCurrency, setPreferredCurrency] = useState("USD");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("jwt");
        const [ratesResponse, currenciesResponse] = await Promise.all([
          axios.get("https://trip-genie-apis.vercel.app/rates", {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("https://trip-genie-apis.vercel.app/tourist/currencies", {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetchUserInfo(),
        ]);
        setRates(ratesResponse.data.rates);
        setCurrencies(currenciesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    // if type of from currency is string and to currency is string  return (amount / rates[fromCurrency]) * rates[toCurrency]
    if (typeof fromCurrency === "string" && typeof toCurrency === "string") {
      return (amount / rates[fromCurrency]) * rates[toCurrency];
    }
    if (typeof fromCurrency !== "string" && typeof toCurrency === "string") {
      return (amount / rates[fromCurrency.code]) * rates[toCurrency];
    }
    if (typeof fromCurrency !== "string" && typeof toCurrency !== "string") {
      return (amount / rates[fromCurrency.code]) * rates[toCurrency.code];
    }

    if (typeof fromCurrency === "string" && typeof toCurrency !== "string") {
      return (amount / rates[fromCurrency]) * rates[toCurrency.code];
    }

    if (!rates[fromCurrency] || !rates[toCurrency.code]) return amount;
    return (amount / rates[fromCurrency]) * rates[toCurrency.code];
  };

  const formatCurrency = (amount, currency) => {
    const currencyInfo = currencies.find((c) => c.code === currency.code);
    return `${currencyInfo ? currencyInfo.symbol : ""}${amount.toFixed(2)}`;
  };

  const convertedWalletAmount = convertCurrency(
    user.wallet,
    "USD",
    preferredCurrency
  );
  const convertiblePoints = Math.floor(user.loyaltyPoints / 10000) * 10000;
  const pointsValueInEGP = convertiblePoints / 100; // Since 10,000 points = 100 EGP
  const pointsValueInUSD = convertCurrency(pointsValueInEGP, "EGP", "USD");
  const pointsValueInPreferredCurrency = convertCurrency(
    pointsValueInUSD,
    "USD",
    preferredCurrency
  );

  console.log("Converted wallet amount:", convertedWalletAmount);
  console.log("Points value in EGP:", pointsValueInEGP);
  console.log("Points value in USD:", pointsValueInUSD);
  console.log(
    "Points value in preferred currency:",
    pointsValueInPreferredCurrency
  );

  const fetchUserInfo = useCallback(async () => {
    const role = Cookies.get("role") || "guest";
    if (role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        if (!token) {
          console.error("No JWT token found");
          return;
        }

        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/",
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const currencyId = response.data.preferredCurrency;

        if (currencyId) {
          const response2 = await axios.get(
            `https://trip-genie-apis.vercel.app/tourist/getCurrency/${currencyId}`,
            {
              credentials: "include",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setPreferredCurrency(response2.data);
        } else {
          console.error("No preferred currency found for user");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  }, []);

  const handleRedeemClick = async () => {
    setIsRedeeming(true);
    setRedeemError(null);
    setRedeemSuccess(null);

    try {
      await onRedeemPoints(user.loyaltyPoints);
      setRedeemSuccess(`Successfully redeemed ${user.loyaltyPoints} points`);
    } catch (error) {
      setRedeemError(
        error.message || "An error occurred while redeeming points"
      );
    } finally {
      setIsRedeeming(false);
    }
  };

  if (user.role !== "tourist") {
    return <div>Points redemption not available for {user.role}</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto bg-gray-50 shadow-xl rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Redeem Loyalty Points</h2>
      <p className="text-lg text-gray-700 mb-6">
        Convert your loyalty points into wallet balance.
      </p>

      <div className="space-y-4 mb-6">
        <p className="text-lg font-medium text-gray-600">
          Available Wallet Balance:{" "}
          <span className="text-teal-600">
            {formatCurrency(convertedWalletAmount, preferredCurrency)}
          </span>
        </p>
        <p className="text-lg font-medium text-gray-600">
          Loyalty Points:{" "}
          <span className="text-blue-600">
            {user.loyaltyPoints.toFixed(2)} points
          </span>
        </p>
      </div>

      <Button
        onClick={handleRedeemClick}
        disabled={isRedeeming || user.loyaltyPoints === 0}
        className="w-full py-3 bg-[#F88C33] text-white rounded-lg hover:bg-orange-500 transition duration-300 ease-in-out"
      >
        {isRedeeming
          ? "Redeeming..."
          : `Redeem Points for ${formatCurrency(
              pointsValueInPreferredCurrency,
              preferredCurrency
            )}`}
      </Button>

      {/* Error Message */}
      {redeemError && (
        <p className="text-red-500 text-sm text-center mt-4">{redeemError}</p>
      )}

      {/* Success Message */}
      {redeemSuccess && (
        <p className="text-green-500 text-sm text-center mt-4">
          {redeemSuccess}
        </p>
      )}
    </div>
  );
};

const CurrencyApp = ({ user }) => {
  const [currencies, setCurrencies] = useState([]);
  const [preferredCurrency, setPreferredCurrency] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("");

  const fetchPreferredCurrencyCode = async () => {
    if (user.role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const codeResponse = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/currencies/idd",
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const preferredCurrencyCode = codeResponse.data;
        console.log("Preferred Currency Code:", preferredCurrencyCode);

        const currencyResponse = await axios.get(
          `https://trip-genie-apis.vercel.app/tourist/getCurrency/${preferredCurrencyCode}`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPreferredCurrency(currencyResponse.data);
      } catch (error) {
        console.error("Error fetching preferred currency details:", error);
      }
    }
  };

  useEffect(() => {
    if (user.role === "tourist") {
      const fetchSupportedCurrencies = async () => {
        try {
          const token = Cookies.get("jwt");
          const response = await axios.get(
            "https://trip-genie-apis.vercel.app/tourist/currencies",
            {
              credentials: "include",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setCurrencies(response.data);
        } catch (error) {
          console.error("Error fetching supported currencies:", error);
        }
      };

      fetchSupportedCurrencies();
      fetchPreferredCurrencyCode();
    }
  }, [user]);

  const handleSetPreferredCurrency = async () => {
    if (user.role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        await axios.post(
          "https://trip-genie-apis.vercel.app/tourist/currencies/set",
          { currencyId: selectedCurrency },
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        openSuccessPopup("Preferred currency set successfully!");

        fetchPreferredCurrencyCode();
      } catch (error) {
        console.error("Error setting preferred currency:", error);
        openErrorPopup(error);
      }
    }
  };

  const [popupType, setPopupType] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const openSuccessPopup = (message) => {
    setPopupType("success");
    setPopupOpen(true);
    setPopupMessage(message);
  };

  const openErrorPopup = (message) => {
    setPopupType("error");
    setPopupOpen(true);
    setPopupMessage(message);
  };

  const closePopup = () => {
    setPopupOpen(false);
  };

  if (user.role !== "tourist") {
    return <div>Currency settings not available for {user.role}</div>;
  }

  return (
    <div className="container p-8 max-w-lg mx-auto bg-white shadow-lg rounded-lg">
      <Popup
        isOpen={popupOpen}
        onClose={closePopup}
        type={popupType}
        message={popupMessage}
      />
      <h1 className="text-2xl font-bold mb-4">Preferred Currency</h1>
      <h2 className="text-xl font-bold mb-4">
        {preferredCurrency
          ? `${preferredCurrency.name} (${preferredCurrency.code})`
          : "Loading..."}
      </h2>

      <label className="block text-lg font-medium text-gray-700 mb-5">
        <span>Select New Preferred Currency:</span>
        <div className="relative mt-2">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="w-full p-4 rounded-lg border-2 border-teal-600 text-teal-600 bg-teal-50 font-medium focus:ring-teal-500 focus:border-teal-500 transition duration-300 ease-in-out"
          >
            <option value="" disabled>
              Choose Currency
            </option>
            {currencies.map((currency) => (
              <option key={currency._id} value={currency._id}>
                {currency.name} ({currency.code})
              </option>
            ))}
          </select>
        </div>
      </label>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSetPreferredCurrency}
          disabled={!selectedCurrency}
          className={`w-36 py-3 rounded-lg text-white font-semibold focus:outline-none transition duration-300 ease-in-out ${
            selectedCurrency
              ? "bg-[#F88C33] hover:bg-orange-600 cursor-pointer" //className="flex items-center justify-center w-full py-2 bg-[#F88C33] text-white rounded-md hover:bg-orange-500 transition duration-300 ease-in-out mb-4"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Set
        </button>
      </div>
    </div>
  );
};

const DeleteAccount = ({ onClose }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(true);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [toastMessage, setToastMessage] = useState("");
  const navigate = useNavigate();

  const showToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setIsToastOpen(true);
    setTimeout(() => {
      setIsToastOpen(false);
      if (type === "success") {
        navigate("/");
      }
    }, 2000); // Show toast for 2 seconds before navigating
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const token = Cookies.get("jwt");
      const role = Cookies.get("role");
      const response = await axios.delete(
        `https://trip-genie-apis.vercel.app/${role}/delete-account`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        setDeleteResult({
          success: true,
          message: "Your account has been successfully deleted.",
        });
        Cookies.remove("jwt");
        Cookies.remove("role");
        showToast("success", "Your account has been successfully deleted.");
      }
    } catch (error) {
      setDeleteResult({
        success: false,
        message:
          error.response?.data?.message ||
          "An error occurred while deleting your account.",
      });
      showToast("error", "An error occurred while deleting your account.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (deleteResult && deleteResult.success) {
      navigate("/login"); // Redirect to login page if deletion is successful
    } else {
      onClose(); // Close the dialog if deletion is not successful
    }
  };

  return (
    <ToastProvider>
      <>
        {showDeleteConfirmation && (
          <DeleteConfirmation
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            itemType="account"
            onConfirm={handleDeleteAccount}
          />
        )}
        {isToastOpen && (
          <Toast
            onOpenChange={setIsToastOpen}
            open={isToastOpen}
            duration={2000}
            className={toastType === "success" ? "bg-green-100" : "bg-red-100"}
          >
            <div className="flex items-center">
              {toastType === "success" ? (
                <CheckCircle className="text-green-500 mr-2" />
              ) : (
                <XCircle className="text-red-500 mr-2" />
              )}
              <div>
                <ToastTitle>
                  {toastType === "success" ? "Success" : "Error"}
                </ToastTitle>
                <ToastDescription>{toastMessage}</ToastDescription>
              </div>
            </div>
            <ToastClose />
          </Toast>
        )}
        <ToastViewport />
      </>
    </ToastProvider>
  );
};

export default function AccountManagement() {
  const [activeTab, setActiveTab] = useState("info");
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const getUserRole = () => Cookies.get("role") || "guest";
  const role = getUserRole();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = Cookies.get("jwt");
        const role = getUserRole();
        const api = `https://trip-genie-apis.vercel.app/${role}`;
        const response = await axios.get(api, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser({
          ...response.data,
          role,
          email: response.data.email, // Ensure email is included
        });
      } catch (err) {
        setError(err.message);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const path = location.pathname.split("/").pop();
    if (path === "account" || path === "") {
      setActiveTab(role === "tourism-governor" ? "faqs" : "info");
    } else {
      setActiveTab(path);
    }
  }, [location, role]);

  const handleRedeemPoints = async () => {
    try {
      const token = Cookies.get("jwt");
      const role = getUserRole();
      const api = `https://trip-genie-apis.vercel.app/${role}/redeem-points`;
      const response = await axios.post(
        api,
        {},
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser((prevUser) => ({
        ...prevUser,
        wallet: response.data.walletBalance,
        loyaltyPoints: response.data.remainingPoints,
      }));

      return response.data;
    } catch (error) {
      console.error("Error redeeming points:", error);
      throw new Error(
        error.response?.data?.error ||
          "Failed to redeem points. Please try again."
      );
    }
  };

  const renderContent = () => {
    if (error)
      return <div className="text-center text-red-500">Error: {error}</div>;
    if (!user) return <div className="text-center"></div>;

    switch (activeTab) {
      case "info":
        return <AccountInfo user={user} />;
      case "notifications":
        return <Notifications user={user} />;
      case "complain":
        return <Complaint />;
      case "my-complaints":
        return <MyComplaintsComponent />;
      case "cart":
        return <Cart user={user} />;
      case "wishlist":
        return <Wishlist user={user} />;
      case "history":
        return <History user={user} />;
      case "historyItineraries":
        return <HistoryItineraries user={user} />;
      case "upcomingActivities":
        return <Upcoming user={user} />;
      case "upcomingItineraries":
        return <UpcomingItineraries user={user} />;
      case "upcomingTransportation":
        return <UpcommingTransportationBooking user={user} />;
      case "historyTransportation":
        return <HistoryTransportationBooking user={user} />;
      case "redeem-points":
        return <RedeemPoints user={user} onRedeemPoints={handleRedeemPoints} />;
      case "security":
        return <PasswordChanger />;
      case "SavedActivities":
        return <Savedactivites />;
      case "SavedItineraries":
        return <Saveditineraries />;
      case "activities":
        return <TouristActivitiesPage />;
      case "purchases":
        return <OrdersPage />;
      case "itineraries":
        return <TouristItinerariesPage />;
      case "transportation":
        return <TouristTransportationPage />;
      case "preferences":
        return <Preferences user={user} />;
      case "wallet-history":
        return <TouristWalletPage user={user} />;
      case "add-card":
        return user.role === "tourist" ? (
          <AddCard />
        ) : (
          <div>Add card not available for {user.role}</div>
        );
      case "add-ship":
        return user.role === "tourist" ? (
          <ShippingAddress />
        ) : (
          <div>Add shipping address not available for {user.role}</div>
        );
      case "currency":
        return <CurrencyApp user={user} />;
      case "faqs":
        return <FAQs />;
      case "sales-report-seller":
        return <ProductReportSeller />;
      case "stock-report":
        return <StockReport />;
      case "flight-bookings":
        return <ExternalFlightBookings user={user} />;
      case "hotel-bookings":
        return <ExternalHotelBookings user={user} />;
      default:
        return <AccountInfo user={user} />;
    }
  };

  const handleTabClick = (tab) => {
    if (tab === "delete-account") {
      setShowDeleteAccount(true);
    } else if (tab === "logout") {
      handleLogoutClick();
    } else {
      setActiveTab(tab);
      navigate(`/account/${tab}`);
    }
  };

  const menuStructure = {
    "My Bookings": [
      {
        name: "Activities",
        icon: Bookmark,
        tab: "activities",
        roles: ["tourist"],
      },
      {
        name: "Itineraries",
        icon: Calendar,
        tab: "itineraries",
        roles: ["tourist"],
      },

      {
        name: "Vehicles",
        icon: HistoryIcon,
        tab: "transportation",
        roles: ["tourist"],
      },
      {
        name: "Hotels",
        icon: HistoryIcon,
        tab: "hotel-bookings",
        roles: ["tourist"],
      },
      {
        name: "Flights",
        icon: HistoryIcon,
        tab: "flight-bookings",
        roles: ["tourist"],
      },
    ],

    "Settings and Privacy": [
      {
        name: "Account",
        icon: User,
        tab: "info",
        roles: ["tourist", "seller", "advertiser", "tour-guide", "admin"],
      },
      // {
      //   name: "Security",
      //   icon: Lock,
      //   tab: "security",
      //   roles: [
      //     "tourist",
      //     "seller",
      //     "advertiser",
      //     "tour-guide",
      //     "admin",
      //     "tourism-governor",
      //   ],
      // },
      {
        name: "Preferences",
        icon: Settings,
        tab: "preferences",
        roles: ["tourist"],
      },
      {
        name: "Wallet History",
        icon: Wallet2,
        tab: "wallet-history",
        roles: ["tourist"],
      },
      {
        name: "Notifications",
        icon: Bell,
        tab: "notifications",
        roles: ["tourist", "seller", "advertiser", "tour-guide"],
      },
      // {
      //   name: "Points and Wallet",
      //   icon: Wallet,
      //   tab: "redeem-points",
      //   roles: ["tourist"],
      // },
      // {
      //   name: "Set Currency",
      //   icon: DollarSign,
      //   tab: "currency",
      //   roles: ["tourist"],
      // },
      // {
      //   name: "Add credit/debit cards",
      //   icon: CreditCard,
      //   tab: "add-card",
      //   roles: ["tourist"],
      // },
      // {
      //   name: "Add Shipping Address",
      //   icon: HomeIcon,
      //   tab: "add-ship",
      //   roles: ["tourist"],
      // },
      {
        name: "Delete Account",
        icon: Trash2,
        tab: "delete-account",
        roles: ["tourist", "seller", "advertiser", "tour-guide"],
      },
    ],
    // "View Reports": [
    //   {
    //     name: "Sales Report",
    //     icon: FileText,
    //     tab: "sales-report-seller",
    //     roles: ["seller"],
    //   },
    //   {
    //     name: "Stock Report",
    //     icon: FileText,
    //     tab: "stock-report",
    //     roles: ["seller"],
    //   },
    // ],
    "Help and Support": [
      // {
      //   name: "File a Complaint",
      //   icon: AlertTriangle,
      //   tab: "complain",
      //   roles: ["tourist"],
      // },
      {
        name: "Complaints",
        icon: FileText,
        tab: "my-complaints",
        roles: ["tourist"],
      },
      {
        name: "FAQs",
        icon: HelpCircle,
        tab: "faqs",
        roles: [
          "tourist",
          "seller",
          "advertiser",
          "tour-guide",
          "admin",
          "tourism-governor",
        ],
      },
    ],

    // "Display and Accessibility": [
    //   { name: "Theme", icon: Eye, tab: "theme", roles: ["tourist", "seller", "advertiser", "tour-guide", "admin", "tourism-governor"] },
    //   { name: "Language", icon: MapPin, tab: "language", roles: ["tourist", "seller", "advertiser", "tour-guide", "admin", "tourism-governor"] },
    // ],
  };

  const LogoutPopup = ({ onConfirm, onCancel }) => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Are you sure you want to log out?
          </h3>
          <div className="flex justify-end gap-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  };

  const [showPopup, setShowPopup] = useState(false);

  const logOut = async () => {
    console.log("Logging out...");
    try {
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/auth/logout"
      );
      if (response.ok) {
        Cookies.set("jwt", "");
        Cookies.set("role", "");
        Cookies.remove("jwt");
        Cookies.remove("role");
        console.log("Logged out successfully");
        navigate("/login");
        window.location.reload();
      } else {
        console.error("Logout failed.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleLogoutClick = () => {
    setShowPopup(true);
  };

  const handleConfirmLogout = () => {
    setShowPopup(false);
    logOut();
  };

  const handleCancelLogout = () => {
    setShowPopup(false);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // First, add these state variables near the top of the AccountManagement component
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");

  // Add this handler function
  const handleChangePasswordClick = () => {
    setIsModalOpen(true);
  };

  // First, update the handlePasswordChangeSuccess function to properly show the toast
  const handlePasswordChangeSuccess = (message) => {
    setIsModalOpen(false);
    setToastMessage("Your password has been successfully updated.");
    setToastType("success");
    setIsToastOpen(true);
  };

  const showToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  return (
    <div>
      <ToastProvider>
        <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
        </div>
        {role === "tourism-governor" && (
          <div className="text-[#1A3B47] p-2 border-b bg-gray-100 border-gray-300">
            <div className="flex justify-end items-center">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none group">
                    <div className="flex items-center space-x-2 p-2 rounded-full transition-colors duration-200 group-hover:bg-[#B5D3D1]">
                      <span className="mr-2 text-[#1A3B47]">
                        {user.username}
                      </span>
                      <Avatar
                        className="h-8 w-8 !bg-[#388A94] text-white"
                        style={{ backgroundColor: "#388A94" }}
                      >
                        <AvatarFallback className="bg-transparent">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-white shadow-lg rounded-md p-2"
                  >
                    <div className="flex items-center space-x-2 p-2">
                      <Avatar className="h-12 w-12 bg-[#388A94] text-white">
                        <AvatarFallback className="text-lg bg-transparent">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-[#1A3B47]">
                          {user.username}
                        </p>
                        <p className="text-sm text-[#5D9297]">
                          Tourism Governor
                        </p>
                      </div>
                    </div>
                    {/* Always show email container if user exists */}
                    <div className="flex items-center justify-center mt-2 text-[#1A3B47]">
                      <Mail className="mr-2 h-4 w-4" />
                      <p className="text-xs">
                        {user.email || "No email available"}
                      </p>
                    </div>
                    <DropdownMenuItem
                      className="w-full text-[#1A3B47] hover:bg-[#B5D3D1] transition-colors duration-200 border border-gray-300 text-center mt-2"
                      onClick={handleChangePasswordClick}
                    >
                      <span className="w-full text-center">
                        Change Password
                      </span>
                    </DropdownMenuItem>
                    <Separator className="my-2" />
                    <DropdownMenuItem
                      className="w-full text-[#1A3B47] hover:bg-[#B5D3D1] transition-colors duration-200"
                      onClick={handleLogoutClick}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )}
        <div className="flex min-h-screen bg-gray-100">
          <Sidebar
            menuStructure={menuStructure}
            role={role}
            activeTab={activeTab}
            onTabClick={handleTabClick}
          />
          <main className="flex-1 p-8">
            <div className="w-full mx-auto">{renderContent()}</div>
          </main>

          {showDeleteAccount && (
            <DeleteAccount onClose={() => setShowDeleteAccount(false)} />
          )}
          {showPopup && (
            <LogoutPopup
              onConfirm={handleConfirmLogout}
              onCancel={handleCancelLogout}
            />
          )}
        </div>
        {/* Password Change Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <button
                  className="close-button"
                  onClick={() => setIsModalOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <PasswordChanger onSuccess={handlePasswordChangeSuccess} />
              </div>
            </div>
          </div>
        )}
        <ToastViewport /> {/* Add this line */}
        {isToastOpen && (
          <Toast
            onOpenChange={setIsToastOpen}
            open={isToastOpen}
            duration={2000}
            className={toastType === "success" ? "bg-green-100" : "bg-red-100"}
          >
            <div className="flex items-center">
              {toastType === "success" ? (
                <CheckCircle className="text-green-500 mr-2" />
              ) : (
                <XCircle className="text-red-500 mr-2" />
              )}
              <div>
                <ToastTitle>
                  {toastType === "success" ? "Success" : "Error"}
                </ToastTitle>
                <ToastDescription>{toastMessage}</ToastDescription>
              </div>
            </div>
            <ToastClose />
          </Toast>
        )}
      </ToastProvider>
    </div>
  );
}
