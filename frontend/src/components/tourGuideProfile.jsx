import React, { useEffect, useState } from "react";
// import { ObjectId } from "mongodb";
import axios from "axios";
import Cookies from "js-cookie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  format,
  subDays,
  subMonths,
  subYears,
  addDays,
  addMonths,
  addYears,
  startOfYear,
  formatDistanceToNow,
} from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import PasswordChanger from "@/components/Passwords";
import { Separator } from "@/components/ui/separator";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa"; // Thumbs up and down icons for liked and disliked
import Flag from "react-world-flags";
import {
  XCircle,
  CheckCircle,
  ChevronLeft,
  Calendar,
  MapPin,
  Users,
  User,
  Mail,
  Phone,
  AtSign,
  Briefcase,
  Plus,
  DollarSign,
  Globe,
  Accessibility,
  Star,
  Edit,
  Trash2,
  Award,
  Clock,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Send,
  Tag,
  Smile,
  Frown,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  UserRound,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import PhoneInput from "react-phone-input-2";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { ImageCropper } from "@/components/ImageCropper";
import { Modal } from "@/components/Modal";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const phoneValidator = (value) => {
  // Check if the input starts with a "+"

  const phoneNumber = parsePhoneNumberFromString("+" + value);

  if (!phoneNumber || !phoneNumber.isValid()) {
    return false;
  }
  return true;
};

const convertUrlToBase64 = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

const StarRating = ({ rating, readOnly = true }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${readOnly ? "" : "cursor-pointer"} ${
            star <= rating ? "text-[#1A3B47] fill-current" : "text-gray-300"
          }`}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        />
      ))}
    </div>
  );
};

const PreviousWorks = ({ works, onEdit, onRemove, onAdd, onView }) => {
  return (
    <Card className="col-span-5 outline-none shadow-none border-white">
      <CardHeader className="flex">
        <CardTitle className="flex justify-between items-center">
          <span>Work History</span>
          <Button
            onClick={onAdd}
            variant="outline"
            size="sm"
            className="bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Add More
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="bg-gray-50 rounded-lg">
        <ScrollArea className="max-h-[200px] overflow-y-auto pt-1">
          {works.length === 0 ? (
            <p className="text-[#1A3B47] p-4 text-center">
              No works to display yet.
            </p>
          ) : (
            <ul className="divide-y p-0 divide-gray-200">
              {works.map((work, index) => (
                <li
                  key={index}
                  className="p-3 bg-white rounded-lg mb-3 shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold">{work.title}</h3>
                    <p className="text-sm text-gray-500">{work.company}</p>
                    <p className="text-sm text-gray-500">{work.duration}</p>
                    <p className="text-sm">
                      {work.description.substring(0, 25)}...
                    </p>
                  </div>
                  <div className=" pt-1 mt-3 border-t border-gray-100">
                    <div className="flex justify-between w-full">
                      <Button
                        onClick={() => onView(index)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 p-0 hover:bg-white hover:text-[#1A3B47]"
                      >
                        View
                      </Button>
                      <Button
                        onClick={() => onEdit(index)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 p-0 hover:bg-white hover:text-[#1A3B47]"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => onRemove(index)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 p-0 hover:bg-white hover:text-red-600"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

const Comments = ({ comments, tourGuide }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [isAllCommentsPopupOpen, setIsAllCommentsPopupOpen] = useState(false);
  const [filteredRating, setFilteredRating] = useState(0);

  const [filteredReviews, setFilteredReviews] = useState(comments);
  const [expandedCommentIndex, setExpandedCommentIndex] = useState(null);

  const filteredComments = comments.map((comment) => ({
    ...comment,
    content: {
      liked: comment.content.liked || "No comment provided",
      disliked: comment.content.disliked || "No comment provided",
    },
  }));

  const handleFilterRating = (rating, comments) => {
    setFilteredRating(rating);
    // If rating is 0, show all reviews; otherwise, filter by the selected rating
    if (rating === 0) {
      setFilteredReviews(filteredComments);
    } else {
      setFilteredReviews(
        filteredComments.filter((comment) => comment.rating === rating)
      );
    }
  };

  const handleToggleComment = (index) => {
    setExpandedCommentIndex((prevIndex) =>
      prevIndex === index ? null : index
    );
  };

  const handleCommentClick = (comment) => {
    setSelectedComment(comment);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedComment(null);
  };

  const openAllCommentsPopup = () => {
    setIsAllCommentsPopupOpen(true);
  };

  const closeAllCommentsPopup = () => {
    setIsAllCommentsPopupOpen(false);
  };

  return (
    <Card className="col-span-6 h-full">
      <CardHeader className="flex">
        <CardTitle className="flex justify-between items-center">
          <span>Reviews ({filteredComments.length})</span>
          <Button
            variant="ghost"
            className="text-sm text-[#388A94] p-2"
            onClick={openAllCommentsPopup}
          >
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[200px] overflow-y-auto pt-1">
          {filteredComments.length === 0 ? (
            <p className="text-[#1A3B47] p-4 text-center">
              No comments to display yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-300">
              {filteredComments.map((comment, index) => (
                <li
                  key={index}
                  className="p-2 transition-colors relative cursor-pointer hover:bg-gray-100"
                  onClick={() => handleCommentClick(comment)}
                >
                  <div className="mb-3">
                    {/* Top part of the comment with profile pic, username, date, and rating */}
                    <div className="flex items-center justify-between mr-2">
                      <div className="flex items-center ">
                        {/* Conditionally render the profile picture or fallback UserRound component */}
                        {comment.tourist?.profilePicture ? (
                          <img
                            src={comment.tourist.profilePicture.url}
                            alt="Tourist"
                            className="w-9 h-9 rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-9 h-9 flex items-center justify-center bg-gray-300 rounded-full mr-2">
                            <UserRound
                              strokeWidth={2.25}
                              className="text-white w-5 h-5"
                            />
                          </div>
                        )}
                        {/* Username and Date under the username */}
                        <div>
                          <h3 className="text-base font-semibold">
                            {comment.username}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {formatCommentDate(comment.date)}
                          </p>
                        </div>
                      </div>
                      {/* Rating on the right side */}
                      <StarRating rating={comment.rating} />
                    </div>

                    {/* Display Liked or Disliked content (truncated to 20 chars and add "..." if more than 20 characters) */}
                    <p className="text-sm mt-2">
                      {(comment.content.liked || comment.content.disliked)
                        .length > 20
                        ? (
                            comment.content.liked || comment.content.disliked
                          ).substring(0, 20) + "..."
                        : comment.content.liked || comment.content.disliked}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {/* Popup */}
        {isPopupOpen && selectedComment && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full relative">
              {/* Close button */}
              <button
                onClick={closePopup}
                className="absolute top-2 right-2 text-gray-600 text-xl"
              >
                &times;
              </button>

              {/* Profile Picture and Username with Date */}
              <div className="flex items-center mb-3">
                {/* Profile Picture */}
                {selectedComment.tourist?.profilePicture ? (
                  <img
                    src={selectedComment.tourist.profilePicture.url}
                    alt="Tourist"
                    className="w-12 h-12 rounded-full mr-3"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-300 rounded-full mr-3">
                    <UserRound
                      strokeWidth={2.25}
                      className="text-white w-7 h-7"
                    />
                  </div>
                )}
                {/* Username and Date */}
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedComment.username}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatCommentDate(selectedComment.date)}
                  </p>
                </div>
                {/* Rating on the right */}
                <div className="ml-auto">
                  <StarRating rating={selectedComment.rating} />
                </div>
              </div>

              {/* Gray Line */}
              <div className="border-t border-gray-300 my-3"></div>

              {/* Liked/Disliked Content with Icons */}
              <div>
                <p className="flex items-center">
                  <ThumbsUp className="text-green-500 mr-2 w-4 h-4" />
                  <strong className="mr-2">Liked: </strong>{" "}
                  {selectedComment.content.liked}
                </p>
                <p className="flex items-center mt-2">
                  <ThumbsDown className="text-red-500 mr-2 w-4 h-4" />
                  <strong className="mr-2">Disliked: </strong>{" "}
                  {selectedComment.content.disliked}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* All Comments Popup */}
        {isAllCommentsPopupOpen && (
          <Dialog
            open={isAllCommentsPopupOpen}
            onOpenChange={setIsAllCommentsPopupOpen}
          >
            <DialogContent className="max-w-2xl p-6">
              <DialogHeader>
                <DialogTitle>All Reviews</DialogTitle>
                <DialogDescription>
                  <div className="text-center my-4">
                    <span className="text-gray-500 uppercase text-sm">
                      Overall
                    </span>
                    <div className="flex justify-center items-center">
                      <span className="text-4xl font-bold">
                        {tourGuide.rating ? tourGuide.rating.toFixed(1) : 0}
                      </span>
                      <div className="ml-2 flex items-center">
                        {[...Array(5)].map((_, i) => {
                          if (i < Math.floor(tourGuide.rating)) {
                            return (
                              <Star
                                key={i}
                                className="w-6 h-6 text-[#1A3B47]"
                              />
                            );
                          } else if (
                            i === Math.floor(tourGuide.rating) &&
                            tourGuide.rating % 1 >= 0.5
                          ) {
                            return (
                              <StarHalf
                                key={i}
                                className="w-6 h-6 text-[#1A3B47]"
                              />
                            );
                          } else {
                            return (
                              <Star key={i} className="w-6 h-6 text-gray-300" />
                            );
                          }
                        })}
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-gray-600">
                      {tourGuide.allRatings
                        ? `${tourGuide.allRatings.length} Ratings`
                        : "No Ratings Yet"}
                    </p>
                    <hr className="my-4 border-t border-gray-300" />
                  </div>

                  {/* Filter by Rating Buttons */}
                  <div className="flex justify-center space-x-2 mb-4">
                    <button
                      className={`px-3 py-2 rounded-md ${
                        filteredRating === 0
                          ? "bg-[#388A94] text-white"
                          : "bg-gray-200"
                      }`}
                      onClick={() => handleFilterRating(0, tourGuide.comments)}
                    >
                      All
                    </button>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <button
                        key={star}
                        className={`px-3 py-2 rounded-md ${
                          filteredRating === star
                            ? "bg-[#388A94] text-white"
                            : "bg-gray-200"
                        }`}
                        onClick={() =>
                          handleFilterRating(star, tourGuide.comments)
                        }
                      >
                        {star} Star{star > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                </DialogDescription>
              </DialogHeader>

              {/* Reviews List */}
              <div className="space-y-6 max-h-[40vh] overflow-y-auto">
                {filteredReviews?.length > 0 ? (
                  filteredReviews.map((review, index) => (
                    <div key={index} className="flex space-x-4 border-b pb-4">
                      <Avatar>
                        <AvatarFallback>{review.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold">
                            {review.username}
                          </h4>
                          <StarRating rating={review.rating} />
                        </div>

                        {/* Show the first 50 characters of the comment and a "Show more" link */}
                        <p className="text-gray-600 mt-1">
                          {expandedCommentIndex === index ? (
                            // Show both liked and disliked content when expanded
                            <>
                              <span>{review.content.liked}</span>
                              <br />
                              <span>{review.content.disliked}</span>
                            </>
                          ) : (
                            // Show only liked content when not expanded
                            review.content.liked
                          )}
                        </p>

                        {/* Only show "Show more" if the comment length exceeds 100 characters */}
                        {review.content.liked && review.content.disliked && (
                          <button
                            onClick={() => handleToggleComment(index)}
                            className="text-blue-500 mt-2 hover:underline"
                          >
                            {expandedCommentIndex === index
                              ? "Show less"
                              : "Show more"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    No reviews for this rating.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  className="bg-[#1A3B47]"
                  onClick={() => setIsAllCommentsPopupOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

const formatCommentDate = (date) => {
  const commentDate = new Date(date);

  if (isNaN(commentDate.getTime())) {
    return "Date unavailable";
  }

  const now = new Date();
  const diffInDays = Math.floor((now - commentDate) / (1000 * 60 * 60 * 24));

  if (diffInDays < 30) {
    return formatDistanceToNow(commentDate, { addSuffix: true });
  } else {
    return format(commentDate, "MMM d, yyyy");
  }
};

export function TourGuideProfileComponent() {
  const [tourGuide, setTourGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTourGuide, setEditedTourGuide] = useState(null);
  const [validationMessages, setValidationMessages] = useState({});
  const [nationalities, setNationalities] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newImage, setNewImage] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const [currentCommentIndex, setCurrentCommentIndex] = useState(0);
  const [showFullComment, setShowFullComment] = useState(false);
  const [base64Image, setBase64Image] = useState(null);

  const [currentWork, setCurrentWork] = useState({
    title: "",
    company: "",
    duration: "",
    description: "",
  });
  const [showWorkDialog, setShowWorkDialog] = useState(false);
  const [currentWorkIndex, setCurrentWorkIndex] = useState(null);

  const [isViewWorkDialogOpen, setIsViewWorkDialogOpen] = useState(false);
  const [viewedWork, setViewedWork] = useState(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const [isPreviousWorksPopupOpen, setIsPreviousWorksPopupOpen] =
    useState(false);

  const handlePreviousWorksClick = () => {
    setIsPreviousWorksPopupOpen(true);
  };

  const closePreviousWorksPopup = () => {
    setIsPreviousWorksPopupOpen(false);
  };

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  const handlePasswordChangeSuccess = (message) => {
    setIsPasswordModalOpen(false);
    setToastMessage(message);
    setIsToastOpen(true);
  };

  const handleViewWork = (index) => {
    setViewedWork(editedTourGuide.previousWorks[index]);
    setIsViewWorkDialogOpen(true);
  };

  const handleCloseViewWork = () => {
    setIsViewWorkDialogOpen(false);
    setViewedWork(null);
  };

  const handleAddWork = () => {
    setCurrentWork({ title: "", company: "", duration: "", description: "" });
    setCurrentWorkIndex(null);
    setShowWorkDialog(true);
  };

  const handleEditWork = (index) => {
    setCurrentWork({ ...editedTourGuide.previousWorks[index] });
    setCurrentWorkIndex(index);
    setShowWorkDialog(true);
  };

  const handlePrevComment = () =>
    setCurrentCommentIndex((prev) => Math.max(0, prev - 3));
  const handleNextComment = () =>
    setCurrentCommentIndex((prev) =>
      Math.min(tourGuide.comments.length - 3, prev + 3)
    );

  const getUserRole = () => {
    let role = Cookies.get("role");
    if (!role) role = "guest";
    return role;
  };

  const [notifications, setNotifications] = useState([]);
  const [hasUnseenNotifications, setHasUnseenNotifications] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkUnseenNotifications();
    fetchNotifications();
  }, []);

  const checkUnseenNotifications = async () => {
    try {
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/tour-guide/unseen-notifications`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setHasUnseenNotifications(response.data.hasUnseen);
    } catch (error) {
      console.error("Error checking unseen notifications:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/tour-guide/notifications`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );

      if (Array.isArray(response.data)) {
        setNotifications(response.data.slice(0, 5));
      } else if (response.data && Array.isArray(response.data.notifications)) {
        setNotifications(response.data.notifications.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsSeen = async (notificationID) => {
    try {
      await axios.post(
        `https://trip-genie-apis.vercel.app/tour-guide/notifications/markAsSeen/${notificationID}`,
        {},
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          seen: true,
        }))
      );
      setHasUnseenNotifications(false);
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  useEffect(() => {
    const fetchTourGuideProfile = async () => {
      try {
        const token = Cookies.get("jwt");
        const role = getUserRole();

        const api = `https://trip-genie-apis.vercel.app/${role}`;
        const response = await axios.get(api, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        response.data.mobile = response.data.mobile.slice(1); // Remove the "+" sign from the mobile number
        setTourGuide(response.data);
        setEditedTourGuide(response.data);
        setProfilePicture(response.data.profilePicture);

        if (response.data.profilePicture && response.data.profilePicture.url) {
          convertUrlToBase64(response.data.profilePicture.url).then(
            (base64) => {
              setBase64Image(base64);
            }
          );
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTourGuideProfile();
  }, []);

  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/api/nationalities"
        );
        setNationalities(response.data);
      } catch (error) {
        console.error("Error fetching nationalities:", error);
      }
    };
    fetchNationalities();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } =
      e && e.target ? e.target : { name: "mobile", value: e };
    setEditedTourGuide((prev) => ({ ...prev, [name]: value }));
    setValidationMessages((prev) => ({ ...prev, [name]: "" }));
  };

  // const handlePictureUpload = (e) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setProfilePicture(reader.result);
  //       setEditedTourGuide((prev) => ({
  //         ...prev,
  //         profilePicture: reader.result,
  //       }));
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const handleNationalityChange = (value) => {
    // const objectId = new ObjectId(value); // Convert string to ObjectId
    setEditedTourGuide((prev) => ({ ...prev, nationality: value }));
    setValidationMessages((prev) => ({ ...prev, nationality: "" }));
  };

  const handleDiscard = () => {
    setEditedTourGuide(tourGuide);
    setProfilePicture(tourGuide.profilePicture);
    setDropdownOpen(false);
    setIsEditing(false);
  };

  const validateFields = () => {
    const { name, username, email, mobile, yearsOfExperience, nationality } =
      editedTourGuide;
    const messages = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{7,15}$/;

    if (!name) messages.name = "Name is required.";
    if (!username) messages.username = "Username is required.";
    if (!email) {
      messages.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      messages.email = "Invalid email format.";
    }
    if (!mobile) {
      messages.mobile = "Phone number is required.";
    } else if (!phoneValidator(mobile)) {
      messages.mobile = "Invalid phone number.";
    }
    if (yearsOfExperience === undefined || yearsOfExperience === null) {
      messages.yearsOfExperience = "Years of experience is required.";
    } else if (yearsOfExperience < 0 || yearsOfExperience > 50) {
      messages.yearsOfExperience =
        "Years of experience must be between 0 and 50.";
    }
    if (!nationality) messages.nationality = "Nationality is required.";

    setValidationMessages(messages);
    return Object.keys(messages).length === 0;
  };

  const handleUpdate = async (newWorks = editedTourGuide.previousWorks) => {
    if (!validateFields()) {
      return;
    }

    try {
      const token = Cookies.get("jwt");
      const role = getUserRole();
      const { username, email, mobile, yearsOfExperience, nationality, name } =
        editedTourGuide;

      const formData = new FormData();
      formData.append("name", name);
      profilePicture &&
        formData.append("profilePicture", JSON.stringify(profilePicture));
      formData.append("username", username);
      formData.append("email", email);
      formData.append("mobile", "+" + mobile);
      formData.append("yearsOfExperience", yearsOfExperience);

      // Append old nationality if no nationality is provided
      const nationalityToAppend = nationality._id || nationality;
      formData.append("nationality", nationalityToAppend);

      // If newWorks is provided and has items, append newWorks; otherwise, append previousWorks
      const worksToAppend =
        newWorks && newWorks.length > 0
          ? newWorks
          : editedTourGuide.previousWorks;
      formData.append("previousWorks", JSON.stringify(worksToAppend));

      const api = `https://trip-genie-apis.vercel.app/${role}`;
      const response = await axios.put(api, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedTourGuide = response.data.tourGuide;
      updatedTourGuide.mobile = updatedTourGuide.mobile.slice(1);
      setTourGuide(updatedTourGuide);
      setEditedTourGuide(updatedTourGuide);
      setIsEditing(false);
      setError("");
      showToast("Profile updated successfully.", "success");
    } catch (err) {
      handleUpdateError(err);
    }
  };

  const handleUpdateError = (err) => {
    if (err.response?.data?.message === "Email already exists") {
      setValidationMessages({ email: "Email already exists" });
    } else if (err.response?.data?.message === "Username already exists") {
      setValidationMessages({ username: "Username already exists" });
    } else {
      showToast("Error updating profile. Please try again later.", "error");
    }
  };

  const handleRemoveWork = (index) => {
    const newWorks = [...editedTourGuide.previousWorks];
    newWorks.splice(index, 1);
    setEditedTourGuide((prev) => ({ ...prev, previousWorks: newWorks }));
    handleUpdate(newWorks);
  };

  const handleSaveWork = () => {
    if (currentWork.title && currentWork.company && currentWork.duration) {
      const newWorks = [...(editedTourGuide.previousWorks || [])];
      if (currentWorkIndex !== null) {
        newWorks[currentWorkIndex] = currentWork;
      } else {
        newWorks.push(currentWork);
      }
      setEditedTourGuide((prev) => ({ ...prev, previousWorks: newWorks }));
      setShowWorkDialog(false);
      setCurrentWorkIndex(null);
      handleUpdate(newWorks);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const openModal = () => {
    setModalOpen(true);
    setDropdownOpen(false); // Close the dropdown when opening the modal
  };

  const handleUpdateClick = () => {
    setShowModal(true);
    setDropdownOpen(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalOpen(false);
    setImageModalOpen(false);
  };

  const handleImageCropped = (newImage) => {
    setNewImage(newImage);
  };

  const handleFirstSave = () => {
    setProfilePicture(newImage);
    setShowModal(false);
  };

  const [graphPeriod, setGraphPeriod] = useState("week");
  const [graphData, setGraphData] = useState([]);
  const [reportData, setReportData] = useState(null);

  const fetchItineraryReport = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/tour-guide/itineraries-report`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReportData(response.data);
      console.log(response.data);
      if (response.data && response.data.itineraryReport) {
        updateGraphData(response.data.itineraryReport, graphPeriod);
      }
    } catch (error) {
      console.error("Error fetching itinerary report:", error);
    }
  };

  const updateGraphData = (reportData, period) => {
    console.log(reportData);
    if (!Array.isArray(reportData)) {
      console.error("Invalid report data:", reportData);
      return;
    }
    const now = new Date();
    let startDate, dateFormat, groupingFunction, data;

    switch (period) {
      case "week":
        startDate = subDays(now, 6);
        dateFormat = "EEE";
        groupingFunction = (date) => format(date, "yyyy-MM-dd");
        data = Array.from({ length: 7 }, (_, i) => ({
          date: format(addDays(startDate, i), dateFormat),
          tickets: 0,
          revenue: 0,
        }));
        break;
      case "year":
        startDate = startOfYear(now);
        dateFormat = "MMM";
        groupingFunction = (date) => format(date, "yyyy-MM");
        data = Array.from({ length: 12 }, (_, i) => ({
          date: format(addMonths(startDate, i), dateFormat),
          tickets: 0,
          revenue: 0,
        }));
        break;
      case "all":
        startDate = subYears(now, 7);
        dateFormat = "yyyy";
        groupingFunction = (date) => format(date, "yyyy");
        data = Array.from({ length: 8 }, (_, i) => ({
          date: format(addYears(startDate, i), dateFormat),
          tickets: 0,
          revenue: 0,
        }));
        break;
    }

    reportData.forEach((item) => {
      const date = new Date(item.itinerary.createdAt);
      if (date >= startDate && date <= now) {
        const key = groupingFunction(date);
        const index = data.findIndex(
          (d) => d.date === format(date, dateFormat)
        );
        if (index !== -1) {
          data[index].tickets += item.tickets;
          data[index].revenue += item.revenue;
        }
      }
    });
    console.log(data);

    setGraphData(data);
  };

  useEffect(() => {
    fetchItineraryReport();
  }, []);

  useEffect(() => {
    if (reportData && reportData.itineraryReport) {
      updateGraphData(reportData.itineraryReport, graphPeriod);
    }
  }, [graphPeriod, reportData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!tourGuide) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold">
          No tour guide profile information is available.
        </p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div>
        <h1 className="text-3xl font-bold mb-2">Account</h1>
        <p className="text-sm text-gray-500 mb-2">
          Settings and Privacy / Account
        </p>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Profile Picture and Info Card - 8 columns */}
            <Card className="col-span-8 h-full">
              <CardContent className="py-6">
                <div className="flex items-center justify-center">
                  {/* Profile Picture Section */}
                  <div className="w-1/3 flex flex-col items-center">
                    <div className="relative mb-4">
                      <button
                        className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center relative"
                        onClick={() => {
                          if (isEditing) {
                            toggleDropdown(); // Toggle dropdown if editing
                          } else {
                            setIsImageViewerOpen(true); // Open image viewer if no profile picture
                          }
                        }}
                        disabled={!profilePicture && !isEditing} // Disable if no profile picture and not editing
                      >
                        {profilePicture ? (
                          <img
                            src={profilePicture.url || profilePicture} // Use profile picture URL if available
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-gray-400" />
                        )}

                        {isEditing && (
                          <div className="h-24 w-24 absolute bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs text-center">
                              Edit Profile Picture
                            </span>
                          </div>
                        )}
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-32">
                          <ul className="py-2">
                            {profilePicture && (
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-center"
                                onClick={() => {
                                  setIsImageViewerOpen(true);
                                  setDropdownOpen(false);
                                }}
                              >
                                View
                              </li>
                            )}
                            {isEditing && (
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-center"
                                onClick={handleUpdateClick}
                              >
                                Update
                              </li>
                            )}
                            {isEditing && profilePicture && (
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500 text-center"
                                onClick={() => {
                                  setProfilePicture(null);
                                  setDropdownOpen(false);
                                }}
                              >
                                Delete
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-center mb-2">
                      <div className="flex flex-col items-center gap-2">
                        {isEditing ? (
                          <div className="flex flex-col items-center">
                            <Input
                              type="text"
                              name="username"
                              value={editedTourGuide.username}
                              onChange={handleInputChange}
                              className={
                                validationMessages.username
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {validationMessages.username && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationMessages.username}
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            <StarRating rating={tourGuide?.rating} />
                            <div className="flex flex-col items-center">
                              <div className="flex items-center">
                                {tourGuide?.isAccepted ? (
                                  <UserRoundCheck className="w-5 h-5 text-[#388A94]" />
                                ) : (
                                  <UserRoundX className="w-5 h-5 text-[#F88C33]" />
                                )}
                                <h2 className="text-xl font-bold ml-1">
                                  {tourGuide?.username}
                                </h2>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="flex flex-col items-center mt-2">
                          <Input
                            type="email"
                            name="email"
                            value={editedTourGuide.email}
                            onChange={handleInputChange}
                            className={
                              validationMessages.email ? "border-red-500" : ""
                            }
                          />
                          {validationMessages.email && (
                            <p className="text-red-500 text-xs mt-1">
                              {validationMessages.email}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">
                          {tourGuide?.email}
                        </p>
                      )}
                    </div>
                    <Separator />
                    {isEditing ? (
                      <div className="flex flex-col w-full max-w-[200px] ">
                        <Button
                          onClick={handleUpdate}
                          className="w-full mt-2 bg-[#388A94] hover:bg-[#2e6b77]"
                        >
                          Update
                        </Button>
                        <Button
                          onClick={handleDiscard}
                          variant="outline"
                          className="w-full mt-2 hover:bg-gray-200 bg-gray-100"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="w-full mt-2 text-sm hover:bg-gray-200 bg-gray-100"
                        >
                          Edit Profile
                        </Button>
                        <Button
                          onClick={() => setIsPasswordModalOpen(true)}
                          className="p-2 w-full mt-2 bg-[#1A3B47]"
                        >
                          Change Password
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Vertical Separator */}
                  <div className="border-r border-gray-200 h-[260px] mx-2"></div>

                  {/* Profile Info Section */}
                  <div className="w-2/3 pl-4 space-y-3">
                    {/* Row 1 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        {isEditing ? (
                          <div>
                            <Input
                              type="text"
                              name="name"
                              value={editedTourGuide.name}
                              onChange={handleInputChange}
                              className={
                                validationMessages.name ? "border-red-500" : ""
                              }
                            />
                            {validationMessages.name && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationMessages.name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-medium">
                            {tourGuide?.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">
                          Years of Experience
                        </p>
                        {isEditing ? (
                          <div>
                            <Input
                              type="number"
                              name="yearsOfExperience"
                              value={editedTourGuide.yearsOfExperience}
                              onChange={handleInputChange}
                              className={
                                validationMessages.yearsOfExperience
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {validationMessages.yearsOfExperience && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationMessages.yearsOfExperience}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-medium">
                            {tourGuide?.yearsOfExperience} years
                          </p>
                        )}
                      </div>
                    </div>
                    <Separator />

                    {/* Row 2 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Phone Number</p>
                        {isEditing ? (
                          <div className="relative">
                            <PhoneInput
                              country="eg"
                              value={editedTourGuide.mobile}
                              onChange={(value) =>
                                handleInputChange({
                                  target: { name: "mobile", value },
                                })
                              }
                              inputProps={{
                                name: "mobile",
                                required: true,
                                className: `w-full pt-2 pb-2 pl-11 text-sm ${
                                  validationMessages.mobile
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`,
                              }}
                              containerClass="w-full"
                              disableDropdown={false}
                            />
                            {validationMessages.mobile && (
                              <span className="text-red-500 text-xs">
                                {validationMessages.mobile}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-medium">
                            +{tourGuide?.mobile}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Nationality</p>
                        {isEditing ? (
                          <Select onValueChange={handleNationalityChange}>
                            <SelectTrigger
                              className={
                                validationMessages.nationality
                                  ? "border-red-500"
                                  : ""
                              }
                            >
                              <SelectValue
                                placeholder={tourGuide?.nationality.name}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {nationalities.map((nat) => (
                                <SelectItem key={nat._id} value={nat._id}>
                                  <div className="flex items-center gap-2">
                                    <Flag
                                      code={nat.countryCode}
                                      style={{
                                        width: 25,
                                        height: 17,
                                        borderRadius: "4px",
                                        overflow: "hidden",
                                      }}
                                    />
                                    {nat.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm font-medium">
                            {tourGuide?.nationality.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="mt-4">
                      <button
                        onClick={handlePreviousWorksClick}
                        className="bg-[#388A94] hover:bg-[#2e6b77] w-full text-white px-4 py-2 rounded-md transition-colors"
                      >
                        View Previous Works
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-4 h-full ">
              <CardHeader className="flex">
                <CardTitle className="flex justify-between items-center">
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      className="text-sm text-[#388A94] p-2"
                      onClick={() =>
                        (window.location.href = "/account/notifications")
                      }
                    >
                      View All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col max-h-[230px] overflow-y-auto">
                  {loading ? (
                    // Skeleton Loader for Notifications
                    <div className="space-y-4 p-4">
                      {[...Array(5)].map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 animate-pulse"
                        >
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>{" "}
                          {/* Placeholder for profile image */}
                          <div className="flex flex-col gap-2">
                            <div className="w-40 h-4 bg-gray-200 rounded-md"></div>{" "}
                            {/* Placeholder for notification body */}
                            <div className="w-24 h-3 bg-gray-200 rounded-md"></div>{" "}
                            {/* Placeholder for notification timestamp */}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="text-[#1A3B47] p-4 text-center">
                      No notifications at the moment.
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {notifications.slice(0, 10).map((notification, index) => (
                        <li
                          key={index}
                          className="p-2 hover:bg-gray-50 transition-colors relative cursor-pointer flex flex-col gap-1"
                          onClick={() => {
                            markNotificationAsSeen(notification._id),
                              navigate("/account/notifications");
                          }}
                        >
                          {!notification.seen && (
                            <span className="absolute top-2 right-2 bg-[#F88C33] text-white text-xs px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                          <div
                            className="text-[#1A3B47] text-sm truncate"
                            dangerouslySetInnerHTML={{
                              __html: notification.body.slice(0, 30) + "...", // Show first 30 characters
                            }}
                          ></div>
                          <p className="text-xs text-gray-500">
                            {formatDate(notification.date)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Previous Works - 4 columns */}
            {/* <PreviousWorks
        works={editedTourGuide?.previousWorks || []}
        onEdit={handleEditWork}
        onRemove={handleRemoveWork}
        onAdd={handleAddWork}
        onView={handleViewWork}
      /> */}

            <div className="col-span-6 ">
              <Comments
                comments={tourGuide?.comments || []}
                tourGuide={tourGuide}
              />
            </div>

            <Card className="col-span-6  h-full flex flex-col">
              <CardHeader className="flex">
                <CardTitle className="flex justify-between items-center">
                  <span>Weekly Revenue Analytics</span>
                  <Button
                    variant="ghost"
                    className="text-sm text-[#388A94]"
                    onClick={() => (window.location.href = "/tourguide-report")}
                  >
                    Full Report
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pl-0 pb-0 ">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={graphData}
                      margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#B5D3D1"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#B5D3D1"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#B5D3D1"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          strokeWidth: 2,
                          stroke: "#B5D3D1",
                          fill: "white",
                        }}
                        activeDot={{
                          r: 5,
                          strokeWidth: 2,
                          stroke: "#B5D3D1",
                          fill: "white",
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Picture Update Modal */}
          <Modal show={showModal} onClose={closeModal}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Update Profile Picture</h2>
              <ImageCropper
                onImageCropped={handleImageCropped}
                currentImage={profilePicture?.url || profilePicture}
              />
              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  onClick={handleFirstSave}
                  className="bg-[#1A3B47] hover:bg-[#142B36] text-white px-4 py-2 rounded"
                >
                  Save
                </Button>
                <Button
                  onClick={closeModal}
                  variant="destructive"
                  className="bg-[#A3A3A3] hover:bg-[#7E7E7E] text-white px-4 py-2 rounded"
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>

          {/* Image Viewer Modal */}
          <Modal
            show={isImageViewerOpen}
            onClose={() => setIsImageViewerOpen(false)}
            isImageViewer={true}
            imageUrl={profilePicture?.url || profilePicture}
          />
          {isPreviousWorksPopupOpen && (
            <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full relative">
                <button
                  onClick={closePreviousWorksPopup}
                  className="absolute top-2 right-2 text-gray-600 text-xl"
                >
                  &times;
                </button>
                <PreviousWorks
                  works={editedTourGuide?.previousWorks || []}
                  onEdit={handleEditWork}
                  onRemove={handleRemoveWork}
                  onAdd={handleAddWork}
                  onView={handleViewWork}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastViewport className="fixed top-0 right-0 p-4" />
      <Dialog open={showWorkDialog} onOpenChange={setShowWorkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentWorkIndex !== null ? "Edit Work" : "Add New Work"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={currentWork.title}
                onChange={(e) =>
                  setCurrentWork({ ...currentWork, title: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <Input
                id="company"
                value={currentWork.company}
                onChange={(e) =>
                  setCurrentWork({ ...currentWork, company: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration
              </Label>
              <Input
                id="duration"
                value={currentWork.duration}
                onChange={(e) =>
                  setCurrentWork({ ...currentWork, duration: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={currentWork.description}
                onChange={(e) =>
                  setCurrentWork({
                    ...currentWork,
                    description: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="bg-[#388A94] hover:bg-[#2e6b77]"
              onClick={handleSaveWork}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewWorkDialogOpen} onOpenChange={handleCloseViewWork}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewedWork?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p>
              <strong>Company:</strong> {viewedWork?.company}
            </p>
            <p>
              <strong>Duration:</strong> {viewedWork?.duration}
            </p>
            <p>
              <strong>Description:</strong>
              <span
                className="block"
                style={{
                  maxWidth: "100%",
                  wordWrap: "break-word",
                  overflowWrap: "break-word", // Ensures long words wrap correctly
                  wordBreak: "break-word", // For handling words that would overflow
                }}
              >
                {viewedWork?.description}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button
              className="bg-[#388A94] hover:bg-[#2e6b77]"
              onClick={handleCloseViewWork}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Modal
        show={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      >
        <PasswordChanger onSuccess={handlePasswordChangeSuccess} />
      </Modal>
      {isToastOpen && (
        <Toast
          onOpenChange={setIsToastOpen}
          open={isToastOpen}
          duration={1500}
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
    </ToastProvider>
  );
}
