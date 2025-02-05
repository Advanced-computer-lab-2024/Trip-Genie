"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon, Star } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserGuide } from "@/components/UserGuide.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_KEY = import.meta.env.VITE_HOTELS_API_KEY3;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    maxWidth: "100%",
    margin: "0 auto",
    backgroundColor: "#1A3B47",
    borderRadius: "8px",
    overflow: "hidden",
  },
  formContainer: {
    backgroundColor: "white",
    padding: "20px",
    transition: "opacity 0.3s",
  },
  form: {
    display: "flex",
    alignItems: "flex-start",
    gap: "15px",
  },
  fieldGroup: {
    flex: 1,
    minWidth: "150px",
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "12px",
    color: "#666",
    marginBottom: "4px",
  },
  select: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
    backgroundColor: "white",
  },
  input: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
  },
  button: {
    padding: "12px 24px",
    backgroundColor: "#1A3B47",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "20px",
  },
  dayDisplay: {
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "4px",
  },
  buttonContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: "24px",
  },
};

export default function HotelSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const today = new Date();
  const tomorrow = addDays(today, 1);

  const [checkInDate, setCheckInDate] = useState(today);
  const [checkOutDate, setCheckOutDate] = useState(tomorrow);
  const [adults, setAdults] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userCurrency, setUserCurrency] = useState({
    code: "USD",
    symbol: "$",
  });
  const [exchangeRates, setExchangeRates] = useState({});
  const [showCheckInWarning, setShowCheckInWarning] = useState(false);
  const [priceFilter, setPriceFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState(0);

  const fetchUserCurrency = useCallback(async () => {
    try {
      const token = Cookies.get("jwt");
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
      setUserCurrency(currencyResponse.data);
    } catch (error) {
      console.error("Error fetching user currency:", error);
    }
  }, []);

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:4000/rates");
      setExchangeRates(response.data.rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserCurrency();
    fetchExchangeRates();
  }, [fetchUserCurrency, fetchExchangeRates]);

  const convertPrice = useCallback(
    (priceUSD) => {
      if (!priceUSD) return null;
      const rate = exchangeRates[userCurrency.code] || 1;
      return (priceUSD * rate).toFixed(2);
    },
    [exchangeRates, userCurrency.code]
  );

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery && checkInDate && checkOutDate) {
      setIsLoading(true);
      setError(null);
      try {
        const locationResponse = await fetch(
          `https://booking-com.p.rapidapi.com/v1/hotels/locations?locale=en-gb&name=${encodeURIComponent(
            searchQuery
          )}`,
          {
            headers: {
              "x-rapidapi-host": "booking-com.p.rapidapi.com",
              "x-rapidapi-key": API_KEY,
            },
          }
        );
        const locations = await locationResponse.json();
        const destId = locations[0]?.dest_id;

        if (!destId) {
          throw new Error("Destination not found");
        }

        const searchResponse = await fetch(
          `https://booking-com.p.rapidapi.com/v1/hotels/search?dest_id=${destId}&order_by=popularity&checkout_date=${format(
            checkOutDate,
            "yyyy-MM-dd"
          )}&checkin_date=${format(
            checkInDate,
            "yyyy-MM-dd"
          )}&adults_number=${adults}&room_number=1&units=metric&filter_by_currency=USD&locale=en-gb&dest_type=city`,
          {
            headers: {
              "x-rapidapi-host": "booking-com.p.rapidapi.com",
              "x-rapidapi-key": API_KEY,
            },
          }
        );
        const searchResults = await searchResponse.json();
        const prices = searchResults.result.map((hotel) =>
          parseFloat(hotel.min_total_price)
        );
        setMaxPrice(Math.max(...prices));
        setHotels(searchResults.result || []);
      } catch (err) {
        setError(
          "An error occurred while searching for hotels. Please try again."
        );
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filterHotels = (hotels) => {
    let filtered = [...hotels];

    if (priceFilter !== "all") {
      filtered = filtered.filter((hotel) => {
        const price = parseFloat(hotel.min_total_price);
        switch (priceFilter) {
          case "under25":
            return price < maxPrice * 0.25;
          case "under50":
            return price < maxPrice * 0.5;
          case "under75":
            return price < maxPrice * 0.75;
          case "over75":
            return price >= maxPrice * 0.75;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const getUserRole = () => {
    let role = Cookies.get("role");
    if (!role) role = "guest";
    return role;
  };

  const guideSteps = [
    {
      target: "body",
      content:
        "Welcome to the hotel booking page! Here you can search for hotels and book rooms for your next trip.",
      placement: "center",
    },
    {
      target: ".search",
      content: (
        <>
          {" "}
          Enter the city or region you want to visit, along with the check-in,
          check-out dates and the number of adults.
          <br />
          <br />
          Press Search Hotels to find the most suitable hotels for you.
        </>
      ),
      placement: "top",
    },
  ];

  const handleCheckInDateChange = (date) => {
    setCheckInDate(date);
    setShowCheckInWarning(false);
    // Ensure check-out date is at least one day after check-in date
    if (!checkOutDate || date >= checkOutDate) {
      setCheckOutDate(addDays(date, 1));
    }
  };

  const handleCheckOutDateChange = (date) => {
    if (checkInDate && date > checkInDate) {
      setCheckOutDate(date);
    }
  };

  return (
    <div className="bg-gray-100">
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>
      <div className="h-16"></div>

      <div className="bg-gray-100 min-h-screen mx-auto px-24">
        <div>
          <h1 className="text-5xl font-bold text-[#1A3B47]">Hotel Booking</h1>
          <div className="h-10"></div>
          <div style={styles.container}>
            <div style={styles.formContainer}>
              <form onSubmit={handleSearch} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>DESTINATION</label>
                  <Input
                    type="text"
                    placeholder="Enter destination"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    required
                    aria-label="Destination"
                    style={styles.input}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>CHECK-IN</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !checkInDate && "text-muted-foreground"
                        )}
                        aria-label="Select check-in date"
                        style={styles.input}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkInDate ? (
                          format(checkInDate, "PPP")
                        ) : (
                          <span>Check-in date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkInDate}
                        onSelect={handleCheckInDateChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div style={styles.dayDisplay}>
                    {checkInDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>CHECK-OUT</label>
                  <Popover>
                    <div>
                      {checkInDate ? (
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[240px] justify-start text-left font-normal",
                              !checkOutDate && "text-muted-foreground"
                            )}
                            aria-label="Select check-out date"
                            style={styles.input}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {checkOutDate ? (
                              format(checkOutDate, "PPP")
                            ) : (
                              <span>Check-out date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-[240px] justify-start text-left font-normal text-muted-foreground"
                          onClick={() => setShowCheckInWarning(true)}
                          aria-label="Select check-out date"
                          style={styles.input}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          <span>Check-out date</span>
                        </Button>
                      )}
                      {showCheckInWarning && !checkInDate && (
                        <p className="text-sm text-red-500 mt-1">
                          Please select a check-in date first.
                        </p>
                      )}
                    </div>
                    {checkInDate && (
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={checkOutDate}
                          onSelect={handleCheckOutDateChange}
                          disabled={(date) =>
                            date <= checkInDate || date <= new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    )}
                  </Popover>
                  <div style={styles.dayDisplay}>
                    {checkOutDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>ADULTS</label>
                  <Input
                    type="number"
                    placeholder="Number of adults"
                    value={adults}
                    onChange={(e) => setAdults(parseInt(e.target.value))}
                    min={1}
                    required
                    aria-label="Number of adults"
                    style={styles.input}
                  />
                </div>
                <button
                  style={styles.button}
                  disabled={isLoading}
                  className="bg-[#1A3B47] hover:bg-[#1A3B47] text-white font-semibold searchButton"
                >
                  {isLoading ? "Searching..." : "Search Hotels"}
                </button>
              </form>
            </div>
          </div>
        </div>
        {hotels.length > 0 && (
          <div className="mt-8 mb-3">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-[160px] border-amber-400">
                  <SelectValue placeholder="Filter by price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under25">
                    Under {userCurrency.symbol}
                    {Math.floor(0.25 * convertPrice(maxPrice))}
                  </SelectItem>
                  <SelectItem value="under50">
                    Under {userCurrency.symbol}
                    {Math.floor(0.5 * convertPrice(maxPrice))}
                  </SelectItem>
                  <SelectItem value="under75">
                    Under {userCurrency.symbol}
                    {Math.floor(0.75 * convertPrice(maxPrice))}
                  </SelectItem>
                  <SelectItem value="over75">
                    Over {userCurrency.symbol}
                    {Math.floor(0.75 * convertPrice(maxPrice))}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="gap-4 grid grid-cols-2 pb-4">
          {hotels.length === 0 ? (
            <div className="col-span-2 text-xl text-center text-gray-600 mt-8 pt-5">
              <p>
                No hotels found. Please adjust your search criteria and try
                again.
              </p>
            </div>
          ) : (
            filterHotels(hotels).map((hotel) => (
              <Link
                to={`/hotels/${hotel.hotel_id}?checkinDate=${format(
                  checkInDate,
                  "yyyy-MM-dd"
                )}&checkoutDate=${format(
                  checkOutDate,
                  "yyyy-MM-dd"
                )}&adults=${adults}`}
                key={hotel.hotel_id}
                className="block"
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      {/* Enforcing consistent image size */}
                      <div className="relative w-[180px] h-[150px] overflow-hidden bg-gray-200 rounded-md">
                        <img
                          src={hotel.max_photo_url || "/placeholder.svg"}
                          alt={hotel.hotel_name}
                          className="object-cover w-full h-full"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <div>
                        <CardHeader className="p-0">
                          <CardTitle className="text-xl">
                            {hotel.hotel_name}
                          </CardTitle>
                        </CardHeader>
                        <div className="mt-2 flex items-center">
                          {[
                            ...Array(Math.floor(hotel.review_score / 2) || 0),
                          ].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {hotel.review_score
                              ? `${(hotel.review_score / 2).toFixed(1)}`
                              : "No reviews yet"}
                          </span>
                        </div>
                        <p className="mt-2">{hotel.address}</p>
                        <p className="mt-2 font-bold">
                          {userCurrency.symbol}
                          {convertPrice(hotel.min_total_price)} -{" "}
                          {userCurrency.symbol}
                          {convertPrice(
                            hotel.price_breakdown.all_inclusive_price
                          )}{" "}
                          per night
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
      {(getUserRole() === "guest" || getUserRole() === "tourist") && (
        <UserGuide steps={guideSteps} pageName="hotel-search" />
      )}
    </div>
  );
}
