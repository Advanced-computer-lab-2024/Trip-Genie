import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import {
  Star,
  Clock,
  MapPin,
  Calendar,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Loader from "@/components/Loader";
import defaultImage from "@/assets/images/default-image.jpg";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { Label } from "@/components/ui/label";
import DeleteConfirmation from "@/components/ui/deletionConfirmation";

const ActivityCard = ({
  booking,
  onSelect,
  onDelete,
  userInfo,
  exchangeRates,
}) => {
  const activity = booking.activity;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const navigate = useNavigate();

  const isWithin48Hours = (bookingDate) => {
    const now = new Date();
    const bookingTime = new Date(bookingDate);
    const hoursDifference =
      (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference <= 48;
  };

  const getFormattedPrice = (price) => {
    if (!userInfo || !exchangeRates) return `${price?.toFixed(2)}`;

    const baseRate = exchangeRates[activity.currency] || 1;
    const targetRate = exchangeRates[userInfo.preferredCurrency.code] || 1;
    const exchangedPrice = (price / baseRate) * targetRate;

    return `${userInfo.preferredCurrency.symbol}${exchangedPrice?.toFixed(2)}`;
  };

  return (
    <Card
      className="group relative flex items-center gap-4 p-2 transition-all hover:shadow-lg cursor-pointer"
      onClick={() => navigate(`/activity/${booking.activity._id}`)}
    >
      <div className="relative h-36 w-36 shrink-0 rounded-sm">
        <img
          src={activity.pictures?.[0]?.url || defaultImage}
          alt={activity.name}
          className="object-cover w-full h-full rounded-sm"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-[#1A3B47]">{activity.name}</h3>
            <div className="flex items-start text-sm text-[#5D9297] font-semibold pt-1">
              <div className="flex-shrink-0 h-4 w-4 flex items-center justify-center mr-1">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="leading-tight">
                {activity.location?.address || "Location not available"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-base">
            <Star className="h-6 w-6 fill-[#F88C33] text-[#F88C33]" />
            <span className="text-[#F88C33]">
              {activity.rating?.toFixed(1) || "0.0"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-[#5D9297]">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-[#5D9297]" />
            <span>
              {activity.duration === 1
                ? "1 hour"
                : `${activity.duration} hours`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-[#5D9297]" />
            <span>{new Date(activity.timing).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-xl font-bold text-[#1A3B47]">
            {getFormattedPrice(booking.paymentAmount)}
          </div>
          <div className="flex gap-2">
            {!isWithin48Hours(booking.activity.timing) && (
              <Button
                size="sm"
                variant="default"
                className="bg-red-500 hover:bg-red-600 text-white font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(booking);
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              variant="default"
              className="bg-[#388A94] hover:bg-[#2e6b77]"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(booking);
              }}
            >
              View
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

export default function BookedActivities() {
  const [bookedActivities, setBookedActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [toastMessage, setToastMessage] = useState("");
  const [tourist, setTourist] = useState(null);
  const navigate = useNavigate();

  const isWithin48Hours = (bookingDate) => {
    const now = new Date();
    const bookingTime = new Date(bookingDate);
    const hoursDifference =
      (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference <= 48;
  };

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:4000/rates");
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
        const response = await axios.get("http://localhost:4000/tourist/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTourist(response.data);
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

  const fetchBookedActivities = useCallback(async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "http://localhost:4000/tourist/touristActivityBookings",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBookedActivities(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching booked activities:", error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserInfo();
    fetchExchangeRates();
    fetchBookedActivities();
  }, [fetchUserInfo, fetchExchangeRates, fetchBookedActivities]);

  const handleActivitySelect = (booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleDeleteBooking = (booking) => {
    setSelectedBooking(booking);
    setIsDeleteDialogOpen(true);
  };

  const showToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setIsToastOpen(true);
  };

  const formatPrice = (price) => {
    if (!userInfo || !exchangeRates) return `${price?.toFixed(2)}`;
    const baseRate = exchangeRates[selectedBooking?.activity.currency] || 1;
    const targetRate = exchangeRates[userInfo.preferredCurrency?.code] || 1;
    const exchangedPrice = (price / baseRate) * targetRate;
    return `${userInfo.preferredCurrency?.symbol}${exchangedPrice?.toFixed(2)}`;
  };

  const confirmDelete = async () => {
    if (!selectedBooking) return;

    const bookingDate = new Date(selectedBooking.activity.timing);
    const now = new Date();
    const hoursDifference =
      (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 48) {
      showToast(
        "error",
        "Bookings can only be cancelled 48 hours or more before the event starts."
      );
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:4000/tourist/activityBooking/${selectedBooking._id}`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );

      setBookedActivities((prev) =>
        prev.filter((booking) => booking._id !== selectedBooking._id)
      );

      console.log(response.data);

      const { wallet } = response.data;
      const formattedRefundAmount = formatPrice(selectedBooking.paymentAmount);
      const formattedNewBalance = formatPrice(wallet);

      showToast(
        "success",
        <>
          <div>Your booking has been successfully cancelled.</div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Label className="text-right">Amount Refunded:</Label>
            <div>{formattedRefundAmount}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Label className="text-right">New Wallet Balance:</Label>
            <div>{formattedNewBalance}</div>
          </div>
        </>
      );
    } catch (error) {
      console.error("Error deleting booking:", error);
      showToast(
        "error",
        "An error occurred while cancelling your booking. Please try again."
      );
    }

    setIsDeleteDialogOpen(false);
  };

  return (
    <ToastProvider>
      <div className="bg-gray-100 min-h-screen">
        {/* <h1 className="text-3xl font-bold mb-2">Upcoming Activities</h1> */}
        {/* <p className="text-sm text-gray-500 mb-2">Activities / Upcoming</p>
         */}
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Render Skeletons for Cards */}
              {[...Array(4)].map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          ) : bookedActivities.length === 0 ? (
            <div className="text-center space-y-4 py-12">
              <h2 className="text-2xl font-semibold text-gray-600">
                No attended events yet
              </h2>
              <p className="text-gray-500">
                Start booking your activities to see the world!
              </p>
              <Button
                size="lg"
                variant="default"
                className="mt-4 bg-[#388A94] text-white"
                onClick={() => navigate("/activity")}
              >
                Start Booking
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {bookedActivities.map((booking) => (
                <ActivityCard
                  key={booking._id}
                  booking={booking}
                  onSelect={handleActivitySelect}
                  onDelete={handleDeleteBooking}
                  userInfo={userInfo}
                  exchangeRates={exchangeRates}
                />
              ))}
            </div>
          )}
        </div>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[330px] bg-white rounded-lg shadow-lg p-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-[#1A3B47]">
                <div>Booking Receipt for</div>
                <div className="text-[#388A94] text-xl font-bold">
                  {selectedBooking?.activity.name}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Booking ID:{" "}
                  <span className="font-semibold">
                    {selectedBooking?._id
                      ? selectedBooking._id.substring(0, 10)
                      : "AB123456"}
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Main content */}
            <div className="border-t border-gray-200 pt-4 space-y-4">
              {/* Date */}
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-400">Date</p>
                <p className="text-[#1A3B47] font-semibold text-right">
                  {new Date(
                    selectedBooking?.activity.timing
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Time */}
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-400">Time</p>
                <p className="text-[#1A3B47] font-semibold text-right">
                  {new Date(
                    selectedBooking?.activity.timing
                  ).toLocaleTimeString("en-US", {
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

              {/* Tickets Booked */}
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-400">
                  Tickets Booked
                </p>
                <p className="text-[#1A3B47] font-semibold text-right">
                  {selectedBooking?.numberOfTickets || "1"} Tickets
                </p>
              </div>

              {/* Total Price */}
              <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                <p className="text-xl font-semibold text-gray-600">
                  Total Price
                </p>
                <p className="text-2xl font-bold text-[#388A94]">
                  {formatPrice(selectedBooking?.paymentAmount || 0)}
                </p>
              </div>

              {/* Payment Method */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">Payment Method</p>
                <p className="text-[#1A3B47] font-semibold text-right">
                  via {selectedBooking?.paymentType || "Credit Card"}
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
                  Please keep this receipt for your records. Present it upon
                  arrival to confirm your booking.
                </span>
              </div>
            </div>

            {/* Cancel Booking Button */}
            <div className="text-center">
              {!isWithin48Hours(selectedBooking?.activity.timing) && (
                <Button
                  size="sm"
                  variant="default"
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleDeleteBooking(selectedBooking);
                  }}
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <DeleteConfirmation
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          itemType={`booking`}
          onConfirm={confirmDelete}
          type="cancel"
        />

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
