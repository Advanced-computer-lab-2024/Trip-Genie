"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { format } from "date-fns";
import {
  Eye,
  Trash2,
  MapPin,
  Clock,
  Car,
  DollarSign,
  Armchair,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import TransportationCard from "@/components/transportationCardUpcoming";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import DeleteConfirmation from "@/components/ui/deletionConfirmation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

const fetchUpcomingBookings = async () => {
  try {
    const response = await axios.get(
      "http://localhost:4000/tourist/upcoming-transportation",
      {
        headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching upcoming bookings:", error);
    throw error;
  }
};

const BookingDetails = ({
  booking,
  isOpen,
  onClose,
  formatPrice,
  tourist,
  onDelete,
}) => {
  if (!booking) return null;

  const formatDate = (date) => {
    return date?.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const departureTime = new Date(booking.transportationID?.timeDeparture);
  const arrivalTime = new Date(
    departureTime.getTime() +
      booking.transportationID?.estimatedDuration * 60 * 1000
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[330px] bg-white rounded-lg shadow-lg p-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#1A3B47]">
            <div>Transportation Details</div>
            <div className="text-[#388A94] text-xl font-bold">
              {booking.transportationID?.from} to {booking.transportationID?.to}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Trip Code:{" "}
              <span className=" font-semibold">
                {booking._id.substring(0, 10) || "N/A"}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Main content */}
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Date */}
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-400">Departure Date</p>
            <p className="text-[#1A3B47] font-semibold text-right">
              {formatDate(departureTime)}
            </p>
          </div>

          {/* Time */}
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-400">Departure Time</p>
            <p className="text-[#1A3B47] font-semibold text-right">
              {departureTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Tourist Information */}
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-400">Recipient</p>
            <div className="text-right">
              <p className="text-[#1A3B47] font-semibold">
                {tourist?.fname || "John"} {tourist?.lname || "Doe"}
              </p>
              <p className="text-[#1A3B47] text-xs">
                {tourist?.email || "john.doe@example.com"}
              </p>
            </div>
          </div>

          {/* Seats Booked */}
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-400">Seats Booked</p>
            <p className="text-[#1A3B47] font-semibold text-right">
              {booking.seatsBooked || "N/A"} Seats
            </p>
          </div>

          {/* Total Price */}
          <div className="flex justify-between items-center border-t border-gray-200 pt-4">
            <p className="text-xl font-semibold text-gray-600">Total Cost</p>
            <p className="text-2xl font-bold text-[#388A94]">
              {formatPrice(booking.totalCost || 0)}
            </p>
          </div>

          {/* Payment Method */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">Payment Method</p>
            <p className="text-[#1A3B47] font-semibold text-right">
              via{" "}
              {booking.paymentMethod === "creditCard" ||
              booking.paymentMethod === "debitCard"
                ? "Credit Card"
                : "Wallet"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 text-center">
          <p className="text-sm text-[#1A3B47] font-medium">
            Thank you for booking with us!
          </p>
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <Info className="h-6 w-6 text-gray-400 mr-1 mb-3" />
            <span>
              Please keep this receipt for your records. Present it upon arrival
              to confirm your booking.
            </span>
          </div>
        </div>

        {/* Cancel Booking Button */}
        <div className="text-center">
          <Button
            size="sm"
            variant="default"
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => {
              onClose();
              onDelete();
            }}
          >
            Cancel Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TransportationCardSkeleton = () => {
  return (
    <div>
      {/* <h1 className="text-3xl font-bold mb-2">Scheduled Transportation</h1>
 <p className="text-sm text-gray-500 mb-2">Transportation / Upcoming</p> */}

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

export default function UpcomingTransportation() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] =
    useState(false);
  const [notificationIconType, setNotificationIconType] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [exchangeRate, setExchangeRate] = useState({});
  const [tourist, setTourist] = useState(null);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [toastMessage, setToastMessage] = useState("");

  const fetchUserInfo = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get("http://localhost:4000/tourist/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const currencyId = response.data.preferredCurrency;

      const response2 = await axios.get(
        `http://localhost:4000/tourist/getCurrency/${currencyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTourist(response.data);
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
        return `${userPreferredCurrency.symbol}${selectedBooking.transportationID?.ticketCost}`;
      } else {
        const exchangedPrice =
          selectedBooking.transportationID?.ticketCost * exchangeRate;
        return `${userPreferredCurrency.symbol}${exchangedPrice.toFixed(2)}`;
      }
    }
  };

  const formatWallet = (price) => {
    if (!tourist || !tourist.wallet) {
      console.log("Tourist or wallet not available.");
      return "Wallet not available";
    }

    const exchangedPrice = price * exchangeRate;
    exchangedPrice.toFixed(2);
    return `${userPreferredCurrency.symbol}${exchangedPrice}`;
  };

  useEffect(() => {
    const loadBookings = async () => {
      setIsLoading(true);
      try {
        const data = await fetchUpcomingBookings();
        fetchUserInfo();
        setBookings(data);
      } catch (err) {
        setError("Failed to load upcoming bookings");
      }
    };

    loadBookings();
  }, []);

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const showNotification = (message, iconType) => {
    setNotificationMessage(message);
    setNotificationIconType(iconType);
    setIsNotificationDialogOpen(true);
  };

  const handleDeleteBooking = (booking) => {
    setSelectedBooking(booking);
    setIsDeleteDialogOpen(true);
    setIsViewDialogOpen(false);
  };

  const showToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setIsToastOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBooking) return;

    try {
      await axios.delete(
        `http://localhost:4000/tourist/transportation-booking/${selectedBooking._id}`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setBookings(
        bookings.filter((booking) => booking._id !== selectedBooking._id)
      );
      setIsDeleteDialogOpen(false);
      const totalPrice = selectedBooking.totalCost; // Ensure paymentAmount is available and numeric
      const formattedTotalPrice = formatPrice(totalPrice);
      const newWalletBalance =
        selectedBooking.paymentMethod === "wallet"
          ? tourist.wallet + totalPrice
          : tourist.wallet;
      const newwallet = tourist.wallet + totalPrice;

      console.log("total price", formatPrice(selectedBooking.totalCost));
      console.log("wallet updated", formatWallet(tourist.wallet + totalPrice));
      console.log("paymentype", selectedBooking.paymentMethod);

      // Update wallet balance if necessary
      if (selectedBooking.paymentMethod === "wallet") {
        tourist.wallet = newWalletBalance;
      }

      // Display success notification with refund details
      showToast(
        "success",
        <>
          <p>Your booking has been successfully cancelled.</p>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Label className="text-right">Amount Refunded:</Label>
              <div>{formattedTotalPrice}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Label className="text-right">New Wallet Balance:</Label>
              <div>{formatWallet(newwallet.toFixed(2))}</div>
            </div>
          </div>
        </>
      );
      fetchUpcomingBookings();
    } catch (error) {
      console.error("Error deleting booking:", error);
      showToast(
        "error",
        "An error occurred while cancelling your booking. Please try again."
      );
    }
  };

  if (isLoading)
    return (
      <div>
        <TransportationCardSkeleton />
      </div>
    );
  if (error) return <div>{error}</div>;

  return (
    <ToastProvider>
      <div>
        {/* <h1 className="text-3xl font-bold mb-2">Scheduled Transportation</h1>
        <p className="text-sm text-gray-500 mb-2">Transportation / Upcoming</p>
     */}
        <div className="container mx-auto px-4 py-8">
          {bookings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bookings.map((booking) => (
                <div key={booking.id}>
                  <TransportationCard
                    booking={booking}
                    displayPrice={formatPrice}
                    tourist={tourist}
                    setSelectedBooking={setSelectedBooking}
                    onClick={() => handleViewBooking(booking)}
                    onDelete={() => handleDeleteBooking(booking)}
                    userPreferredCurrency={userPreferredCurrency}
                    exchangeRate={exchangeRate}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center space-y-4 py-12">
              <h2 className="text-2xl font-semibold text-gray-600">
                No upcoming transportation bookings
              </h2>
              <p className="text-gray-500">Book your next trip now!</p>
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

          {/* Dialog for Booking Details */}
          <BookingDetails
            booking={selectedBooking}
            isOpen={isViewDialogOpen}
            formatPrice={formatPrice}
            onClose={() => setIsViewDialogOpen(false)}
            tourist={tourist}
            onDelete={() => handleDeleteBooking(selectedBooking)}
          />

          {/* Dialog for Cancellation Confirmation */}
          <DeleteConfirmation
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            itemType={`booking`}
            onConfirm={confirmDelete}
            type="cancel"
          />

          {/* Notification Dialog */}
          <Dialog
            open={isNotificationDialogOpen}
            onOpenChange={setIsNotificationDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Notification</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2">
                {notificationIconType === "error" && (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                {notificationIconType === "success" && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                {notificationIconType === "warning" && (
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                )}
                <p>{notificationMessage}</p>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsNotificationDialogOpen(false)}>
                  OK
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ToastViewport className="fixed top-0 right-0 p-4" />
          {isToastOpen && (
            <Toast
              onOpenChange={setIsToastOpen}
              open={isToastOpen}
              duration={5000}
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
        </div>
      </div>
    </ToastProvider>
  );
}
