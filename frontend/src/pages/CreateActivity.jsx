"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import Cookies from "js-cookie";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { format, parseISO } from "date-fns";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
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
    .optional(),
  tags: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  specialDiscount: z
    .number()
    .int()
    .nonnegative("Discount must be a non-negative integer"),
  pictures: z.array(z.string()).optional(),
});

export default function CreateActivity() {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      location: {
        address: "",
        coordinates: { longitude: 0, latitude: 0 },
      },
      category: [],
      tags: [],
      pictures: [],
    },
  });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({
    longitude: 31.1342,
    latitude: 29.9792,
  });
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [pictures, setPictures] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/api/getAllCategories"
      );
      setCategories(
        response.data.map((cat) => ({ value: cat._id, label: cat.name }))
      );
    };

    const fetchTags = async () => {
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/api/getAllTags"
      );
      setTags(
        response.data.map((tag) => ({ value: tag._id, label: tag.type }))
      );
    };

    fetchCategories();
    fetchTags();
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all");
      const data = await response.json();
      const sortedCountries = data
        .map((country) => ({
          value: country.name.common,
          label: country.name.common,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setCountries(sortedCountries);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  const handlePicturesUpload = (e) => {
    const files = e.target.files;
    if (files) {
      setPictures([...pictures, ...Array.from(files)]);
    }
  };

  const fetchCities = async (country) => {
    setCitiesLoading(true);
    try {
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries/cities",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ country }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.msg || "Failed to fetch cities");
      }

      const sortedCities = data.data.sort().map((city) => ({
        value: city,
        label: city,
      }));
      setCities(sortedCities);
    } catch (err) {
      if (err.status === 404) {
        setCities([]);
      }
      console.error("Error fetching cities: ", err);
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    const token = Cookies.get("jwt");
    const role = Cookies.get("role") || "guest";

    const formData = new FormData();

    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("timing", data.timing.toISOString());
    formData.append("duration", data.duration);
    formData.append("price", data.price);
    formData.append("specialDiscount", data.specialDiscount);
    formData.append("location[address]", data.location.address);
    formData.append("location[coordinates][longitude]", location.longitude);
    formData.append("location[coordinates][latitude]", location.latitude);

    data.category.forEach((cat) => formData.append("category[]", cat.value));
    data.tags.forEach((tag) => formData.append("tags[]", tag.value));

    pictures.forEach((picture, index) => {
      formData.append("pictures", picture);
    });

    try {
      const response = await axios.post(
        `https://trip-genie-apis.vercel.app/${role}/activities`,
        formData,
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Created activity:", response.data);
      setShowDialog(true);
    } catch (error) {
      console.error("Failed to create activity:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (selectedOption) => {
    setSelectedCountry(selectedOption);
    setSelectedCity(null);
    setCities([]);
    fetchCities(selectedOption.value);
  };

  const handleCityChange = (selectedOption) => {
    setSelectedCity(selectedOption);
    setValue(
      "location.address",
      `${selectedOption.value}, ${selectedCountry.value}`
    );
  };

  const handleGoBack = () => {
    navigate("/activity");
  };

  const handleCreateNew = () => {
    window.location.reload();
  };

  const MapClick = () => {
    useMapEvents({
      click: (e) => {
        setLocation({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      },
    });
    return null;
  };

  const formatDate = (dateString) => {
    return format(parseISO(dateString), "dd/MM/yyyy HH:mm");
  };

  return (
    <div>
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat p-2"
        style={{
          backgroundImage: `url(${backgroundPicture})`,
        }}
      >
        <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-7xl flex flex-col md:flex-row">
          <div className="w-full md:w-1/4 bg-[#B5D3D1] p-6">
            <h2 className="text-3xl font-bold text-[#1A3B47] mb-2">
              Create New Activity
            </h2>
            <p className="text-sm mb-6 text-[#1A3B47]">
              Create a new activity for your tours. Fill in the details
              carefully to ensure accurate information for your customers.
            </p>
          </div>
          <div className="w-full md:w-3/4 p-6">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-4 gap-4"
            >
              <div className="col-span-2">
                <Label htmlFor="name">Activity Name</Label>
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

              <div className="col-span-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  onValueChange={(value) =>
                    handleCountryChange({ value, label: value })
                  }
                  value={selectedCountry?.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="city">City</Label>
                <Select
                  onValueChange={(value) =>
                    handleCityChange({ value, label: value })
                  }
                  value={selectedCity?.value}
                  disabled={!selectedCountry || citiesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      value={
                        field.value
                          ? field.value.toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        const dateValue = new Date(e.target.value);
                        field.onChange(dateValue);
                      }}
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
                <Label htmlFor="price">Price (in USD)</Label>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="0"
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
                      min="0"
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

              <div className="col-span-2">
                <Label htmlFor="pictures">Pictures</Label>
                <Input
                  id="pictures"
                  type="file"
                  multiple
                  onChange={handlePicturesUpload}
                />
              </div>

              <div className="col-span-4">
                <Label>Location (click to set)</Label>
                <div className="h-64 w-full rounded-md overflow-hidden">
                  <MapContainer
                    center={[location.latitude, location.longitude]}
                    zoom={13}
                    style={{ height: "100%", width: "100%", zIndex: 0 }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                    />
                    <MapClick />
                    <Marker
                      position={[location.latitude, location.longitude]}
                    />
                  </MapContainer>
                </div>
              </div>

              {/* <div className="col-span-4">
                <Label>Transportation Options</Label>
                {transportations.map((transport, index) => (
                  <div key={index} className="p-2 border rounded flex justify-between items-center mb-2">
                    <div>
                      <p>From: {transport.from}</p>
                      <p>To: {transport.to}</p>
                      <p>Vehicle: {transport.vehicleType}</p>
                      <p>Departure: {formatDate(transport.timeDeparture)}</p>
                      <p>Duration: {transport.estimatedDuration} hours</p>
                      <p>Remaining Seats: {transport.remainingSeats}</p>
                    </div>
                    <div>
                      <Button
                        type="button"
                        onClick={() => handleEditTransportation(index)}
                        className="bg-[#5D9297] hover:bg-[#1A3B47] text-white mr-2"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDeleteTransportation(index)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => setShowTransportationForm(true)}
                  className="bg-[#5D9297] hover:bg-[#1A3B47] text-white w-full mt-2"
                >
                  Add Transportation
                </Button>
              </div> */}

              <Button
                type="submit"
                className="col-span-4 bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Activity"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* <Dialog open={showTransportationForm} onOpenChange={setShowTransportationForm}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTransportationIndex !== null ? "Edit Transportation" : "Add Transportation"}</DialogTitle>
            <DialogDescription>
              Please fill in the details for the transportation option.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTransportation(onSubmitTransportation)} className="space-y-4">
            <div>
              <Label htmlFor="from">From</Label>
              <Input {...registerTransportation("from")} />
              {transportationErrors.from && <p className="text-red-500">{transportationErrors.from.message}</p>}
            </div>
            <div>
              <Label htmlFor="to">To</Label>
              <Input {...registerTransportation("to")} />
              {transportationErrors.to && <p className="text-red-500">{transportationErrors.to.message}</p>}
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
              {transportationErrors.vehicleType && <p className="text-red-500">{transportationErrors.vehicleType.message}</p>}
            </div>
            <div>
              <Label htmlFor="ticketCost">Ticket Cost</Label>
              <Input type="number" step="0.01" {...registerTransportation("ticketCost", { valueAsNumber: true })} />
              {transportationErrors.ticketCost && <p className="text-red-500">{transportationErrors.ticketCost.message}</p>}
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
                      const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
                      field.onChange(utcDate.toISOString().slice(0, 16));
                    }}
                  />
                )}
              />
              {transportationErrors.timeDeparture && <p className="text-red-500">{transportationErrors.timeDeparture.message}</p>}
            </div>
            <div>
              <Label htmlFor="estimatedDuration">Estimated Duration (hours)</Label>
              <Input type="number" step="0.1" {...registerTransportation("estimatedDuration", { valueAsNumber: true })} />
              {transportationErrors.estimatedDuration && <p className="text-red-500">{transportationErrors.estimatedDuration.message}</p>}
            </div>
            <div>
              <Label htmlFor="remainingSeats">Remaining Seats</Label>
              <Input 
                type="number" 
                {...registerTransportation("remainingSeats", { valueAsNumber: true })} 
                max={getMaxSeats(selectedVehicleType)}
              />
              {transportationErrors.remainingSeats && <p className="text-red-500">{transportationErrors.remainingSeats.message}</p>}
            </div>
            <Button type="submit" className="bg-[#388A94] hover:bg-[#2c6d75] text-white">
              {editingTransportationIndex !== null ? "Update Transportation" : "Add Transportation"}
            </Button>
          </form>
        </DialogContent>
      </Dialog> */}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Created Successfully</DialogTitle>
            <DialogDescription>
              Your activity has been created. What would you like to do next?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={handleGoBack}
              className="bg-[#388A94] hover:bg-[#2c6d75] text-white"
            >
              Go to All Activities
            </Button>
            <Button variant="outline" onClick={handleCreateNew}>
              Create New Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
