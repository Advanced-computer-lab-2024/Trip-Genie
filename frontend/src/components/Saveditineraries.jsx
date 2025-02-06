import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import {
  Star,
  Clock,
  MapPin,
  Accessibility,
  Calendar,
  Bookmark,
  Users,
  Globe,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Loader from "@/components/Loader";
import defaultImage from "@/assets/images/default-image.jpg";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

const ItineraryCard = ({
  itinerary,
  onSelect,
  onItineraryUnsaved,
  userInfo,
  exchangeRates,
  showToast,
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const handleUnsave = async (e) => {
    e.stopPropagation();
    try {
      const token = Cookies.get("jwt");
      const response = await axios.post(
        `https://trip-genie-apis.vercel.app/tourist/save-itinerary/${itinerary._id}`,
        {},
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        onItineraryUnsaved(itinerary._id);
      }
    } catch (error) {
      showToast(
        "error",
        "An error occurred while unsaving your itinerary. Please try again."
      );
    }
  };

  const getFormattedPrice = (price) => {
    if (!userInfo || !exchangeRates) return `$${price.toFixed(2)}`;

    const baseRate = exchangeRates[itinerary.currency] || 1;
    const targetRate = exchangeRates[userInfo.preferredCurrency.code] || 1;
    const exchangedPrice = (price / baseRate) * targetRate;

    return `${userInfo.preferredCurrency.symbol}${exchangedPrice.toFixed(2)}`;
  };

  return (
    <Card
      className="group relative flex items-center gap-4 p-2 transition-all hover:shadow-lg cursor-pointer"
      onClick={() => onSelect(itinerary._id)}
    >
      {/* Image Section */}
      <div className="relative h-36 w-36 shrink-0 rounded-sm">
        <img
          src={itinerary.activities?.[0]?.pictures?.[0]?.url || defaultImage}
          alt={itinerary.title}
          className="object-cover w-full h-full rounded-sm"
        />
        {/* Bookmark Icon */}
        <div
          className="absolute top-1 left-1 z-20 bg-white p-1 rounded-full"
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
        >
          <Bookmark
            className="fill-[#1A3B47] text-[#1A3B47] hover:fill-[#2e6b77] hover:text-[#2e6b77]"
            size={25}
            onClick={handleUnsave}
          />
          {tooltipVisible && (
            <div className="absolute bottom-10 left-0 bg-[#B5D3D1] font-semibold text-black text-xs px-2 py-1 rounded-lg">
              Unsave?
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col gap-1">
        {/* Title and Rating */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-[#1A3B47]">{itinerary.title}</h3>
          </div>
          <div className="flex items-center gap-1 text-base">
            <Star className="h-6 w-6 fill-[#F88C33] text-[#F88C33]" />
            <span className="text-[#F88C33]">
              {itinerary.rating?.toFixed(1) || "0.0"}
            </span>
          </div>
        </div>

        {/* Additional Information: Pick-up Location, Drop-off Location, Language, Accessibility */}
        <div className="flex flex-col gap-2 text-sm text-[#5D9297]">
          <div className="flex items-center gap-1 mt-2">
            <Globe className="h-4 w-4 text-[#5D9297]" />
            <span>{itinerary.language || "Language not specified"}</span>

            {/* Accessibility */}
            {itinerary.accessibility !== undefined && (
              <div className="flex items-center  ml-4">
                <Accessibility className="h-4 w-4 mr-1 text-[#5D9297]" />
                <span>
                  {itinerary.accessibility === true
                    ? "Accessible"
                    : "Not Accessible"}
                </span>
              </div>
            )}
          </div>

          {/* Pick-up Location */}
          <div className="flex items-center mt-2">
            <MapPin className="h-4 w-4 mr-1 text-[#5D9297]" />
            <span className="font-semibold">
              {itinerary.pickUpLocation || "Pick-up Location not specified"}
            </span>
          </div>
        </div>

        {/* Price Section */}
        <div className="mt-2 flex items-center justify-between">
          <div className="text-xl font-bold text-[#1A3B47]">
            {getFormattedPrice(itinerary.price)}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="bg-[#388A94] hover:bg-[#2e6b77]"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(itinerary._id);
              }}
            >
              View
            </Button>
            <Button
              size="sm"
              variant="default"
              className="bg-gray-200 hover:bg-gray-300 text-black font-semibold"
              onClick={handleUnsave}
            >
              Unsave
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const SkeletonCard = () => {
  return (
    <Card className="group relative flex items-center gap-4 p-2 transition-all hover:shadow-lg cursor-pointer">
      <div className="relative h-36 w-36 shrink-0 rounded-sm bg-gray-300 animate-pulse" />
      <div className="flex flex-1 flex-col gap-2">
        {" "}
        {/* Reduced gap between elements */}
        <div className="flex items-start justify-between">
          <div className="w-3/4 h-6 bg-gray-300 rounded-sm animate-pulse mr-2" />{" "}
          {/* Increased width for title */}
          <div className="w-1/3 h-6 bg-gray-300 rounded-sm animate-pulse mr-2" />{" "}
          {/* Increased width for other small section */}
        </div>
        <div className="flex items-center gap-2 text-sm text-[#5D9297]">
          {/* Increased gap between elements */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 p-2 bg-gray-300 rounded-full animate-pulse" />
            <div className="w-4/5 pl-11 pr-11 pt-1 pb-1 h-5 bg-gray-300 rounded-sm animate-pulse" />{" "}
            {/* Increased width */}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 p-2 bg-gray-300 rounded-full animate-pulse" />
            <div className="w-4/5 h-5 pl-11 pr-11 pt-1 pb-1 bg-gray-300 rounded-sm animate-pulse" />{" "}
            {/* Increased width */}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          {" "}
          {/* Adjusted margin-top */}
          <div className="w-3/4 h-6 bg-gray-300 rounded-sm mr-2 animate-pulse" />{" "}
          {/* Increased width */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="bg-[#388A94] text-[#388A94] hover:bg-[#2e6b77]"
              disabled
            >
              View Details
            </Button>
            <Button
              size="sm"
              variant="default"
              className="bg-gray-300 text-gray-300 hover:bg-gray-300"
              disabled
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
export default function SavedItineraries() {
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const navigate = useNavigate();
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setIsToastOpen(true);
  };

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/rates"
      );
      setExchangeRates(response.data.rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  }, []);

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
      if (token) {
        const decodedToken = jwtDecode(token);
        setUserInfo({
          role,
          userId: decodedToken.id,
        });
      } else {
        setUserInfo({ role });
      }
    }
  }, []);

  useEffect(() => {
    fetchUserInfo();
    fetchExchangeRates();
  }, [fetchUserInfo, fetchExchangeRates]);

  const fetchSavedItineraries = useCallback(async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/tourist/saved-itineraries",
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSavedItineraries(response.data);
      setTimeout(() => setIsLoading(false), 1000);
    } catch (error) {
      console.error("Error fetching saved itineraries:", error);
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, []);

  useEffect(() => {
    fetchSavedItineraries();
  }, [fetchSavedItineraries]);

  const handleItinerarySelect = (id) => {
    navigate(`/itinerary/${id}`);
  };

  const handleItineraryUnsaved = (itineraryId) => {
    setSavedItineraries((prev) =>
      prev.filter((itinerary) => itinerary._id !== itineraryId)
    );
    showToast("success", "Itinerary removed from saved list successfully!");
    setTimeout(() => setAlertMessage(null), 3000);
  };

  return (
    <ToastProvider>
      <div className="bg-gray-100 min-h-screen">
        {/* <h1 className="text-3xl font-bold mb-2">Saved Itineraries</h1>
    <p className="text-sm text-gray-500 mb-2">Itineraries / Saved</p>
     */}
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Render Skeletons for Cards */}
              {[...Array(4)].map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          ) : savedItineraries.length === 0 ? (
            <div className="text-center space-y-4 py-12">
              <h2 className="text-2xl font-semibold text-gray-600">
                No itineraries saved yet
              </h2>
              <p className="text-gray-500">
                Start exploring and save itineraries to your list!
              </p>
              <Button
                size="lg"
                variant="default"
                className="mt-4 bg-[#388A94] text-white"
                onClick={() => navigate("/all-itineraries")}
              >
                Explore Itineraries
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {savedItineraries.map((itinerary) => (
                <ItineraryCard
                  key={itinerary._id}
                  itinerary={itinerary}
                  onSelect={handleItinerarySelect}
                  onItineraryUnsaved={handleItineraryUnsaved}
                  userInfo={userInfo}
                  exchangeRates={exchangeRates}
                  showToast={showToast}
                />
              ))}
            </div>
          )}
        </div>
        <ToastViewport className="fixed top-0 right-0 p-4" />
        {isToastOpen && (
          <Toast
            onOpenChange={setIsToastOpen}
            open={isToastOpen}
            duration={5000}
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
      </div>
    </ToastProvider>
  );
}
