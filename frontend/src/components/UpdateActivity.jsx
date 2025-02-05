"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  Check,
  X,
  Trash2,
  Edit,
  CheckCircleIcon,
  XCircle,
} from "lucide-react";
import {
  FaMapMarkerAlt,
  FaDollarSign,
  FaClock,
  FaHourglassHalf,
  FaChair,
} from "react-icons/fa";
import * as z from "zod";
import axios from "axios";
import Cookies from "js-cookie";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import ReactSelect from "react-select";
import signUpPicture from "../assets/images/signUpPicture.jpeg";
import backgroundPicture from "../assets/images/backgroundPattern.png";

const vehicleTypes = ["Bus", "Car", "Microbus"];

const getMaxSeats = (vehicleType) => {
  switch (vehicleType) {
    case "Bus":
      return 50;
    case "Car":
      return 5;
    case "Microbus":
      return 15;
    default:
      return 0;
  }
};

// const transportationSchema = z.object({
//   from: z.string().min(1, "From is required"),
//   to: z.string().min(1, "To is required"),
//   vehicleType: z.enum(vehicleTypes),
//   ticketCost: z.number().positive("Ticket cost must be positive"),
//   timeDeparture: z.string().min(1, "Departure time is required"),
//   estimatedDuration: z.number().positive("Duration must be positive"),
//   remainingSeats: z
//     .number()
//     .int()
//     .positive("Remaining seats must be positive")
//     .refine(
//       (val, ctx) => {
//         const maxSeats = 100;
//         return val <= maxSeats;
//       },
//       {
//         message:
//           "Remaining seats must not exceed the maximum for the selected vehicle type",
//       }
//     ),
// });

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  location: z.object({
    address: z.string().min(1, "Address is required"),
    coordinates: z.object({
      longitude: z.number(),
      latitude: z.number(),
    }),
  }),
  duration: z.number().int().positive("Duration must be a positive integer"),
  timing: z.date().refine((date) => date > new Date(), {
    message: "Timing must be a future date",
  }),
  price: z.number().int().positive("Price must be a positive integer"),
  category: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .nonempty("At least one category is required"),
  tags: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .nonempty("At least one tag is required"),
  specialDiscount: z
    .number()
    .int()
    .nonnegative("Discount must be a non-negative integer"),
  isBookingOpen: z.boolean(),
});

