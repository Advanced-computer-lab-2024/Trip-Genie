import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import defaultImage from "../assets/images/default-image.jpg";
import { Link } from "react-router-dom";

export const ItineraryCards = () => {
  const [itineraries, setItineraries] = useState([]);
  const [userRole, setUserRole] = useState(Cookies.get("role") || "guest");
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencySymbol, setCurrencySymbol] = useState({});

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const token = Cookies.get("jwt");
        let role = Cookies.get("role");
        if (role === undefined) role = "guest";
        const response = await axios.get(
          `https://trip-genie-apis.vercel.app/${role}/itineraries`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.data.slice(0, 6);
        setItineraries(data);
      } catch (error) {
        console.error("Error fetching itineraries:", error);
      }
    };

    fetchItineraries();
    fetchUserInfo();
  }, []);

  const fetchExchangeRate = async (itineraryCurrency) => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `https://trip-genie-apis.vercel.app/${userRole}/populate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base: itineraryCurrency,
            target: userPreferredCurrency._id,
          }),
        }
      );
      const data = await response.json();
      // console.log("data mn fetch", data);
      if (response.ok) {
        setExchangeRates((prevRates) => ({
          ...prevRates,
          [itineraryCurrency]: data.conversion_rate,
        }));
      } else {
        console.error("Error in fetching exchange rate:", data.message);
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  };

  const getCurrencySymbol = async (itineraryCurrency) => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/${userRole}/getCurrency/${itineraryCurrency}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrencySymbol(response.data);
    } catch (error) {
      console.error("Error fetching currency symbol:", error);
    }
  };

  const formatPrice = (price, currency) => {
    if (userRole === "tourist" && userPreferredCurrency) {
      // console.log("exchangerates:", exchangeRates);
      // console.log("currency:", currency);
      // console.log("henaaaaaaa", exchangeRates[currency]);
      if (userPreferredCurrency._id === currency) {
        return `${userPreferredCurrency.symbol}${price}`;
      } else if (exchangeRates[currency]) {
        const convertedPrice = price * exchangeRates[currency];
        return `${userPreferredCurrency.symbol}${convertedPrice.toFixed(2)}`;
      }
    } else if (currencySymbol) {
      return `${currencySymbol.symbol}${price}`;
    }
    // return `$${price}`;
  };

  const fetchUserInfo = async () => {
    const role = Cookies.get("role") || "guest";
    setUserRole(role);

    if (role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const currencyId = response.data.preferredCurrency;
        const response2 = await axios.get(
          `https://trip-genie-apis.vercel.app/tourist/getCurrency/${currencyId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUserPreferredCurrency(response2.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  useEffect(() => {
    itineraries.forEach((itinerary) => {
      if (
        userRole === "tourist" &&
        userPreferredCurrency &&
        userPreferredCurrency._id !== itinerary.currency
      ) {
        // console.log("ba fetch exchange rate", itinerary.currency);
        fetchExchangeRate(itinerary.currency);
        // console.log("exchangerates:", exchangeRates);
      } else {
        // console.log("fetch currency symbol");
        getCurrencySymbol(itinerary.currency);
      }
    });
  }, [userRole, userPreferredCurrency, itineraries]);

  return (
    <div className="container mx-auto px-24 py-12 flex flex-col md:flex-row">
      {/* Left Side: Itineraries Title, Line, Description, Button */}
      <div className="w-full md:w-2/6 pr-8 mb-8 md:mb-0">
        <h1 className="text-4xl font-bold text-[#1A3B47] mb-4">Itineraries</h1>
        <p className="text-[#1A3B47] mb-4">
          Discover our curated itineraries designed for every traveler, blending
          cultural experiences with thrilling adventures. From serene escapes to
          adrenaline-filled expeditions, our diverse journeys cater to all
          preferences. Let us turn your travel dreams into reality!
        </p>

        <div className="flex justify-center">
          <Link to="/all-itineraries">
            <button className="bg-[#388A94] hover:bg-[#5D9297] text-white px-8a py-2 pl-8 pr-8 rounded-full text-lg font-medium transition-colors duration-300">
              View More
            </button>
          </Link>
        </div>
      </div>

      {/* Right Side: Itineraries Cards */}
      <div className="w-full md:w-4/6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {itineraries.map((itinerary) => {
          // const activityImage =
          //   itinerary.activities &&
          //     itinerary.activities.length > 0 &&
          //     itinerary.activities[0].pictures &&
          //     itinerary.activities[0].pictures.length > 0
          //     ? itinerary.activities[0].pictures[0].url
          //     : defaultImage;

          const firstAvailablePicture =
            itinerary.activities
              ?.flatMap((activity) => activity.pictures ?? [])
              .find((picture) => picture?.url)?.url || defaultImage;

          return (
            <Link to={`/itinerary/${itinerary._id}`} key={itinerary._id}>
              <div
                className="group relative bg-cover bg-center rounded-[26px] overflow-hidden"
                style={{
                  width: "100%",
                  height: "300px",
                  backgroundImage: `url(${firstAvailablePicture})`,
                }}
              >
                {/* Gradient Overlay - hidden initially */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#002845] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                {/* Itinerary content - hidden and slides up on hover */}
                <div className="absolute inset-x-0 bottom-0 p-5 text-white transform translate-y-full transition-transform duration-500 group-hover:translate-y-0">
                  <div className="flex flex-col items-start w-full">
                    <h3
                      className="w-[90%] font-semibold text-lg leading-tight mb-2"
                      style={{
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
                      }}
                    >
                      {itinerary.title}
                    </h3>
                    <span
                      className="text-base font-medium"
                      style={{
                        textShadow: "2px 2px 5px rgba(0, 0, 0, 1)", // Increased shadow strength
                      }}
                    >
                      {formatPrice(itinerary.price, itinerary.currency)}
                    </span>

                    <div
                      className="mt-1 text-sm text-white/90"
                      style={{
                        textShadow: "1px 1px 3px rgba(0, 0, 0, 0.5)",
                      }}
                    >
                      {itinerary.availableDates.length > 0
                        ? new Date(
                            itinerary.availableDates[0].date
                          ).toLocaleDateString()
                        : "No dates available"}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
