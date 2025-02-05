import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import {
  Star,
  Clock,
  Accessibility,
  Globe,
  MapPin,
  Calendar,
  Eye,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Loader from "@/components/Loader";
import defaultImage from "@/assets/images/default-image.jpg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const ItineraryCard = ({ booking, onSelect, userInfo, exchangeRates }) => {
  const itinerary = booking.itinerary;

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
      onClick={() => onSelect(booking)}
    >
      <div className="relative h-36 w-36 shrink-0 rounded-sm">
        <img
          src={itinerary.activities?.[0]?.pictures?.[0]?.url || defaultImage}
          alt={itinerary.title}
          className="object-cover w-full h-full rounded-sm"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1">
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

        <div className="mt-2 flex items-center justify-between">
          <div className="text-xl font-bold text-[#1A3B47]">
            {getFormattedPrice(booking.paymentAmount)}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="bg-[#388A94] hover:bg-[#2e6b77]"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(booking);
              }}
            >
              View Details
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
            <div className="w-4/5 pl-11 pr-11 pt-1 pb-1  h-5 bg-gray-300 rounded-sm animate-pulse" />{" "}
            {/* Increased width */}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 p-2 bg-gray-300 rounded-full animate-pulse" />
            <div className="w-4/5 h-5 pl-11 pr-11 pt-1 pb-1 bg-gray-300 rounded-sm animate-pulse " />{" "}
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
          </div>
        </div>
      </div>
    </Card>
  );
};
const SkeletonDialog = () => {
  return (
    <Dialog>
      <DialogContent className="sm:max-w-[400px] bg-white rounded-lg shadow-lg p-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#1A3B47]">
            <div className="w-2/3 h-6 bg-gray-300 rounded-sm animate-pulse" />
            <div className="w-1/2 h-8 bg-gray-300 rounded-sm animate-pulse mt-2" />
          </DialogTitle>
        </DialogHeader>

        <div className="border-t border-gray-200 pt-4">
          {/* Name and Booking ID */}
          <div className="flex justify-between items-center mb-3">
            <div className="w-2/3 h-4 bg-gray-300 rounded-sm animate-pulse" />
            <div className="w-1/4 h-4 bg-gray-300 rounded-sm animate-pulse" />
          </div>

          {/* Date & Time and Paid Via */}
          <div className="flex justify-between items-center mb-3">
            <div className="w-2/3 h-4 bg-gray-300 rounded-sm animate-pulse" />
            <div className="w-1/3 h-4 bg-gray-300 rounded-sm animate-pulse" />
          </div>

          {/* Tickets and Total Price */}
          <div className="flex items-center justify-between border-t border-gray-200 mt-4 pt-4">
            <div className="w-1/4 h-6 bg-gray-300 rounded-sm animate-pulse" />
            <div className="w-1/4 h-6 bg-gray-300 rounded-sm animate-pulse" />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          {/* Thank You Message */}
          <div className="w-1/2 h-4 bg-gray-300 rounded-sm animate-pulse mb-4" />
          {/* Reminder and Info */}
          <div className="w-2/3 h-4 bg-gray-300 rounded-sm animate-pulse" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const fetchData = async (userRole, dataType) => {
  try {
    const response = await axios.get(
      `http://localhost:4000/${userRole}/${dataType}`,
      {
        headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return [];
    }
    console.error(`Error fetching ${dataType}:`, error);
    throw error;
  }
};

export default function TouristAttendedItineraries() {
  const [userRole, setUserRole] = useState(Cookies.get("role") || "guest");
  const [itineraries, setItineraries] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [tourist, setTourist] = useState(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
        const currencyId = response.data.preferredCurrency;
        setTourist(response.data);

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

  useEffect(() => {
    const role = Cookies.get("role") || "guest";
    setUserRole(role);

    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [itinerariesData] = await Promise.all([
          fetchData(role, "touristItineraryAttendedBookings"),
        ]);
        setItineraries(itinerariesData);
        await fetchUserInfo();
        await fetchExchangeRates();
      } catch (err) {
        setError("An error occurred while fetching data");
      } finally {
        setTimeout(() => setIsLoading(false), 1000);
      }
    };

    fetchAllData();
  }, [fetchUserInfo, fetchExchangeRates]);

  const handleItinerarySelect = (booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleReviewClick = async (id) => {
    try {
      // fetch the activity from the backend
      const response = await axios.get(
        `http://localhost:4000/tourist/itineraries/${id}`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );

      if (response.status === 200) {
        navigate(`/itinerary/${id}`);
      } else {
        setIsReviewDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
      setIsReviewDialogOpen(true);
    }
  };

  const getFormattedPrice = (price) => {
    if (!userInfo || !exchangeRates) return `$${price.toFixed(2)}`;

    const baseRate = exchangeRates[selectedBooking?.itinerary.currency] || 1;
    const targetRate = exchangeRates[userInfo.preferredCurrency.code] || 1;
    const exchangedPrice = (price / baseRate) * targetRate;

    return `${userInfo.preferredCurrency.symbol}${exchangedPrice.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100 min-h-screen">
        {/* <h1 className="text-3xl font-bold mb-2">Attended Itineraries</h1>
        <p className="text-sm text-gray-500 mb-2">Itineraries / Attended</p>
   */}
        <Toaster />
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Render Skeletons for Cards */}
            {[...Array(4)].map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>

          {/* Skeleton for Dialog */}
          <SkeletonDialog />
        </div>
      </div>
    );
  }

  if (error) return <div>{error}</div>;

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* <h1 className="text-3xl font-bold mb-2">Attended Itineraries</h1>
        <p className="text-sm text-gray-500 mb-2">Itineraries / Attended</p>
         */}
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        {itineraries.length === 0 ? (
          <div className="text-center space-y-4 py-12">
            <h2 className="text-2xl font-semibold text-gray-600">
              No attended itineraries yet
            </h2>
            <p className="text-gray-500">
              Your attended itineraries will appear here once you've completed
              them.
            </p>
            <Button
              size="lg"
              variant="default"
              className="mt-4 bg-[#388A94] text-white"
              onClick={() => navigate("/all-itineraries")}
            >
              Start Booking
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {itineraries.map((booking) => (
              <ItineraryCard
                key={booking._id}
                booking={booking}
                onSelect={handleItinerarySelect}
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
                {selectedBooking?.itinerary.title}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Booking ID:{" "}
                <span className=" font-semibold">
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
                {new Date(selectedBooking?.date).toLocaleDateString("en-US", {
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
                {new Date(selectedBooking?.date).toLocaleTimeString("en-US", {
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
              <p className="text-xl font-semibold text-gray-600">Total Price</p>
              <p className="text-2xl font-bold text-[#388A94]">
                {getFormattedPrice(selectedBooking?.paymentAmount || 0)}
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
              Thank you for joining the itinerary!
            </p>
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <Info className="h-6 w-6 text-gray-400 mr-1 mb-3" />
              <span>
                We'd love to hear your thoughts!{" "}
                <span
                  className="text-[#388A94] cursor-pointer hover:underline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleReviewClick(selectedBooking?.itinerary._id);
                  }}
                >
                  Please leave a review
                </span>{" "}
                to help us improve.
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[330px] bg-white rounded-lg shadow-lg p-4">
          <DialogHeader>
            <DialogTitle>Activity Deleted</DialogTitle>
            <DialogDescription>
              The activity you are trying to review has been deleted and is no
              longer available.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end">
            <Button
              onClick={() => setIsReviewDialogOpen(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
