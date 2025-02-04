"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Flag from "react-world-flags";
import Cookies from "js-cookie";
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  parseISO,
} from "date-fns";
import {
  Activity,
  ShoppingCart,
  Plane,
  Hotel,
  Calendar,
  Wallet,
  Award,
  Bell,
  ShoppingBasket,
  CheckCircle,
  XCircle,
  Bus,
  Map,
  User,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Modal } from "@/components/Modal";
import { ImageCropper } from "@/components/ImageCropper";
import ShippingAddress from "@/pages/AddShippingAddress";
import Popup from "@/components/popup";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PasswordChanger from "@/components/Passwords";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast";
import WalletHistory from "./WalletHistory";

const convertUrlToBase64 = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

const getTransactionIcon = (details) => {
  if (details.toLowerCase().includes("activity"))
    return <Activity className="w-6 h-6" />;
  if (details.toLowerCase().includes("itinerary"))
    return <Map className="w-6 h-6" />;
  if (details.toLowerCase().includes("bus")) return <Bus className="w-6 h-6" />;
  if (details.toLowerCase().includes("car")) return <Car className="w-6 h-6" />;
  if (details.toLowerCase().includes("order"))
    return <ShoppingBasket className="w-6 h-6" />;
  if (details.toLowerCase().includes("flight"))
    return <Plane className="w-6 h-6" />;
  if (details.toLowerCase().includes("hotel"))
    return <Hotel className="w-6 h-6" />;

  return <Wallet className="w-6 h-6" />;
};

const groupTransactionsByDate = (transactions) => {
  const grouped = {
    Today: { transactions: [], total: 0, sign: "" },
    Yesterday: { transactions: [], total: 0, sign: "" },
    "This Week": { transactions: [], total: 0, sign: "" },
    "This Month": { transactions: [], total: 0, sign: "" },
    Earlier: {},
  };

  transactions.forEach((transaction) => {
    const date = parseISO(transaction.timestamp);
    const amount =
      transaction.transactionType === "deposit"
        ? transaction.amount
        : -transaction.amount;
    const absAmount = Math.abs(amount); // Use the absolute value for total
    const sign = amount >= 0 ? "positive" : "negative"; // Set the sign based on the transaction type

    if (isToday(date)) {
      grouped.Today.transactions.push(transaction);
      grouped.Today.total += absAmount;
      grouped.Today.sign = sign; // Set the sign for Today
    } else if (isYesterday(date)) {
      grouped.Yesterday.transactions.push(transaction);
      grouped.Yesterday.total += absAmount;
      grouped.Yesterday.sign = sign; // Set the sign for Yesterday
    } else if (isThisWeek(date)) {
      grouped["This Week"].transactions.push(transaction);
      grouped["This Week"].total += absAmount;
      grouped["This Week"].sign = sign; // Set the sign for This Week
    } else if (isThisMonth(date)) {
      grouped["This Month"].transactions.push(transaction);
      grouped["This Month"].total += absAmount;
      grouped["This Month"].sign = sign; // Set the sign for This Month
    } else {
      const monthYear = format(date, "MMMM yyyy");
      if (!grouped.Earlier[monthYear]) {
        grouped.Earlier[monthYear] = { transactions: [], total: 0, sign: "" };
      }
      grouped.Earlier[monthYear].transactions.push(transaction);
      grouped.Earlier[monthYear].total += absAmount;
      grouped.Earlier[monthYear].sign = sign; // Set the sign for Earlier
    }
  });

  // Sort transactions within each group
  Object.keys(grouped).forEach((key) => {
    if (Array.isArray(grouped[key].transactions)) {
      grouped[key].transactions.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
    } else if (typeof grouped[key] === "object") {
      Object.keys(grouped[key]).forEach((subKey) => {
        grouped[key][subKey].transactions.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
      });
    }
  });

  return grouped;
};

const phoneValidator = (value) => {
  const phoneNumber = parsePhoneNumberFromString("+" + value);
  return phoneNumber ? phoneNumber.isValid() : false;
};

