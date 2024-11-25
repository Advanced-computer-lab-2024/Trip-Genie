"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import axios from "axios";
import { Search, ChevronLeft, ChevronRight, Star, Filter, ArrowUpDown, Heart, Edit, Trash2, Bookmark } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loader from "@/components/Loader";
import defaultImage from "@/assets/images/default-image.jpg";
import activityImage from "@/assets/images/sam.png";
import DualHandleSliderComponent from "@/components/dual-handle-slider";
import SingleActivityAdmin from "./SingleActivityAdmin";

const renderStars = (rating) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-[#F88C33] fill-current" : "text-gray-300"
            }`}
        />
      ))}
    </div>
  );
};

let exchangeRateForFilter = 1;

const ActivityCard = ({
  activity,
  onSelect,
  userInfo,
  exchangeRates,
  currencies,
  onDeleteConfirm,
  savedActivities,
  onActivitySaved,
}) => {
  const role = Cookies.get("role") || "guest";
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (savedActivities && savedActivities.length > 0) {
      setIsSaved(savedActivities.some(savedActivity => savedActivity.activity.toString() === activity._id.toString()));
      
    }
    console.log(isSaved);
  }, [savedActivities, activity._id]);

  const handleSaveToggle = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.post(
        `http://localhost:4000/tourist/save-activity/${activity._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        const newSavedState = !isSaved;
        setIsSaved(newSavedState);
        if (onActivitySaved) {
          onActivitySaved(activity._id, newSavedState);
        }
      }
    } catch (error) {
      console.error("Error toggling save activity:", error);
    }
  };

  useEffect(() => {
    const initializeCard = async () => {
      await Promise.all([
        userInfo &&
          userInfo.role === "tourist" &&
          userInfo.preferredCurrency !== activity.currency
          ? fetchExchangeRate()
          : getCurrencySymbol(),
      ]);
      setIsInitialized(true);
    };

    initializeCard();
  }, [userInfo, activity]);

  const fetchExchangeRate = useCallback(async () => {
    if (userInfo && userInfo.role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await fetch(
          `http://localhost:4000/${userInfo.role}/populate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              base: activity.currency,
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
    }
  }, [userInfo, activity]);


  const getCurrencySymbol = useCallback(async () => {
    if (userInfo) {
      setCurrencySymbol("$");
    }
  }, [userInfo, activity]);

  const formatPrice = (price) => {
    if (userInfo && userInfo.role === "tourist" && userInfo.preferredCurrency) {
      if (userInfo.preferredCurrency === activity.currency) {
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

  if (!isInitialized) {
    return (
      <div className="h-[400px] animate-pulse bg-gray-100 rounded-lg"></div>
    );
  }

  return (
<Card
    className="overflow-hidden cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl relative"
    onClick={() => onSelect(activity._id)}
  >
    <div className="relative aspect-video overflow-hidden">
      <img
        src={activity.pictures?.[0]?.url || defaultImage}
        alt={activity.name}
        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
      />
    </div>
    <CardHeader className="p-4">
      <CardTitle className="text-xl font-semibold text-[#1A3B47]">{activity.name}</CardTitle>
      <p className="text-sm text-muted-foreground">{activity.location.address}</p>
    </CardHeader>
    <CardContent className="p-4 pt-0 space-y-2">
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < activity.rating ? "text-[#F88C33] fill-[#F88C33]" : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">{activity.rating.toFixed(1)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-[#388A94]">$ {activity.price}</span>
        <span className="text-sm text-[#1A3B47]">{activity.duration} hours</span>
      </div>
      <p className="text-sm text-[#1A3B47]">{new Date(activity.timing).toLocaleDateString()}</p>
    </CardContent>
    <CardFooter className="p-4 pt-0">
      <div className="flex flex-wrap gap-2">
        {activity.tags.map((tag, index) => (
          <Badge key={index} variant="outline" className="bg-[#E6DCCF] text-[#1A3B47]">
            {tag.type}
          </Badge>
        ))}
        {activity.category.map((cat, index) => (
          <Badge key={index} variant="secondary" className="bg-[#B5D3D1] text-[#1A3B47]">
            {cat.name}
          </Badge>
        ))}
      </div>
    </CardFooter>
  </Card>
);

};

export default function AllActivities() {
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState(1);
  const [sortBy, setSortBy] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [maxPriceOfActivities, setMaxPriceOfActivities] = useState(1000);
  const [priceRange, setPriceRange] = useState([0, maxPriceOfActivities]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isSortedByPreference, setIsSortedByPreference] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isPriceInitialized, setIsPriceInitialized] = useState(false);
  const activitiesPerPage = 6;
  const [savedActivities, setSavedActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState(null);

  const navigate = useNavigate();

  const getUserRole = useCallback(() => {
    return Cookies.get("role") || "guest";
  }, []);

  const fetchSavedActivities = useCallback(async () => {
    if (userInfo?.role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get("http://localhost:4000/tourist/saved-activities", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedActivities(response.data);
      } catch (error) {
        console.error("Error fetching saved activities:", error);
      }
    }
  }, [userInfo]);

  useEffect(() => {
    fetchSavedActivities();
  }, [fetchSavedActivities]);


  const handleSaveActivity = async (activityId) => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.post(
        `http://localhost:4000/toursit/save-activity/${activityId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        fetchSavedActivities();
        setAlertMessage({
          type: "success",
          message: "Activity saved/unsaved successfully!",
        });
      }
    } catch (error) {
      console.error("Error saving/unsaving activity:", error);
      setAlertMessage({
        type: "error",
        message: "Error saving/unsaving activity. Please try again.",
      });
    }
  };

  const handleActivitySaved = useCallback((activityId, isSaved) => {
    setAlertMessage({
      type: "success",
      message: isSaved ? "Activity saved successfully!" : "Activity unsaved successfully!",
    });
    
    // Clear the alert message after 3 seconds
    setTimeout(() => {
      setAlertMessage(null);
    }, 2000);

    fetchSavedActivities();
  }, [fetchSavedActivities]);

  const fetchUserInfo = useCallback(async () => {
    const role = Cookies.get("role") || "guest";
    const token = Cookies.get("jwt");

    if (role === "tourist") {
      try {
        const response = await axios.get("http://localhost:4000/tourist/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currencyId = response.data.preferredCurrency;

        const currencyResponse = await axios.get(
          `http://localhost:4000/tourist/getCurrency/${currencyId}`,
          {
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

  const fetchActivities = useCallback(
    async (params = {}) => {
      try {
        const token = Cookies.get("jwt");
        const role = getUserRole();

        if (role === "tourist" && !isInitialized) {
          const [preferredResponse, otherResponse] = await Promise.all([
            axios.get("http://localhost:4000/tourist/activities-preference", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(
              "http://localhost:4000/tourist/activities-not-preference",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            ),
          ]);
          setActivities([...preferredResponse.data, ...otherResponse.data]);
          setIsSortedByPreference(true);
          setIsInitialized(true);
        } else {
          const url = new URL(`http://localhost:4000/${role}/activities`);

          Object.keys(params).forEach((key) => {
            if (key === "sort" && params[key] === "price") {
              url.searchParams.append("sort", "price");
              url.searchParams.append("asc", params.asc.toString());
            } else {
              url.searchParams.append(key, params[key]);
            }
          });

          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setActivities(data);
        }
        setError(null);
      } catch (error) {
        console.error("Error fetching activities:", error);
        setError("Error fetching activities");
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    },
    [getUserRole, isInitialized]
  );

  const fetchMaxPrice = useCallback(async () => {
    try {
      const role = getUserRole();
      const token = Cookies.get("jwt");
      const url = new URL(`http://localhost:4000/${role}/maxPriceActivities`);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      const roundedMaxPrice = Math.ceil(data);
      setMaxPriceOfActivities(roundedMaxPrice);
      setPriceRange([0, roundedMaxPrice]);
      setIsPriceInitialized(true);
    } catch (error) {
      console.error("Error fetching max price:", error);
      setIsPriceInitialized(true);
    }
  }, [getUserRole]);

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:4000/rates");
      setExchangeRates(response.data.rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  }, []);


  const fetchCurrencies = useCallback(async () => {
    const role = Cookies.get("role");
    if (role !== "tourist") return;
    try {
      const response = await axios.get(
        "http://localhost:4000/tourist/currencies",
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setCurrencies(response.data);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(
        "http://localhost:4000/api/getAllCategories"
      );
      setCategoryOptions(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserInfo();
    fetchMaxPrice();
    fetchExchangeRates();
    fetchCurrencies();
    fetchCategories();
  }, [
    fetchUserInfo,
    fetchMaxPrice,
    fetchExchangeRates,
    fetchCurrencies,
    fetchCategories,
  ]);

  useEffect(() => {
    if (userInfo) {
      fetchActivities({
        searchBy: searchTerm,
        sort: sortBy,
        asc: sortOrder,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        rating: selectedRating,
        categories: selectedCategories.join(","),
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
    }
  }, [
    userInfo,
    fetchActivities,
    searchTerm,
    sortBy,
    sortOrder,
    priceRange,
    selectedRating,
    selectedCategories,
    dateRange,
  ]);

  const handleActivitySelect = useCallback(
    (id) => {
      setSelectedActivityId(id);
    },
    []
  );

  const handleBackToAllActivities = () => {
    setSelectedActivityId(null);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSort = (attribute) => {
    setSortOrder((prevOrder) => (prevOrder === 1 ? -1 : 1));
    setSortBy(attribute);
  };

  const handleSortByPreference = useCallback(async () => {
    setIsSortedByPreference((prev) => !prev);
    if (!isSortedByPreference) {
      try {
        const token = Cookies.get("jwt");
        const [preferredResponse, otherResponse] = await Promise.all([
          axios.get("http://localhost:4000/tourist/activities-preference", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:4000/tourist/activities-not-preference", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setActivities([...preferredResponse.data, ...otherResponse.data]);
      } catch (error) {
        console.error("Error fetching activities by preference:", error);
        setError("Error fetching activities by preference");
      }
    } else {
      fetchActivities();
    }
  }, [isSortedByPreference, fetchActivities]);

  useEffect(() => {
    if (userInfo) {
      fetchActivities();
    }
  }, [userInfo, fetchActivities]);

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("");
    setSortOrder(1);
    setPriceRange([0, maxPriceOfActivities]);
    setSelectedRating(null);
    setSelectedCategories([]);
    setDateRange({ start: "", end: "" });
    setIsSortedByPreference(false);
    fetchActivities();
  };

  const handleDeleteConfirm = async (id) => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `http://localhost:4000/${getUserRole()}/activities/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete activity");
      }

      setAlertMessage({
        type: "success",
        message: "Activity deleted successfully!",
      });
      fetchActivities();
    } catch (error) {
      setAlertMessage({
        type: "error",
        message: error.message || "Error deleting activity. Please try again.",
      });
    }
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch =
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice =
        activity.price >= priceRange[0] && activity.price <= priceRange[1];
      const matchesRating = selectedRating
        ? activity.rating >= selectedRating
        : true;
      const matchesCategories =
        selectedCategories.length === 0 ||
        activity.category?.some((cat) => selectedCategories.includes(cat.name));
      const activityDate = new Date(activity.timing);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      const matchesDate =
        (!startDate || activityDate >= startDate) &&
        (!endDate || activityDate <= endDate);

      return (
        matchesSearch &&
        matchesPrice &&
        matchesRating &&
        matchesCategories &&
        matchesDate
      );
    });
  }, [
    activities,
    searchTerm,
    priceRange,
    selectedRating,
    selectedCategories,
    dateRange,
  ]);

  const sortedActivities = useMemo(() => {
    const sorted = [...filteredActivities];
    if (sortBy === "price") {
      sorted.sort((a, b) => sortOrder * (a.price - b.price));
    } else if (sortBy === "rating") {
      sorted.sort((a, b) => sortOrder * (b.rating - a.rating));
    }
    return sorted;
  }, [filteredActivities, sortBy, sortOrder]);

  const handleCategoryChange = (checked, category) => {
    setSelectedCategories((prev) =>
      checked ? [...prev, category] : prev.filter((c) => c._id !== category._id)
    );
  };

  const handleDateChange = (type, value) => {
    setDateRange((prev) => {
      const newRange = { ...prev, [type]: value };
      // Ensure 'end' date is not before 'start' date
      if (type === "start" && newRange.end && newRange.start > newRange.end) {
        newRange.end = newRange.start;
      } else if (type === "end" && newRange.start && newRange.end < newRange.start) {
        newRange.end = newRange.start;
      }
      return newRange;
    });
  };

  return (
    <div className="bg-gray-100">
      <div className="container mx-auto px-4 py-8 lg:px-24">
        {selectedActivityId ? (
          <div>
            <Button onClick={handleBackToAllActivities} className="mb-4 bg-[#5D9297] text-white text-base">
            <ChevronLeft className="w-5 h-5 mr-2" />
              Back to All Activities
            </Button>
            <SingleActivityAdmin activityId={selectedActivityId} />
          </div>
        ) : (
          <div className="flex gap-8">
            <div className="hidden md:block w-80 bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#1A3B47]">Filters</h2>
                <Button
                  onClick={clearFilters}
                  size="sm"
                  className="text-gray-400 hover:text-gray-200 bg-transparent border-none"
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-[#1A3B47] mb-2">Price Range</h3>
                  {isPriceInitialized && (
                    <DualHandleSliderComponent
                      min={0}
                      max={maxPriceOfActivities}
                      symbol={userInfo?.preferredCurrency?.symbol || "$"}
                      step={10}
                      values={priceRange}
                      exchangeRate={exchangeRateForFilter}
                      onChange={(values) => setPriceRange(values)}
                      middleColor="#5D9297"
                      colorRing="#388A94"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-[#1A3B47] mb-2">Date Range</h3>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleDateChange('start', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      min={dateRange.start || new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleDateChange('end', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-[#1A3B47] mb-2">Star Rating</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <button
                        key={rating}
                        onClick={() =>
                          setSelectedRating(
                            rating === selectedRating ? null : rating
                          )
                        }
                        className={`flex items-center w-full p-2 rounded hover:bg-gray-100 ${selectedRating === rating ? "bg-[#B5D3D1]" : ""
                          }`}
                      >
                        {renderStars(rating)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-[#1A3B47] mb-2">Category</h3>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {categoryOptions.map((category) => (
                        <div key={category._id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={category._id}
                            checked={selectedCategories.includes(category.name)}
                            onChange={() => {
                              setSelectedCategories((prev) =>
                                prev.includes(category.name)
                                  ? prev.filter((cat) => cat !== category.name)
                                  : [...prev, category.name]
                              );
                            }}
                            className="mr-2 checked:bg-[#388A94]"
                          />
                          <label
                            htmlFor={category._id}
                            className="text-sm text-gray-600"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-4">
                <div className="relative flex-grow mb-4 flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="Search activities..."
                    className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5D9297]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                  <span className="text-gray-500 text-sm whitespace-nowrap">
                    ({sortedActivities.length} items)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap rounded-full"
                    onClick={() => handleSort("rating")}
                  >
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Sort by Rating
                    {sortBy === "rating" && (
                      <span className="ml-2">
                        {sortOrder === 1 ? "↓" : "↑"}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap rounded-full"
                    onClick={() => handleSort("price")}
                  >
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Sort by Price
                    {sortBy === "price" && (
                      <span className="ml-2">
                        {sortOrder === 1 ? "↓" : "↑"}
                      </span>
                    )}
                  </Button>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    {userInfo?.role === "tourist" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={`whitespace-nowrap rounded-full ${isSortedByPreference ? "bg-red-100" : ""
                          }`}
                        onClick={handleSortByPreference}
                      >
                        <Heart
                          className={`w-4 h-4 mr-2 ${isSortedByPreference
                            ? "fill-current text-red-500"
                            : ""
                            }`}
                        />
                        Sort by Preference
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setFiltersVisible(!filtersVisible)}
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedActivities
                  .slice(
                    (currentPage - 1) * activitiesPerPage,
                    currentPage * activitiesPerPage
                  )
                  .map((activity) => (
                    <ActivityCard
                      key={activity._id}
                      activity={activity}
                      onSelect={handleActivitySelect}
                      userInfo={userInfo}
                      exchangeRates={exchangeRates}
                      currencies={currencies}
                      onDeleteConfirm={handleDeleteConfirm}
                      savedActivities={savedActivities}
                      onActivitySaved={handleActivitySaved}
                    />
                  ))}
              </div>
              {sortedActivities.length > 0 && (
                <div className="mt-8 flex justify-center items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of{" "}
                    {Math.ceil(sortedActivities.length / activitiesPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handlePageChange(
                        Math.min(
                          currentPage + 1,
                          Math.ceil(sortedActivities.length / activitiesPerPage)
                        )
                      )
                    }
                    disabled={
                      currentPage ===
                      Math.ceil(sortedActivities.length / activitiesPerPage)
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {alertMessage && (
        <Alert
          className={`fixed bottom-4 right-4 w-96 ${alertMessage.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white`}
        >
          <AlertTitle>
            {alertMessage.type === "success" ? "Success" : "Error"}
          </AlertTitle>
          <AlertDescription>{alertMessage.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}