"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Loader from "./Loader.jsx";

export function Activities() {
  const [activities, setActivities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(Cookies.get("role") || "guest");
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencySymbol, setCurrencySymbol] = useState({});

  // Number of visible slides (3 cards at a time)
  const visibleSlides = 3;

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const token = Cookies.get("jwt");
        let role = Cookies.get("role");
        if (role === undefined) role = "guest";
        if (role !== "tourist" && role !== "advertiser" && role != "guest")
          return;
        const api = `http://localhost:4000/${role}/activities`;
        const response = await axios.get(api, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setActivities(response.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUserInfo();
    fetchActivities();
    setIsLoading(false);
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  const fetchExchangeRate = async (activityCurrency) => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `http://localhost:4000/${userRole}/populate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base: activityCurrency,
            target: userPreferredCurrency._id,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setExchangeRates((prevRates) => ({
          ...prevRates,
          [activityCurrency]: data.conversion_rate,
        }));
      } else {
        console.error("Error in fetching exchange rate:", data.message);
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  };

  const getCurrencySymbol = async (activityCurrency) => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `http://localhost:4000/${userRole}/getCurrency/${activityCurrency}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrencySymbol(response.data);
    } catch (error) {
      console.error("Error fetching currency symbol:", error);
    }
  };

  const formatPrice = (price, currency) => {
    if (userRole === "tourist" && userPreferredCurrency) {
      if (userPreferredCurrency._id === currency) {
        return `${userPreferredCurrency.symbol}${price}`;
      } else if (exchangeRates[currency]) {
        const convertedPrice = price * exchangeRates[currency];
        return `${userPreferredCurrency.symbol}${convertedPrice.toFixed(2)}`;
      }
    } else if (currencySymbol) {
      return `${currencySymbol.symbol}${price}`;
    }
    return `$${price}`;
  };

  const fetchUserInfo = async () => {
    const role = Cookies.get("role") || "guest";
    setUserRole(role);

    if (role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get("http://localhost:4000/tourist/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currencyId = response.data.preferredCurrency;
        const response2 = await axios.get(
          `http://localhost:4000/tourist/getCurrency/${currencyId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUserPreferredCurrency(response2.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  useEffect(() => {
    activities.forEach((activity) => {
      if (
        userRole === "tourist" &&
        userPreferredCurrency &&
        userPreferredCurrency._id !== activity.currency
      ) {
        fetchExchangeRate(activity.currency);
      } else {
        getCurrencySymbol(activity.currency);
      }
    });
  }, [userRole, userPreferredCurrency, activities]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < activities.length - visibleSlides ? prevIndex + 1 : prevIndex
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
  };

  return (
    <div className="container mx-auto px-24 py-12">
      <div className="flex items-start mb-6">
        <div className="w-full pr-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-[#1A3B47] mb-4 pl-12 ml-4">
                Activities
              </h1>
              <p className="text-[#1A3B47] mb-4 max-w-2xl pl-12 ml-4">
                Explore a range of exciting activities on our travel website!
                Whether it's guided tours, outdoor adventures, or cultural
                experiences, we have something for every traveler. Start
                planning today for unforgettable memories!
              </p>
            </div>
            <div className="pr-4 pt-24">
              <Link to="/activity">
                <Button
                  variant="primary"
                  className="bg-[#388A94] hover:bg-[#5D9297] text-white px-8 py-2 rounded-full text-lg font-medium transition-colors duration-300"
                >
                  View More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Cards Slider */}
      <div className="relative px-12">
        {/* Navigation Buttons */}
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          disabled={currentIndex === 0}
          aria-label="Previous activity"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#B5D3D1] text-white hover:bg-[#1A3B47] disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          disabled={currentIndex >= activities.length - visibleSlides}
          aria-label="Next activity"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#F88C33] text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Overflow container */}
        <div className="overflow-hidden">
          {/* Sliding content */}
          <div
            className="flex transition-transform duration-300"
            style={{
              transform: `translateX(-${
                currentIndex * (100 / visibleSlides)
              }%)`,
            }}
          >
            {activities.map((act) => (
              <div
                key={act._id}
                className="w-full min-w-[33.333%] px-3 transition-all duration-300 group"
              >
                <div
                  className="rounded-lg overflow-hidden "
                  style={{ backgroundColor: "rgb(255, 248, 241)" }}
                >
                  <img
                    src={
                      Array.isArray(act.pictures)
                        ? act.pictures[0]?.url
                        : act.pictures
                    }
                    alt={act.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{act.name}</h3>
                    <div className="flex mb-2">
                      {Array.from({ length: 5 }, (_, i) => {
                        if (i < Math.floor(act.rating)) {
                          return (
                            <span key={i} className="text-[#F88C33]">
                              ★
                            </span>
                          );
                        } else if (i < act.rating) {
                          return (
                            <span key={i} className="text-y[#F88C33]">
                              ☆
                            </span>
                          );
                        } else {
                          return (
                            <span key={i} className="text-gray-300">
                              ☆
                            </span>
                          );
                        }
                      })}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {`Description: ${
                        act.description.length > 85
                          ? act.description.slice(0, 85) + "..."
                          : act.description
                      }`}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">{`Location: ${act.location.address}`}</p>
                    <p className="text-sm text-gray-600 mb-2">{`Duration: ${act.duration}`}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">
                        From {formatPrice(act.price, act.currency)}
                      </span>
                      <Link to={`/activity/${act._id}`}>
                        <button className="bg-[#388A94] hover:bg-[#5D9297] text-white px-4 py-2 rounded-full text-l font-medium transition-colors duration-300">
                          Details
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
