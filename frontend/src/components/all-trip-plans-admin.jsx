import React, { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FilterComponent from "./Filter.jsx";
import defaultImage from "../assets/images/default-image.jpg";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Loader from "./Loader.jsx";
import { Button } from "@/components/ui/button";
import * as jwtDecode from "jwt-decode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DualHandleSliderComponent from "./dual-handle-slider";
import { DateRangePicker } from "@/components/ui/date-range-picker";

let exchangeRateForFilter = 1;

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  itineraryTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-[#1A3B47]">
          Confirm Deletion
        </h2>
        <p className="mb-6 text-[#1A3B47]">
          Are you sure you want to delete the itinerary "{itineraryTitle}"?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            className="px-4 py-2 bg-[#E6DCCF] text-[#1A3B47] rounded hover:bg-[#F88C33] transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-[#F88C33] text-white rounded hover:bg-[#E6DCCF] transition-colors"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ItineraryCard = ({
  itinerary,
  onSelect,
  role,
  setShowDeleteConfirm,
  setSelectedItinerary,
  userInfo,
  onDeleteConfirm,
}) => {
  const [exchangeRate, setExchangeRate] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [userId, setUserId] = useState(null);

  const fetchExchangeRate = useCallback(async () => {
    if (!userInfo || !userInfo.preferredCurrency) return;

    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `https://trip-genie-apis.vercel.app/${userInfo.role}/populate`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base: itinerary.currency,
            target: userInfo.preferredCurrency._id,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setExchangeRate(data.conversion_rate);
        exchangeRateForFilter = data.conversion_rate;
      } else {
        console.error("Error in fetching exchange rate:", data.message);
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  }, [userInfo, itinerary.currency]);

  const getCurrencySymbol = useCallback(async () => {
    setCurrencySymbol("$");
    // try {
    //   const token = Cookies.get("jwt");
    //   const response = await axios.get(
    //     `https://trip-genie-apis.vercel.app/${userInfo.role}/getCurrency/${itinerary.currency}`,
    //     {
    //        credentials: "include", headers: { Authorization: `Bearer ${token}` },
    //     }
    //   );
    //   setCurrencySymbol(response.data.symbol);
    // } catch (error) {
    //   console.error("Error fetching currency symbol:", error);
    // }
  }, [userInfo.role, itinerary.currency]);

  useEffect(() => {
    if (
      userInfo.role === "tourist" &&
      userInfo.preferredCurrency &&
      userInfo.preferredCurrency !== itinerary.currency
    ) {
      fetchExchangeRate();
    } else {
      getCurrencySymbol();
    }
  }, [userInfo, itinerary, fetchExchangeRate, getCurrencySymbol]);

  const formatPrice = (price) => {
    if (userInfo.role === "tourist" && userInfo.preferredCurrency) {
      if (userInfo.preferredCurrency === itinerary.currency) {
        return `${userInfo.preferredCurrency.symbol}${price}`;
      } else if (exchangeRate) {
        const exchangedPrice = price * exchangeRate;
        return `${userInfo.preferredCurrency.symbol}${exchangedPrice.toFixed(
          2
        )}`;
      }
    } else if (currencySymbol) {
      return `${currencySymbol}${price}`;
    }
  };

  useEffect(() => {
    const token = Cookies.get("jwt");
    if (token) {
      const decodedToken = jwtDecode.jwtDecode(token);
      setUserId(decodedToken.id);
    }
  }, []);

  const uniqueCategories = new Set();
  const uniqueTags = new Set();

  const firstAvailablePicture = itinerary.activities
    ?.flatMap((activity) => activity.pictures ?? [])
    .find((picture) => picture?.url)?.url;

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl relative"
      onClick={() => onSelect(itinerary._id)}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={firstAvailablePicture || defaultImage}
          alt={itinerary.title}
          className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-[#1A3B47]">
            {itinerary.title}
          </h3>
          {!itinerary.isActivated && (
            <span className="bg-[#F88C33] text-white text-xs px-2 py-1 rounded-full">
              {role === "tour-guide" ? "Deactivated" : "Currently Unavailable"}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-bold text-[#388A94]">
            {formatPrice(itinerary.price)}
          </span>
          <span className="text-sm text-[#1A3B47]">{itinerary.language}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {itinerary.activities?.flatMap((activity, index) => [
            ...(activity.category
              ?.filter((cat) => {
                if (uniqueCategories.has(cat.name)) {
                  return false;
                }
                uniqueCategories.add(cat.name);
                return true;
              })
              .map((cat) => (
                <span
                  key={`cat-${index}-${cat.id || cat.name}`}
                  className="bg-[#E6DCCF] text-[#1A3B47] text-xs px-2 py-1 rounded-full"
                >
                  {cat.name}
                </span>
              )) || []),

            ...(activity.tags
              ?.filter((tag) => {
                if (uniqueTags.has(tag.type)) {
                  return false;
                }
                uniqueTags.add(tag.type);
                return true;
              })
              .map((tag) => (
                <span
                  key={`tag-${index}-${tag.id || tag.type}`}
                  className="bg-[#B5D3D1] text-[#1A3B47] text-xs px-2 py-1 rounded-full"
                >
                  {tag.type}
                </span>
              )) || []),
          ])}
        </div>
      </div>

      {role === "tour-guide" && userId === itinerary.tourGuide._id && (
        <div className="absolute top-2 right-2 flex space-x-2">
          <button
            className="p-2 bg-[#5D9297] text-white rounded-full hover:bg-[#388A94] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/update-itinerary/${itinerary._id}`;
            }}
            aria-label="Edit itinerary"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            className="p-2 bg-[#F88C33] text-white rounded-full hover:bg-[#E6DCCF] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConfirm(itinerary._id, itinerary.title);
            }}
            aria-label="Delete itinerary"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export function AllItinerariesComponent({ onSelectItinerary }) {
  const [itineraries, setItineraries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [maxPriceOfItinerary, setMaxPriceOfItinerary] = useState(1000);
  const [priceRange, setPriceRange] = useState([0, maxPriceOfItinerary]);
  const [maxPrice, setMaxPrice] = useState(maxPriceOfItinerary);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [myItineraries, setMyItineraries] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [price, setPrice] = useState("");
  const [dateRange, setDateRange] = useState({ lower: "", upper: "" });
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [tripsPerPage] = useState(6);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [typesOptions, setTypesOptions] = useState([]);
  const [languagesOptions, setLanguagesOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooked, setIsBooked] = useState(false);
  const [canModify, setCanModify] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isSortedByPreference, setIsSortedByPreference] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isPriceInitialized, setIsPriceInitialized] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState(null);

  const navigate = useNavigate();

  const fetchUserInfo = useCallback(async () => {
    const role = Cookies.get("role") || "guest";
    const token = Cookies.get("jwt");

    if (role === "tourist") {
      try {
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/",
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const currencyId = response.data.preferredCurrency;

        const currencyResponse = await axios.get(
          `https://trip-genie-apis.vercel.app/tourist/getCurrency/${currencyId}`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setUserInfo({
          role,
          preferredCurrency: currencyResponse.data,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserInfo({ role });
      }
    } else {
      setUserInfo({ role });
    }
  }, []);

  const getUserRole = () => {
    let role = Cookies.get("role");
    if (!role) role = "guest";
    return role;
  };

  const getSymbol = () => {
    if (userInfo && userInfo.role === "tourist" && userInfo.preferredCurrency) {
      return `${userInfo.preferredCurrency.symbol}`;
    } else {
      return "$";
    }
  };

  useEffect(() => {
    if (!isPriceInitialized) {
      fetchMaxPrice();
    }
  }, [userInfo]);

  const fetchMaxPrice = async () => {
    const role = getUserRole();
    const token = Cookies.get("jwt");
    const url = new URL(
      `https://trip-genie-apis.vercel.app/${role}/max-price-itinerary`
    );
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log("data: ", data);
    setMaxPriceOfItinerary(data);
    setMaxPrice(data);
    setPriceRange([0, data]);
    setIsPriceInitialized(true);
  };

  const handleSortByPreference = async () => {
    try {
      setIsLoading(true);
      const newSortedByPreference = !isSortedByPreference;
      setIsSortedByPreference(newSortedByPreference);

      const token = Cookies.get("jwt");
      const url = newSortedByPreference
        ? "https://trip-genie-apis.vercel.app/tourist/itineraries-preference"
        : "https://trip-genie-apis.vercel.app/tourist/itineraries";

      const response = await fetch(url, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (newSortedByPreference) {
        const otherItineraries = await fetch(
          "https://trip-genie-apis.vercel.app/tourist/itineraries-not-preference",
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ).then((res) => res.json());

        setItineraries([...data, ...otherItineraries]);
      } else {
        setItineraries(data);
      }

      setError(null);
    } catch (error) {
      console.error("Error fetching sorted itineraries:", error);
      setError("Error fetching sorted itineraries. Please try again.");
      setItineraries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItinerarySelect = (id) => {
    onSelectItinerary(id);
  };

  const fetchItineraries = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("jwt");
      const role = getUserRole();

      if (role === "tourist" && !searchTerm && !sortBy && !myItineraries) {
        const preferredItineraries = await fetch(
          "https://trip-genie-apis.vercel.app/tourist/itineraries-preference",
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ).then((res) => res.json());

        const otherItineraries = await fetch(
          "https://trip-genie-apis.vercel.app/tourist/itineraries-not-preference",
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ).then((res) => res.json());

        setItineraries([...preferredItineraries, ...otherItineraries]);
        setIsSortedByPreference(true);
      } else {
        const url = new URL(
          `https://trip-genie-apis.vercel.app/${role}/itineraries`
        );
        const response = await fetch(url, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setItineraries(data);
        setIsSortedByPreference(false);
      }

      setError(null);
      setCurrentPage(1);
      setCanModify(true);
    } catch (error) {
      console.error("Error fetching itineraries:", error);
      setError("Error fetching itineraries");
      setItineraries([]);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, myItineraries]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    if (userInfo) {
      fetchItineraries();
    }
  }, [userInfo, fetchItineraries]);

  const searchItineraries = async () => {
    setIsSortedByPreference(false);
    try {
      const role = getUserRole();
      const url = new URL(
        `https://trip-genie-apis.vercel.app/${role}/itineraries`
      );

      if (priceRange[0] !== 0 || priceRange[1] !== maxPrice) {
        url.searchParams.append("minPrice", priceRange[0].toString());
        url.searchParams.append("maxPrice", priceRange[1].toString());
      }
      if (myItineraries) {
        url.searchParams.append("myItineraries", myItineraries);
      }
      if (searchTerm) {
        url.searchParams.append("searchBy", searchTerm);
      }
      if (price && price !== "") {
        url.searchParams.append("budget", price);
      }
      if (dateRange.upper) {
        url.searchParams.append("upperDate", dateRange.upper);
      }
      if (dateRange.lower) {
        url.searchParams.append("lowerDate", dateRange.lower);
      }
      if (selectedTypes.length > 0) {
        url.searchParams.append("types", selectedTypes.join(","));
      }
      if (selectedLanguages.length > 0) {
        url.searchParams.append("languages", selectedLanguages.join(","));
      }
      if (isBooked) {
        url.searchParams.append("isBooked", isBooked);
      }
      if (sortBy) {
        url.searchParams.append("sort", sortBy);
      }
      if (sortOrder) {
        url.searchParams.append("asc", sortOrder);
      }

      console.log(priceRange[0]);
      console.log(priceRange[1]);
      console.log(url);

      const token = Cookies.get("jwt");
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setItineraries(data);
      setError(null);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching filtered results:", error);
      setError("Error fetching filtered results");
      setItineraries([]);
    }
  };

  useEffect(() => {
    searchItineraries();
  }, [priceRange, dateRange, selectedTypes, selectedLanguages, isBooked]);

  useEffect(() => {
    fetchItineraries();

    const fetchData = async () => {
      try {
        const [typesResponse, languagesResponse] = await Promise.all([
          axios.get("https://trip-genie-apis.vercel.app/api/getAllTypes"),
          axios.get("https://trip-genie-apis.vercel.app/api/getAllLanguages"),
        ]);
        setTypesOptions(typesResponse.data);
        setLanguagesOptions(languagesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchItineraries();
      } else {
        fetchItineraries();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    if (sortBy || sortOrder || myItineraries) {
      searchItineraries();
    } else {
      fetchItineraries();
    }
  }, [sortBy, sortOrder, myItineraries]);

  const handleSort = (attribute) => {
    setIsLoading(true);
    const newSortOrder = sortOrder === 1 ? -1 : 1;
    setSortOrder(newSortOrder);
    setSortBy(attribute);
    setIsLoading(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleMyItineraries = (attribute) => {
    setMyItineraries(attribute);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPrice("");
    setDateRange({ lower: "", upper: "" });
    setSelectedTypes([]);
    setSelectedLanguages([]);
    setSortBy("");
    setSortOrder("");
    setMyItineraries(false);
    setIsBooked(false);
    setPriceRange([0, maxPriceOfItinerary]);
    searchItineraries();
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const handleLowerDateChange = (e) => {
    const newLowerDate = e.target.value;
    if (newLowerDate > dateRange.upper) {
      setDateRange({ lower: newLowerDate, upper: newLowerDate });
    } else {
      setDateRange({ ...dateRange, lower: newLowerDate });
    }
  };

  const handleUpperDateChange = (e) => {
    const newUpperDate = e.target.value;
    setDateRange({ ...dateRange, upper: newUpperDate });
  };

  // const handleDelete = async () => {
  //   setShowDeleteConfirm(false);
  //   setIsLoading(true);
  //   setDeleteError(null);
  //   try {
  //     const token = Cookies.get("jwt");
  //     const response = await fetch(
  //       `https://trip-genie-apis.vercel.app/${getUserRole()}/itineraries/${selectedItinerary}`,
  //       {
  //         method: "DELETE",
  //          credentials: "include", headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       if (response.status === 400 || response.status === 403) {
  //         setDeleteError(errorData.message);
  //         return;
  //       }
  //       throw new Error("Failed to delete itinerary");
  //     }

  //     setShowDeleteSuccess(true);
  //     fetchItineraries();
  //   } catch (err) {
  //     setError("Error deleting itinerary. Please try again later.");
  //     console.error("Error deleting itinerary:", err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleDeleteConfirm = (id, title) => {
    setItineraryToDelete({ id, title });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!itineraryToDelete) return;

    setIsLoading(true);
    setDeleteError(null);
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `https://trip-genie-apis.vercel.app/${getUserRole()}/itineraries/${
          itineraryToDelete.id
        }`,

        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 || response.status === 403) {
          setDeleteError(errorData.message);
          return;
        }
        throw new Error("Failed to delete itinerary");
      }

      setShowDeleteSuccess(true);
      fetchItineraries();
    } catch (err) {
      setError("Error deleting itinerary. Please try again later.");
      console.error("Error deleting itinerary:", err);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setItineraryToDelete(null);
    }
  };
  const ActivityPageSkeleton = () => {
    return (
      <div className="bg-gray-100">
        <div className="">
          <div className="flex gap-8">
            {/* Sidebar Skeleton */}
            <div className="hidden md:block w-80 bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 w-24 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-6">
                {/* Price Range Skeleton */}
                <div>
                  <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-2"></div>
                  <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
                {/* Date Range Skeleton */}
                <div>
                  <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-2"></div>
                  <div className="h-8 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
                {/* Star Rating Skeleton */}
                <div>
                  <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-2"></div>
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-8 w-full bg-gray-200 rounded animate-pulse"
                      ></div>
                    ))}
                  </div>
                </div>
                {/* Category Skeleton */}
                <div>
                  <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-2"></div>
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="flex items-center">
                        <div className="h-5 w-5 bg-gray-300 rounded animate-pulse mr-2"></div>
                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1">
              {/* Search and Filters Skeleton */}
              <div className="mb-4">
                <div className="relative flex-grow mb-4 flex items-center gap-4">
                  <div className="h-10 w-full bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-6 w-20 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-10 w-40 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-10 w-40 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Cards Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col bg-white shadow-lg rounded-lg overflow-hidden animate-pulse"
                  >
                    <div className="h-40 bg-gray-300"></div>
                    <div className="p-4 space-y-4">
                      <div className="h-8 w-3/4 bg-gray-300 rounded"></div>
                      <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
                      <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="p-4 border-t space-y-3">
                      <div className="h-5 w-1/3 bg-gray-300 rounded"></div>
                      <div className="h-5 w-1/4 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Skeleton */}
              <div className="mt-8 flex justify-center items-center space-x-4">
                <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="bg-gray-100 min-h-screen">
      {isLoading ? (
        <ActivityPageSkeleton />
      ) : (
        <div className="">
          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <div className="hidden md:block w-80 bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#1A3B47]">
                  Filters
                </h2>
                <Button
                  onClick={clearFilters}
                  size="sm"
                  className="text-[#1A3B47] hover:text-[#E6DCCF] bg-transparent border-none"
                >
                  Clear All
                </Button>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="font-medium text-[#1A3B47] mb-2">Price Range</h3>
                {isPriceInitialized && (
                  <DualHandleSliderComponent
                    min={0}
                    max={maxPriceOfItinerary}
                    symbol={getSymbol()}
                    step={Math.max(
                      1,
                      Math.ceil(
                        (maxPriceOfItinerary * exchangeRateForFilter) / 100
                      )
                    )}
                    values={priceRange}
                    exchangeRate={exchangeRateForFilter}
                    middleColor="#5D9297"
                    colorRing="#388A94"
                    onChange={(values) => setPriceRange(values)}
                  />
                )}
              </div>

              {/* Date Range Input */}
              <div className="mb-6">
                <h3 className="font-medium text-[#1A3B47] mb-2">Date Range</h3>
                <div className="flex flex-col space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-[#1A3B47]">
                      From:
                    </label>
                    <input
                      type="date"
                      value={dateRange.lower}
                      onChange={handleLowerDateChange}
                      className="w-full mt-1 border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A3B47]">
                      To:
                    </label>
                    <input
                      type="date"
                      value={dateRange.upper}
                      onChange={handleUpperDateChange}
                      min={dateRange.lower}
                      className="w-full mt-1 border rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Type Filter */}
              <div className="mb-6">
                <h3 className="font-medium text-[#1A3B47] mb-2">Type</h3>
                <ScrollArea className="h-[150px]">
                  {typesOptions.map((type) => (
                    <div
                      key={type}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <Checkbox
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          setSelectedTypes((prev) =>
                            checked
                              ? [...prev, type]
                              : prev.filter((t) => t !== type)
                          );
                        }}
                      />
                      <label
                        htmlFor={`type-${type}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#1A3B47]"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* Language Filter */}
              <div className="mb-6">
                <h3 className="font-medium text-[#1A3B47] mb-2">Language</h3>
                <ScrollArea className="h-[150px]">
                  {languagesOptions.map((language) => (
                    <div
                      key={language}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <Checkbox
                        id={`language-${language}`}
                        checked={selectedLanguages.includes(language)}
                        onCheckedChange={(checked) => {
                          setSelectedLanguages((prev) =>
                            checked
                              ? [...prev, language]
                              : prev.filter((l) => l !== language)
                          );
                        }}
                      />
                      <label
                        htmlFor={`language-${language}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#1A3B47]"
                      >
                        {language}
                      </label>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Search and Filter Controls */}
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="Search itineraries..."
                      className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5D9297]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                  </div>
                  <span className="text-gray-500 text-sm whitespace-nowrap">
                    ({itineraries.length} itineraries)
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap rounded-full text-[#1A3B47] border-[#1A3B47]"
                    onClick={() => handleSort("price")}
                  >
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Sort by Price{" "}
                    {sortBy === "price" && (sortOrder === 1 ? "↑" : "↓")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap rounded-full text-[#1A3B47] border-[#1A3B47]"
                    onClick={() => handleSort("rating")}
                  >
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Sort by Rating{" "}
                    {sortBy === "rating" && (sortOrder === 1 ? "↑" : "↓")}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="text-[#F88C33] text-center mb-4">{error}</div>
              )}

              {/* Itineraries Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itineraries
                  .slice(
                    (currentPage - 1) * tripsPerPage,
                    currentPage * tripsPerPage
                  )
                  .map((itinerary) => (
                    <ItineraryCard
                      key={itinerary._id}
                      itinerary={itinerary}
                      onSelect={handleItinerarySelect}
                      role={userInfo.role}
                      userInfo={userInfo}
                      canModify={canModify}
                      setShowDeleteConfirm={setShowDeleteConfirm}
                      setSelectedItinerary={setSelectedItinerary}
                      onDeleteConfirm={handleDeleteConfirm}
                    />
                  ))}
              </div>

              {/* Pagination */}
              <div className="mt-8 flex justify-center items-center space-x-4">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="icon"
                  className="text-[#1A3B47] border-[#1A3B47]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-[#1A3B47]">
                  Page {currentPage} of{" "}
                  {Math.max(1, Math.ceil(itineraries.length / tripsPerPage))}
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={
                    currentPage ===
                    Math.max(1, Math.ceil(itineraries.length / tripsPerPage))
                  }
                  variant="outline"
                  size="icon"
                  className="text-[#1A3B47] border-[#1A3B47]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itineraryTitle={itineraryToDelete?.title}
      />

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1A3B47]">
              Delete Itinerary
            </DialogTitle>
            <DialogDescription className="text-[#1A3B47]">
              Are you sure you want to delete this itinerary?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              className="text-[#1A3B47] border-[#1A3B47]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-[#F88C33] text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteSuccess} onOpenChange={setShowDeleteSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1A3B47]">
              <CheckCircle className="w-6 h-6 text-[#388A94] inline-block mr-2" />
              Itinerary Deleted
            </DialogTitle>
            <DialogDescription className="text-[#1A3B47]">
              The itinerary has been successfully deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => {
                setShowDeleteSuccess(false);
                navigate("/all-itineraries");
              }}
              className="bg-[#E6DCCF] hover:bg-[#F88C33]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteError !== null}
        onOpenChange={() => setDeleteError(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1A3B47]">
              <XCircle className="w-6 h-6 text-[#F88C33] inline-block mr-2" />
              Failed to Delete Itinerary
            </DialogTitle>
            <DialogDescription className="text-[#1A3B47]">
              {deleteError || "Itinerary is already booked!"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => setDeleteError(null)}
              className="bg-[#E6DCCF] hover:bg-[#F88C33]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AllItinerariesComponent;
