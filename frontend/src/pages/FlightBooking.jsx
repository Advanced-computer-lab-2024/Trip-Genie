"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UserGuide } from "@/components/UserGuide.jsx";
import axios from "axios";

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
  ArrowUpDown,
  Calendar,
  Plane,
  AlertCircle,
  PlaneLanding,
  PlaneTakeoff,
  Info,
  Ticket,
  Clock,
  ChevronLeft,
  ChevronRight,
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";
import { useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { set, format, startOfToday } from "date-fns";

const airports = [
  { code: "CAI", name: "Cairo International Airport", region: "Egypt" },
  { code: "CDG", name: "Charles de Gaulle Airport", region: "France" },
  {
    code: "DXB",
    name: "Dubai International Airport",
    region: "United Arab Emirates",
  },
  { code: "JFK", name: "John F. Kennedy International Airport", region: "USA" },
  { code: "LHR", name: "Heathrow Airport", region: "UK" },
  { code: "HND", name: "Tokyo Haneda Airport", region: "Japan" },
  {
    code: "PEK",
    name: "Beijing Capital International Airport",
    region: "China",
  },
  { code: "SYD", name: "Sydney Kingsford Smith Airport", region: "Australia" },
  { code: "FRA", name: "Frankfurt Airport", region: "Germany" },
  { code: "SIN", name: "Singapore Changi Airport", region: "Singapore" },
  { code: "AMS", name: "Amsterdam Schiphol Airport", region: "Netherlands" },
  { code: "ORD", name: "Hare International Airport", region: "USA" },
  { code: "MEX", name: "Mexico City International Airport", region: "Mexico" },
  {
    code: "GRU",
    name: "São Paulo–Guarulhos International Airport",
    region: "Brazil",
  },
  { code: "HKG", name: "Hong Kong International Airport", region: "Hong Kong" },
  { code: "ICN", name: "Incheon International Airport", region: "South Korea" },
  {
    code: "JNB",
    name: "O.R. Tambo International Airport",
    region: "South Africa",
  },
  {
    code: "YYZ",
    name: "Toronto Pearson International Airport",
    region: "Canada",
  },
  {
    code: "MAD",
    name: "Adolfo Suárez Madrid–Barajas Airport",
    region: "Spain",
  },
  { code: "SVO", name: "Sheremetyevo International Airport", region: "Russia" },
  { code: "LAX", name: "Los Angeles International Airport", region: "USA" },
  { code: "IST", name: "Istanbul Airport", region: "Turkey" },
  { code: "BCN", name: "Barcelona-El Prat Airport", region: "Spain" },
  {
    code: "BOM",
    name: "Chhatrapati Shivaji Maharaj International Airport",
    region: "India",
  },
  {
    code: "ATL",
    name: "Hartsfield-Jackson Atlanta International Airport",
    region: "USA",
  },
  { code: "MUC", name: "Munich Airport", region: "Germany" },
  { code: "FCO", name: "Leonardo da Vinci–Fiumicino Airport", region: "Italy" },
  { code: "DME", name: "Domodedovo International Airport", region: "Russia" },
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
    marginTop: "20px",
  },
};

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

const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

function getTodayAtMidnight() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight
  return today;
}

