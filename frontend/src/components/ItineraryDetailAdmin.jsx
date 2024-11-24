import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from "axios";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import * as jwtDecode from 'jwt-decode';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Loader from './Loader';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  CheckCircle, XCircle, Star, Edit, Trash2, Mail, Phone, Award, Globe, Accessibility,
  MapPin, Clock, DollarSign, Info, ChevronLeft, ChevronRight, Share2, Link,
  MessageSquare, Banknote, Smile, Frown,
  ThumbsUp,
  ThumbsDown,
  StarHalf
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TimelinePreviewComponent } from "@/components/timeline-preview";
import { ActivityTimeline } from "@/components/ItineraryTimeline";

import { ChevronUp, ChevronDown } from 'lucide-react';

const ImageGallery = ({ activities }) => {
  // Collect all pictures from activities
  const allPictures = activities.flatMap(activity => activity.pictures);

  const [mainImage, setMainImage] = useState(allPictures[0]?.url);
  const [startIndex, setStartIndex] = useState(0);

  const handlePrev = () => {
    setStartIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNext = () => {
    setStartIndex((prevIndex) => Math.min(allPictures.length - 5, prevIndex + 1));
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Thumbnail Column */}
      <div className="w-1/5 relative">
        <div className="h-full overflow-hidden relative">
          {allPictures.length > 5 && (
            <button
              onClick={handlePrev}
              className={`absolute top-0 left-1/2 transform -translate-x-1/2 bg-opacity-50 text-white p-1 rounded-full z-10 ${startIndex === 0 ? 'bg-gray-400' : 'bg-black'
                }`}
              disabled={startIndex === 0}
              aria-label="Previous images"
            >
              <ChevronUp size={20} />
            </button>
          )}
          <div className="flex flex-col gap-2 h-full transition-transform duration-700 ease-in-out">
            {allPictures.slice(startIndex, startIndex + 5).map((pic, index) => (
              <img
                key={startIndex + index}
                src={pic.url}
                alt={`Activity image ${startIndex + index + 1}`}
                className="w-full h-[20%] object-cover rounded-lg cursor-pointer"
                onClick={() => setMainImage(pic.url)}
                style={{ transition: 'transform 0.7s ease-in-out' }}
              />
            ))}
          </div>
          {allPictures.length > 5 && (
            <button
              onClick={handleNext}
              className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-opacity-50 text-white p-1 rounded-full z-10 ${startIndex >= allPictures.length - 5 ? 'bg-gray-400' : 'bg-black'
                }`}
              disabled={startIndex >= allPictures.length - 5}
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
            alt="Main activity image"
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
        className="h-full bg-[#1A3B47]  rounded-full"
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
          className={`w-6 h-6 ${readOnly ? '' : 'cursor-pointer'} ${star <= rating ? "text-[#F88C33] fill-current" : "text-gray-300"
            }`}
          onClick={() => !readOnly && setRating(star)}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        />
      ))}
    </div>
  );
};

const getTotalRatingsTG = (profile) => {
  return profile?.comments?.length || 0;
};




const AvailableDatesSection = ({ availableDates, handleBookNowClick, selectedDate, setSelectedDate }) => {
  console.log(selectedDate);
  const dates = availableDates.map((dateInfo) => new Date(dateInfo.date));

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      if (dates.some((availableDate) => availableDate.toDateString() === date.toDateString())) {
        return <div className="highlight"></div>;
      }
    }
    return null;
  };

  return (
    <div className="p-6 border-t border-gray-200 mt-6">
      <h3 className="text-2xl font-semibold mb-2">Available Dates</h3>
      <p>Select a date and book now!</p>
      <Calendar
        value={selectedDate}
        tileDisabled={({ date }) => !dates.some((availableDate) => availableDate.toDateString() === date.toDateString())}
        onClickDay={(value) => {
          setSelectedDate(value);
          handleBookNowClick(value);
        }}
        minDetail="month"
        next2Label={null}
        prev2Label={null}
        tileContent={tileContent}
        className="w-full custom-calendar"
      />
      <style jsx>{`
        .react-calendar {
          width: 100%;
          max-width: 100%;
          background: #B5D3D1;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.125em;
          border: none; /* Remove the outline */
        }

        .react-calendar__tile {
          max-height: 40px;
          text-align: center;
          padding: 0.5em;
          background: #B5D3D1; /* Match the background color */
          border: none; /* Remove the outline */
          transition: background-color 0.3s;
        }

        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #388A94;
          color: white;
        }

        .react-calendar__tile--now {
          background: #F88C33;
          color: white;
        }

        .react-calendar__tile--active {
          background: #388A94;
          color: white;
        }

        .react-calendar__navigation button {
          color: #1A3B47;
        }

        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: #B5D3D1;
        }

        .highlight {
          background-color: #388A94;
          border-radius: 50%;
          height: 10px;
          width: 10px;
          display: inline-block;
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
};








const TourguideProfileCard = ({
  handleQuickTourGuideRating,
  setShowTourGuideReviewDialog,
  userTourGuideReview,
  tourGuideRating,
  profile,
  onReviewClick,
  userRole,
  userBookings,
  itinerary,
  canModify,
  setShowDeleteConfirm,
  handleUpdate,
  handleActivationToggle,
  isActivated,
  isItineraryAvailable,
  handleBookNowClick,
  isAppropriate,
  dialogOpen,
  handleOpenDialog,
  handleCloseDialog,
  handleConfirmFlag,
}) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h1 className="text-3xl font-bold text-center">{itinerary.title}</h1>
        <div className="mt-4 text-4xl font-semibold text-center">
          $ {itinerary.price}
          <div className="text-sm text-gray-500 flex items-center justify-center mt-1">
            <Info className="w-4 h-4 mr-1 text-gray-500" />
            Prices include VAT
          </div>
        </div>


      </CardHeader>
      <CardContent>
        <div className="mt-4">
          <div className="text-lg font-semibold">Pick-up Location:</div>
          <div className="text-md text-gray-700">{itinerary.pickUpLocation}</div>
        </div>
        <div className="mt-2">
          <div className="text-lg font-semibold">Drop-off Location:</div>
          <div className="text-md text-gray-700">{itinerary.dropOffLocation}</div>
        </div>
        <div className="mt-4">
          <div className="text-lg font-semibold">Language:</div>
          <div className="text-md text-gray-700">{itinerary.language}</div>
        </div>
        <div className="mt-2">
          <div className="text-lg font-semibold">Accessibility:</div>
          <div className="text-md text-gray-700">{itinerary.accessibility ? "Yes" : "No"}</div>
        </div>
        {userRole === "tour-guide" && canModify && (
          <div className="mt-3 space-y-3">
            <Button
              onClick={handleUpdate}
              variant="default"
              className="w-full flex items-center bg-[#1a202c] hover:bg-[#2d3748]"
            >
              <Edit className="w-4 h-4 mr-2" />
              Update
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
              className="w-full flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              onClick={() => handleActivationToggle()}
              variant={isActivated ? "destructive" : "default"}
              className={`w-full flex items-center ${isActivated ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isActivated ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        )}

        <div className="mt-6 border-t border-gray-300 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">Tour Guide</span>
            <Badge
              variant="secondary"
              className="px-2 py-1 text-xs font-medium rounded-full bg-[#5D9297] hover:bg-[#5D9297] text-white hover:text-white"
            >
              Verified Guide
            </Badge>
          </div>
        </div>

        <div className="mt-4 flex items-center">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatarUrl} alt={profile.username} />
            <AvatarFallback>{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <h3 className="text-2xl font-bold">{profile.username}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span className="font-semibold text-xs">
                95% positive
              </span>
              <span className="mx-2">|</span>
              <span className="font-semibold text-xs">
                {profile.yearsOfExperience} years of experience
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center mt-2">
          <span>
            <StarRating rating={profile.rating} readOnly={true} />
          </span>
          <span className="ml-2 text-lg font-semibold">{profile.rating.toFixed(1)}</span>
        </div>

        {showMore && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm">
              <Mail className="h-5 w-5 mr-2 text-gray-500" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center text-sm">
              <Phone className="h-5 w-5 mr-2 text-gray-500" />
              <span>{profile.mobile}</span>
            </div>
            <div className="mt-2">
              <h4 className="font-semibold mb-2">Languages</h4>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang, index) => (
                  <Badge key={index} variant="secondary">{lang}</Badge>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <h4 className="font-semibold mb-2">Specialties</h4>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((specialty, index) => (
                  <Badge key={index} variant="outline">{specialty}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <Button
            variant="link"
            className="w-full p-0 h-auto mb-2 font-normal text-[#5D9297] hover:[#388A94]"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? 'Less Info' : 'More Info'}
          </Button>
        </div>

        {userRole === 'tourist' && userBookings.some(booking => booking.itinerary?._id === itinerary._id) && (
          <div className="border-t pt-4 mt-4">
            <div className="text-lg text-gray-600 font-semibold mb-2">Rate Tour Guide:</div>
            <div className="text-sm text-gray-500 mb-2">Tap to Rate</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer ${tourGuideRating >= star ? 'text-yellow-500 fill-current' : 'text-gray-300'
                    }`}
                  onClick={() => handleQuickTourGuideRating(star)}
                />
              ))}
            </div>
            <Button
              onClick={() => setShowTourGuideReviewDialog(true)}
              className="w-full mt-4 mb-2 bg-[#5D9297]"
            >
              {userTourGuideReview ? 'Edit Review' : 'Write a Review'}
            </Button>
          </div>
        )}
        <Button onClick={onReviewClick} className="w-full bg-[#1A3B47]">
          See All Reviews
        </Button>
        {userRole === "admin" && (
          <>
            <div className="mt-6 border-t border-gray-300 pt-4"></div>
            <Button
              className={`w-full mx-auto text-white ${isAppropriate
                ? "bg-red-500 hover:bg-red-600" // Appropriate: Red Button
                : "bg-green-500 hover:bg-green-600" // Inappropriate: Green Button
                }`}
              onClick={handleOpenDialog}
            >
              {isAppropriate ? "Flag as Inappropriate" : "Flag as Appropriate"}
            </Button>

            {dialogOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">Confirm Action</h2>
                    <p className="text-gray-600 mt-2">
                      Are you sure you want to change the status of this itinerary/event?
                    </p>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outlined"
                      onClick={handleCloseDialog}
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      color="secondary"
                      onClick={handleConfirmFlag}
                      className="bg-[#5D9297] hover:[#388A94] text-white"
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

    </Card>


  );
};



const ItineraryDetail = () => {
  const { id } = useParams();
  const [itinerary, setItinerary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(Cookies.get("role") || "guest");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [tourGuideProfile, setTourGuideProfile] = useState(null);
  const [canModify, setCanModify] = useState(false);
  const [rating, setRating] = useState(0);
  const [showRatingSubmit, setShowRatingSubmit] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [currentCommentIndex, setCurrentCommentIndex] = useState(0);
  const [newReview, setNewReview] = useState({
    rating: 0,
    liked: '',
    disliked: '',
    visitDate: '',
    isAnonymous: false
  });
  const [username, setUsername] = useState('');
  const [showRateItineraryDialog, setShowRateItineraryDialog] = useState(false);
  const [itineraryRating, setItineraryRating] = useState(0);
  const [itineraryReview, setItineraryReview] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showFullComment, setShowFullComment] = useState(null);
  const [activityRating, setActivityRating] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAppropriate, setIsAppropriate] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [paymentType, setPaymentType] = useState("CreditCard");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [isActivated, setIsActivated] = useState(true);
  const [userBookings, setUserBookings] = useState([]);
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencySymbol, setCurrencySymbol] = useState({});
  const [open, setOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [userComment, setUserComment] = useState(null);
  const [showEditReview, setShowEditReview] = useState(false);
  const [userId, setUserId] = useState(null);
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });
  const [tourGuideRatingDistribution, setTourGuideRatingDistribution] = useState({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });
  const [quickRating, setQuickRating] = useState(0);
  const [isRatingHovered, setIsRatingHovered] = useState(false);
  const [showAllTourGuideReviews, setShowAllTourGuideReviews] = useState(false);
  const [tourGuideRating, setTourGuideRating] = useState(0);
  const [tourGuideReview, setTourGuideReview] = useState({
    rating: 0,
    liked: '',
    disliked: '',
    isAnonymous: false
  });
  const [showTourGuideReviewDialog, setShowTourGuideReviewDialog] = useState(false);
  const [userTourGuideReview, setUserTourGuideReview] = useState(null);

  useEffect(() => {
    const token = Cookies.get("jwt");
    if (token) {
      const decodedToken = jwtDecode.jwtDecode(token);
      setUserId(decodedToken.id);
    }
  }, []);


  const handleDateSelect = (date) => {
    setSelectedDate(date);
    handleDateChange(date);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Find the available times for the selected date
    const selectedDateInfo = itinerary.availableDates.find(
      (dateInfo) => new Date(dateInfo.date).toDateString() === new Date(date).toDateString()
    );

  };


  useEffect(() => {
    if (itinerary && userId) {
      const userComment = itinerary.comments.find(comment => comment.tourist === userId);
      if (userComment) {
        setUserComment(userComment);
        setQuickRating(userComment.rating || 0);
        setNewReview({
          rating: userComment.rating || 0,
          liked: userComment.content?.liked || "",
          disliked: userComment.content?.disliked || "",
          isAnonymous: userComment.username === 'Anonymous'
        });
        setItineraryRating(userComment.rating || 0);
      }

      // Calculate rating distribution for itinerary
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      itinerary.comments.forEach(comment => {
        distribution[Math.floor(comment.rating)] = (distribution[Math.floor(comment.rating)] || 0) + 1;
      });
      setRatingDistribution(distribution);
    }

    if (tourGuideProfile) {
      // Calculate rating distribution for tour guide
      const tourGuideDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      // Iterate over the comments array to calculate rating distribution
      tourGuideProfile.comments.forEach(comment => {
        if (comment.rating >= 1 && comment.rating <= 5) { // Ensure rating is within valid range
          tourGuideDistribution[Math.floor(comment.rating)] = (tourGuideDistribution[Math.floor(comment.rating)] || 0) + 1;
        }
      });

      setTourGuideRatingDistribution(tourGuideDistribution);
    }

    if (tourGuideProfile && userId) {
      const userReview = tourGuideProfile.comments.find(comment => comment.tourist === userId);
      if (userReview) {
        setUserTourGuideReview(userReview);
        setTourGuideRating(userReview.rating || 0);
        setTourGuideReview({
          rating: userReview.rating || 0,
          liked: userReview.content?.liked || "",
          disliked: userReview.content?.disliked || "",
          isAnonymous: userReview.username === 'Anonymous'
        });
      }
    }
  }, [itinerary, userId, tourGuideProfile]);

  const handleQuickTourGuideRating = async (rating) => {
    try {
      const method = userTourGuideReview ? 'PUT' : 'POST';
      const url = userTourGuideReview
        ? `http://localhost:4000/${userRole}/tourguide/updateComment/${tourGuideProfile._id}`
        : `http://localhost:4000/${userRole}/tourguide/comment/${tourGuideProfile._id}`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('jwt')}`,
        },
        body: JSON.stringify({
          rating: rating,
          content: userTourGuideReview ? userTourGuideReview.content : { liked: '', disliked: '' },
          isAnonymous: userTourGuideReview ? userTourGuideReview.isAnonymous : false,
          date: new Date().toISOString(),
          username: userTourGuideReview ? userTourGuideReview.username : 'User'
        }),
      });
      if (!response.ok) throw new Error('Failed to submit tour guide rating');
      setTourGuideRating(rating);
      window.location.reload();
    } catch (error) {
      console.error('Error submitting tour guide rating:', error);
    }
  };

  const handleRateTourGuide = async () => {
    try {
      const method = userTourGuideReview ? 'PUT' : 'POST';
      const url = userTourGuideReview
        ? `http://localhost:4000/${userRole}/tourguide/updateComment/${tourGuideProfile._id}`
        : `http://localhost:4000/${userRole}/tourguide/comment/${tourGuideProfile._id}`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('jwt')}`,
        },
        body: JSON.stringify({
          rating: tourGuideReview.rating,
          content: {
            liked: tourGuideReview.liked,
            disliked: tourGuideReview.disliked
          },
          isAnonymous: tourGuideReview.isAnonymous,
          date: new Date().toISOString(),
          username: tourGuideReview.isAnonymous ? 'Anonymous' : 'User'
        }),
      });
      if (!response.ok) throw new Error('Failed to submit tour guide review');
      setShowTourGuideReviewDialog(false);
      setTourGuideReview({
        rating: 0,
        liked: '',
        disliked: '',
        isAnonymous: false
      });
      window.location.reload();
    } catch (error) {
      console.error('Error submitting tour guide review:', error);
    }
  };

  const handleQuickRating = async (rating) => {
    try {
      const method = userComment ? 'PUT' : 'POST';
      const url = userComment
        ? `http://localhost:4000/${userRole}/itinerary/updateComment/${itinerary._id}`
        : `http://localhost:4000/${userRole}/itinerary/comment/${itinerary._id}`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('jwt')}`,
        },
        body: JSON.stringify({
          rating: rating,
          content: userComment ? userComment.content : { liked: '', disliked: '' },
          isAnonymous: userComment ? userComment.isAnonymous : false,
          date: new Date().toISOString(),
          username: userComment ? userComment.username : 'User'
        }),
      });
      if (!response.ok) throw new Error('Failed to submit rating');
      setQuickRating(rating);
      window.location.reload();
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const getTotalRatings = () => {
    return itinerary?.comments?.length || 0;
  };


  const getReviewsCount = () => {
    return itinerary?.comments?.filter(comment =>
      comment.content && (comment.content.liked || comment.content.disliked)
    ).length || 0;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsToastOpen(true);
    setOpen(false);
  };

  const calculateTotalPrice = () => {
    return (itinerary.price * numberOfTickets).toFixed(2);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out this itinerary: ${itinerary.title}`);
    const body = encodeURIComponent(`I thought you might be interested in this itinerary:\n\n${itinerary.title}\n\n${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpen(false); // Close the popover
  };

  const handleBookNowClick = () => {
    setShowBookingDialog(true);
    setBookingError("");
  };


  const handleBooking = async () => {
    setIsBooking(true);
    setBookingError("");
    try {
      const token = Cookies.get("jwt");
      const totalPrice = calculateTotalPrice();
      const response = await fetch(`http://localhost:4000/${userRole}/itineraryBooking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itinerary: id,
          paymentType,
          paymentAmount: totalPrice,
          numberOfTickets,
          date: selectedDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message === "Insufficient funds in wallet") {
          setBookingError("Insufficient funds, please choose a different payment method or update your wallet.");
        } else {
          throw new Error(errorData.message || "Failed to book itinerary");
        }
      } else {
        const data = await response.json();
        setShowBookingDialog(false);
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error("Error booking itinerary:", error);
      setBookingError(error.message || "An error occurred while booking. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };


  const navigate = useNavigate();

  useEffect(() => {
    scrollToTop();
  }, [isActivated]);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const fetchUsername = async (userId) => {
    try {
      const response = await fetch(`http://localhost:4000/${userRole}`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('jwt')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch username');
      }
      const data = await response.json();
      return data.username;
    } catch (error) {
      console.error("Error fetching username:", error);
      return "Unknown User";
    }
  };
  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const handleConfirmFlag = async () => {
    try {
      const updatedStatus = !isAppropriate; // Toggle status

      // Update the backend

      const token = Cookies.get("jwt");

      const response = await fetch(`http://localhost:4000/${userRole}/itineraries/${itinerary._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appropriate: updatedStatus, }),
      });


      setIsAppropriate(updatedStatus); // Update state to reflect the new status
      setDialogOpen(false); // Close the dialog

    } catch (error) {
      console.error("Failed to update itinerary status:", error);
    }
  };

  useEffect(() => {
    const fetchItineraryDetails = async () => {
      if (!id) {
        setError("Invalid itinerary ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = Cookies.get("jwt");

        const itineraryFetch = fetch(`http://localhost:4000/${userRole}/itineraries/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then(response => {
          if (!response.ok) {
            throw new Error("Failed to fetch itinerary details");
          }
          return response.json();
        });

        const userBookingsFetch = userRole === 'tourist' ? axios.get(`http://localhost:4000/${userRole}/touristItineraryAttendedBookings`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(response => response.data) : Promise.resolve([]);

        const [data, userBookings] = await Promise.all([itineraryFetch, userBookingsFetch]);

        setItinerary(data);
        setActivities(data.activities);
        setUserBookings(userBookings);

        if (data.tourGuide) {
          setTourGuideProfile({
            ...data.tourGuide,
            languages: ['English', 'Spanish', 'French'],
            specialties: ['Historical Tours', 'Food Tours', 'Adventure Tours'],
          });
        }

        setIsAppropriate(data.appropriate);
        setIsActivated(data.isActivated);

        if (token) {
          const decodedToken = jwtDecode.jwtDecode(token);
          setCanModify(decodedToken.id === data.tourGuide._id);
        }
        setError(null);
      } catch (err) {
        setError("Error fetching itinerary details. Please try again later.");
        console.error("Error fetching itinerary details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItineraryDetails();
  }, [id, userRole]);

  const isItineraryAvailable = () => {
    if (!itinerary.availableDates || itinerary.availableDates.length === 0) {
      return false; // No dates to check, assume not passed
    }

    const hasUpcomingDate = itinerary.availableDates.some(dateInfo => {
      const itineraryDate = new Date(dateInfo.date).setHours(0, 0, 0, 0);
      const currentDate = new Date().setHours(0, 0, 0, 0);

      const isFutureDate = itineraryDate >= currentDate;

      return isFutureDate;
    });

    return hasUpcomingDate;
  };

  const handleActivationToggle = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("jwt");
      setIsActivated(prevState => !prevState); // Immediately update the state
      const response = await fetch(`http://localhost:4000/${userRole}/itineraries-activation/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle activation');
      }

      const updatedItinerary = await response.json();

    } catch (error) {
      console.error('Error toggling activation:', error);
      setIsActivated(prevState => !prevState); // Revert the state if there's an error
      // Optionally, show an error message to the user
    }
    finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    navigate(`/update-itinerary/${id}`);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    setDeleteError(null);
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `http://localhost:4000/${userRole}/itineraries/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 || response.status === 403) {
          setDeleteError(errorData.message);
          return;
        }
        throw new Error("Failed to delete itinerary");
      }

      setShowDeleteSuccess(true);
    } catch (err) {
      setError("Error deleting itinerary. Please try again later.");
      console.error("Error deleting itinerary:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (newRating) => {
    setRating(newRating);
    setShowRatingSubmit(true);
  };

  const submitRating = async () => {
    try {
      const response = await fetch(`http://localhost:4000/${userRole}/tourguide/rate/${tourGuideProfile._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('jwt')}`,
        },
        body: JSON.stringify({ rating }),
      });
      if (!response.ok) throw new Error('Failed to submit rating');
      setShowRatingSubmit(false);
      window.location.reload();
      // Handle success (e.g., show a success message)
    } catch (error) {
      console.error('Error submitting rating:', error);
      // Handle error (e.g., show an error message)
    }
  };

  const handleAddReview = async () => {
    try {
      const newComment = {
        username: newReview.isAnonymous ? 'Anonymous' : 'User',
        rating: newReview.rating,
        content: {
          liked: newReview.liked,
          disliked: newReview.disliked
        },
        date: new Date(),
      };
      const response = await fetch(`http://localhost:4000/${userRole}/tourguide/comment/${tourGuideProfile._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('jwt')}`,
        },
        body: JSON.stringify(newComment),
      });
      if (!response.ok) throw new Error('Failed to submit review');
      setShowAddReview(false);
      setNewReview({
        rating: 0,
        liked: "",
        disliked: "",
        visitDate: '',
        isAnonymous: false
      });
      // Handle success (e.g., show a success message, refresh comments)
    } catch (error) {
      console.error('Error submitting review:', error);
      // Handle error (e.g., show an error message)
    }
  };

  const isReviewValid = () => {
    return (
      newReview.liked.trim() !== '' ||
      newReview.disliked.trim() !== '' ||
      newReview.rating > 0
    );
  };


  const handlePrevComment = () => {
    setCurrentCommentIndex(Math.max(0, currentCommentIndex - 3));
  };

  const handleNextComment = () => {
    setCurrentCommentIndex(Math.min(itinerary.comments.length - 3, currentCommentIndex + 3));
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
      return format(commentDate, 'MMM d, yyyy');
    }
  };

  const handleRateItinerary = async () => {
    try {
      const method = userComment ? 'PUT' : 'POST';
      const url = userComment
        ? `http://localhost:4000/${userRole}/itinerary/updateComment/${itinerary._id}`
        : `http://localhost:4000/${userRole}/itinerary/comment/${itinerary._id}`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('jwt')}`,
        },
        body: JSON.stringify({
          rating: itineraryRating,
          content: {
            liked: newReview.liked,
            disliked: newReview.disliked
          },
          isAnonymous: newReview.isAnonymous,
          date: new Date().toISOString(),
          username: newReview.isAnonymous ? 'Anonymous' : 'User'
        }),
      });
      if (!response.ok) throw new Error('Failed to submit itinerary rating');
      setShowRateItineraryDialog(false);
      setShowEditReview(false);
      setNewReview({
        rating: 0,
        liked: '',
        disliked: '',
        isAnonymous: false
      });
      setItineraryRating(0);
      window.location.reload();
    } catch (error) {
      console.error('Error submitting itinerary rating:', error);
    }
  };

  const handleActivityRating = async () => {
    try {
      const response = await fetch(`http://localhost:4000/${userRole}/itinerary/rate/${itinerary._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('jwt')}`,
        },
        body: JSON.stringify({
          rating: activityRating,
        }),
      });
      if (!response.ok) throw new Error('Failed to submit activity rating');
      setShowRatingDialog(false);
      setActivityRating(0);
      // Handle success (e.g., show a success message, refresh activity details)
    } catch (error) {
      console.error('Error submitting activity rating:', error);
      // Handle error (e.g., show an error message)
    }
  };



  if (loading) return <Loader />;


  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <button
        onClick={() => navigate('/all-itineraries')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <ChevronLeft className="w-5 h-5 mr-2" />
        Back to All Trip Plans
      </button>
      <nav className="bg-[#1a202c] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold text-white"></div>
          </div>
        </div>
      </nav>

      <div className="bg-[#1a202c] text-white py-20 px-4">
        <div className="container mx-auto text-center">

          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {itinerary.title}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-3/4">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-4xl font-bold">{itinerary.title}</h1>
                  <ToastProvider>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto">
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
                      <Toast onOpenChange={setIsToastOpen} open={isToastOpen} duration={3000}>
                        <ToastTitle>Link Copied</ToastTitle>
                        <ToastDescription>The link has been copied to your clipboard.</ToastDescription>
                        <ToastClose />
                      </Toast>
                    )}
                  </ToastProvider>
                </div>

                <div className="w-full h-[400px]">
                  <ImageGallery activities={itinerary.activities} />
                </div>

                <AvailableDatesSection availableDates={itinerary.availableDates} handleBookNowClick={handleBookNowClick} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

                <div className="flex flex-wrap gap-2 my-4">
                  {itinerary.activities.map((activity, index) =>
                    activity.category ? (
                      activity.category.map((cat, catIndex) => (
                        <Badge key={catIndex} variant="secondary">
                          {cat.name}
                        </Badge>
                      ))
                    ) : null
                  )}
                  {itinerary.activities.map((activity, index) =>
                    activity.tags ? (
                      activity.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline">
                          {tag.type}
                        </Badge>
                      ))
                    ) : null
                  )}
                </div>

                <div className="mt-8">
                  <h2 className="text-2xl font-semibold mb-4">Activities</h2>
                  <ActivityTimeline activities={itinerary.activities} />
                </div>

                {itinerary.location && (
                  <div className="mt-8">
                    <TimelinePreviewComponent />
                  </div>
                )}


              </div>
            </div>
          </div>



          <div className="lg:w-1/4">

            {tourGuideProfile && (
              <TourguideProfileCard
                profile={tourGuideProfile}
                ratingDistribution={tourGuideRatingDistribution}
                onReviewClick={() => setShowAllTourGuideReviews(true)}
                userRole={userRole}
                userBookings={userBookings}
                itinerary={itinerary}
                tourGuideRating={tourGuideRating}
                userTourGuideReview={userTourGuideReview}
                handleQuickTourGuideRating={handleQuickTourGuideRating}
                setShowTourGuideReviewDialog={setShowTourGuideReviewDialog}
                canModify={canModify}
                handleUpdate={handleUpdate}
                setShowDeleteConfirm={setShowDeleteConfirm}
                handleActivationToggle={handleActivationToggle}
                isActivated={isActivated}
                isItineraryAvailable={isItineraryAvailable}
                handleBookNowClick={handleBookNowClick}
                isAppropriate={isAppropriate}
                dialogOpen={dialogOpen}
                handleOpenDialog={handleOpenDialog}
                handleCloseDialog={handleCloseDialog}
                handleConfirmFlag={handleConfirmFlag}

              />
            )}







          </div>
        </div>

        <div className="mt-8 relative bg-white p-6 rounded-lg shadow-md">
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
                  {itinerary?.rating?.toFixed(1) || "0.0"}
                </div>
                <div className="text-sm text-gray-500">
                  out of 5
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {getTotalRatings()} Ratings
                </div>
              </div>

              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = ratingDistribution[stars] || 0;
                  const percentage = getTotalRatings()
                    ? Math.round((count / getTotalRatings()) * 100)
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
          </div>

          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
            <p className="text-sm text-gray-600 mb-4">
              {getTotalRatings()} overall ratings, {getReviewsCount()} with reviews
            </p>
            {itinerary.comments && itinerary.comments.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Button onClick={handlePrevComment} variant="ghost" disabled={currentCommentIndex === 0}>
                    <ChevronLeft />
                  </Button>
                  <div className="flex-1 flex justify-between px-4">
                    {itinerary.comments
                      .filter(
                        (comment) => (comment.content.liked || comment.content.disliked) || comment.tourist === userId
                      ) // Filter for comments with content or by the user
                      .slice(currentCommentIndex, currentCommentIndex + 3) // Slice after filtering
                      .map((comment, index) => (
                        <Card
                          key={index}
                          className={`w-[30%] ${comment.tourist === userId ? 'bg-[#B5D3D1]' : 'bg-gray-100'} shadow-none border-none p-4 rounded-lg`}
                        >
                          <CardHeader className="flex items-start">
                            <div className="flex">
                              <div className="flex items-center justify-center w-12 h-12 bg-gray-300 text-gray-700 rounded-full mr-4 text-xl font-bold">
                                {comment.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <CardTitle className="text-xl font-semibold">{comment.username}</CardTitle>
                                <p className="text-sm text-gray-500">{formatCommentDate(comment.date)}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <StarRating rating={comment.rating} readOnly={true} />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700 line-clamp-3">
                              {comment.content.liked || comment.content.disliked || "No comment provided"}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <a
                                href="#"
                                className="text-[#1A3B47] hover:underline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShowFullComment(comment);
                                }}
                              >
                                View more
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  <Button
                    onClick={handleNextComment}
                    variant="ghost"
                    disabled={currentCommentIndex >= itinerary.comments.length - 3}
                  >
                    <ChevronRight />
                  </Button>
                </div>

              </>
            ) : (
              <p>No comments yet.</p>
            )}


            {userBookings.some(booking => booking.itinerary?._id === itinerary._id) && userRole !== "admin" && !userComment && (
              <Button onClick={() => setShowRateItineraryDialog(true)} className="mt-4 mr-4">
                Add a Review
              </Button>
            )}
            {userComment && (
              <Button onClick={() => setShowEditReview(true)} className="mt-4 mr-4 bg-[#5D9297] hover:[#B5D3D1] ">
                Edit Your Review
              </Button>
            )}
          </div>
        </div>

        <Dialog open={showAllTourGuideReviews} onOpenChange={setShowAllTourGuideReviews}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>All Reviews for {tourGuideProfile?.username}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] overflow-auto">
              {tourGuideProfile?.comments.map((review, index) => (
                <Card
                  key={index}
                  className={`mb-4 ${review.tourist === userId ? 'bg-[#B5D3D1]' : ''}`} // Apply blue background if comment is from the logged-in user
                >
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{review.username}</CardTitle>
                      <StarRating rating={review.rating} readOnly={true} />
                    </div>
                    <CardDescription>{formatCommentDate(review.date)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <ThumbsUp className="mr-2 text-green-500 w-4 h-4" /> {/* Positive icon next to liked */}
                      <p><strong>Liked:</strong> {review.content.liked || "Not specified"}</p>
                    </div>
                    <div className="flex items-center mt-1">
                      <ThumbsDown className="mr-2 text-red-500 w-4 h-4" /> {/* Negative icon next to disliked */}
                      <p><strong>Disliked:</strong> {review.content.disliked || "Not specified"}</p>
                    </div>
                    {/* Edit Review Button, shown only for user's comments */}
                    {review.tourist === userId && ( // Check if the comment is from the logged-in user
                      <Button
                        onClick={() => setShowTourGuideReviewDialog(true)}
                        className="w-full mt-4"
                      >
                        Edit Review
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog open={showTourGuideReviewDialog} onOpenChange={setShowTourGuideReviewDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{userTourGuideReview ? 'Edit Your Review' : 'Write a Review for Tour Guide'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Your Rating</label>
                <StarRating rating={tourGuideReview.rating} setRating={(rating) => setTourGuideReview(prev => ({ ...prev, rating }))} />
              </div>
              <div>
                <label htmlFor="liked" className="block text-sm font-medium text-gray-700">
                  <Smile className="w-5 h-5 inline mr-2 text-green-500" />
                  Something you liked
                </label>
                <Textarea
                  id="liked"
                  value={tourGuideReview.liked}
                  onChange={(e) => setTourGuideReview(prev => ({ ...prev, liked: e.target.value }))}
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div>
                <label htmlFor="disliked" className="block text-sm font-medium text-gray-700">
                  <Frown className="w-5 h-5 inline mr-2 text-red-500" />
                  Something you didn't like
                </label>
                <Textarea
                  id="disliked"
                  value={tourGuideReview.disliked}
                  onChange={(e) => setTourGuideReview(prev => ({ ...prev, disliked: e.target.value }))}
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous-mode"
                  checked={tourGuideReview.isAnonymous}
                  onCheckedChange={(checked) => setTourGuideReview(prev => ({ ...prev, isAnonymous: checked }))}
                />
                <Label htmlFor="anonymous-mode">Post anonymously</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setShowTourGuideReviewDialog(false)}
                className="bg-gray-300 text-black hover:bg-gray-400 mr-2"
              >
                Cancel
              </Button>
              <Button
                className="border-[#5D9297] text-white bg-[#5D9297] hover:[#388A94]"
                onClick={handleRateTourGuide}
              >
                {userTourGuideReview ? 'Update Review' : 'Submit Review'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Itinerary</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this itinerary?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showDeleteSuccess}
          onOpenChange={(open) => {
            if (!open) {
              setShowDeleteSuccess(false);
              navigate("/all-itineraries");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <CheckCircle className="w-6 h-6 text-green-500 inline-block mr-2" />
                Itinerary Deleted
              </DialogTitle>
              <DialogDescription>
                The itinerary has been successfully deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="default"
                onClick={() => {
                  setShowDeleteSuccess(false);
                  navigate("/all-itineraries");
                }}
              >
                Back to All Itineraries
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
              <p>You have successfully booked {numberOfTickets} ticket(s) for {itinerary.title}.</p>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowSuccessDialog(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>






        <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Rate this Itinerary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Your Rating</label>
              <StarRating rating={activityRating} setRating={setActivityRating} />
            </div>
            <DialogFooter>
              <Button onClick={handleActivityRating}>Submit My Rating</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <Dialog open={showRateItineraryDialog || showEditReview} onOpenChange={() => {
          setShowRateItineraryDialog(false);
          setShowEditReview(false);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{userComment ? 'Edit Your Review' : 'Write a Review for Itinerary'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Your Rating</label>
                <StarRating rating={itineraryRating} setRating={setItineraryRating} />
              </div>
              <div>
                <label htmlFor="liked" className="block text-sm font-medium text-gray-700">
                  <Smile className="w-5 h-5 inline mr-2 text-green-500" />
                  Something you liked
                </label>
                <Textarea
                  id="liked"
                  value={newReview.liked}
                  onChange={(e) => setNewReview(prev => ({ ...prev, liked: e.target.value }))}
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div>
                <label htmlFor="disliked" className="block text-sm font-medium text-gray-700">
                  <Frown className="w-5 h-5 inline mr-2 text-red-500" />
                  Something you didn't like
                </label>
                <Textarea
                  id="disliked"
                  value={newReview.disliked}
                  onChange={(e) => setNewReview(prev => ({ ...prev, disliked: e.target.value }))}
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous-mode"
                  checked={newReview.isAnonymous}
                  onCheckedChange={(checked) => setNewReview(prev => ({ ...prev, isAnonymous: checked }))}
                />
                <Label htmlFor="anonymous-mode">Post anonymously</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setShowRateItineraryDialog(false);
                  setShowEditReview(false);
                  setNewReview({
                    rating: userComment ? userComment.rating : 0,
                    liked: userComment ? userComment.content.liked : "",
                    disliked: userComment ? userComment.content.disliked : "",
                    isAnonymous: userComment.username === 'Anonymous',
                  });
                }}
                className="bg-gray-300 text-black hover:bg-gray-400 ml-2"
              >
                Cancel
              </Button>

              <Button
                className="bg-[#5D9297] hover:[#388A94] border-[#5D9297] text-white "
                onClick={handleRateItinerary}
              >
                {userComment ? 'Update Review' : 'Submit Review'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



        <Dialog open={!!showFullComment} onOpenChange={() => setShowFullComment(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{showFullComment?.username}'s Review</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] overflow-auto">
              <div className="space-y-4">
                <div>
                  <StarRating rating={showFullComment?.rating} readOnly={true} />
                  <p className="text-sm text-gray-500 mt-1">
                    {showFullComment && formatCommentDate(showFullComment.date)}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold flex items-center">
                    <Smile className="w-5 h-5 mr-2 text-green-500" />
                    Liked:
                  </h4>
                  <p>{showFullComment?.content?.liked || "Nothing mentioned"}</p>
                </div>
                <div>
                  <h4 className="font-semibold flex items-center">
                    <Frown className="w-5 h-5 mr-2 text-red-500" />
                    Disliked:
                  </h4>
                  <p>{showFullComment?.content?.disliked || "Nothing mentioned"}</p>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ItineraryDetail;