export default function UpdateActivity() {
  const { id } = useParams();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      location: {
        address: "",
        coordinates: { longitude: 0, latitude: 0 },
      },
      duration: 0,
      timing: new Date(),
      price: 0,
      category: [],
      tags: [],
      specialDiscount: 0,
      isBookingOpen: true,
    },
  });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 29.9792, lng: 31.1342 });
  const [markerPosition, setMarkerPosition] = useState({
    lat: 29.9792,
    lng: 31.1342,
  });
  const [currencies, setCurrencies] = useState([]);
  const [pictures, setPictures] = useState([]);
  const [newPictures, setNewPictures] = useState([]);
  const [base64Pictures, setBase64Pictures] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showErrorPopup, setShowErrorPopup] = useState(null);
  const navigate = useNavigate();

  // const [transportations, setTransportations] = useState([]);
  // const [showTransportationForm, setShowTransportationForm] = useState(false);
  // const [editingTransportationIndex, setEditingTransportationIndex] =
  //   useState(null);

  // const {
  //   register: registerTransportation,
  //   handleSubmit: handleSubmitTransportation,
  //   reset: resetTransportation,
  //   control: controlTransportation,
  //   setValue: setTransportationValue,
  //   watch: watchTransportation,
  //   formState: { errors: transportationErrors },
  // } = useForm({
  //   resolver: zodResolver(transportationSchema),
  // });

  // const selectedVehicleType = watchTransportation("vehicleType");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("jwt");
        const role = Cookies.get("role") || "guest";

        const [activityResponse, categoriesResponse, tagsResponse] =
          await Promise.all([
            axios.get(
              `https://trip-genie-apis.vercel.app/${role}/activities/${id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            ),
            axios.get(
              "https://trip-genie-apis.vercel.app/api/getAllCategories"
            ),
            axios.get("https://trip-genie-apis.vercel.app/api/getAllTags"),
          ]);

        const activityData = activityResponse.data;
        setCategories(
          categoriesResponse.data.map((cat) => ({
            value: cat._id,
            label: cat.name,
          }))
        );
        setTags(
          tagsResponse.data.map((tag) => ({ value: tag._id, label: tag.type }))
        );

        console.log("Activity data:", activityData);
        // Set form values
        setValue("name", activityData.name);
        setValue("description", activityData.description);
        setValue("location.address", activityData.location.address);
        setValue("duration", activityData.duration);
        setValue("timing", new Date(activityData.timing));
        setValue("price", activityData.price);
        setValue("specialDiscount", activityData.specialDiscount);
        setValue("isBookingOpen", activityData.isBookingOpen);
        setValue("pictures", activityData.pictures);

        setPictures(activityData.pictures);
        // setTransportations(activityData.transportations || []);

        // Set location for the map
        const activityLocation = activityData.location.coordinates;
        setMapCenter({
          lat: activityLocation.latitude,
          lng: activityLocation.longitude,
        });
        setMarkerPosition({
          lat: activityLocation.latitude,
          lng: activityLocation.longitude,
        });
        setValue("location.coordinates", {
          latitude: activityLocation.latitude,
          longitude: activityLocation.longitude,
        });

        // Set categories and tags
        setValue(
          "category",
          activityData.category.map((cat) => ({
            value: cat._id,
            label: cat.name,
          }))
        );
        setValue(
          "tags",
          activityData.tags.map((tag) => ({ value: tag._id, label: tag.type }))
        );
      } catch (error) {
        console.error("Failed to fetch activity data:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrencies();
    fetchData();
  }, [id, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    const token = Cookies.get("jwt");
    const role = Cookies.get("role") || "guest";

    const formData = new FormData();

    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("timing", data.timing);
    formData.append("duration", Number(data.duration));
    formData.append("price", Number(data.price));
    formData.append("specialDiscount", Number(data.specialDiscount));
    formData.append("isBookingOpen", data.isBookingOpen);

    formData.append("location[address]", data.location.address);
    formData.append(
      "location[coordinates][latitude]",
      data.location.coordinates.latitude
    );
    formData.append(
      "location[coordinates][longitude]",
      data.location.coordinates.longitude
    );

    data.category.forEach((cat) => formData.append("category[]", cat.value));
    data.tags.forEach((tag) => formData.append("tags[]", tag.value));

    formData.append("oldPictures", JSON.stringify(pictures || []));

    newPictures.forEach((picture) => {
      formData.append("newPictures", picture);
    });

    // transportations.forEach((transport) => {
    //   formData.append("transportations[]", transport._id);
    // });

    try {
      console.log("Location coordinates:", data.location.coordinates);
      const response = await axios.put(
        `https://trip-genie-apis.vercel.app/${role}/activities/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Updated activity:", response.data);
      setShowDialog(true);
    } catch (error) {
      setShowErrorPopup(error.response.data.message);
      console.error("Failed to update activity:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const MapComponent = () => {
    const map = useMap();

    useEffect(() => {
      map.setView([mapCenter.lat, mapCenter.lng], map.getZoom());
    }, [map, mapCenter, markerPosition]);

    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setMarkerPosition({ lat, lng });
        setValue("location.coordinates", { latitude: lat, longitude: lng });
      },
    });

    return <Marker position={[markerPosition.lat, markerPosition.lng]} />;
  };

  const fetchCurrencies = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/advertiser/currencies`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrencies(response.data);
    } catch (err) {
      console.error("Error fetching currencies:", err.message);
    }
  };

  const handlePicturesUpload = (e) => {
    const files = e.target.files;
    if (files) {
      const newFilePictures = Array.from(files);

      const existingFileNames = new Set(newPictures.map((file) => file.name));

      const newFilesToUpload = newFilePictures.filter(
        (file) => !existingFileNames.has(file.name)
      );

      const newBase64PicturesPromises = newFilesToUpload.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => resolve(reader.result);
          })
      );

      Promise.all(newBase64PicturesPromises).then((base64Pictures) => {
        setBase64Pictures((prev) => [...prev, ...base64Pictures]);
        setNewPictures((prev) => [...prev, ...newFilesToUpload]);
      });
    }
  };

  const removePicture = (index, isOld) => {
    if (isOld) {
      const newPictures = [...pictures];
      newPictures.splice(index, 1);
      setPictures(newPictures);
    } else {
      const newBase64Pictures = [...base64Pictures];
      newBase64Pictures.splice(index, 1);
      setBase64Pictures(newBase64Pictures);
      const newPictures2 = [...newPictures];
      newPictures2.splice(index, 1);
      setNewPictures(newPictures);
    }

    setSelectedImage(null);
  };

  const handleGoBack = () => {
    navigate("/activity");
  };

  // const onSubmitTransportation = async (data) => {
  //   try {
  //     const token = Cookies.get("jwt");
  //     let response;
  //     if (editingTransportationIndex !== null) {
  //       // Update existing transportation
  //       response = await axios.put(
  //         `https://trip-genie-apis.vercel.app/advertiser/transportations/${transportations[editingTransportationIndex]._id}`,
  //         data,
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }
  //       );
  //       const updatedTransportations = [...transportations];
  //       updatedTransportations[editingTransportationIndex] = response.data;
  //       setTransportations(updatedTransportations);
  //     } else {
  //       // Create new transportation
  //       response = await axios.post(
  //         "https://trip-genie-apis.vercel.app/advertiser/transportations",
  //         data,
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }
  //       );
  //       setTransportations((prevTransportations) => [
  //         ...prevTransportations,
  //         response.data,
  //       ]);
  //     }
  //     setShowTransportationForm(false);
  //     resetTransportation();
  //     setEditingTransportationIndex(null);
  //   } catch (error) {
  //     console.error("Failed to create/update transportation:", error);
  //   }
  // };

  // const handleEditTransportation = (index) => {
  //   const transportation = transportations[index];
  //   resetTransportation({
  //     ...transportation,
  //     timeDeparture: format(
  //       parseISO(transportation.timeDeparture),
  //       "yyyy-MM-dd'T'HH:mm"
  //     ),
  //   });
  //   setEditingTransportationIndex(index);
  //   setShowTransportationForm(true);
  // };

  const formatDate = (dateString) => {
    console.log("Date string:", dateString);
    return format(parseISO(dateString), "dd/MM/yyyy HH:mm");
  };

  // const handleDeleteTransportation = async (index) => {
  //   try {
  //     const token = Cookies.get("jwt");
  //     await axios.delete(
  //       `https://trip-genie-apis.vercel.app/advertiser/transportations/${transportations[index]._id}`,
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );
  //     const updatedTransportations = transportations.filter(
  //       (_, i) => i !== index
  //     );
  //     setTransportations(updatedTransportations);
  //   } catch (error) {
  //     console.error("Failed to delete transportation:", error);
  //   }
  // };

  return (
    <div>
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>
      <div
        className="flex min-h-screen  items-center justify-center bg-cover bg-center bg-no-repeat p-2"
        style={{
          backgroundImage: `url(${backgroundPicture})`,
        }}
      >
        <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-7xl flex flex-col md:flex-row">
          <div className="w-full md:w-1/4 bg-[#B5D3D1] p-6">
            <h2 className="text-3xl font-bold text-[#1A3B47] mb-2">
              Update Activity
            </h2>
            <p className="text-sm mb-6 text-[#1A3B47]">
              Update the details of your activity. Make sure all information is
              accurate and up-to-date.
            </p>
          </div>
          <div className="w-full md:w-3/4 p-6">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-4 gap-4"
            >
              <div className="col-span-2">
                <Label htmlFor="name">Name</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" {...field} />}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs">{errors.name.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea id="description" {...field} />
                  )}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="col-span-4">
                <Label htmlFor="address">Address</Label>
                <Controller
                  name="location.address"
                  control={control}
                  render={({ field }) => <Input id="address" {...field} />}
                />
                {errors.location?.address && (
                  <p className="text-red-500 text-xs">
                    {errors.location.address.message}
                  </p>
                )}
              </div>

              <div className="col-span-1">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Controller
                  name="duration"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      id="duration"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
                {errors.duration && (
                  <p className="text-red-500 text-xs">
                    {errors.duration.message}
                  </p>
                )}
              </div>

              <div className="col-span-1">
                <Label htmlFor="timing">Timing</Label>
                <Controller
                  name="timing"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="datetime-local"
                      id="timing"
                      {...field}
                      onChange={(e) => {
                        const dateValue = new Date(e.target.value);
                        field.onChange(dateValue);
                      }}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().slice(0, 16)
                          : ""
                      }
                    />
                  )}
                />
                {errors.timing && (
                  <p className="text-red-500 text-xs">
                    {errors.timing.message}
                  </p>
                )}
              </div>

              <div className="col-span-1">
                <Label htmlFor="price">Price</Label>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      id="price"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
                {errors.price && (
                  <p className="text-red-500 text-xs">{errors.price.message}</p>
                )}
              </div>

              <div className="col-span-1">
                <Label htmlFor="specialDiscount">Special Discount (%)</Label>
                <Controller
                  name="specialDiscount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      id="specialDiscount"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
                {errors.specialDiscount && (
                  <p className="text-red-500 text-xs">
                    {errors.specialDiscount.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label>Categories</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <ReactSelect
                      {...field}
                      options={categories}
                      isMulti
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  )}
                />
                {errors.category && (
                  <p className="text-red-500 text-xs">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label>Tags</Label>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <ReactSelect
                      {...field}
                      options={tags}
                      isMulti
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  )}
                />
                {errors.tags && (
                  <p className="text-red-500 text-xs">{errors.tags.message}</p>
                )}
              </div>

              <div className="col-span-4 flex items-center space-x-2">
                <Controller
                  name="isBookingOpen"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isBookingOpen"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="isBookingOpen">Is Booking Open?</Label>
              </div>

              <div className="col-span-4">
                <Label htmlFor="pictures">Add New Pictures</Label>
                <Input
                  id="pictures"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePicturesUpload}
                  className="mb-2"
                />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {pictures.map((picture, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img
                        src={picture.url}
                        alt={`Product Existing ${index + 1}`}
                        className="w-full h-32 object-cover rounded cursor-pointer"
                        onClick={() => setSelectedImage(picture.url)}
                      />
                      <button
                        type="button"
                        onClick={() => removePicture(index, true)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}

                  {base64Pictures.map((picture, index) => (
                    <div key={`new-${index}`} className="relative">
                      <img
                        src={picture}
                        alt={`Product New ${index + 1}`}
                        className="w-full h-32 object-cover rounded cursor-pointer"
                        onClick={() => setSelectedImage(picture)}
                      />
                      <button
                        onClick={() => removePicture(index, false)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-4">
                <Label>Location (click to update)</Label>
                <div className="h-64 w-full rounded-md overflow-hidden">
                  <MapContainer
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={13}
                    style={{ height: "100%", width: "100%", zIndex: 0 }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>Open StreetMap</a> contributors"
                    />
                    <MapComponent />
                  </MapContainer>
                </div>
              </div>

              {/* <div className="col-span-4 space-y-4">
                <Label>Transportation Options</Label>
                {transportations.map((transport, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-md flex justify-between items-center"
                  >
                    <div>
                      <p>
                        <strong>From:</strong> {transport.from}
                      </p>
                      <p>
                        <strong>To:</strong> {transport.to}
                      </p>
                      <p>
                        <strong>Vehicle:</strong> {transport.vehicleType}
                      </p>
                      <p>
                        <strong>Ticket Cost:</strong> {transport.ticketCost}
                      </p>
                      {console.log(transport)}
                      <p>
                        <strong>Departure:</strong>{" "}
                        {formatDate(transport.timeDeparture)}
                      </p>
                      <p>
                        <strong>Duration:</strong> {transport.estimatedDuration}{" "}
                        hours
                      </p>
                      <p>
                        <strong>Remaining Seats:</strong>{" "}
                        {transport.remainingSeats}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <Button
                        type="button"
                        onClick={() => handleEditTransportation(index)}
                        className="p-2 rounded-full  w-10 h-10 bg-blue-100 hover:bg-blue-200 transition duration-300 ease-in-out mr-2"
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDeleteTransportation(index)}
                        className="p-2 w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 transition duration-300 ease-in-out"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                {/* <Button
                  type="button"
                  onClick={() => setShowTransportationForm(true)}
                  className="bg-[#5D9297] hover:bg-[#1A3B47] text-white w-full"
                >
                  Add Transportation
                </Button> 
              </div> */}

              <Button
                type="submit"
                className="col-span-4 bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Activity"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="text-left">
          {" "}
          {/* Ensures all text inside DialogContent is left-aligned */}
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircleIcon className="text-green-500" />
              <span>Activity Updated</span>
            </DialogTitle>
            <DialogDescription className="text-left">
              The activity has been successfully updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center">
            {" "}
            {/* Centers the button */}
            <Button
              onClick={handleGoBack}
              className="bg-[#1A3B47] hover:bg-[#142B36] text-white"
            >
              Back to Activities
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showErrorPopup !== null}
        onOpenChange={() => setShowErrorPopup(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <XCircle className="w-6 h-6 text-red-500 inline-block mr-2" />
              Failed to Update Activity
            </DialogTitle>
            <DialogDescription>
              <div className="text-m">
                {showErrorPopup ||
                  "An error occurred while updating the itinerary."}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="default"
              className="bg-gray-400 hover:bg-gray-500"
              onClick={() => setShowErrorPopup(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="sm:max-w-[80vw] sm:max-h-[80vh]">
            <img
              src={selectedImage}
              alt="Full size product"
              className="w-full h-full object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
      {/* <Dialog
        open={showTransportationForm}
        onOpenChange={setShowTransportationForm}
      >
        <DialogContent className="sm:max-w-[425px] sm:h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransportationIndex !== null
                ? "Edit Transportation"
                : "Add Transportation"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmitTransportation(onSubmitTransportation)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="from">From</Label>
              <Input {...registerTransportation("from")} />
              {transportationErrors.from && (
                <p className="text-red-500 text-sm">
                  {transportationErrors.from.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="to">To</Label>
              <Input {...registerTransportation("to")} />
              {transportationErrors.to && (
                <p className="text-red-500 text-sm">
                  {transportationErrors.to.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Controller
                name="vehicleType"
                control={controlTransportation}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {transportationErrors.vehicleType && (
                <p className="text-red-500 text-sm">
                  {transportationErrors.vehicleType.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="ticketCost">Ticket Cost</Label>
              <Input
                type="number"
                step="0.01"
                {...registerTransportation("ticketCost", {
                  valueAsNumber: true,
                })}
              />
              {transportationErrors.ticketCost && (
                <p className="text-red-500 text-sm">
                  {transportationErrors.ticketCost.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="timeDeparture">Departure Time</Label>
              <Controller
                name="timeDeparture"
                control={controlTransportation}
                render={({ field }) => (
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value}
                    onChange={(e) => {
                      const localDate = new Date(e.target.value);
                      const utcDate = new Date(
                        localDate.getTime() -
                          localDate.getTimezoneOffset() * 60000
                      );
                      field.onChange(utcDate.toISOString().slice(0, 16));
                    }}
                  />
                )}
              />
              {transportationErrors.timeDeparture && (
                <p className="text-red-500">
                  {transportationErrors.timeDeparture.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="estimatedDuration">
                Estimated Duration (hours)
              </Label>
              <Input
                type="number"
                {...registerTransportation("estimatedDuration", {
                  valueAsNumber: true,
                })}
              />
              {transportationErrors.estimatedDuration && (
                <p className="text-red-500 text-sm">
                  {transportationErrors.estimatedDuration.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="remainingSeats">Remaining Seats</Label>
              <Input
                type="number"
                {...registerTransportation("remainingSeats", {
                  valueAsNumber: true,
                })}
                max={getMaxSeats(selectedVehicleType)}
              />
              {transportationErrors.remainingSeats && (
                <p className="text-red-500 text-sm">
                  {transportationErrors.remainingSeats.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="bg-[#388A94] hover:bg-[#2c6d75] text-white"
            >
              {editingTransportationIndex !== null
                ? "Update Transportation"
                : "Add Transportation"}
            </Button>
          </form>
        </DialogContent>
      </Dialog> */}
    </div>
  );
}
