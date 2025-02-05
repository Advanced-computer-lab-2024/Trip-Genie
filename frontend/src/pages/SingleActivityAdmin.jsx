import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { formatDistanceToNow, format } from "date-fns";
import Map from "../components/Map";
import axios from "axios";
import Loader from "../components/Loader";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import signUpPicture from "../assets/images/signUpPicture.jpeg";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  XCircle,
  CheckCircle,
  ChevronLeft,
  Calendar,
  MapPin,
  Users,
  User,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Globe,
  Accessibility,
  Star,
  Edit,
  Trash2,
  Mail,
  Phone,
  Award,
  Clock,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Send,
  Tag,
  Share2,
  Link,
  Smile,
  Frown,
  Car,
  Bus,
} from "lucide-react";

const ImageGallery = ({ pictures }) => {
  const [mainImage, setMainImage] = useState(pictures[0]?.url);
  const [startIndex, setStartIndex] = useState(0);

  const handlePrev = () => {
    setStartIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNext = () => {
    setStartIndex((prevIndex) => Math.min(pictures.length - 5, prevIndex + 1));
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Thumbnail Column */}
      <div className="w-1/5 relative">
        <div className="h-full overflow-hidden relative">
          {pictures.length > 5 && (
            <button
              onClick={handlePrev}
              className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full z-10"
              disabled={startIndex === 0}
              aria-label="Previous images"
            >
              <ChevronUp size={20} />
            </button>
          )}
          <div className="flex flex-col gap-2 h-full">
            {pictures.slice(startIndex, startIndex + 5).map((pic, index) => (
              <img
                key={index}
                src={pic.url}
                alt={`Product image ${startIndex + index + 1}`}
                className="w-full h-[20%] object-cover rounded-lg cursor-pointer"
                onClick={() => setMainImage(pic.url)}
              />
            ))}
          </div>
          {pictures.length > 5 && (
            <button
              onClick={handleNext}
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full z-10"
              disabled={startIndex >= pictures.length - 5}
              aria-label="Next images"
            >
              <ChevronDown size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Image Column */}
      <div className="w-4/5 h-full">
        <div className="h-full flex items-center justify-center">
          <img
            src={mainImage}
            alt="Main product image"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

const RatingDistributionBar = ({ percentage, count }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="w-8 text-right">{count} ★</span>
    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
    <span className="w-12 text-gray-500">{percentage}%</span>
  </div>
);

const StarRating = ({ rating, setRating, readOnly = false }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-6 h-6 ${readOnly ? "" : "cursor-pointer"} ${
            star <= rating ? "text-[#F88C33] fill-current" : "text-gray-300"
          }`}
          onClick={() => !readOnly && setRating(star)}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        />
      ))}
    </div>
  );
};

const SingleActivityAdmin = ({ activityId }) => {
  const { id } = useParams();
  const activityIdToUse = activityId || id;
  const [isExpanded, setIsExpanded] = useState(false);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(Cookies.get("role") || "guest");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [advertiserProfile, setAdvertiserProfile] = useState(null);
  const [canModify, setCanModify] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [userBooking, setUserBooking] = useState([]);
  const [booked, setBooked] = useState([]);
  const [showUpdateBookingDialog, setShowUpdateBookingDialog] = useState(false);
  const [activityRating, setActivityRating] = useState(0);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [paymentType, setPaymentType] = useState("CreditCard");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [open, setOpen] = useState(false); // Added state for popover
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [isActivityBooked, setIsActivityBooked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAppropriate, setIsAppropriate] = useState(true);

  const [showTransportationSuccessDialog, setShowTransportationSuccessDialog] =
    useState(false);

  const [exchangeRates, setExchangeRates] = useState({});
  const [currencySymbol, setCurrencySymbol] = useState({});
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });
  const [userComment, setUserComment] = useState(null);
  const [quickRating, setQuickRating] = useState(0);
  const [isRatingHovered, setIsRatingHovered] = useState(false);
  const [selectedTransportation, setSelectedTransportation] = useState(null);
  const [transportationBookingDialog, setTransportationBookingDialog] =
    useState(false);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("creditCard");

  const handleTransportationBooking = async () => {
    if (!selectedTransportation) return;

    setIsBooking(true);
    setBookingError("");
    try {
      const token = Cookies.get("jwt");
      const response = await axios.post(
        "http://localhost:4000/tourist/book-transportation",
        {
          touristID: currentUser,
          transportationID: selectedTransportation._id,
          seatsToBook: seatsToBook,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.message === "Transportation Booking successful") {
        setShowTransportationSuccessDialog(true);
        const updatedTransportations = activity.transportations.map((t) =>
          t._id === selectedTransportation._id
            ? { ...t, remainingSeats: response.data.remainingSeats }
            : t
        );
        setActivity({ ...activity, transportations: updatedTransportations });
      } else {
        setBookingError(
          response.data.message || "Failed to book transportation"
        );
      }
    } catch (error) {
      console.error("Error booking transportation:", error);
      setBookingError(
        error.response?.data?.message || "An error occurred while booking"
      );
    } finally {
      setIsBooking(false);
      setTransportationBookingDialog(false);
    }
  };

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const renderTransportationOptions = () => {
    if (!activity.transportations || activity.transportations.length === 0) {
      return <p>No transportation options available for this activity.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activity.transportations.map((transport) => (
          <Card key={transport._id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {transport.vehicleType === "Bus" ||
                  transport.vehicleType === "Microbus" ? (
                    <Bus className="w-5 h-5 mr-2 text-blue-500" />
                  ) : (
                    <Car className="w-5 h-5 mr-2 text-green-500" />
                  )}
                  <h3 className="text-base font-semibold">
                    {transport.vehicleType}
                  </h3>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {formatPrice(transport.ticketCost)}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="flex justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium">{transport.from}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">To:</span>
                  <span className="font-medium">{transport.to}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">Departure:</span>
                  <span className="font-medium">
                    {format(
                      new Date(transport.timeDeparture),
                      "MMM d, yyyy HH:mm"
                    )}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {transport.estimatedDuration} hours
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">Seats left:</span>
                  <span className="font-medium">
                    {transport.remainingSeats}
                  </span>
                </p>
              </div>
              {userRole === "tourist" &&
                isActivityBooked &&
                transport.remainingSeats > 0 && (
                  <Button
                    onClick={() => {
                      setSelectedTransportation(transport);
                      setTransportationBookingDialog(true);
                    }}
                    className="w-full mt-4 bg-[#388A94] hover:bg-[#2c6d75] text-white"
                  >
                    Book Transportation
                  </Button>
                )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsToastOpen(true);
    setOpen(false);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteSuccess(false);
    navigate("/activity");
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(
      `Check out this activity: ${activity.name}`
    );
    const body = encodeURIComponent(
      `I thought you might be interested in this activity:\n\n${activity.name}\n\n${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpen(false); // Close the popover
  };

  const handleBookNowClick = () => {
    setShowBookingDialog(true);
    setBookingError("");
  };

  const handleUpdateNowClick = () => {
    setShowUpdateBookingDialog(true);
    setBookingError("");
  };

  const calculateTotalPrice = () => {
    const discountedPrice = calculateDiscountedPrice(
      activity.price,
      activity.specialDiscount
    );
    return (discountedPrice * numberOfTickets).toFixed(2);
  };

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const handleConfirmFlag = async () => {
    try {
      const updatedStatus = !isAppropriate; // Toggle status

      // Update the backend

      const token = Cookies.get("jwt");

      const response = await fetch(
        `http://localhost:4000/${userRole}/activities/${activity._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ appropriate: updatedStatus }),
        }
      );

      setIsAppropriate(updatedStatus); // Update state to reflect the new status
      setDialogOpen(false); // Close the dialog
    } catch (error) {
      console.error("Failed to update itinerary status:", error);
    }
  };

  const handleBooking = async () => {
    setIsBooking(true);
    setBookingError("");
    try {
      const token = Cookies.get("jwt");
      const totalPrice = calculateTotalPrice();

      const response = await fetch(
        `http://localhost:4000/${userRole}/activityBooking`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            activity: id,
            paymentType,
            paymentAmount: totalPrice,
            numberOfTickets,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message === "Insufficient funds in wallet") {
          setBookingError(
            "Insufficient funds, please choose a different payment method or update your wallet."
          );
        } else {
          throw new Error(errorData.message || "Failed to book activity");
        }
      } else {
        const data = await response.json();
        setShowBookingDialog(false);
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error("Error booking activity:", error);
      setBookingError(
        error.message || "An error occurred while booking. Please try again."
      );
    } finally {
      setIsBooking(false);
    }
  };

  // Comment Carousel State
  const [currentCommentIndex, setCurrentCommentIndex] = useState(0);
  const [showFullComment, setShowFullComment] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    liked: "",
    disliked: "",
    visitDate: "",
    isAnonymous: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivityDetails = async () => {
      if (!activityIdToUse) {
        setError("Invalid activity ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = Cookies.get("jwt");
        const response = await fetch(
          `http://localhost:4000/${userRole}/activities/${activityIdToUse}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch activity details");
        }

        const data = await response.json();
        setActivity(data);
        setError(null);

        if (data.advertiser) {
          setAdvertiserProfile(data.advertiser);
        }
        if (token) {
          const decodedToken = jwtDecode(token);
          setCanModify(decodedToken.id === data.advertiser._id);
          setCurrentUser(decodedToken.id);
        }
        if (data) {
          setActivity(data);
          // Calculate rating distribution
          const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          data.comments.forEach((comment) => {
            distribution[Math.floor(comment.rating)] =
              (distribution[Math.floor(comment.rating)] || 0) + 1;
          });
          setRatingDistribution(distribution);

          // Find user's comment if exists
          if (currentUser) {
            const userComment = data.comments.find(
              (comment) => comment.tourist === currentUser
            );
            if (userComment) {
              setUserComment(userComment);
              setQuickRating(userComment.rating || 0);
              setNewReview({
                rating: userComment.rating || 0,
                liked: userComment.content?.liked || "",
                disliked: userComment.content?.disliked || "",
                visitDate: userComment.visitDate || "",
                isAnonymous: userComment.username === "Anonymous",
              });
            }
          }
        }
      } catch (err) {
        setError("Error fetching activity details. Please try again later.");
        console.error("Error fetching activity details:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserBookings = async () => {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          `http://localhost:4000/${userRole}/touristActivityAttendedBookings`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserBookings(response.data);

        console.log(response.data);
      } catch (error) {
        console.error("Error fetching user bookings:", error);
      }
    };

    const fetchMyBookings = async () => {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          "http://localhost:4000/tourist/touristActivityBookings",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const bookings = response.data;
        console.log(bookings);
        //search through all bookin.activity._id and check if it matches the current activity id
        const isBooked = bookings.some(
          (booking) => booking.activity._id === id
        );
        console.log(isBooked);
        setIsActivityBooked(isBooked);
      } catch (error) {
        console.error("Error fetching user bookings:", error);
      }
    };

    fetchUserInfo();
    fetchActivityDetails();
    if (userRole === "tourist") {
      fetchUserBookings();
      fetchMyBookings();
    }
  }, [activityIdToUse, userRole, currentUser]);

  const fetchExchangeRate = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `http://localhost:4000/${userRole}/populate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Ensure content type is set to JSON
          },
          body: JSON.stringify({
            base: activity.currency, // Sending base currency ID
            target: userPreferredCurrency._id, // Sending target currency ID
          }),
        }
      );
      // Parse the response JSON
      const data = await response.json();

      if (response.ok) {
        setExchangeRates(data.conversion_rate);
      } else {
        // Handle possible errors
        console.error("Error in fetching exchange rate:", data.message);
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  };

  const getCurrencySymbol = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `http://localhost:4000/${userRole}/getCurrency/${activity.currency}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCurrencySymbol(response.data);
    } catch (error) {
      console.error("Error fetching currency symbol:", error);
    }
  };

  const formatPrice = (price, type) => {
    if (activity) {
      if (userRole === "tourist" && userPreferredCurrency) {
        if (userPreferredCurrency === activity.currency) {
          return `${userPreferredCurrency.symbol}${price}`;
        } else {
          const exchangedPrice = price * exchangeRates;
          return `${userPreferredCurrency.symbol}${exchangedPrice.toFixed(2)}`;
        }
      } else {
        if (currencySymbol) {
          return `${currencySymbol.symbol}${price}`;
        }
      }
    }
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
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserPreferredCurrency(response2.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  useEffect(() => {
    if (activity) {
      if (
        userRole === "tourist" &&
        userPreferredCurrency &&
        userPreferredCurrency !== activity.currency
      ) {
        fetchExchangeRate();
      } else {
        getCurrencySymbol();
      }
    }
  }, [userRole, userPreferredCurrency, activity]);

  const isActivityPassed = () => {
    return new Date(activity.timing) < new Date();
  };

  useEffect(() => {
    console.log(userBooking, "final booking list after state update");
  }, [userBooking]);

  const handleUpdateBooking = async () => {
    setIsBooking(true);
    setBookingError("");
    try {
      const token = Cookies.get("jwt");
      const additionalTickets = numberOfTickets + userBooking.numberOfTickets;
      const additionalPrice =
        userBooking.paymentAmount +
        calculateDiscountedPrice(activity.price, activity.specialDiscount) *
          additionalTickets;

      const response = await axios.put(
        `http://localhost:4000/${userRole}/activityBooking/${userBooking._id}`,
        {
          numberOfTickets,
          paymentAmount: additionalPrice,
          paymentType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowUpdateBookingDialog(false);
      setShowSuccessDialog(true);
      setUserBooking(response.data);
    } catch (error) {
      console.error("Error updating booking:", error);
      setBookingError(
        error.response?.data?.message ||
          "An error occurred while updating the booking."
      );
    } finally {
      setIsBooking(false);
    }
  };

  const handleUpdate = () => {
    navigate(`/update-activity/${id}`);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `http://localhost:4000/${userRole}/activities/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (
          response.status === 400 &&
          errorData.message === "Cannot delete activity with existing bookings"
        ) {
          setDeleteError(true);
          return;
        }
        throw new Error("Failed to delete activity");
      }

      setShowDeleteSuccess(true);
    } catch (err) {
      setError("Error deleting activity. Please try again later.");
      console.error("Error deleting activity:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalRatings = () => {
    return activity?.comments?.length || 0;
  };

  const getReviewsCount = () => {
    return (
      activity?.comments?.filter(
        (comment) =>
          comment.content && (comment.content.liked || comment.content.disliked)
      ).length || 0
    );
  };

  const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
    return ((originalPrice * (100 - discountPercentage)) / 100).toFixed(2);
  };

  const handleAddComment = (newComment) => {
    setActivity((prevActivity) => ({
      ...prevActivity,
      comments: [...(prevActivity.comments || []), newComment],
    }));
  };

  const handleActivityRating = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/${userRole}/activities/rate/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("jwt")}`,
          },
          body: JSON.stringify({ rating: activityRating }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit activity rating");
      }

      const data = await response.json();
      setActivity((prevActivity) => ({
        ...prevActivity,
        rating: data.newRating,
      }));
      setShowRatingDialog(false);

      window.location.reload();
    } catch (error) {
      console.error("Error submitting activity rating:", error);
    }
  };

  // Comment Carousel Functions
  const handlePrevComment = () =>
    setCurrentCommentIndex((prev) => Math.max(0, prev - 3));
  const handleNextComment = () =>
    setCurrentCommentIndex((prev) =>
      Math.min(activity.comments.length - 3, prev + 3)
    );

  const handleQuickRating = async (rating) => {
    try {
      const method = userComment ? "PUT" : "POST";
      const url = userComment
        ? `http://localhost:4000/${userRole}/activities/updateComment/${id}`
        : `http://localhost:4000/${userRole}/activities/comment/${id}`;

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("jwt")}`,
        },
        body: JSON.stringify({
          rating: rating,
          content: userComment
            ? userComment.content
            : { liked: "", disliked: "" },
          isAnonymous: userComment ? userComment.isAnonymous : false,
          date: new Date().toISOString(),
          username: userComment ? userComment.username : "User",
        }),
      });
      if (!response.ok) throw new Error("Failed to submit rating");
      setQuickRating(rating);
      window.location.reload();
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  const handleAddReview = async () => {
    try {
      const method = userComment ? "PUT" : "POST";
      const url = userComment
        ? `http://localhost:4000/${userRole}/activities/updateComment/${id}`
        : `http://localhost:4000/${userRole}/activities/comment/${id}`;

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("jwt")}`,
        },
        body: JSON.stringify({
          rating: newReview.rating,
          content: {
            liked: newReview.liked,
            disliked: newReview.disliked,
          },
          isAnonymous: newReview.isAnonymous,
          visitDate: newReview.visitDate,
          date: new Date().toISOString(),
          username: newReview.isAnonymous ? "Anonymous" : "User",
        }),
      });
      if (!response.ok) throw new Error("Failed to submit review");
      setShowAddReview(false);
      setNewReview({
        rating: 0,
        liked: "",
        disliked: "",
        visitDate: "",
        isAnonymous: false,
      });
      window.location.reload();
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const isReviewValid = () => {
    return newReview.liked.trim() !== "" || newReview.disliked.trim() !== "";
  };

  const formatCommentDate = (date) => {
    // Check if the date is valid
    const commentDate = new Date(date);

    // Check if the date is valid
    if (isNaN(commentDate.getTime())) {
      return "Date unavailable"; // Return if the date is invalid
    }

    const now = new Date();
    const diffInDays = Math.floor((now - commentDate) / (1000 * 60 * 60 * 24));

    if (diffInDays < 30) {
      return formatDistanceToNow(commentDate, { addSuffix: true });
    } else {
      return format(commentDate, "MMM d, yyyy");
    }
  };

  const ActivityDetailSkeleton = () => {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Section */}
            <div className="lg:w-3/4 flex-1">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="h-10 w-1/2 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse"></div>
                  </div>

                  <div className="w-full h-[400px] bg-gray-300 rounded animate-pulse mb-6"></div>

                  <div className="mb-6">
                    <div className="h-6 w-1/4 bg-gray-300 rounded animate-pulse mb-2"></div>
                  </div>

                  <div className="mt-8">
                    <div className="h-[200px] w-full bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="lg:w-1/4 flex-none">
              <Card>
                <CardHeader>
                  <div className="h-8 w-3/4 bg-gray-300 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-300 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4 text-4xl font-semibold text-center animate-pulse">
                    <div className="h-8 w-32 bg-gray-300 rounded mx-auto"></div>
                    <div className="text-sm text-gray-500 flex items-center justify-center mt-6">
                      <div className="h-4 w-24 bg-gray-300 rounded"></div>
                    </div>
                  </div>

                  <div className="mt-4 animate-pulse">
                    <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-300 rounded mt-6"></div>
                  </div>

                  <div className="mt-2 animate-pulse">
                    <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-300 rounded mt-6"></div>
                  </div>

                  <div className="mt-4 animate-pulse">
                    <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-300 rounded mt-6"></div>
                  </div>

                  <div className="mt-2 animate-pulse">
                    <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-300 rounded mt-6"></div>
                  </div>

                  <div className="mt-6 animate-pulse">
                    <div className="h-10 bg-gray-300 rounded"></div>
                    <div className="h-10 bg-gray-300 rounded mt-6"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div className="h-8 w-1/4 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-300 rounded animate-pulse"></div>
              </div>

              <div className="flex gap-8 mb-6">
                <div className="text-center">
                  <div className="h-12 w-12 bg-gray-300 rounded animate-pulse mx-auto mb-2"></div>
                  <div className="h-4 w-16 bg-gray-300 rounded animate-pulse mx-auto"></div>
                </div>
                <div className="flex-1 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="h-6 w-1/4 bg-gray-300 rounded animate-pulse mb-4"></div>
              <div className="h-4 w-1/2 bg-gray-300 rounded animate-pulse mb-4"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="flex-1 flex justify-between px-4">
                  {[...Array(3)].map((_, i) => (
                    <Card
                      key={i}
                      className="w-[30%] bg-gray-100 shadow-none border-none p-4 rounded-lg"
                    >
                      <CardHeader className="flex items-start">
                        <div className="flex">
                          <div className="h-12 w-12 bg-gray-300 rounded-full animate-pulse mr-4"></div>
                          <div className="flex flex-col">
                            <div className="h-4 w-24 bg-gray-300 rounded animate-pulse mb-2"></div>
                            <div className="h-3 w-16 bg-gray-300 rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-4 w-full bg-gray-300 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-full bg-gray-300 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <ActivityDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">No activity found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-100">
        <div className="">
          <div className="pt-4">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-4xl font-bold flex items-center justify-between">
                      {activity.name}
                      <div className="flex items-center">
                        <ToastProvider>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-4"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <div className="flex flex-col">
                                <Button
                                  variant="ghost"
                                  onClick={handleCopyLink}
                                  className="flex items-center justify-start px-4 py-2 hover:text-green-500"
                                >
                                  <Link className="mr-2 h-4 w-4" />
                                  Copy Link
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={handleEmailShare}
                                  className="flex items-center justify-start px-4 py-2 hover:text-green-500"
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Share by Email
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>

                          <ToastViewport />

                          {isToastOpen && (
                            <Toast
                              onOpenChange={setIsToastOpen}
                              open={isToastOpen}
                              duration={2000}
                            >
                              <ToastTitle>Link Copied</ToastTitle>
                              <ToastDescription>
                                The link has been copied to your clipboard.
                              </ToastDescription>
                              <ToastClose />
                            </Toast>
                          )}
                        </ToastProvider>
                      </div>
                    </CardTitle>

                    <CardDescription className="flex items-center justify-end"></CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col lg:flex-row gap-8">
                      <div className="w-full h-[400px]">
                        <ImageGallery pictures={activity.pictures} />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {/* Categories Badges */}
                      {activity.category.map((cat, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center text-base bg-[#388A94]  text-white font-semibold px-2 py-1 rounded
            hover:bg-[#388A94] hover:text-white"
                        >
                          {cat.name}
                        </Badge>
                      ))}

                      {/* Tags Badges */}
                      {activity.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center text-base font-semibold bg-[#1A3B47] text-white px-2 py-1 rounded hover:bg-[#1A3B47] hover:text-white"
                        >
                          {tag.type}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center p-6">
                      <Map
                        position={[
                          activity.location.coordinates.latitude,
                          activity.location.coordinates.longitude,
                        ]}
                        height="300px"
                        width="100%"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col md:flex-col gap-8">
                <div className="flex-1 bg-white shadow-md rounded-lg p-4">
                  <div>
                    <div className="space-y-4">
                      <div className="">
                        <h1 className="text-3xl font-bold">{activity.name}</h1>
                      </div>
                      <div className="flex items-center">
                        {/* Rating Badge */}
                        <div className="flex items-center px-3 py-1 rounded-full">
                          <StarRating
                            rating={activity.rating}
                            readOnly={true}
                          />
                        </div>

                        {/* Rating Count outside the badge */}
                        <span className="text-sm font-normal ml-2">
                          {activity.comments
                            ? `(${activity.comments.length})`
                            : "(0)"}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <div>
                          <div className="bg-red-600 text-white text-sm font-bold px-3 py-2 rounded mb-2 inline-block">
                            Limited time deal
                          </div>

                          <div className="flex flex-col items-start">
                            <div className="flex items-baseline">
                              <span className="text-4xl font-bold text-gray-900">
                                {formatPrice(
                                  calculateDiscountedPrice(
                                    activity.price,
                                    activity.specialDiscount
                                  )
                                )}
                              </span>
                              <span className="ml-3 text-xl font-semibold text-red-600">
                                -{activity.specialDiscount}% Discount
                              </span>
                            </div>
                            <div className="text-2xl text-gray-500 line-through mt-2">
                              {formatPrice(activity.price)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                        <span className="text-gray-700">
                          Location: {activity.location.address}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                        <span className="text-gray-700">
                          Date: {new Date(activity.timing).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-orange-500" />
                        <span className="text-gray-700">
                          Time:{" "}
                          {new Date(activity.timing).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="text-lg text-gray-600 mt-4 mb-6 overflow-hidden w-[400px]">
                        {isExpanded
                          ? activity.description
                          : `${activity.description.substring(0, 130)}...`}
                        <button
                          onClick={toggleExpanded}
                          className="text-blue-500 hover:underline ml-2"
                        >
                          {isExpanded ? "View Less" : "View More"}
                        </button>
                      </div>

                      {userRole === "tourist" && !isActivityPassed() && (
                        <>
                          <div className="border-t-4 border-gray-300 w-1/2 mx-auto my-4"></div>

                          <Button
                            onClick={handleBookNowClick}
                            className="w-full bg-[#388A94] hover:bg-[#2B6870] text-white font-bold py-2 px-4 rounded mt-4"
                          >
                            {"Book Now"}
                          </Button>
                        </>
                      )}

                      {canModify && (
                        <>
                          <div className="border-t-4 border-gray-300 w-1/2 mx-auto my-4"></div>
                          <Button
                            onClick={handleUpdate}
                            variant="default"
                            className="w-full bg-[#1A3B47] hover:bg-[#123239] text-white font-bold py-2 px-4 rounded mt-4"
                          >
                            <Edit className="mr-2" /> Update
                          </Button>
                          <Button
                            onClick={handleDelete}
                            variant="destructive"
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mt-4"
                          >
                            <Trash2 className="mr-2" /> Delete
                          </Button>
                        </>
                      )}

                      <div className="border-t-4 border-gray-300 w-1/2 mx-auto my-4"></div>
                    </div>
                  </div>

                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <span className="text-3xl font-bold -ml-2 ">
                        Advertiser Profile
                      </span>
                      <Badge
                        variant="secondary"
                        className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500 text-white hover:bg-blue-500 hover:text-white"
                      >
                        Verified Advertiser
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={advertiserProfile.logo}
                          alt={advertiserProfile.username}
                        />
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <h3 className="text-2xl font-bold text-[#1A3B47]">
                          {advertiserProfile.username}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="font-semibold text-xs">
                            95% Positive
                          </span>
                          <span className="mx-2">|</span>
                          <span className="font-semibold text-xs">
                            754 Bookings
                          </span>
                        </div>
                        <div className="flex items-center mt-2">
                          <StarRating rating={5} />
                        </div>
                      </div>
                    </div>

                    {showMore && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm">
                          <Mail className="h-5 w-5 mr-2 text-gray-500" />
                          <span>{advertiserProfile.email}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Globe className="h-5 w-5 mr-2 text-gray-500" />
                          <span>{advertiserProfile.website}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-5 w-5 mr-2 text-gray-500" />
                          <span>{advertiserProfile.hotline}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <Button
                        variant="link"
                        className="w-full p-0 h-auto font-normal text-blue-500 hover:text-blue-700"
                        onClick={() => setShowMore(!showMore)}
                      >
                        {showMore ? "Less Info" : "More Info"}
                      </Button>
                    </div>
                    {userRole === "admin" && (
                      <>
                        <div className="mt-6 border-t border-gray-300 pt-4"></div>
                        <Button
                          className={`w-full mx-auto text-white ${
                            isAppropriate
                              ? "bg-red-500 hover:bg-red-600" // Appropriate: Red Button
                              : "bg-green-500 hover:bg-green-600" // Inappropriate: Green Button
                          }`}
                          onClick={handleOpenDialog}
                        >
                          {isAppropriate
                            ? "Flag as Inappropriate"
                            : "Flag as Appropriate"}
                        </Button>

                        {dialogOpen && (
                          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                              <div className="mb-4">
                                <h2 className="text-lg font-semibold">
                                  Confirm Action
                                </h2>
                                <p className="text-gray-600 mt-2">
                                  Are you sure you want to change the status of
                                  this itinerary/event?
                                </p>
                              </div>
                              <div className="flex justify-end space-x-4">
                                <Button
                                  variant="outlined"
                                  onClick={handleCloseDialog}
                                  className="bg-[#A3A3A3] hover:bg-[#7E7E7E] text-white border-[#A3A3A3]"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  color="secondary"
                                  onClick={handleConfirmFlag}
                                  className="bg-[#5D9297] hover:bg-[#388A94] text-white"
                                >
                                  Confirm
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </div>

                {/* {userRole === 'tourist' && !isActivityPassed() && booked &&(
          <Button
          onClick={handleUpdateNowClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
          >
          {"Update Booking"}
          </Button>
          )} */}
              </div>
            </div>

            {/* {(userRole === "advertiser" || userRole === "tourist") && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">
                Transportation Options
              </h2>
              {renderTransportationOptions()}
            </div>
          )} */}

            {/* Comment Carousel */}
            <div className="mt-8 relative bg-white p-6 mb-4 rounded-lg shadow-md">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Ratings & Reviews</h2>
                  <Button variant="link" className="text-primary">
                    See All
                  </Button>
                </div>

                <div className="flex gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-1">
                      {activity?.rating?.toFixed(1) || "0.0"}
                    </div>
                    <div className="text-sm text-gray-500">out of 5</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {activity?.comments?.length || 0} Ratings
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = ratingDistribution[stars] || 0;
                      const percentage = activity?.comments?.length
                        ? Math.round((count / activity.comments.length) * 100)
                        : 0;
                      return (
                        <RatingDistributionBar
                          key={stars}
                          percentage={percentage}
                          count={stars}
                        />
                      );
                    })}
                  </div>
                </div>

                {userRole === "tourist" && userComment && (
                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-500 mb-2">
                      Tap to Rate:
                    </div>
                    <div
                      className="flex gap-2"
                      onMouseLeave={() => setIsRatingHovered(false)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 cursor-pointer ${
                            (
                              isRatingHovered
                                ? quickRating >= star
                                : quickRating >= star
                            )
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300"
                          }`}
                          onMouseEnter={() => {
                            setIsRatingHovered(true);
                            setQuickRating(star);
                          }}
                          onClick={() => handleQuickRating(star)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t pt-6"></div>
              <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
              <p className="text-sm text-gray-600 mb-4">
                {getTotalRatings()} overall ratings, {getReviewsCount()} with
                reviews
              </p>
              {activity.comments && activity.comments.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      onClick={handlePrevComment}
                      variant="ghost"
                      disabled={currentCommentIndex === 0}
                    >
                      <ChevronLeft />
                    </Button>
                    <div className="flex-1 flex justify-between px-4">
                      {activity.comments
                        .filter(
                          (comment) =>
                            comment.content.liked || comment.content.disliked
                        ) // Filter for comments with content
                        .slice(currentCommentIndex, currentCommentIndex + 3) // Slice the filtered comments
                        .map((comment, index) => (
                          <Card
                            key={index}
                            className="w-[30%] bg-gray-100 shadow-none border-none p-4 rounded-lg"
                          >
                            <CardHeader className="flex items-start">
                              <div className="flex">
                                {/* User icon with larger first letter */}
                                <div className="flex items-center justify-center w-12 h-12 bg-gray-300 text-gray-700 rounded-full mr-4 text-xl font-bold">
                                  {comment.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  {/* Larger Username */}
                                  <CardTitle className="text-xl font-semibold">
                                    {comment.username}
                                  </CardTitle>
                                  {/* Date under the username */}
                                  <p className="text-sm text-gray-500">
                                    {formatCommentDate(comment.date)}
                                  </p>
                                </div>
                              </div>
                              {/* Star Rating below username and date */}
                              <div className="mt-2">
                                <StarRating
                                  rating={comment.rating}
                                  readOnly={true}
                                />
                              </div>
                            </CardHeader>

                            <CardContent>
                              {/* Liked content */}
                              <p className="text-gray-700 line-clamp-3">
                                {comment.content.liked ||
                                  comment.content.disliked ||
                                  "No comment provided"}
                              </p>
                              {/* View more link */}
                              <a
                                href="#"
                                className="text-blue-500 hover:underline mt-2 inline-block"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShowFullComment(comment);
                                }}
                              >
                                View more
                              </a>
                            </CardContent>
                          </Card>
                        ))}
                    </div>

                    <Button
                      onClick={handleNextComment}
                      variant="ghost"
                      disabled={
                        currentCommentIndex >= activity.comments.length - 3
                      }
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </>
              ) : (
                <p>No comments yet.</p>
              )}
              {userBookings.some(
                (booking) => booking.activity._id === activity._id
              ) &&
                !userComment && (
                  <Button
                    onClick={() => setShowAddReview(true)}
                    className="mt-4 mr-4"
                  >
                    Add a Review
                  </Button>
                )}
              {userComment && (
                <Button
                  onClick={() => setShowAddReview(true)}
                  className="mt-4 mr-4"
                >
                  Edit Your Review
                </Button>
              )}
            </div>
          </div>

          <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Book Activity: {activity.name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tickets" className="text-right">
                    Tickets
                  </Label>
                  <Input
                    id="tickets"
                    type="number"
                    value={numberOfTickets}
                    onChange={(e) =>
                      setNumberOfTickets(Math.max(1, parseInt(e.target.value)))
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Total Price</Label>
                  <div className="col-span-3">
                    {formatPrice(calculateTotalPrice())}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Payment Type</Label>
                  <RadioGroup
                    value={paymentType}
                    onValueChange={setPaymentType}
                    className="col-span-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CreditCard" id="CreditCard" />
                      <Label htmlFor="CreditCard">Credit Card</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="DebitCard" id="DebitCard" />
                      <Label htmlFor="DebitCard">Debit Card</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Wallet" id="Wallet" />
                      <Label htmlFor="Wallet">Wallet</Label>
                    </div>
                  </RadioGroup>
                </div>
                {bookingError && (
                  <div className="text-red-500 text-sm">{bookingError}</div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => setShowBookingDialog(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button onClick={handleBooking} disabled={isBooking}>
                  {isBooking ? "Booking..." : "Confirm Booking"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showUpdateBookingDialog}
            onOpenChange={setShowUpdateBookingDialog}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Update Booking: {activity.name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tickets" className="text-right">
                    Tickets
                  </Label>
                  <Input
                    id="tickets"
                    type="number"
                    value={numberOfTickets}
                    onChange={(e) =>
                      setNumberOfTickets(
                        Math.max(
                          userBooking.numberOfTickets,
                          parseInt(e.target.value)
                        )
                      )
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Additional Price</Label>
                  <div className="col-span-3">
                    {(
                      calculateDiscountedPrice(
                        activity.price,
                        activity.specialDiscount
                      ) *
                      (numberOfTickets - userBooking.numberOfTickets)
                    ).toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Payment Type</Label>
                  <RadioGroup
                    value={paymentType}
                    onValueChange={setPaymentType}
                    className="col-span-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CreditCard" id="CreditCard" />
                      <Label htmlFor="CreditCard">Credit Card</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="DebitCard" id="DebitCard" />
                      <Label htmlFor="DebitCard">Debit Card</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Wallet" id="Wallet" />
                      <Label htmlFor="Wallet">Wallet</Label>
                    </div>
                  </RadioGroup>
                </div>
                {bookingError && (
                  <div className="text-red-500 text-sm">{bookingError}</div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => setShowUpdateBookingDialog(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateBooking} disabled={isBooking}>
                  {isBooking ? "Updating..." : "Confirm Update"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                {/* Flexbox container to align icon and title horizontally */}
                <div className="flex items-center">
                  {/* Check Circle Icon */}
                  <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                  {/* Title */}
                  <DialogTitle>Booking Successful</DialogTitle>
                </div>
              </DialogHeader>

              <div className="py-4">
                <p>
                  You have successfully booked {numberOfTickets} ticket(s) for{" "}
                  {activity.name}.
                </p>
              </div>

              <DialogFooter>
                <Button onClick={() => setShowSuccessDialog(false)}>OK</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Full Comment Dialog */}
        <Dialog
          open={!!showFullComment}
          onOpenChange={() => setShowFullComment(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{showFullComment?.username}'s Review</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] overflow-auto">
              <div className="space-y-4">
                <div>
                  <StarRating
                    rating={showFullComment?.rating}
                    readOnly={true}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {showFullComment && formatCommentDate(showFullComment.date)}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold flex items-center">
                    <Smile className="w-5 h-5 mr-2 text-green-500" />
                    Liked:
                  </h4>
                  <p>
                    {showFullComment?.content?.liked || "Nothing mentioned"}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold flex items-center">
                    <Frown className="w-5 h-5 mr-2 text-red-500" />
                    Disliked:
                  </h4>
                  <p>
                    {showFullComment?.content?.disliked || "Nothing mentioned"}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Add Review Dialog */}
        <Dialog open={showAddReview} onOpenChange={setShowAddReview}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {userComment ? "Edit Your Review" : "Write a Review"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your Rating
                </label>
                <StarRating
                  rating={newReview.rating}
                  setRating={(rating) =>
                    setNewReview((prev) => ({ ...prev, rating }))
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="liked"
                  className="block text-sm font-medium text-gray-700"
                >
                  <Smile className="w-5 h-5 inline mr-2 text-green-500" />
                  Something you liked
                </label>
                <Textarea
                  id="liked"
                  value={newReview.liked}
                  onChange={(e) =>
                    setNewReview((prev) => ({ ...prev, liked: e.target.value }))
                  }
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div>
                <label
                  htmlFor="disliked"
                  className="block text-sm font-medium text-gray-700"
                >
                  <Frown className="w-5 h-5 inline mr-2 text-red-500" />
                  Something you didn't like
                </label>
                <Textarea
                  id="disliked"
                  value={newReview.disliked}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      disliked: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-2"
                />
              </div>
              {/* <div>
                <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700">
                  When did you visit?
                </label>
                <select
                  id="visitDate"
                  value={newReview.visitDate}
                  onChange={(e) => setNewReview(prev => ({ ...prev, visitDate: e.target.value }))}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a time</option>
                  <option value="weekday">Weekday</option>
                  <option value="weekend">Weekend</option>
                  <option value="holiday">Public holiday</option>
                </select>
              </div> */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous-mode"
                  checked={newReview.isAnonymous}
                  onCheckedChange={(checked) =>
                    setNewReview((prev) => ({ ...prev, isAnonymous: checked }))
                  }
                />
                <Label htmlFor="anonymous-mode">Post anonymously</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setShowAddReview(false)}
                className="bg-gray-300 text-black hover:bg-gray-400 mr-2"
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-500 border-blue-500 text-white hover:bg-blue-600"
                onClick={handleAddReview}
              >
                {userComment ? "Update Review" : "Submit Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rate Activity Dialog */}
        <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Rate this Activity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Your Rating
              </label>
              <StarRating
                rating={activityRating}
                setRating={setActivityRating}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleActivityRating}>Submit My Rating</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this activity? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteError} onOpenChange={setDeleteError}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cannot Delete Activity</DialogTitle>
              <DialogDescription>
                This activity cannot be deleted because it has active bookings.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setDeleteError(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog
          open={showDeleteSuccess}
          onOpenChange={(open) => {
            if (!open) handleDeleteSuccess();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
              <DialogDescription>
                The activity has been deleted successfully.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleDeleteSuccess} variant="default">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back to All Activities
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={transportationBookingDialog}
          onOpenChange={setTransportationBookingDialog}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Book Transportation</DialogTitle>
              <DialogDescription>
                Please select the number of seats and payment method.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="seats" className="text-right">
                  Seats
                </Label>
                <Input
                  id="seats"
                  type="number"
                  className="col-span-3"
                  value={seatsToBook}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setSeatsToBook(
                      Math.max(
                        0,
                        Math.min(
                          value,
                          selectedTransportation?.remainingSeats || 0
                        )
                      )
                    );
                  }}
                  min="0"
                  max={selectedTransportation?.remainingSeats}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Total Price</Label>
                <div className="col-span-3">
                  {formatPrice(
                    (selectedTransportation?.ticketCost || 0) * seatsToBook
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Payment</Label>
                <RadioGroup
                  defaultValue="creditCard"
                  className="col-span-3"
                  onValueChange={setPaymentMethod}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="creditCard" id="creditCard" />
                    <Label htmlFor="creditCard">Credit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="debitCard" id="debitCard" />
                    <Label htmlFor="debitCard">Debit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet">Wallet</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setTransportationBookingDialog(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTransportationBooking}
                disabled={isBooking}
              >
                {isBooking ? "Booking..." : "Confirm Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showTransportationSuccessDialog}
          onOpenChange={setShowTransportationSuccessDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transportation Booked Successfully</DialogTitle>
              <DialogDescription>
                Your transportation has been booked. Thank you for your
                purchase!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowTransportationSuccessDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SingleActivityAdmin;