function BookingPage() {
  const [searchParams] = useSearchParams();
  const [from, setFrom] = useState(searchParams.get("from") || "CAI");
  const [to, setTo] = useState(searchParams.get("to") || "DXB");
  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [seatType, setSeatType] = useState("Economy");
  const [departureDate, setDepartureDate] = useState(
    searchParams.get("departDate") || format(startOfToday(), "yyyy-MM-dd")
  );
  const [returnDate, setReturnDate] = useState(
    searchParams.get("returnDate") ||
      formatDate(new Date(Date.now() + 86400000))
  );
  const [tripType, setTripType] = useState(
    searchParams.get("tripType") || "roundTrip"
  );
  const [flights, setFlights] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("price");
  const [sortOrder, setSortOrder] = useState("asc");
  const [priceFilter, setPriceFilter] = useState("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [currencyCode, setCurrencyCode] = useState("");
  const [maxPrice, setMaxPrice] = useState(0);
  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] =
    useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const mainContentRef = useRef(null);
  const [paymentMethod, setPaymentMethod] = useState("Wallet");
  const [bookingError, setBookingError] = useState("");
  const [exchangeRates, setExchangeRates] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const bookingProcessedRef = useRef(false);

  const [tourist, setTourist] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoDetails, setPromoDetails] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountedTotal, setDiscountedTotal] = useState(0);

  useEffect(() => {
    const fetchTouristData = async () => {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTourist(response.data);
        const currencyId = response.data.preferredCurrency;

        const response2 = await axios.get(
          `https://trip-genie-apis.vercel.app/tourist/getCurrency/${currencyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCurrencySymbol(response2.data.symbol);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchTouristData();
  }, []);

  const itemsPerPage = 9;

  useEffect(() => {
    if (new Date(returnDate) <= new Date(departureDate)) {
      setReturnDate(
        formatDate(new Date(new Date(departureDate).getTime() + 86400000))
      );
    }
  }, [departureDate, returnDate]);

  // call this use effect only once to avoid double booking
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true" && !bookingProcessedRef.current) {
      handleBookNow();
    }
  }, [searchParams]);

  const renderLocationDisplay = (code) => {
    const location = airports.find((item) => item.code === code);
    return location ? (
      <>
        <div style={styles.locationDisplay}>{location.name}</div>
        <div style={styles.locationSubtext}>
          {location.code}, {location.region}
        </div>
      </>
    ) : null;
  };

  const handlePromoSubmit = async (e) => {
    if (e) e.preventDefault();
    setPromoError("");
    setPromoDetails(null);
    setDiscountAmount(0);
    setDiscountedTotal(selectedFlight.price.total * numberOfSeats);

    if (!promoCode.trim()) {
      return;
    }

    try {
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/get/promo-code",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Cookies.get("jwt")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: promoCode }),
        }
      );

      if (response.status === 404) {
        setPromoError("Promo Code Not Found.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch promo code details");
      }

      const data = await response.json();
      const promo = data.promoCode;

      if (promo.status === "inactive") {
        setPromoError("This promo code is currently inactive.");
        return;
      }

      const currentDate = new Date();
      const startDate = new Date(promo?.dateRange?.start);
      const endDate = new Date(promo?.dateRange?.end);

      if (currentDate < startDate || currentDate > endDate) {
        setPromoError("This promo code is not valid for the current date.");
        return;
      }

      if (promo.timesUsed >= promo.usage_limit) {
        setPromoError("This promo code has reached its usage limit.");
        return;
      }

      setPromoDetails(promo);
      const discount =
        selectedFlight.price.total * numberOfSeats * (promo.percentOff / 100);
      setDiscountAmount(discount);
      setDiscountedTotal(selectedFlight.price.total * numberOfSeats - discount);
    } catch (error) {
      console.error(error);
      setPromoError("Failed to apply promo code. Please try again.");
    }
  };

  const handleCardPayment = async () => {
    try {
      // Initialize Stripe
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

      const stripe = await loadStripe(stripeKey);
      if (!stripe) {
        setBookingError("Failed to initialize Stripe. Please try again.");
        return;
      }

      // Create an items array with price in cents to send to Stripe
      const items = [
        {
          product: {
            name: `${
              selectedFlight.itineraries[0].segments[0].departure.iataCode
            } → ${
              selectedFlight.itineraries[0].segments[
                selectedFlight.itineraries[0].segments.length - 1
              ].arrival.iataCode
            }`,
          },
          quantity: numberOfSeats,
          totalPrice: Math.round(parseFloat(selectedFlight.price.total)), // convert price to cents
        },
      ];
      const convertedPrice = convertPrice(
        parseFloat(selectedFlight.price.total),
        currencyCode,
        "USD"
      );

      // Prepare metadata and other necessary details
      const metadata = {
        flightID: `${Math.random().toString(36).substr(2, 9)}`,
        from: selectedFlight.itineraries[0].segments[0].departure.iataCode,
        to: selectedFlight.itineraries[0].segments[
          selectedFlight.itineraries[0].segments.length - 1
        ].arrival.iataCode,
        departureDate: selectedFlight.itineraries[0].segments[0].departure.at,
        arrivalDate:
          selectedFlight.itineraries[0].segments[
            selectedFlight.itineraries[0].segments.length - 1
          ].arrival.at,
        price: convertedPrice,
        numberOfTickets: numberOfSeats,
        type: selectedFlight.itineraries[1] ? "Round Trip" : "One Way",
        returnDepartureDate: selectedFlight.itineraries[1]
          ? selectedFlight.itineraries[1].segments[0].departure.at
          : undefined,
        returnArrivalDate: selectedFlight.itineraries[1]
          ? selectedFlight.itineraries[1].segments[
              selectedFlight.itineraries[1].segments.length - 1
            ].arrival.at
          : undefined,
        seatType: seatType,
        flightType: `${selectedFlight.itineraries[0].segments[0].carrierCode} ${selectedFlight.itineraries[0].segments[0].number}`,
        flightTypeReturn: selectedFlight.itineraries[1]
          ? selectedFlight.itineraries[1].segments[0].carrierCode +
            " " +
            selectedFlight.itineraries[1].segments[0].number
          : undefined,
      };

      // Make the request to create the checkout session
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/create-flight-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            metadata,
            items,
            returnLocation: "http://localhost:3000/flights",
            currency: currencyCode,
            discountPercentage: promoDetails ? promoDetails.percentOff : 0,
          }),
        }
      );

      if (!response.ok) {
        setBookingError("Failed to create checkout session. Please try again.");
        throw new Error("Failed to create checkout session");
      }

      // Get session ID from the response
      const { id: sessionId } = await response.json();
      console.log("Stripe session ID:", sessionId);

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({ sessionId });
      if (result.error) {
        setBookingError(result.error.message);
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Error in Stripe checkout:", error);
    }
  };

  const handleBookNow = async () => {
    try {
      const success = searchParams.get("success");

      if (success === "true") {
        if (bookingProcessedRef.current) {
          console.log("Booking already processed");
          return;
        }

        bookingProcessedRef.current = true;
        const sessionId = searchParams.get("session_id");
        const flightID = searchParams.get("flightID");
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const departureDate = searchParams.get("departureDate");
        const arrivalDate = searchParams.get("arrivalDate");
        const price = searchParams.get("price");
        const numberOfTickets = searchParams.get("numberOfTickets");
        const type = searchParams.get("type");
        const returnDepartureDate = searchParams.get("returnDepartureDate");
        const returnArrivalDate = searchParams.get("returnArrivalDate");
        const seatType = searchParams.get("seatType");
        const flightType = searchParams.get("flightType");
        const flightTypeReturn = searchParams.get("flightTypeReturn");
        const discountPercentage = searchParams.get("discountPercentage");

        console.log(flightID);

        if (sessionId) {
          try {
            const response = await axios.get(
              `https://trip-genie-apis.vercel.app/check-payment-status?session_id=${sessionId}`
            );

            console.log("Payment status response:", response.data);
            if (response.data.status === "paid") {
              const token = Cookies.get("jwt");
              const convertedPrice = convertPrice(
                parseFloat(
                  discountPercentage === 0
                    ? price * numberOfTickets
                    : price * numberOfTickets * (1 - discountPercentage / 100)
                ),
                currencyCode,
                "USD"
              );
              const response = await fetch(
                "https://trip-genie-apis.vercel.app/tourist/book-flight",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    paymentType: "CreditCard",
                    flightID: flightID,
                    from: from,
                    to: to,
                    departureDate: departureDate,
                    arrivalDate: arrivalDate,
                    price: convertedPrice,
                    numberOfTickets: numberOfTickets,
                    type: type,
                    returnDepartureDate: returnDepartureDate
                      ? returnDepartureDate
                      : undefined,
                    returnArrivalDate: returnArrivalDate
                      ? returnArrivalDate
                      : undefined,
                    seatType: seatType,
                    flightType: flightType,
                    flightTypeReturn: flightTypeReturn
                      ? flightTypeReturn
                      : undefined,
                  }),
                }
              );

              if (!response.ok) {
                setBookingError("Booking Failed. Please try again.");
                throw new Error("Failed to book the flight");
              }

              setIsBookingConfirmationOpen({
                open: true,
                paymentMethod: "CreditCard",
                price,
                wallet: tourist?.wallet,
              });
              searchParams.delete("success");
              searchParams.delete("session_id");
              searchParams.delete("flightID");
              searchParams.delete("from");
              searchParams.delete("to");
              searchParams.delete("departureDate");
              searchParams.delete("arrivalDate");
              searchParams.delete("price");
              searchParams.delete("numberOfTickets");
              searchParams.delete("type");
              searchParams.delete("returnDepartureDate");
              searchParams.delete("returnArrivalDate");
              searchParams.delete("seatType");
              searchParams.delete("flightType");
              searchParams.delete("flightTypeReturn");

              const newUrl = `${window.location.pathname}`;

              window.history.replaceState(null, "", newUrl);
              return;
            }
          } catch (error) {
            console.error("Error checking payment status:", error);
          }
        }

        return;
      }

      if (paymentMethod === "CreditCard" && !success) {
        handleCardPayment();
        return;
      }

      if (paymentMethod === "Wallet") {
        const token = Cookies.get("jwt");

        const convertedPrice = convertPrice(
          parseFloat(
            discountedTotal === 0
              ? selectedFlight.price.total * numberOfSeats
              : discountedTotal
          ),
          currencyCode,
          "USD"
        );
        const response = await fetch(
          "https://trip-genie-apis.vercel.app/tourist/book-flight",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              paymentType: paymentMethod,
              flightID: `${Math.random().toString(36).substr(2, 9)}`,
              from: selectedFlight.itineraries[0].segments[0].departure
                .iataCode,
              to: selectedFlight.itineraries[0].segments[
                selectedFlight.itineraries[0].segments.length - 1
              ].arrival.iataCode,
              departureDate:
                selectedFlight.itineraries[0].segments[0].departure.at,
              arrivalDate:
                selectedFlight.itineraries[0].segments[
                  selectedFlight.itineraries[0].segments.length - 1
                ].arrival.at,
              price: convertedPrice,
              numberOfTickets: numberOfSeats,
              type: selectedFlight.itineraries[1] ? "Round Trip" : "One Way",
              returnDepartureDate: selectedFlight.itineraries[1]
                ? selectedFlight.itineraries[1].segments[0].departure.at
                : undefined,
              returnArrivalDate: selectedFlight.itineraries[1]
                ? selectedFlight.itineraries[1].segments[
                    selectedFlight.itineraries[1].segments.length - 1
                  ].arrival.at
                : undefined,
              seatType: seatType,
              flightType:
                selectedFlight.itineraries[0].segments[0].carrierCode +
                " " +
                selectedFlight.itineraries[0].segments[0].number,
              flightTypeReturn: selectedFlight.itineraries[1]
                ? selectedFlight.itineraries[1].segments[0].carrierCode
                : undefined,
            }),
          }
        );

        if (!response.ok) {
          setBookingError("Insufficient funds. Please try again.");
          throw new Error("Failed to book the flight");
        }

        const data = await response.json();
        console.log("Booking successful:", data);
        setIsBookingConfirmationOpen({
          open: true,
          paymentMethod,
          price: isBookingConfirmationOpen,
          wallet: tourist?.wallet,
        });
      }
    } catch (error) {
      console.error("Booking error:", error);
    }
  };

  const getUserRole = () => {
    let role = Cookies.get("role");
    if (!role) role = "guest";
    return role;
  };

  const fetchExchangeRates = async () => {
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

  const fetchCurrencies = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/currencies",
        {
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

  const guideSteps = [
    {
      target: "body",
      content:
        "Welcome to the flight booking page! Here, you can search for flights, view flight details, and book your flight tickets.",
      placement: "center",
    },
    {
      target: ".search",
      content:
        "Please enter your departure and arrival times, select the departure and arrival airports, and specify the type of ticket to proceed with your booking!",
      placement: "bottom",
    },
    {
      target: ".searchButton",
      content:
        "Click on the 'Search Flights' button to view the available flights based on your search criteria.",

      placement: "left",
    },
    {
      target: ".seeDetails",
      content:
        "Click on the 'Book Now' button to view the details of the selected flight, Enter your personal data and to finally choose your payment method before confirming your flight booking!.",
      placement: "bottom",
    },
  ];

  async function refreshToken() {
    try {
      const API_KEY = import.meta.env.VITE_AMADEUS_API_KEY;
      const API_SECRET = import.meta.env.VITE_AMADEUS_API_SECRET;
      const response = await fetch(
        "https://test.api.amadeus.com/v1/security/oauth2/token",
        {
          method: "POST",
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
  }

  const getCurrencyCode = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/currencies/code",
        {
          method: "GET",
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
  };

  useEffect(() => {
    Promise.all([
      refreshToken(),
      getCurrencyCode(),
      fetchExchangeRates(),
      fetchCurrencies(),
    ]);
  }, []);

  // convert price that takes any currency and converts it to any currency using exchange rates
  const convertPrice = (price, fromCurrency, toCurrency) => {
    if (!exchangeRates || !fromCurrency || !toCurrency) {
      return price;
    }
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    return ((price * toRate) / fromRate).toFixed(2);
  };

  const handleSearch = async () => {
    if (returnDate && new Date(returnDate) < new Date(departureDate)) {
      setError("Return date cannot be before departure date.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${from}&destinationLocationCode=${to}&departureDate=${departureDate}${
          tripType === "roundTrip" ? `&returnDate=${returnDate}` : ""
        }&adults=1&nonStop=true&currencyCode=${currencyCode}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch flights");
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        setError("No flights found for your search criteria.");
        setFlights([]);
      } else {
        setFlights(data.data);
        setCurrentPage(1);
        const prices = data.data.map((flight) =>
          parseFloat(flight.price.total)
        );
        setMaxPrice(Math.max(...prices));
      }
    } catch (err) {
      setError("Failed to fetch flights. Please try again later.");
      setFlights([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterFlights = (flights) => {
    let filtered = [...flights];

    if (priceFilter !== "all") {
      filtered = filtered.filter((flight) => {
        const price = parseFloat(flight.price.total);
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

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "price":
          aValue = parseFloat(a.price.total);
          bValue = parseFloat(b.price.total);
          break;
        case "departure":
          aValue = new Date(a.itineraries[0].segments[0].departure.at);
          bValue = new Date(b.itineraries[0].segments[0].departure.at);
          break;
        case "arrival":
          aValue = new Date(
            a.itineraries[0].segments[
              a.itineraries[0].segments.length - 1
            ].arrival.at
          );
          bValue = new Date(
            b.itineraries[0].segments[
              b.itineraries[0].segments.length - 1
            ].arrival.at
          );
          break;
        default:
          aValue = parseFloat(a.price.total);
          bValue = parseFloat(b.price.total);
      }
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  };

  const paginatedFlights = filterFlights(flights).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filterFlights(flights).length / itemsPerPage);

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleOpenDialog = (flight) => {
    setSelectedFlight(flight);
    setIsDialogOpen(true);
    if (mainContentRef.current) {
      mainContentRef.current.inert = true;
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setBookingError("");
    if (mainContentRef.current) {
      mainContentRef.current.inert = false;
    }
  };

  const handleCloseAllPopups = () => {
    setIsBookingConfirmationOpen(false);
    setIsDialogOpen(false);
    if (mainContentRef.current) {
      mainContentRef.current.inert = false;
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const handleDepartureDateChange = (e) => {
    const selectedDate = e.target.value;
    setDepartureDate(selectedDate);
  };

  return (
    <div className="bg-gray-100">
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>
      <div className="h-16"></div>

      <div className="bg-gray-100 min-h-screen mx-auto px-24">
        <div ref={mainContentRef}>
          <h1 className="text-5xl font-bold text-[#1A3B47]">Flight Booking</h1>
          <div className="h-10"></div>

          <div className="mx-auto mb-12 search">
            <div style={styles.container}>
              <div style={styles.formContainer}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch();
                  }}
                  style={styles.form}
                >
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>TRIP TYPE</label>
                    <select
                      style={styles.select}
                      value={tripType}
                      onChange={(e) => setTripType(e.target.value)}
                    >
                      <option value="roundTrip">Round Trip</option>
                      <option value="oneWay">One Way</option>
                    </select>
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>FROM</label>
                    <select
                      style={styles.select}
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      required
                    >
                      {airports.map((airport) => (
                        <option key={airport.code} value={airport.code}>
                          {airport.name} ({airport.code}) - {airport.region}
                        </option>
                      ))}
                    </select>
                    {renderLocationDisplay(from)}
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>TO</label>
                    <select
                      style={styles.select}
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      required
                    >
                      {airports.map((airport) => (
                        <option key={airport.code} value={airport.code}>
                          {airport.name} ({airport.code}) - {airport.region}
                        </option>
                      ))}
                    </select>
                    {renderLocationDisplay(to)}
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>DEPARTURE</label>
                    <div style={{ position: "relative" }}>
                      <Input
                        id="departureDate"
                        type="date"
                        style={styles.input}
                        value={departureDate}
                        onChange={handleDepartureDateChange}
                        min={today}
                        required
                      />
                    </div>
                    <div style={styles.locationDisplay}>
                      {new Date(departureDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                  </div>

                  {tripType === "roundTrip" && (
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>RETURN</label>
                      <div style={{ position: "relative" }}>
                        <Input
                          id="returnDate"
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          min={departureDate || today}
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.locationDisplay}>
                        {new Date(returnDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                    </div>
                  )}
                  <button
                    style={styles.button}
                    disabled={isLoading}
                    className="bg-[#1A3B47] text-white font-semibold px-8 searchButton"
                  >
                    {isLoading ? "Searching..." : "Search Flights"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="bg-red-50 border-red-200 mr-24 ml-24 w-200"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div className="flex flex-col space-y-1">
                  <AlertTitle className="text-red-600 font-semibold text-lg">
                    Error
                  </AlertTitle>
                  <AlertDescription className="text-red-700 text-sm">
                    {error}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {flights.length > 0 && (
            <div className="space-y-4 mt-3">
              <div className="flex flex-wrap gap-3 justify-between items-center">
                <div className="flex gap-3">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] border-amber-400">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="departure">Departure Time</SelectItem>
                      <SelectItem value="arrival">Arrival Time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setSortOrder((order) =>
                        order === "asc" ? "desc" : "asc"
                      )
                    }
                    className="flex gap-2 border-amber-400"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortOrder.toUpperCase()}
                  </Button>
                </div>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="w-[160px] border-amber-400">
                    <SelectValue placeholder="Filter by price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under25">
                      Under {currencySymbol}
                      {Math.floor(0.25 * maxPrice)}
                    </SelectItem>
                    <SelectItem value="under50">
                      Under {currencySymbol}
                      {Math.floor(0.5 * maxPrice)}
                    </SelectItem>
                    <SelectItem value="under75">
                      Under {currencySymbol}
                      {Math.floor(0.75 * maxPrice)}
                    </SelectItem>
                    <SelectItem value="over75">
                      Over {currencySymbol}
                      {Math.floor(0.75 * maxPrice)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className=" gap-3">
                {paginatedFlights.map((flight, index) => (
                  <Card key={index} className="p-6 mb-4">
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-lg">
                        <span className="font-semibold text-[#1A3B47]">
                          Flight Number
                        </span>
                        <span className="text-base ml-1 text-[#5D9297]">
                          {flight.itineraries[0].segments[0].carrierCode}{" "}
                          {flight.itineraries[0].segments[0].number}
                        </span>
                      </div>
                      <span className="text-4xl font-bold text-[#1A3B47]">
                        {currencySymbol}
                        {flight.price.total}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <div
                        className={`mb-6 ${
                          !flight.itineraries[1] ? "justify-center" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Depart</div>
                            <div className="text-3xl font-bold text-[#1A3B47]">
                              {new Date(
                                flight.itineraries[0].segments[0].departure.at
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(
                                flight.itineraries[0].segments[0].departure.at
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {
                                flight.itineraries[0].segments[0].departure
                                  .iataCode
                              }
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col items-center mx-4">
                            <div className="w-full flex items-center gap-2">
                              <PlaneTakeoff className="h-5 w-5 text-[#388A94] shrink-0 mb-1" />
                              <div className="w-full border-t-2 border-dashed border-[#388A94] relative">
                                <span className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white px-2">
                                  {calculateDuration(
                                    flight.itineraries[0].segments[0].departure
                                      .at,
                                    flight.itineraries[0].segments[
                                      flight.itineraries[0].segments.length - 1
                                    ].arrival.at
                                  )}
                                </span>
                              </div>
                              <PlaneLanding className="h-5 w-5 text-[#388A94] shrink-0 mb-1" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Arrive</div>
                            <div className="text-3xl font-bold text-[#1A3B47]">
                              {new Date(
                                flight.itineraries[0].segments[
                                  flight.itineraries[0].segments.length - 1
                                ].arrival.at
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(
                                flight.itineraries[0].segments[
                                  flight.itineraries[0].segments.length - 1
                                ].arrival.at
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {
                                flight.itineraries[0].segments[
                                  flight.itineraries[0].segments.length - 1
                                ].arrival.iataCode
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                      {flight.itineraries[1] && (
                        <div className="pt-6 border-t">
                          {/* Return trip information */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-500">
                                Depart
                              </div>
                              <div className="text-3xl font-bold text-[#1A3B47]">
                                {new Date(
                                  flight.itineraries[1].segments[0].departure.at
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(
                                  flight.itineraries[1].segments[0].departure.at
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {
                                  flight.itineraries[1].segments[0].departure
                                    .iataCode
                                }
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center mx-4">
                              <div className="w-full flex items-center gap-2">
                                <PlaneTakeoff className="h-5 w-5 text-[#388A94] shrink-0 mb-1" />
                                <div className="w-full border-t-2 border-dashed border-[#388A94] relative">
                                  <span className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white px-2">
                                    {calculateDuration(
                                      flight.itineraries[1].segments[0]
                                        .departure.at,
                                      flight.itineraries[1].segments[
                                        flight.itineraries[1].segments.length -
                                          1
                                      ].arrival.at
                                    )}
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
                                  flight.itineraries[1].segments[
                                    flight.itineraries[1].segments.length - 1
                                  ].arrival.at
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(
                                  flight.itineraries[1].segments[
                                    flight.itineraries[1].segments.length - 1
                                  ].arrival.at
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {
                                  flight.itineraries[1].segments[
                                    flight.itineraries[1].segments.length - 1
                                  ].arrival.iataCode
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-6 space-y-0">
                        <div className="flex bg-gray-100 px-4 py-2 rounded-md">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Ticket className="h-6 w-6" />
                            <span>
                              Show e-tickets and passenger identities during
                              check-in
                            </span>
                          </div>
                          <div className="border-l-2 border-gray-300 h-9 mx-4"></div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-6 w-6" />
                            <span>
                              Please be at the boarding gate at least 30 minutes
                              before boarding time
                            </span>
                          </div>
                        </div>
                        <Button
                          className="bg-[#388A94] hover:bg-[#2e6b77] text-lg text-white seeDetails ml-2 px-16 pt-4 pb-4"
                          onClick={() => handleOpenDialog(flight)}
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-8 flex justify-center items-center space-x-4">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="icon"
                  className="text-[#1A3B47] border-[#1A3B47]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-[#1A3B47]">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="icon"
                  className="text-[#1A3B47] border-[#1A3B47]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-[425px] bg-white max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Flight Details</DialogTitle>
              <DialogDescription>
                Complete information about the selected flight.
              </DialogDescription>
            </DialogHeader>
            {selectedFlight && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Outbound Flight</h4>
                {selectedFlight.itineraries[0].segments.map(
                  (segment, index) => (
                    <div key={index} className="mb-2">
                      <p>
                        From: {segment.departure.iataCode} at{" "}
                        {formatDateTime(segment.departure.at)}
                      </p>
                      <p>
                        To: {segment.arrival.iataCode} at{" "}
                        {formatDateTime(segment.arrival.at)}
                      </p>
                      <p>
                        Flight: {segment.carrierCode} {segment.number}
                      </p>
                    </div>
                  )
                )}
                {selectedFlight.itineraries[1] && (
                  <>
                    <h4 className="font-semibold mb-2 mt-4">Return Flight</h4>
                    {selectedFlight.itineraries[1].segments.map(
                      (segment, index) => (
                        <div key={index} className="mb-2">
                          <p>
                            From: {segment.departure.iataCode} at{" "}
                            {formatDateTime(segment.departure.at)}
                          </p>
                          <p>
                            To: {segment.arrival.iataCode} at{" "}
                            {formatDateTime(segment.arrival.at)}
                          </p>
                          <p>
                            Flight: {segment.carrierCode} {segment.number}
                          </p>
                        </div>
                      )
                    )}
                  </>
                )}
                <h4 className="font-semibold mt-4">Price Details</h4>
                <p>
                  Total:{" "}
                  {discountedTotal === 0
                    ? selectedFlight.price.total * numberOfSeats
                    : discountedTotal}{" "}
                  {selectedFlight.price.currency}
                </p>
                <div className="space-y-4 mt-4">
                  <Select
                    value={numberOfSeats.toString()}
                    onValueChange={(value) => setNumberOfSeats(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Number of Seats" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "Seat" : "Seats"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={seatType} onValueChange={setSeatType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seat Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Economy">Economy</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="First Class">First Class</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-1 gap-4">
                    <Label htmlFor="promoCode" className="font-semibold mt-4">
                      Promo Code
                    </Label>
                    <Input
                      id="promoCode"
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <Button
                      onClick={handlePromoSubmit}
                      className="bg-[#1A3B47] hover:bg-[#1A3B47]/90 text-white"
                    >
                      Apply Promo Code
                    </Button>
                    {promoError && (
                      <div className="text-red-500 text-sm mt-2">
                        {promoError}
                      </div>
                    )}
                    {promoDetails && (
                      <div className="text-green-600 text-sm mt-2">
                        Congratulations! You've saved {promoDetails.percentOff}%
                        on this purchase!
                      </div>
                    )}
                  </div>

                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Wallet" id="Wallet" />
                      <Label htmlFor="Wallet">Wallet</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CreditCard" id="CreditCard" />
                      <Label htmlFor="CreditCard">Credit/Debit Card</Label>
                    </div>
                  </RadioGroup>
                </div>

                {bookingError && (
                  <Alert variant="destructive" className="mt-4">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                      <div className="flex flex-col space-y-1">
                        <AlertTitle className="text-red-600 font-semibold text-lg">
                          Error
                        </AlertTitle>
                        <AlertDescription className="text-red-700 text-sm">
                          {bookingError}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}

                <div className="flex justify-end">
                  <Button
                    className="mt-4 bg-[#388A94] hover:bg-[#1A3B47] text-white"
                    onClick={handleBookNow}
                  >
                    Book Now
                  </Button>
                </div>
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
                Your flight has been booked successfully.
              </DialogDescription>
              {isBookingConfirmationOpen.paymentMethod === "Wallet" && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Label className="text-right">You Paid:</Label>
                  <div>
                    {currencySymbol}
                    {discountedTotal === 0
                      ? selectedFlight.price.total * numberOfSeats
                      : discountedTotal}
                  </div>
                  <Label className="text-right">New Wallet Balance:</Label>
                  <div>
                    {currencySymbol}
                    {convertPrice(
                      isBookingConfirmationOpen.wallet,
                      "USD",
                      currencyCode
                    ) -
                      (discountedTotal === 0
                        ? selectedFlight.price.total * numberOfSeats
                        : discountedTotal)}
                  </div>
                </div>
              )}
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
      {(getUserRole() === "guest" || getUserRole() === "tourist") && (
        <UserGuide steps={guideSteps} pageName="flight" />
      )}
    </div>
  );
}

export default BookingPage;