const SkeletonLoader = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Account</h1>
      <p className="text-sm text-gray-500 mb-2">
        Settings and Privacy / Account
      </p>
      <div className="container mx-auto px-4 py-8 ">
        <div className="animate-pulse">
          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-7">
              <CardContent className="py-6">
                <div className="flex items-center justify-center">
                  {/* Skeleton for Profile Picture Section */}
                  <div className="w-1/3 flex flex-col items-center">
                    <div className="relative mb-4">
                      <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-center mb-2">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 h-6 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                      <p className="w-32 h-4 bg-gray-200 rounded-md animate-pulse mt-1"></p>
                    </div>
                    <Separator />
                    <div className="flex flex-col w-full max-w-[200px] ">
                      <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse mt-2"></div>
                      <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse mt-2"></div>
                    </div>
                  </div>

                  {/* Vertical Separator */}
                  <div className="border-r border-gray-200 h-[260px] mx-2"></div>

                  {/* Skeleton for Profile Info Section */}
                  <div className="w-2/3 pl-4 space-y-3">
                    {/* Row 1 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-32 h-6 bg-gray-200 rounded-md animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-32 h-6 bg-gray-200 rounded-md animate-pulse"></div>
                      </div>
                    </div>

                    <Separator />

                    {/* Row 2 */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="w-14 h-3 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-20 h-5 bg-gray-200 rounded-md animate-pulse mt-1"></div>
                      </div>
                      <div>
                        <div className="w-14 h-3 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-20 h-5 bg-gray-200 rounded-md animate-pulse mt-1"></div>
                      </div>
                      <div>
                        <div className="w-14 h-3 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-20 h-5 bg-gray-200 rounded-md animate-pulse mt-1"></div>
                      </div>
                    </div>

                    <Separator />

                    {/* Row 3 */}
                    <div className="grid grid-cols-3 ">
                      {/* Nationality field spans two columns */}
                      <div className="col-span-2 space-y-2">
                        <div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-32 h-6 bg-gray-200 rounded-md animate-pulse"></div>
                      </div>

                      {/* Occupation field takes one column */}
                      <div>
                        <div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-24 h-6 bg-gray-200 rounded-md animate-pulse mt-1"></div>
                      </div>
                    </div>

                    {/* Separator */}
                    <Separator />

                    {/* Row 4 (Phone Number and Register Date) */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Phone Number spans two columns */}
                      <div className="col-span-2 space-y-2">
                        <div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-full h-8 bg-gray-200 rounded-md animate-pulse mt-1"></div>
                      </div>

                      {/* Register Date */}
                      <div>
                        <div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-20 h-6 bg-gray-200 rounded-md animate-pulse mt-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="col-span-5 bg-white border rounded-lg shadow-sm p-6">
              {/* Title Skeleton */}
              <div className="mb-4 flex items-center justify-between animate-pulse">
                <div className="w-32 h-4 bg-gray-200 rounded-md"></div>{" "}
                {/* Skeleton for Title */}
                <div className="w-24 h-6 bg-gray-200 rounded-md"></div>{" "}
                {/* Skeleton for Button */}
              </div>

              {/* Scrollable Card Skeleton */}
              <div className="space-y-4 h-[200px] overflow-y-auto">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg mb-3 p-4 shadow-sm animate-pulse"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full"></div>{" "}
                      {/* Location icon skeleton */}
                      <div className="w-24 h-4 bg-gray-200 rounded-md ml-2"></div>{" "}
                      {/* Location type skeleton */}
                    </div>
                    <div className="space-y-1">
                      <div className="w-32 h-4 bg-gray-200 rounded-md"></div>{" "}
                      {/* Street skeleton */}
                      <div className="w-24 h-4 bg-gray-200 rounded-md"></div>{" "}
                      {/* City, state, postal code skeleton */}
                      <div className="w-40 h-3 bg-gray-200 rounded-md"></div>{" "}
                      {/* Landmark skeleton */}
                    </div>
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                      <div className="flex space-x-3">
                        <div className="w-16 h-4 bg-gray-200 rounded-md"></div>{" "}
                        {/* Edit button skeleton */}
                        <div className="w-16 h-4 bg-gray-200 rounded-md"></div>{" "}
                        {/* Delete button skeleton */}
                      </div>
                      <div className="w-32 h-4 bg-gray-200 rounded-md"></div>{" "}
                      {/* Set as Default button skeleton */}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-8">
              <Card>
                <CardContent className="pt-6">
                  {/* Current Balance Skeleton */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                    </div>
                    <div className="w-24 h-6 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>

                  {/* Wallet History Skeleton */}
                  <div className="mt-2 overflow-y-auto ">
                    <h3 className="text-lg font-semibold mb-2">
                      <div className="w-28 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                    </h3>
                    <div className="space-y-4">
                      {/* Skeleton for no transactions */}
                      <div className="space-y-2">
                        <div className="w-full h-12 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-full h-12 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="w-full h-12 bg-gray-200 rounded-md animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="col-span-4">
              <CardHeader className="flex">
                <div className="w-full flex justify-between items-center animate-pulse">
                  <div className="w-32 h-4 bg-gray-200 rounded-md"></div>{" "}
                  {/* Skeleton for Title */}
                  <div className="w-20 h-6 bg-gray-200 rounded-md"></div>{" "}
                  {/* Skeleton for Button */}
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col max-h-[180px] overflow-y-auto">
                  <div className="space-y-4 p-4">
                    {[...Array(5)].map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 animate-pulse"
                      >
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>{" "}
                        {/* Placeholder for profile image */}
                        <div className="flex flex-col gap-2">
                          <div className="w-40 h-4 bg-gray-200 rounded-md"></div>{" "}
                          {/* Placeholder for notification body */}
                          <div className="w-24 h-3 bg-gray-200 rounded-md"></div>{" "}
                          {/* Placeholder for notification timestamp */}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export function TouristProfileComponent() {
  const navigate = useNavigate();

  const [tourist, setTourist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTourist, setEditedTourist] = useState(null);
  const [validationMessages, setValidationMessages] = useState({});
  const [nationalities, setNationalities] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [currencyCode, setCurrencyCode] = useState(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newImage, setNewImage] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [base64Image, setBase64Image] = useState(null);
  const [rates, setRates] = useState({});
  const [currencies, setCurrencies] = useState([]);
  const [activeTab, setActiveTab] = useState("wallet");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  const handlePasswordChangeSuccess = (message) => {
    setIsPasswordModalOpen(false);
    setToastMessage(message);
    setIsToastOpen(true);
  };

  const getUserRole = () => Cookies.get("role") || "guest";

  const convertCurrency = useCallback(
    (amount, fromCurrency, toCurrency) => {
      if (typeof fromCurrency === "string" && typeof toCurrency === "string") {
        return (amount / rates[fromCurrency]) * rates[toCurrency];
      } else if (
        typeof fromCurrency !== "string" &&
        typeof toCurrency === "string"
      ) {
        return (amount / rates[fromCurrency.code]) * rates[toCurrency];
      } else if (
        typeof fromCurrency !== "string" &&
        typeof toCurrency !== "string"
      ) {
        return (amount / rates[fromCurrency?.code]) * rates[toCurrency?.code];
      } else if (
        typeof fromCurrency === "string" &&
        typeof toCurrency !== "string"
      ) {
        return (amount / rates[fromCurrency]) * rates[toCurrency?.code];
      } else if (!rates[fromCurrency] || !rates[toCurrency.code]) return amount;
      return (amount / rates[fromCurrency]) * rates[toCurrency?.code];
    },
    [rates]
  );

  const formatCurrency = useCallback(
    (amount, currency) => {
      const currencyInfo = currencies.find((c) => c.code === currencyCode);
      return `${currencyInfo ? currencyInfo.symbol : ""}${amount.toFixed(2)}`;
    },
    [currencies]
  );

  const fetchTouristProfile = async () => {
    try {
      const token = Cookies.get("jwt");
      const role = getUserRole();
      const api = `https://trip-genie-apis.vercel.app/${role}`;
      const response = await axios.get(api, {
        headers: { Authorization: `Bearer ${token}` },
      });
      response.data.mobile = response.data.mobile.slice(1);
      setTourist(response.data);
      setEditedTourist(response.data);
      setSelectedImage(response.data.profilePicture);

      if (response.data.profilePicture && response.data.profilePicture.url) {
        convertUrlToBase64(response.data.profilePicture.url).then((res) => {
          setBase64Image(res);
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTouristProfile();
  }, []);

  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/api/nationalities"
        );
        setNationalities(response.data);
      } catch (error) {
        console.error("Error fetching nationalities:", error);
      }
    };
    fetchNationalities();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (activeTab === "wallet") {
        try {
          const token = Cookies.get("jwt");
          const [ratesResponse, currenciesResponse] = await Promise.all([
            axios.get("https://trip-genie-apis.vercel.app/rates", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("https://trip-genie-apis.vercel.app/tourist/currencies", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          setRates(ratesResponse.data.rates);
          setCurrencies(currenciesResponse.data);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchData();
  }, [activeTab]);

  const openModal = () => {
    setModalOpen(true);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const fetchExchangeRate = useCallback(async () => {
    if (tourist) {
      try {
        const token = Cookies.get("jwt");
        const response = await fetch(
          `https://trip-genie-apis.vercel.app/tourist/populate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              base: "67140446ee157ee4f239d523",
              target: tourist.preferredCurrency,
            }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setExchangeRate(data.conversion_rate);
        } else {
          console.error("Error in fetching exchange rate:", data.message);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    }
  }, [tourist]);

  const getCurrencySymbol = useCallback(async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/tourist/getCurrency/${tourist.preferredCurrency}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrencyCode(response.data.code);
      setCurrencySymbol(response.data.symbol);
    } catch (error) {
      console.error("Error fetching currency symbol:", error);
    }
  }, [tourist]);

  const formatWallet = (price) => {
    fetchExchangeRate();
    getCurrencySymbol();
    if (tourist && exchangeRate && currencySymbol) {
      const exchangedPrice = price * exchangeRate;
      return `${currencySymbol}${exchangedPrice.toFixed(2)}`;
    }
  };

  const handleUpdateClick = () => {
    setShowModal(true);
    setDropdownOpen(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalOpen(false);
    setImageModalOpen(false);
  };

  const handleImageCropped = (newImage) => {
    setNewImage(newImage);
  };

  const handleFirstSave = () => {
    setSelectedImage(newImage);
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } =
      e && e.target ? e.target : { name: "mobile", value: e };
    setEditedTourist((prev) => ({ ...prev, [name]: value }));
    setValidationMessages((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNationalityChange = (value) => {
    setEditedTourist((prev) => ({ ...prev, nationality: value }));
    setValidationMessages((prev) => ({ ...prev, nationality: "" }));
  };

  const handleDiscard = () => {
    setEditedTourist(tourist);
    setSelectedImage(tourist.profilePicture);
    setDropdownOpen(false);
    setIsEditing(false);
    setValidationMessages({});
  };

  const validateFields = () => {
    const { email, mobile, nationality, jobOrStudent, fname, lname, username } =
      editedTourist;
    const messages = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      messages.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      messages.email = "Invalid email format.";
    }
    if (!mobile) {
      messages.mobile = "Phone number is required.";
    } else if (!phoneValidator(mobile)) {
      messages.mobile = "Invalid phone number.";
    }
    if (!nationality) messages.nationality = "Nationality is required.";
    if (!jobOrStudent) messages.jobOrStudent = "Occupation is required.";
    if (!fname) messages.fname = "First name is required.";
    if (!lname) messages.lname = "Last name is required.";
    if (!username) messages.username = "Username is required.";

    setValidationMessages(messages);
    return Object.keys(messages).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateFields()) return;

    try {
      const finalTourist = { ...editedTourist };
      finalTourist.mobile = "+" + editedTourist.mobile;
      finalTourist.fname = editedTourist.fname;
      finalTourist.lname = editedTourist.lname;
      finalTourist.username = editedTourist.username;
      finalTourist.email = editedTourist.email;

      const token = Cookies.get("jwt");
      const role = getUserRole();
      const api = `https://trip-genie-apis.vercel.app/${role}`;
      finalTourist.profilePicture = selectedImage;
      setDropdownOpen(false);
      console.log(finalTourist);

      const response = await axios.put(api, finalTourist, {
        headers: { Authorization: `Bearer ${token}` },
      });
      response.data.tourist.mobile = response.data.tourist.mobile.slice(1);

      if (response.status === 200) {
        setTourist(response.data.tourist);
        setIsEditing(false);
        setError("");
        setValidationMessages({});
      }
      console.log(response.data);
    } catch (err) {
      if (err.response?.data?.message === "Email already exists") {
        setValidationMessages({ email: "Email already exists" });
      } else if (err.response?.data?.message === "Username already exists") {
        setValidationMessages({ username: "Username already exists" });
      } else {
        setError(err.message);
      }
    }
  };

  const handleRedeemPoints = async () => {
    try {
      const token = Cookies.get("jwt");
      const role = getUserRole();
      const api = `https://trip-genie-apis.vercel.app/${role}/redeem-points`;
      const response = await axios.post(
        api,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTourist((prevTourist) => ({
        ...prevTourist,
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

  const RedeemPoints = ({ user, onRedeemPoints }) => {
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemError, setRedeemError] = useState(null);
    const [redeemSuccess, setRedeemSuccess] = useState(null);
    const [preferredCurrency, setPreferredCurrency] = useState("USD");

    useEffect(() => {
      const fetchUserInfo = async () => {
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
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            const currencyId = response.data.preferredCurrency;

            if (currencyId) {
              const response2 = await axios.get(
                `https://trip-genie-apis.vercel.app/tourist/getCurrency/${currencyId}`,
                {
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
      };
      fetchUserInfo();
    }, []);

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

    return (
      <Card className="w-full h-[240px] shadow-none border border-white">
        <CardHeader>
          <CardTitle>Redeem Loyalty Points</CardTitle>
          <CardDescription>
            Convert your loyalty points into wallet balance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              Available Wallet Balance:
            </span>
            <span className="text-lg font-bold text-[#388A94]">
              {formatCurrency(convertedWalletAmount, preferredCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Loyalty Points:</span>
            <span className="text-lg font-bold text-[#1A3B47]">
              {user.loyaltyPoints.toFixed(2)} points
            </span>
          </div>
          <Button
            onClick={handleRedeemClick}
            disabled={isRedeeming || user.loyaltyPoints === 0}
            className="w-full text-base text-[#388A94] bg-gray-200 hover:bg-gray-300"
          >
            {isRedeeming
              ? "Redeeming..."
              : `Redeem Points for ${formatCurrency(
                  pointsValueInPreferredCurrency,
                  preferredCurrency
                )}`}
          </Button>
        </CardContent>
        <CardFooter>
          {redeemError && <p className="text-red-500 text-sm">{redeemError}</p>}
          {redeemSuccess && (
            <p className="text-green-500 text-sm">{redeemSuccess}</p>
          )}
        </CardFooter>
      </Card>
    );
  };

  const CurrencyApp = ({ user }) => {
    const [currencies, setCurrencies] = useState([]);
    const [preferredCurrency, setPreferredCurrency] = useState(null);
    const [selectedCurrency, setSelectedCurrency] = useState("");

    const fetchPreferredCurrencyCode = async () => {
      try {
        const token = Cookies.get("jwt");
        const codeResponse = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/currencies/idd",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const preferredCurrencyCode = codeResponse.data;

        const currencyResponse = await axios.get(
          `https://trip-genie-apis.vercel.app/tourist/getCurrency/${preferredCurrencyCode}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPreferredCurrency(currencyResponse.data);
      } catch (error) {
        console.error("Error fetching preferred currency details:", error);
      }
    };

    useEffect(() => {
      const fetchSupportedCurrencies = async () => {
        try {
          const token = Cookies.get("jwt");
          const response = await axios.get(
            "https://trip-genie-apis.vercel.app/tourist/currencies",
            {
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
    }, [user]);

    const handleSetPreferredCurrency = async () => {
      try {
        const token = Cookies.get("jwt");
        await axios.post(
          "https://trip-genie-apis.vercel.app/tourist/currencies/set",
          { currencyId: selectedCurrency },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        openSuccessPopup("Preferred currency set successfully!");

        fetchPreferredCurrencyCode();
      } catch (error) {
        console.error("Error setting preferred currency:", error);
        openErrorPopup(error);
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

    return (
      <Card className="w-full h-[240px] shadow-none border border-white">
        <CardHeader>
          <CardTitle>Preferred Currency</CardTitle>
          <CardDescription>
            {preferredCurrency
              ? `Current: ${preferredCurrency.name} (${preferredCurrency.code})`
              : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency-select">
                Select New Preferred Currency
              </Label>
              <Select
                value={selectedCurrency}
                onValueChange={(value) => setSelectedCurrency(value)}
              >
                <SelectTrigger id="currency-select">
                  <SelectValue placeholder="Choose Currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency._id} value={currency._id}>
                      {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSetPreferredCurrency}
              disabled={!selectedCurrency}
              className="w-full bg-[#388A94] hover:bg-[#2e6b77]"
            >
              Set Preferred Currency
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getDefaultAddress = () => {
    const defaultAddress = tourist.shippingAddresses.find(
      (addr) => addr.default
    );
    return defaultAddress
      ? {
          streetName: defaultAddress.streetName,
          city: defaultAddress.city,
          postalCode: defaultAddress.postalCode,
        }
      : null;
  };

  const getBadgeColor = () => {
    switch (tourist.loyaltyBadge) {
      case "Bronze":
        return "bg-amber-600";
      case "Silver":
        return "bg-gray-400";
      case "Gold":
        return "bg-yellow-400";
      default:
        return "bg-gray-200";
    }
  };

  const CustomFlag = ({ countryCode }) => {
    return (
      <Flag
        code={countryCode}
        style={{
          width: 25,
          height: 17,
          borderRadius: "4px",
          overflow: "hidden",
        }}
      />
    );
  };

  const [notifications, setNotifications] = useState([]);
  const [hasUnseenNotifications, setHasUnseenNotifications] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkUnseenNotifications();
    fetchNotifications();
  }, []);

  const checkUnseenNotifications = async () => {
    try {
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/tourist/unseen-notifications`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setHasUnseenNotifications(response.data.hasUnseen);
    } catch (error) {
      console.error("Error checking unseen notifications:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/tourist/notifications`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );

      if (Array.isArray(response.data)) {
        setNotifications(response.data.slice(0, 5));
      } else if (response.data && Array.isArray(response.data.notifications)) {
        setNotifications(response.data.notifications.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsSeen = async (notificationID) => {
    try {
      await axios.post(
        `https://trip-genie-apis.vercel.app/tourist/notifications/markAsSeen/${notificationID}`,
        {},
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          seen: true,
        }))
      );
      setHasUnseenNotifications(false);
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading || !tourist) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div>
        <h1 className="text-3xl font-bold mb-2">Account</h1>
        <p className="text-sm text-gray-500 mb-2">
          Settings and Privacy / Account
        </p>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Merged Profile Picture and Info Card - 8 columns */}
            <Card className="col-span-7">
              <CardContent className="py-6">
                <div className="flex items-center justify-center">
                  {/* Profile Picture Section */}
                  <div className="w-1/3 flex flex-col items-center">
                    <div className="relative mb-4">
                      <button
                        className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center"
                        onClick={toggleDropdown}
                        disabled={!selectedImage && !isEditing}
                      >
                        {selectedImage ? (
                          <img
                            src={selectedImage.url || selectedImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-gray-400" />
                        )}
                        {isEditing && (
                          <div className="h-24 w-24 absolute bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs text-center">
                              Edit Profile Picture
                            </span>
                          </div>
                        )}
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-32">
                          <ul className="py-2">
                            {selectedImage && (
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-center"
                                onClick={() => {
                                  setIsImageViewerOpen(true);
                                  setDropdownOpen(false);
                                }}
                              >
                                View
                              </li>
                            )}
                            {isEditing && (
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-center"
                                onClick={handleUpdateClick}
                              >
                                Update
                              </li>
                            )}
                            {isEditing && selectedImage && (
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500 text-center"
                                onClick={() => {
                                  setSelectedImage(null);
                                  setDropdownOpen(false);
                                }}
                              >
                                Delete
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-center mb-2">
                      <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                          <div className="flex flex-col items-center">
                            <Input
                              type="text"
                              name="username"
                              value={editedTourist.username}
                              onChange={handleInputChange}
                              className={
                                validationMessages.username
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {validationMessages.username && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationMessages.username}
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            <h2 className="text-xl font-bold">
                              {tourist.username}
                            </h2>
                            <div
                              className={`w-7 h-7 flex items-center justify-center rounded-full ${getBadgeColor()}`}
                            >
                              <Award className="w-4 h-4 text-white items-center" />
                            </div>
                          </>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="flex flex-col items-center mt-2">
                          <Input
                            type="email"
                            name="email"
                            value={editedTourist.email}
                            onChange={handleInputChange}
                            className={
                              validationMessages.email ? "border-red-500" : ""
                            }
                          />
                          {validationMessages.email && (
                            <p className="text-red-500 text-xs mt-1">
                              {validationMessages.email}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">
                          {tourist.email}
                        </p>
                      )}
                    </div>
                    <Separator />
                    {isEditing ? (
                      <div className="flex flex-col w-full max-w-[200px] ">
                        <Button
                          onClick={handleUpdate}
                          className="w-full mt-2 bg-[#388A94] hover:bg-[#2e6b77]"
                        >
                          Update
                        </Button>
                        <Button
                          onClick={handleDiscard}
                          variant="outline"
                          className="w-full mt-2 hover:bg-gray-200 bg-gray-100"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="w-full mt-2 text-sm hover:bg-gray-200 bg-gray-100"
                        >
                          Edit Profile
                        </Button>

                        <Button
                          onClick={() => setIsPasswordModalOpen(true)}
                          className="p-2 w-full mt-2 bg-[#1A3B47]"
                        >
                          Change Password
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Vertical Separator */}
                  <div className="border-r border-gray-200 h-[260px] mx-2"></div>

                  {/* Profile Info Section */}
                  <div className="w-2/3 pl-4 space-y-3">
                    {/* Row 1 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">First Name</p>
                        {isEditing ? (
                          <div>
                            <Input
                              type="text"
                              name="fname"
                              value={editedTourist.fname}
                              onChange={handleInputChange}
                              className={
                                validationMessages.fname ? "border-red-500" : ""
                              }
                            />
                            {validationMessages.fname && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationMessages.fname}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-medium">{tourist.fname}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Last Name</p>
                        {isEditing ? (
                          <div>
                            <Input
                              type="text"
                              name="lname"
                              value={editedTourist.lname}
                              onChange={handleInputChange}
                              className={
                                validationMessages.lname ? "border-red-500" : ""
                              }
                            />
                            {validationMessages.lname && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationMessages.lname}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-medium">{tourist.lname}</p>
                        )}
                      </div>
                    </div>
                    <Separator />

                    {/* Row 2 */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Street Address</p>
                        <p className="text-sm font-medium">
                          {getDefaultAddress()?.streetName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">City</p>
                        <p className="text-sm font-medium">
                          {getDefaultAddress()?.city || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">ZIP Code</p>
                        <p className="text-sm font-medium">
                          {getDefaultAddress()?.postalCode || "N/A"}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Row 3 */}
                    <div className="grid grid-cols-3 ">
                      {/* Nationality field spans two columns */}
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Nationality</p>
                        {isEditing ? (
                          <Select onValueChange={handleNationalityChange}>
                            <SelectTrigger
                              className={
                                validationMessages.nationality
                                  ? "border-red-500"
                                  : ""
                              }
                            >
                              <SelectValue
                                placeholder={tourist.nationality.name}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {nationalities.map((nat) => (
                                <SelectItem key={nat._id} value={nat._id}>
                                  <div className="flex items-center gap-2">
                                    <Flag
                                      code={nat.countryCode}
                                      style={{
                                        width: 25,
                                        height: 17,
                                        borderRadius: "4px",
                                        overflow: "hidden",
                                      }}
                                    />
                                    {nat.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm font-medium">
                            {tourist.nationality.name}
                          </p>
                        )}
                      </div>

                      {/* Occupation field takes one column */}
                      <div>
                        <p className="text-xs text-gray-500">Occupation</p>
                        {isEditing ? (
                          <div>
                            <Input
                              type="text"
                              name="jobOrStudent"
                              value={editedTourist.jobOrStudent}
                              onChange={handleInputChange}
                              className={
                                validationMessages.jobOrStudent
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {validationMessages.jobOrStudent && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationMessages.jobOrStudent}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-medium">
                            {tourist.jobOrStudent || "Not Specified"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Separator */}
                    <Separator />

                    {/* Row 4 (Phone Number and Register Date) */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Phone Number spans two columns */}
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Phone Number</p>
                        {isEditing ? (
                          <div className="relative">
                            <PhoneInput
                              country="eg"
                              value={editedTourist.mobile}
                              onChange={(value) =>
                                handleInputChange({
                                  target: { name: "mobile", value },
                                })
                              }
                              inputProps={{
                                name: "mobile",
                                required: true,
                                className: `w-full pt-2 pb-2 pl-11 ${
                                  validationMessages.mobile
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`,
                              }}
                              containerClass="w-full"
                              disableDropdown={false} // Ensures the dropdown is visible
                              // Use a custom flag component for the country code dropdown
                              customFlagComponent={CustomFlag}
                            />
                            {validationMessages.mobile && (
                              <span className="text-red-500 text-xs">
                                {validationMessages.mobile}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-medium">
                            +{tourist.mobile}
                          </p>
                        )}
                      </div>

                      {/* Register Date */}
                      <div>
                        <p className="text-xs text-gray-500">Birthday</p>
                        <p className="text-sm font-medium">
                          {new Date(tourist.dateOfBirth).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Edit Button below email */}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Addresses - 4 columns */}
            <div className="col-span-5 ">
              <ShippingAddress
                addresses={tourist.shippingAddresses}
                fetch={fetchTouristProfile}
                showToast={showToast}
              />
            </div>

            {/* Tabs Section - spans 8 columns */}
            <div className="col-span-8">
              <Card>
                <CardContent>
                  <Tabs
                    defaultValue="wallet"
                    onValueChange={setActiveTab}
                    className="w-full bg-white"
                  >
                    <TabsList className="grid w-full grid-cols-3 bg-white pt-3">
                      <TabsTrigger
                        value="wallet"
                        className={`relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                          activeTab === "wallet"
                            ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                            : "text-gray-500 bg-white"
                        }`}
                      >
                        View Wallet Balance
                      </TabsTrigger>
                      <TabsTrigger
                        value="currency"
                        className={`relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                          activeTab === "currency"
                            ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                            : "border-gray-300 text-gray-500 bg-white"
                        }`}
                      >
                        Change Currency
                      </TabsTrigger>
                      <TabsTrigger
                        value="points"
                        className={`relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                          activeTab === "points"
                            ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                            : "border-gray-300 text-gray-500 bg-white"
                        }`}
                      >
                        Redeem Points
                      </TabsTrigger>{" "}
                    </TabsList>

                    <TabsContent value="wallet">
                      <Card className="shadow-none border border-white h-[240px]">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex flex-col">
                              <span className="font-bold text-2xl">
                                Available Balance
                              </span>
                              <span className="text-xs text-gray-500">
                                Your wallet balance is updated in real-time
                                based on your latest transactions.
                              </span>
                            </div>
                            <span className="text-2xl text-[#388A94] font-bold self-start">
                              {formatWallet(tourist.wallet)}
                            </span>
                          </div>
                          <div className="border-t border-gray-200 pt-4">
                            <div className="text-sm text-gray-500">
                              - Use your wallet balance to book trips or
                              purchase exclusive items.
                              <br />
                              - Wallet funds are non-transferable and expire
                              after 12 months of inactivity.
                              <br />- Access your{" "}
                              <a
                                href="/account/wallet-history"
                                className=" font-semibold underline text-gray-600 hover:text-gray-800"
                              >
                                Wallet History
                              </a>{" "}
                              to review all past transactions.
                              <br />- For more details, visit the{" "}
                              <a
                                href="/account/help"
                                className="font-semibold underline text-gray-600 hover:text-gray-800"
                              >
                                Help Center
                              </a>
                              .
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="currency">
                      <CurrencyApp user={tourist} />
                    </TabsContent>

                    <TabsContent value="points">
                      <RedeemPoints
                        user={tourist}
                        onRedeemPoints={handleRedeemPoints}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Notifications - 4 columns */}
            <Card className="col-span-4">
              <CardHeader className="flex">
                <CardTitle className="flex justify-between items-center">
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      className="text-sm text-[#388A94] p-2"
                      onClick={() =>
                        (window.location.href = "/account/notifications")
                      }
                    >
                      View All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col max-h-[200px] overflow-y-auto">
                  {loading ? (
                    // Skeleton Loader for Notifications
                    <div className="space-y-4 p-4">
                      {[...Array(5)].map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 animate-pulse"
                        >
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>{" "}
                          {/* Placeholder for profile image */}
                          <div className="flex flex-col gap-2">
                            <div className="w-40 h-4 bg-gray-200 rounded-md"></div>{" "}
                            {/* Placeholder for notification body */}
                            <div className="w-24 h-3 bg-gray-200 rounded-md"></div>{" "}
                            {/* Placeholder for notification timestamp */}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="text-[#1A3B47] p-4 text-center">
                      No notifications at the moment.
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {notifications.slice(0, 10).map((notification, index) => (
                        <li
                          key={index}
                          className="p-2 hover:bg-gray-50 transition-colors relative cursor-pointer flex flex-col gap-1"
                          onClick={() => {
                            markNotificationAsSeen(notification._id),
                              navigate("/account/notifications");
                          }}
                        >
                          {!notification.seen && (
                            <span className="absolute top-2 right-2 bg-[#F88C33] text-white text-xs px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                          <div
                            className="text-[#1A3B47] text-sm truncate"
                            dangerouslySetInnerHTML={{
                              __html: notification.body.slice(0, 30) + "...", // Show first 30 characters
                            }}
                          ></div>
                          <p className="text-xs text-gray-500">
                            {formatDate(notification.date)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Picture Update Modal */}
          <Modal show={showModal} onClose={closeModal}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Update Profile Picture</h2>
              <ImageCropper
                onImageCropped={handleImageCropped}
                currentImage={selectedImage?.url || selectedImage}
              />
              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  onClick={handleFirstSave}
                  className="bg-[#1A3B47] hover:bg-[#142B36] text-white px-4 py-2 rounded"
                >
                  Save
                </Button>
                <Button
                  onClick={closeModal}
                  variant="destructive"
                  className="bg-[#A3A3A3] hover:bg-[#7E7E7E] text-white px-4 py-2 rounded"
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>

          {/* Image Viewer Modal */}
          <Modal
            show={isImageViewerOpen}
            onClose={() => setIsImageViewerOpen(false)}
            isImageViewer={true}
            imageUrl={selectedImage?.url || selectedImage}
          />
          <Modal
            show={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
          >
            <PasswordChanger onSuccess={handlePasswordChangeSuccess} />
          </Modal>
          {isToastOpen && (
            <Toast
              onOpenChange={setIsToastOpen}
              open={isToastOpen}
              duration={1500}
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
          <ToastViewport className="fixed top-0 right-0 p-4" />
        </div>
      </div>
    </ToastProvider>
  );
}
