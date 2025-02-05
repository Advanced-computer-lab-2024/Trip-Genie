"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Calendar, ChevronRight, MapPin, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import TransportationCard from "@/components/transportationCardAttended";

const fetchData = async (userRole, dataType) => {
  try {
    const response = await axios.get(
      `http://localhost:4000/${userRole}/history-transportation`,
      {
        headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
      }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return [];
    }
    console.error(`Error fetching ${dataType}:`, error);
    throw error;
  }
};

const TransportationCardSkeleton = () => {
  return (
    <div>
      {/* <h1 className="text-3xl font-bold mb-2">Transportation History</h1>
      <p className="text-sm text-gray-500 mb-2">Transportation / Attended</p> */}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(4)
            .fill()
            .map((_, index) => (
              <div
                key={index}
                className="bg-gray-200 rounded-lg shadow-sm border p-4 space-y-4 animate-pulse"
              >
                {/* Departure Section */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start w-1/5">
                    <div className="h-4 w-16 bg-gray-300 rounded"></div>
                    <div className="h-6 w-24 bg-gray-300 rounded mt-2"></div>
                    <div className="flex items-center mt-2">
                      <div className="h-4 w-12 bg-gray-300 rounded"></div>
                    </div>
                  </div>

                  {/* Center Section (Date and Duration) */}
                  <div className="flex flex-col items-center justify-center w-3/5 relative">
                    <div className="absolute h-4 w-24 bg-gray-300 rounded top-1"></div>
                    <div className="absolute h-6 w-28 bg-gray-300 rounded -top-6"></div>
                  </div>

                  {/* Arrival Section */}
                  <div className="flex flex-col items-end w-1/5">
                    <div className="h-4 w-16 bg-gray-300 rounded"></div>
                    <div className="h-6 w-24 bg-gray-300 rounded mt-2"></div>
                    <div className="h-4 w-12 bg-gray-300 rounded mt-2"></div>
                  </div>
                </div>

                {/* Vehicle Type and Price Section */}
                <div className="mt-4 flex justify-between items-center">
                  <div className="h-4 w-32 bg-gray-300 rounded text-center"></div>
                  <div className="flex items-center space-x-4">
                    <div className="h-6 w-16 bg-gray-300 rounded"></div>
                  </div>
                </div>

                {/* Skeleton for Dialog (Popup) Content */}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const BookingDetails = ({ booking, isOpen, onClose, formatPrice }) => {
  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>
            Your transportation booking information
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">From:</span>
            <span className="col-span-3">{booking.transportationID.from}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">To:</span>
            <span className="col-span-3">{booking.transportationID.to}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Vehicle:</span>
            <span className="col-span-3">
              {booking.transportationID.vehicleType}
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Departure:</span>
            <span className="col-span-3">
              {new Date(
                booking.transportationID.timeDeparture
              ).toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Duration:</span>
            <span className="col-span-3">
              {booking.transportationID.estimatedDuration} hours
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Seats:</span>
            <span className="col-span-3">{booking.seatsBooked}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Cost:</span>
            <span className="col-span-3">
              {formatPrice(booking.transportationID.ticketCost)} per ticket
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Total:</span>
            <span className="col-span-3">{formatPrice(booking.totalCost)}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Payment:</span>
            <span className="col-span-3">{booking.paymentMethod}</span>
          </div>
        </div>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default function TouristTransportationHistory() {
  const [userRole, setUserRole] = useState(Cookies.get("role") || "guest");
  const [transportations, setTransportations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [exchangeRate, setExchangeRate] = useState({});
  const [tourist, setTourist] = useState(null);

  const fetchUserInfo = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get("http://localhost:4000/tourist/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const currencyId = response.data.preferredCurrency;
      setTourist(response.data);

      const response2 = await axios.get(
        `http://localhost:4000/tourist/getCurrency/${currencyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserPreferredCurrency(response2.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchExchangeRate = async (booking) => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(`http://localhost:4000/tourist/populate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", // Ensure content type is set to JSON
        },
        body: JSON.stringify({
          base: "67140446ee157ee4f239d523", // Sending base currency ID
          target: userPreferredCurrency._id, // Sending target currency ID
        }),
      });
      // Parse the response JSON
      const data = await response.json();
      console.log(data);

      if (response.ok) {
        setExchangeRate(data.conversion_rate);
      } else {
        // Handle possible errors
        console.error("Error in fetching exchange rate:", data.message);
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (
      userPreferredCurrency &&
      userPreferredCurrency !== "67140446ee157ee4f239d523"
    ) {
      fetchExchangeRate(selectedBooking);
    } else {
      setIsLoading(false);
    }
  }, [userPreferredCurrency, selectedBooking]);

  const formatPrice = (price, type) => {
    if (selectedBooking && userPreferredCurrency) {
      if (userPreferredCurrency === "67140446ee157ee4f239d523") {
        return `${userPreferredCurrency.symbol}${selectedBooking.transportationID.ticketCost}`;
      } else {
        const exchangedPrice =
          selectedBooking.transportationID.ticketCost * exchangeRate;
        return `${userPreferredCurrency.symbol}${exchangedPrice.toFixed(2)}`;
      }
    }
  };

  const handleTransportationClick = (booking) => {
    if (booking.transportationID.isDeleted) {
      return toast({
        title: "Transportation Unavailable",
        description: "This transportation booking no longer exists",
        duration: 3000,
      });
    }
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const role = Cookies.get("role") || "guest";
    setUserRole(role);

    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const transportationsData = await fetchData(
          role,
          "touristTransportationHistory"
        );
        setTransportations(transportationsData);
      } catch (err) {
        setError("An error occurred while fetching data");
      } finally {
      }
    };

    fetchAllData();
    fetchUserInfo();
  }, []);

  if (isLoading)
    return (
      <div>
        <TransportationCardSkeleton />
      </div>
    );
  if (error) return <div>{error}</div>;

  const noBookingsMessage = (
    <div className="text-center py-8">
      <p className="text-xl font-semibold text-gray-600">
        No past transportation bookings
      </p>
      <p className="text-gray-500 mt-2">
        Your completed trips will appear here
      </p>
    </div>
  );

  return (
    <div>
      <Toaster />
      {/* <h1 className="text-3xl font-bold mb-2">Transportation History</h1>
    <p className="text-sm text-gray-500 mb-2">Transportation / Attended</p>
     */}
      <div className="container mx-auto px-4 py-8">
        {transportations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {transportations.map((booking) => (
              <div key={booking.id}>
                <TransportationCard
                  booking={booking}
                  userRole={userRole}
                  displayPrice={formatPrice}
                  tourist={tourist}
                  setSelectedBooking={setSelectedBooking}
                  userPreferredCurrency={userPreferredCurrency}
                  exchangeRate={exchangeRate}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center space-y-4 py-12">
            <h2 className="text-2xl font-semibold text-gray-600">
              No past transportation bookings
            </h2>
            <p className="text-gray-500">
              Your completed trips will appear here.
            </p>
            <Button
              size="lg"
              variant="default"
              className="mt-4 bg-[#388A94] text-white"
              onClick={() => navigate("/transportation")}
            >
              Start Booking
            </Button>
          </div>
        )}

        <BookingDetails
          booking={selectedBooking}
          isOpen={isDialogOpen}
          formatPrice={formatPrice}
          onClose={() => setIsDialogOpen(false)}
        />
      </div>
    </div>
  );
}
