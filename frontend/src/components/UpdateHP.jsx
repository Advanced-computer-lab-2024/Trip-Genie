"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Check, Plus, XCircle, X, CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import signUpPicture from "../assets/images/signUpPicture.jpeg";
import backgroundPicture from "../assets/images/backgroundPattern.png";

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

export default function UpdateHistoricalPlace() {
  const { id } = useParams();
  const [historicalPlace, setHistoricalPlace] = useState({
    title: "",
    description: "",
    location: {
      address: "",
      city: "",
      country: "",
    },
    openingHours: {
      weekdays: "",
      weekends: "",
    },
    ticketPrices: {
      native: 0,
      student: 0,
      foreigner: 0,
    },
    historicalTag: [],
    pictures: [],
  });
  const [loading, setLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(Cookies.get("role") || "guest");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [showErrorPopup, setShowErrorPopup] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [currencies, setCurrencies] = useState([]);
  const [pictures, setPictures] = useState([]);
  const [newPictures, setNewPictures] = useState([]);
  const [base64Pictures, setBase64Pictures] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const addressRef = useRef(null);
  const countryRef = useRef(null);
  const cityRef = useRef(null);
  const nativePriceRef = useRef(null);
  const studentPriceRef = useRef(null);
  const foreignerPriceRef = useRef(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          `https://trip-genie-apis.vercel.app/tourism-governor/currencies`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCurrencies(response.data);
      } catch (err) {
        console.error("Error fetching currencies:", err.message);
        setError("Failed to fetch currencies. Please try again.");
      }
    };

    fetchCurrencies();
  }, []);

  useEffect(() => {
    const fetchHistoricalPlaceDetails = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("jwt");
        const response = await fetch(
          `https://trip-genie-apis.vercel.app/${userRole}/historical-places/${id}`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const historicalPlaceData = await response.json();
        setPictures(historicalPlaceData.pictures);
        if (!historicalPlaceData.historicalTag) {
          historicalPlaceData.historicalTag = [];
        }
        setHistoricalPlace(historicalPlaceData);
        setError(null);
      } catch (err) {
        setError("Error fetching data. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalPlaceDetails();
    fetchCountries();
    fetchAvailableTags();
  }, [id, userRole]);

  useEffect(() => {
    if (historicalPlace.location.country) {
      fetchCities(historicalPlace.location.country);
    } else {
      setCities([]);
    }
  }, [historicalPlace.location.country]);

  const fetchCountries = async () => {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all");
      const data = await response.json();
      const sortedCountries = data.map((country) => country.name.common).sort();
      setCountries(sortedCountries);
    } catch (error) {
      console.error("Error fetching countries:", error);
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
        throw new Error(data.msg || "Failed to fetch cities ");
      }

      const sortedCities = data.data.sort();
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

  const fetchAvailableTags = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `https://trip-genie-apis.vercel.app/${userRole}/historical-tag`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }

      const tags = await response.json();
      setAvailableTags(tags);
    } catch (err) {
      console.error("Error fetching tags:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setHistoricalPlace((prev) => {
      const newState = { ...prev };
      if (name.includes(".")) {
        const [parent, child] = name.split(".");
        newState[parent] = { ...newState[parent], [child]: value };
      } else {
        newState[name] = value;
      }

      if (name.startsWith("ticketPrices.")) {
        const price = parseFloat(value);
        if (isNaN(price) || price < 0) {
          newState.ticketPrices = {
            ...newState.ticketPrices,
            [name.split(".")[1]]: 0,
          };
        }
      }

      return newState;
    });

    setFormErrors((prev) => ({ ...prev, [name]: "" }));
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

  const handleSelectChange = (name, value) => {
    setHistoricalPlace((prev) => {
      const newState = { ...prev };
      if (name.includes(".")) {
        const [parent, child] = name.split(".");
        newState[parent] = { ...newState[parent], [child]: value };
      } else {
        newState[name] = value;
      }
      return newState;
    });

    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};

    if (!historicalPlace.title.trim()) {
      errors.title = "Title is required";
    }
    if (!historicalPlace.description.trim()) {
      errors.description = "Description is required";
    }
    if (!historicalPlace.location.address.trim()) {
      errors.address = "Address is required";
    }
    if (!historicalPlace.location.country) {
      errors.country = "Country is required";
    }
    if (!historicalPlace.location.city) {
      errors.city = "City is required";
    }

    if (historicalPlace.ticketPrices.native < 0) {
      errors.nativePrice = "Native ticket price cannot be negative";
    }
    if (historicalPlace.ticketPrices.student < 0) {
      errors.studentPrice = "Student ticket price cannot be negative";
    }
    if (historicalPlace.ticketPrices.foreigner < 0) {
      errors.foreignerPrice = "Foreigner ticket price cannot be negative";
    }

    if (!historicalPlace.openingHours.weekdays.trim()) {
      errors.weekdays = "Weekdays opening hours are required";
    }
    if (!historicalPlace.openingHours.weekends.trim()) {
      errors.weekends = "Weekends opening hours are required";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      const firstErrorField = Object.keys(formErrors)[0];
      if (firstErrorField) {
        const refMap = {
          title: titleRef,
          description: descriptionRef,
          "location.address": addressRef,
          "location.country": countryRef,
          "location.city": cityRef,
          "ticketPrices.native": nativePriceRef,
          "ticketPrices.student": studentPriceRef,
          "ticketPrices.foreigner": foreignerPriceRef,
        };
        const fieldRef = refMap[firstErrorField];
        if (fieldRef && fieldRef.current) {
          fieldRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          fieldRef.current.focus();
        }
      }
      return;
    }

    setLoading(true);
    try {
      const token = Cookies.get("jwt");
      const formData = new FormData();

      formData.append("title", historicalPlace.title);
      formData.append("description", historicalPlace.description);
      formData.append("location[address]", historicalPlace.location.address);
      formData.append("location[city]", historicalPlace.location.city);
      formData.append("location[country]", historicalPlace.location.country);
      formData.append(
        "openingHours[weekdays]",
        historicalPlace.openingHours.weekdays
      );
      formData.append(
        "openingHours[weekends]",
        historicalPlace.openingHours.weekends
      );
      formData.append(
        "ticketPrices[native]",
        historicalPlace.ticketPrices.native.toString()
      );
      formData.append(
        "ticketPrices[student]",
        historicalPlace.ticketPrices.student.toString()
      );
      formData.append(
        "ticketPrices[foreigner]",
        historicalPlace.ticketPrices.foreigner.toString()
      );

      historicalPlace.historicalTag.forEach((tag, index) => {
        formData.append(`historicalTag[${index}]`, tag._id);
      });

      formData.append("oldPictures", JSON.stringify(pictures));

      newPictures.forEach((picture) => {
        formData.append("newPictures", picture);
      });

      const response = await axios.put(
        `https://trip-genie-apis.vercel.app/${userRole}/historical-places/${id}`,
        formData,
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        setShowSuccessPopup(true);
      } else {
        throw new Error("Failed to update historical place");
      }
    } catch (err) {
      console.error("Error updating historical place:", err);
      setShowErrorPopup(
        err.response?.data?.message ||
          "Error updating historical place. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (
      newTag &&
      !historicalPlace.historicalTag.some((tag) => tag._id === newTag)
    ) {
      const tagToAdd = availableTags.find((tag) => tag._id === newTag);
      if (tagToAdd) {
        setHistoricalPlace((prev) => ({
          ...prev,
          historicalTag: [...prev.historicalTag, tagToAdd],
        }));
        setNewTag("");
      }
    }
  };

  const handleRemoveTag = (tagId) => {
    setHistoricalPlace((prev) => ({
      ...prev,
      historicalTag: prev.historicalTag.filter((tag) => tag._id !== tagId),
    }));
  };

  if (loading) {
    return <LoadingSpinner />;
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
              Update Historical Place
            </h2>
            <p className="text-sm mb-6 text-[#1A3B47]">
              Update the details of your historical place. Make sure all
              information is accurate and up-to-date.
            </p>
          </div>
          <div className="w-full md:w-3/4 p-6">
            <form className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={historicalPlace.title}
                  onChange={handleChange}
                  ref={titleRef}
                />
                {formErrors.title && (
                  <p className="text-red-500 text-xs">{formErrors.title}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={historicalPlace.description}
                  onChange={handleChange}
                  rows={5}
                  ref={descriptionRef}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-xs">
                    {formErrors.description}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="location.country">Country</Label>
                <Select
                  name="location.country"
                  onValueChange={(value) =>
                    handleSelectChange("location.country", value)
                  }
                  value={historicalPlace.location.country}
                  ref={countryRef}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.country && (
                  <p className="text-red-500 text-xs">{formErrors.country}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="location.city">City</Label>
                {historicalPlace.location.country &&
                  cities.length === 0 &&
                  !citiesLoading && (
                    <p className="text-blue-500 text-xs">
                      No cities available for the selected country.
                    </p>
                  )}
                {citiesLoading ? (
                  <p>Loading cities...</p>
                ) : (
                  <Select
                    name="location.city"
                    onValueChange={(value) =>
                      handleSelectChange("location.city", value)
                    }
                    value={historicalPlace.location.city}
                    ref={cityRef}
                    disabled={
                      !historicalPlace.location.country ||
                      cities.length === 0 ||
                      citiesLoading
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          citiesLoading ? "Loading cities..." : "Select a city"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {formErrors.city && (
                  <p className="text-red-500 text-xs">{formErrors.city}</p>
                )}
              </div>

              <div className="col-span-4">
                <Label htmlFor="location.address">Address</Label>
                <Input
                  id="location.address"
                  name="location.address"
                  value={historicalPlace.location.address}
                  onChange={handleChange}
                  ref={addressRef}
                />
                {formErrors.address && (
                  <p className="text-red-500 text-xs">{formErrors.address}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="openingHours.weekdays">
                  Opening Hours (Weekdays)
                </Label>
                <Input
                  id="openingHours.weekdays"
                  name="openingHours.weekdays"
                  value={historicalPlace.openingHours.weekdays}
                  onChange={handleChange}
                />
                {formErrors.weekdays && (
                  <p className="text-red-500 text-xs">{formErrors.weekdays}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="openingHours.weekends">
                  Opening Hours (Weekends)
                </Label>
                <Input
                  id="openingHours.weekends"
                  name="openingHours.weekends"
                  value={historicalPlace.openingHours.weekends}
                  onChange={handleChange}
                />
                {formErrors.weekends && (
                  <p className="text-red-500 text-xs">{formErrors.weekends}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="ticketPrices.native">
                  Ticket Price (Native)
                </Label>
                <Input
                  type="number"
                  id="ticketPrices.native"
                  name="ticketPrices.native"
                  value={historicalPlace.ticketPrices.native}
                  onChange={handleChange}
                  min="0"
                  ref={nativePriceRef}
                />
                {formErrors.nativePrice && (
                  <p className="text-red-500 text-xs">
                    {formErrors.nativePrice}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="ticketPrices.student">
                  Ticket Price (Student)
                </Label>
                <Input
                  type="number"
                  id="ticketPrices.student"
                  name="ticketPrices.student"
                  value={historicalPlace.ticketPrices.student}
                  onChange={handleChange}
                  min="0"
                  ref={studentPriceRef}
                />
                {formErrors.studentPrice && (
                  <p className="text-red-500 text-xs">
                    {formErrors.studentPrice}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="ticketPrices.foreigner">
                  Ticket Price (Foreigner)
                </Label>
                <Input
                  type="number"
                  id="ticketPrices.foreigner"
                  name="ticketPrices.foreigner"
                  value={historicalPlace.ticketPrices.foreigner}
                  onChange={handleChange}
                  min="0"
                  ref={foreignerPriceRef}
                />
                {formErrors.foreignerPrice && (
                  <p className="text-red-500 text-xs">
                    {formErrors.foreignerPrice}
                  </p>
                )}
              </div>

              <div className="col-span-4">
                <Label>Historical Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {historicalPlace.historicalTag.map((tag) => (
                    <div
                      key={tag._id}
                      className="flex items-center bg-gray-200 rounded-full px-3 py-1"
                    >
                      <span>
                        {tag.type} - {tag.period}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 p-0"
                        onClick={() => handleRemoveTag(tag._id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={newTag} onValueChange={setNewTag}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select a tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags.map((tag) => (
                        <SelectItem key={tag._id} value={tag._id}>
                          {tag.type} - {tag.period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddTag}
                    disabled={!newTag}
                    className="bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                  >
                    Add Tag
                  </Button>
                </div>
              </div>

              <div className="col-span-4">
                <Label htmlFor="pictures">Pictures</Label>
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

              <Button
                type="button"
                onClick={handleUpdate}
                className="col-span-4 bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Historical Place"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Dialog open={showSuccessPopup} onOpenChange={setShowSuccessPopup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
              Historical Place Updated
            </DialogTitle>
            <DialogDescription>
              The historical place has been successfully updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => navigate("/all-historical-places")}
              className="bg-[#5D9297] text-white hover:bg-[#1A3B47]"
            >
              Back to All Historical Places
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
              Failed to Update Historical Place
            </DialogTitle>
            <DialogDescription>
              {showErrorPopup ||
                "An error occurred while updating the historical place."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="default" onClick={() => setShowErrorPopup(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
