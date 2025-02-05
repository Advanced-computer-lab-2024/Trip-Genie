import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import * as jwtDecode from "jwt-decode";
import {
  XCircle,
  CheckCircle,
  MapPin,
  Clock,
  DollarSign,
  Globe,
  Edit,
  Trash2,
  Info,
  Tag,
  Share2,
  Link,
  Mail,
  ChevronLeft,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-50">
    <svg
      className="spinner"
      width="65px"
      height="65px"
      viewBox="0 0 66 66"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="path"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        cx="33"
        cy="33"
        r="30"
      ></circle>
    </svg>
  </div>
);

const HistoricalPlaceDetail = ({ id }) => {
  const [historicalPlace, setHistoricalPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(Cookies.get("role") || "guest");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [canModify, setCanModify] = useState(false);
  const [open, setOpen] = useState(false); // Added state for popover
  const [isToastOpen, setIsToastOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistoricalPlaceDetails = async () => {
      if (!id) {
        setError("Invalid historical place ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = Cookies.get("jwt");
        const response = await fetch(
          `http://localhost:4000/${userRole}/historical-places/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch historical place details");
        }

        const data = await response.json();

        // Now set the state
        setHistoricalPlace(data);

        if (data.pictures && data.pictures.length > 0) {
          setMainImage(data.pictures[0].url);
        }
        if (token) {
          const decodedToken = jwtDecode.jwtDecode(token);
          setCanModify(decodedToken.id === data.governor._id);
        }
        setError(null);
      } catch (err) {
        setError(
          "Error fetching historical place details. Please try again later."
        );
        console.error("Error fetching historical place details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistoricalPlaceDetails();
  }, [id]); // Add id to dependency array

  const handleUpdate = () => {
    navigate(`/update-historical-place/${id}`);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    setDeleteError(null);
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `http://localhost:4000/${userRole}/historical-places/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          setDeleteError(errorData.message);
          return;
        }
        if (response.status === 403) {
          setDeleteError(errorData.message);
          return;
        }

        throw new Error("Failed to delete historical place");
      }

      setShowDeleteSuccess(true);
    } catch (err) {
      setError("Error deleting historical place. Please try again later.");
      console.error("Error deleting historical place:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsToastOpen(true);
    setOpen(false);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(
      `Check out this historical place: ${historicalPlace.title}`
    );
    const body = encodeURIComponent(
      `I thought you might be interested in this historical place:\n\n${historicalPlace.title}\n\n${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpen(false); // Close the popover
  };

  const HistoricalPlaceDetailSkeleton = () => {
    return (
      <div>
        <div className="min-h-screen bg-gray-100 pt-8">
          <div className="container mx-auto px-4 py-8 ">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-8 w-1/4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-10 w-1/12 bg-gray-300 rounded animate-pulse mt-1"></div>
                  </div>
                  <div className="h-12 w-2/4 bg-gray-300 rounded animate-pulse mt-2"></div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-2/3">
                    <div className="relative pb-[56.25%] h-0">
                      <div className="absolute top-0 left-0 w-full h-full bg-gray-300 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="mt-4 flex gap-2 overflow-x-auto">
                      {[1, 2, 3, 4].map((index) => (
                        <div
                          key={index}
                          className="w-24 h-24 bg-gray-300 rounded animate-pulse"
                        ></div>
                      ))}
                    </div>
                  </div>

                  <div className="md:w-1/3 space-y-4">
                    <Button variant="outline" size="sm" className="ml-auto">
                      <Share2 className="h-4 w-4" />
                    </Button>

                    <Card>
                      <CardHeader>
                        <CardTitle>Location</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                          <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse"></div>
                        </div>
                        <div className="flex items-center mt-2">
                          <Globe className="w-5 h-5 mr-2 text-gray-500" />
                          <div className="h-4 w-1/2 bg-gray-300 rounded animate-pulse"></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Ticket Prices</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {["Foreigner", "Native", "Student"].map(
                          (type, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between mt-2"
                            >
                              <span>{type}:</span>
                              <div className="h-4 w-1/4 bg-gray-300 rounded animate-pulse"></div>
                            </div>
                          )
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Opening Hours</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {["Weekdays", "Weekends"].map((day, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between mt-2"
                          >
                            <span>{day}:</span>
                            <div className="h-4 w-1/3 bg-gray-300 rounded animate-pulse"></div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  if (loading) {
    return <HistoricalPlaceDetailSkeleton />;
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

  if (!historicalPlace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">No Data:</strong>
          <span className="block sm:inline"> Historical place not found.</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#B5D3D1" }}>
      {" "}
      {/* Light Aqua/Seafoam Green */}
      <div className="bg-gray-100">
        <div className="">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col mb-6">
                <div className="flex justify-between items-start mb-2">
                  <h1 className="text-3xl font-bold">
                    {historicalPlace.title}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    {historicalPlace.historicalTag &&
                    historicalPlace.historicalTag.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {historicalPlace.historicalTag.map(
                          (historicalTag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-lg px-4 py-2 rounded-full font-semibold flex text-[#1A3B47] items-center bg-[#B5D3D1] hover:bg-[#B5D3D1] hover:text-[#1A3B47]"
                            >
                              <Tag className="mr-2" />
                              {historicalTag.type}
                            </Badge>
                          )
                        )}
                      </div>
                    ) : (
                      <p>No tags available</p>
                    )}
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
                            className="flex items-center justify-start px-4 py-2 hover:text-[#5D9297]"
                          >
                            <Link className="mr-2 h-4 w-4" />
                            Copy Link
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={handleEmailShare}
                            className="flex items-center justify-start px-4 py-2 hover:text-[#5D9297]"
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Share by Email
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <p className="text-gray-600 mt-2">
                  {historicalPlace.description || "No description available."}
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-2/3">
                  <div className="relative pb-[56.25%] h-0">
                    <img
                      src={mainImage}
                      alt={historicalPlace.title}
                      className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="mt-4 flex gap-2 overflow-x-auto">
                    {historicalPlace.pictures &&
                      historicalPlace.pictures.map((pic, index) => (
                        <img
                          key={index}
                          src={pic.url}
                          alt={`${historicalPlace.title} - ${index + 1}`}
                          className="w-24 h-24 object-cover rounded cursor-pointer"
                          onClick={() => setMainImage(pic.url)}
                        />
                      ))}
                  </div>
                </div>

                <div className="md:w-1/3 space-y-4">
                  <ToastProvider>
                    <ToastViewport />

                    {isToastOpen && (
                      <Toast
                        onOpenChange={setIsToastOpen}
                        open={isToastOpen}
                        duration={3000}
                      >
                        {" "}
                        {/* Auto close after 3 seconds */}
                        <ToastTitle>Link Copied</ToastTitle>
                        <ToastDescription>
                          The link has been copied to your clipboard.
                        </ToastDescription>
                        <ToastClose />
                      </Toast>
                    )}
                  </ToastProvider>

                  <Card>
                    <CardHeader>
                      <CardTitle>Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                        <span>
                          {historicalPlace.location?.address || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center mt-2">
                        <Globe className="w-5 h-5 mr-2 text-gray-500" />
                        <span>
                          {historicalPlace.location?.city},{" "}
                          {historicalPlace.location?.country}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ticket Prices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span>Foreigner:</span>
                        <span>${historicalPlace.ticketPrices?.foreigner}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span>Native:</span>
                        <span>${historicalPlace.ticketPrices?.native}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span>Student:</span>
                        <span>${historicalPlace.ticketPrices?.student}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Opening Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span>Weekdays:</span>
                        <span>
                          {historicalPlace.openingHours?.weekdays || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span>Weekends:</span>
                        <span>
                          {historicalPlace.openingHours?.weekends || "N/A"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {canModify && userRole === "tourism-governor" && (
                <div className="mt-8 flex justify-end space-x-4">
                  <Button
                    onClick={handleUpdate}
                    variant="default"
                    className="flex items-center bg-[#1a202c] hover:bg-[#2d3748]"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="destructive"
                    className="flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Historical Place</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this historical place?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteSuccess} onOpenChange={setShowDeleteSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <CheckCircle className="w-6 h-6 text-green-500 inline-block mr-2" />
                Historical Place Deleted
              </DialogTitle>
              <DialogDescription>
                The historical place has been successfully deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="default"
                onClick={() => navigate("/all-historical-places")}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back to All Historical Places
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={deleteError !== null}
          onOpenChange={() => setDeleteError(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <XCircle className="w-6 h-6 text-red-500 inline-block mr-2" />
                Failed to Delete Historical Place
              </DialogTitle>
              <DialogDescription>
                {deleteError ||
                  "An error occurred while deleting the historical place."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="default" onClick={() => setDeleteError(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default HistoricalPlaceDetail;
