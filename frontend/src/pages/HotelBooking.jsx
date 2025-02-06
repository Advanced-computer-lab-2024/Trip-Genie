"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Bed,
  Calendar,
  ArrowUpDown,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";
import { useSearchParams } from "react-router-dom";

const cities = [
  { code: "CAI", name: "Cairo", region: "Egypt" },
  { code: "PAR", name: "Paris", region: "France" },
  { code: "DXB", name: "Dubai", region: "United Arab Emirates" },
  { code: "NYC", name: "New York", region: "USA" },
  { code: "LON", name: "London", region: "UK" },
  { code: "TKY", name: "Tokyo", region: "Japan" },
  { code: "PEK", name: "Beijing", region: "China" },
  { code: "SYD", name: "Sydney", region: "Australia" },
  { code: "BER", name: "Berlin", region: "Germany" },
  { code: "SIN", name: "Singapore", region: "Singapore" },
  { code: "AMS", name: "Amsterdam", region: "Netherlands" },
  { code: "CHI", name: "Chicago", region: "USA" },
  { code: "MEX", name: "Mexico City", region: "Mexico" },
  { code: "SAO", name: "São Paulo", region: "Brazil" },
  { code: "HKG", name: "Hong Kong", region: "Hong Kong" },
  { code: "SEL", name: "Seoul", region: "South Korea" },
  { code: "JNB", name: "Johannesburg", region: "South Africa" },
  { code: "TOR", name: "Toronto", region: "Canada" },
  { code: "MAD", name: "Madrid", region: "Spain" },
  { code: "MOW", name: "Moscow", region: "Russia" },
  { code: "LAX", name: "Los Angeles", region: "USA" },
  { code: "IST", name: "Istanbul", region: "Turkey" },
  { code: "BCN", name: "Barcelona", region: "Spain" },
  { code: "MUM", name: "Mumbai", region: "India" },
  { code: "ATL", name: "Atlanta", region: "USA" },
  { code: "MUN", name: "Munich", region: "Germany" },
  { code: "ROM", name: "Rome", region: "Italy" },
  { code: "DME", name: "Moscow (Domodedovo)", region: "Russia" },
];

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    maxWidth: "100%",
    margin: "0 auto",
    backgroundColor: "#1A3B47",
    borderRadius: "8px",
    overflow: "hidden",
  },
  tabsContainer: {
    display: "flex",
    backgroundColor: "#388A94",
    padding: "10px 10px 0",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    cursor: "pointer",
    border: "none",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
    color: "#E6DCCF",
    backgroundColor: "transparent",
    fontSize: "14px",
    marginRight: "4px",
    transition: "background-color 0.3s, color 0.3s",
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    fontSize: "20px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#888",
  },
  activeTab: {
    backgroundColor: "white",
    color: "#388A94",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
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
  locationDisplay: {
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "4px",
  },
  locationSubtext: {
    fontSize: "12px",
    color: "#666",
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
    alignSelf: "flex-end",
    marginTop: "24px",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
    borderRadius: "10px", // Rounded edges
    overflow: "hidden", // Ensures rounded corners display correctly
    padding: "20px",
    maxWidth: "380px",
    width: "100%",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
    position: "relative", // For positioning the close button if needed
  },
  modalButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
};

// const formatDate = (date) => {
//   return date.toISOString().split('T')[0];
// };

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function HotelBookingPage() {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get("city") || "CAI");
  const [checkInDate, setCheckInDate] = useState(
    searchParams.get("checkIn") || formatDate(new Date())
  );
  const [checkOutDate, setCheckOutDate] = useState(
    searchParams.get("checkOut") || formatDate(new Date(Date.now() + 86400000))
  );
  const [activeTab, setActiveTab] = useState("hotels");
  const [adults, setAdults] = useState(searchParams.get("adults") || "1");
  const [hotels, setHotels] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("price");
  const [sortOrder, setSortOrder] = useState("asc");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] =
    useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hotelOffers, setHotelOffers] = useState(null);
  const [dialogError, setDialogError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [holderName, setHolderName] = useState("");
  const [cvv, setCvv] = useState("");
  const [exchangeRates, setExchangeRates] = useState({});

  const itemsPerPage = 9;

  const refreshToken = useCallback(async () => {
    try {
      const API_KEY = import.meta.env.VITE_AMADEUS_API_KEY;
      const API_SECRET = import.meta.env.VITE_AMADEUS_API_SECRET;
      const response = await fetch(
        "https://test.api.amadeus.com/v1/security/oauth2/token",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: API_KEY,
            client_secret: API_SECRET,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to refresh access token");
      }

      const data = await response.json();
      setAccessToken(data.access_token);
      setTimeout(refreshToken, 29 * 60 * 1000);
    } catch (err) {
      setError("Authentication failed. Please try again later.");
    }
  }, []);

  const getCurrencyCode = useCallback(async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/currencies/code",
        {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch currency code");
      }

      const data = await response.json();
      setCurrencyCode(data);
    } catch (err) {
      setError("Failed to fetch currency code. Please try again later.");
    }
  }, []);

  const getExchangeRates = useCallback(async () => {
    try {
      const response = await fetch("https://trip-genie-apis.vercel.app/rates");
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      const data = await response.json();
      setExchangeRates(data.rates);
    } catch (err) {
      setError("Failed to fetch exchange rates. Please try again later.");
    }
  }, []);

  useEffect(() => {
    refreshToken();
    getCurrencyCode();
    getExchangeRates();
  }, [refreshToken, getCurrencyCode, getExchangeRates]);

  useEffect(() => {
    // Ensure check-out date is after check-in date
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setCheckOutDate(
        formatDate(new Date(new Date(prev.checkIn).getTime() + 86400000))
      );
    }
  }, [checkInDate, checkOutDate]);

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    if (!fromRate || !toRate) return amount;
    return (amount / fromRate) * toRate;
  };

  const handleSearch = async () => {
    if (!city) {
      setError("Please enter a city code.");
      return;
    }

    setIsLoading(true);
    setError("");
    setHotels([]);
    try {
      const response = await fetch(
        `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${city}`,
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch hotels");
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        setError("No hotels found for your search criteria.");
        setHotels([]);
      } else {
        const hotelIds = data.data.map((hotel) => hotel.hotelId);
        const fetchHotelOffers = async (ids) => {
          try {
            const response = await fetch(
              `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${ids.join(
                ","
              )}&adults=${adults}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&currency=USD`,
              {
                credentials: "include",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (response.ok) {
              return await response.json();
            } else {
              console.warn(
                `Failed to fetch offers for hotels: ${ids.join(", ")}`
              );
              return { data: [] };
            }
          } catch (error) {
            console.error(`Error fetching hotel offers: ${error.message}`);
            return { data: [] };
          }
        };

        for (let i = 0; i < hotelIds.length; i += 20) {
          const chunk = hotelIds.slice(i, i + 20);
          const offersData = await fetchHotelOffers(chunk);
          const validHotels = offersData.data.filter(
            (hotel) =>
              hotel.offers &&
              hotel.offers[0] &&
              hotel.offers[0].price &&
              !isNaN(parseFloat(hotel.offers[0].price.total))
          );
          setHotels((prevHotels) => [...prevHotels, ...validHotels]);

          if (i + 20 < hotelIds.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
          }
        }

        setCurrentPage(1);
      }
    } catch (err) {
      setError("Failed to fetch hotels. Please try again later.");
      setHotels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterHotels = (hotels) => {
    let filtered = [...hotels];

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "price":
          aValue = parseFloat(
            convertCurrency(
              a.offers[0].price.total,
              a.offers[0].price.currency,
              currencyCode
            ) || 0
          );
          bValue = parseFloat(
            convertCurrency(
              b.offers[0].price.total,
              b.offers[0].price.currency,
              currencyCode
            ) || 0
          );
          break;
        default:
          aValue = parseFloat(
            convertCurrency(
              a.offers[0].price.total,
              a.offers[0].price.currency,
              currencyCode
            ) || 0
          );
          bValue = parseFloat(
            convertCurrency(
              b.offers[0].price.total,
              b.offers[0].price.currency,
              currencyCode
            ) || 0
          );
      }
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  };

  const paginatedHotels = filterHotels(hotels).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filterHotels(hotels).length / itemsPerPage);

  // const formatDate = (dateString) => {
  //   return new Date(dateString).toLocaleDateString("en-US", {
  //     year: "numeric",
  //     month: "long",
  //     day: "numeric",
  //   });
  // };

  const handleOpenDialog = async (hotel) => {
    setSelectedHotel(hotel);
    setIsDialogOpen(true);
    setDialogError("");

    try {
      const response = await fetch(
        `https://test.api.amadeus.com/v3/shopping/hotel-offers/${hotel.offers[0].id}`,
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch hotel details");
      }

      const data = await response.json();
      setHotelOffers(data.data);
    } catch (err) {
      setDialogError(err.message);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setHotelOffers(null);
    resetBookingForm();
  };

  const handleBookNow = () => {
    setIsBookingConfirmationOpen(true);
  };

  const handleCloseAllPopups = () => {
    setIsBookingConfirmationOpen(false);
    setIsDialogOpen(false);
    setHotelOffers(null);
    resetBookingForm();
  };

  const resetBookingForm = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setPaymentMethod("");
    setCardNumber("");
    setExpiryDate("");
    setHolderName("");
    setCvv("");
  };

  const isBookingFormValid = () => {
    if (!firstName || !lastName || !phone || !email || !paymentMethod) {
      return false;
    }
    if (
      paymentMethod === "card" &&
      (!cardNumber || !expiryDate || !holderName || !cvv)
    ) {
      return false;
    }
    return true;
  };

  const today = new Date().toISOString().split("T")[0];

  const renderLocationDisplay = (code) => {
    const list = cities;
    const location = list.find((item) => item.code === code);
    return location ? (
      <>
        <div style={styles.locationDisplay}>{location.name}</div>
        <div style={styles.locationSubtext}>
          {location.code}, {location.region}
        </div>
      </>
    ) : null;
  };

  const handleCheckInDateChange = (e) => {
    const selectedDate = e.target.value;
    setCheckInDate(selectedDate);
    if (checkOutDate && new Date(checkOutDate) <= new Date(selectedDate)) {
      setCheckOutDate("");
    }
  };

  const getPageNumbers = (current, total, maxVisible) => {
    const pages = [];
    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    pages.push(1);
    const halfVisible = Math.floor(maxVisible / 2);
    let start = Math.max(2, current - halfVisible);
    let end = Math.min(total - 1, current + halfVisible);
    if (current <= halfVisible + 1) {
      end = maxVisible - 1;
    } else if (current >= total - halfVisible) {
      start = total - maxVisible + 2;
    }
    if (start > 2) pages.push("ellipsis");
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < total - 1) pages.push("ellipsis");
    pages.push(total);
    return pages;
  };

  return (
    <div className="bg-[#E6DCCF]">
      {/* Navbar */}
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>
      <div className="h-16"></div>
      <div className="bg-[#E6DCCF] min-h-screen mx-auto px-24">
        <h1 className="text-5xl font-bold text-[#1A3B47]">Hotel Booking</h1>
        <div className="h-10"></div>

        <div className="mx-auto mb-12">
          <div
            style={{
              ...styles.formContainer,
              opacity: activeTab === "hotels" ? 1 : 0,
              position: activeTab === "hotels" ? "static" : "absolute",
              pointerEvents: activeTab === "hotels" ? "auto" : "none",
            }}
          >
            <form style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>CITY</label>
                <select
                  style={styles.select}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                >
                  {cities.map((city) => (
                    <option key={city.code} value={city.code}>
                      {city.name} ({city.code}) - {city.region}
                    </option>
                  ))}
                </select>
                {renderLocationDisplay(city)}
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>CHECK IN</label>
                <div style={{ position: "relative" }}>
                  <Input
                    id="checkInDate"
                    type="date"
                    value={checkInDate}
                    onChange={handleCheckInDateChange}
                    min={today}
                    style={styles.input}
                    required
                  />
                  {/* <Calendar size={16} style={{ position: 'absolute', right: '8px', top: '8px', pointerEvents: 'none' }} /> */}
                </div>
                <div style={styles.locationDisplay}>
                  {new Date(checkInDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>CHECK OUT</label>
                <div style={{ position: "relative" }}>
                  <Input
                    id="checkOutDate"
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate}
                    style={styles.input}
                    required
                  />
                  {/* <Calendar size={16} style={{ position: 'absolute',   right: '8px', top: '8px', pointerEvents: 'none' }} /> */}
                </div>
                <div style={styles.locationDisplay}>
                  {new Date(checkOutDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>ADULTS</label>
                <Select
                  style={styles.select}
                  value={adults}
                  onValueChange={setAdults}
                  required
                >
                  <SelectTrigger id="adults">
                    <SelectValue placeholder="Select number of adults" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(8)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* <Button type="submit" style={styles.button} onClick={handleSearch}>
          {isLoading ? "Searching..." : "Search Hotels"}
          </Button> */}
            </form>
            <div className="mt-8 mr-2 ml-2">
              <Button
                onClick={handleSearch}
                className="bg-[#1A3B47] hover:bg-[#388A94] text-white font-semibold px-8 w-full"
              >
                {isLoading ? "Searching..." : "Search Hotels"}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hotels.length > 0 && (
          <div className="space-y-4 mt-3">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] border-amber-400">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() =>
                    setSortOrder((order) => (order === "asc" ? "desc" : "asc"))
                  }
                  className="flex gap-2 border-amber-400"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {sortOrder.toUpperCase()}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedHotels.map((hotel, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#1A3B47] text-white rounded">
                          <Bed className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-semibold">
                          {hotel.hotel.name}
                        </h3>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#B5D3D1]" />
                          <span>
                            Check-in: {formatDate(hotel.offers[0].checkInDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#5D9297]" />
                          <span>
                            Check-out:{" "}
                            {formatDate(hotel.offers[0].checkOutDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-lg text-[#F88C33]">
                          <span>
                            {" "}
                            {convertCurrency(
                              hotel.offers[0].price.total,
                              hotel.offers[0].price.currency,
                              currencyCode
                            ).toFixed(2)}{" "}
                            {currencyCode}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <Button
                          className="bg-[#388A94] hover:bg-[#1A3B47] text-white"
                          onClick={() => handleOpenDialog(hotel)}
                        >
                          See Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {getPageNumbers(currentPage, totalPages, 5).map(
                  (page, index) => (
                    <PaginationItem key={index}>
                      {page === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className={
                            currentPage === page ? "pointer-events-none" : ""
                          }
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-[425px] bg-white max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Hotel Details</DialogTitle>
              <DialogDescription>
                Complete information about the selected hotel.
              </DialogDescription>
            </DialogHeader>
            {dialogError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{dialogError}</AlertDescription>
              </Alert>
            )}

            {selectedHotel && hotelOffers && !dialogError && (
              <div className="mt-4 space-y-4">
                <h4 className="font-semibold mb-2">{hotelOffers.hotel.name}</h4>
                <p>Check-in: {formatDate(hotelOffers.offers[0].checkInDate)}</p>
                <p>
                  Check-out: {formatDate(hotelOffers.offers[0].checkOutDate)}
                </p>
                <p>Room Type: {hotelOffers.offers[0].room.type}</p>
                <p>
                  Price:{" "}
                  {convertCurrency(
                    hotelOffers.offers[0].price.total,
                    hotelOffers.offers[0].price.currency,
                    currencyCode
                  ).toFixed(2)}{" "}
                  {currencyCode}
                </p>
                <p>Adults: {adults}</p>
                <div>
                  <h5 className="font-semibold mt-4 mb-2">Description:</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {hotelOffers.offers[0].room.description.text
                      .split("-")
                      .map((item, index) => (
                        <li key={index}>{item.trim()}</li>
                      ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mt-4 mb-2">Amenities:</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {hotelOffers.hotel.amenities.map((amenity, index) => (
                      <li key={index}>
                        {amenity
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0) + word.slice(1).toLowerCase()
                          )
                          .join(" ")}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <Input
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <Input
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <Input
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="wallet" id="wallet" />
                      <Label htmlFor="wallet">Wallet</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card">Credit/Debit Card</Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      <Input
                        placeholder="Card Number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                      />
                      <Input
                        placeholder="Expiry Date (YYYY-MM)"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                      <Input
                        placeholder="Card Holder Name"
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                      />
                      <Input
                        placeholder="CVV"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <Button
                  className="mt-4 w-full bg-[#388A94] hover:bg-[#1A3B47] text-white"
                  onClick={handleBookNow}
                  disabled={!isBookingFormValid()}
                >
                  Book Now
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={isBookingConfirmationOpen}
          onOpenChange={setIsBookingConfirmationOpen}
        >
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Booking Confirmed</DialogTitle>
              <DialogDescription>
                Your hotel has been booked successfully. You will receive a
                confirmation email shortly.
              </DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button
                onClick={handleCloseAllPopups}
                className="mt-4 w-full bg-[#388A94] hover:bg-[#1A3B47] text-white"
              >
                Close
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
