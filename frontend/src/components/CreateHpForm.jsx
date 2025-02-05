"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import backgroundPicture from "../assets/images/backgroundPattern.png";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import signUpPicture from "../assets/images/signUpPicture.jpeg";

const createFormSchema = (isCityDisabled) =>
  z.object({
    title: z.string().min(1, "Please enter a name"),
    description: z.string().min(1, "Please enter a description"),
    location: z.object({
      address: z.string().min(1, "Please enter an address"),
      city: isCityDisabled
        ? z.string().optional()
        : z.string().min(1, "Please enter a city"),
      country: z.string().min(1, "Please select a country"),
    }),
    historicalTag: z.array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    ),
    openingHours: z.object({
      weekdays: z.string().min(1, "Please enter weekday opening hours"),
      weekends: z.string().min(1, "Please enter weekend opening hours"),
    }),
    ticketPrices: z.object({
      foreigner: z.string().min(1, "Please enter foreigner ticket price"),
      native: z.string().min(1, "Please enter native ticket price"),
      student: z.string().min(1, "Please enter student ticket price"),
    }),
  });

export default function CreateHpForm() {
  const [historicalTags, setHistoricalTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [isCityDisabled, setIsCityDisabled] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [pictures, setPictures] = useState([]);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: zodResolver(createFormSchema(isCityDisabled)),
    defaultValues: {
      title: "",
      description: "",
      location: {
        address: "",
        city: "",
        country: "",
      },
      historicalTag: [],
      openingHours: {
        weekdays: "",
        weekends: "",
      },
      ticketPrices: {
        foreigner: "",
        native: "",
        student: "",
      },
    },
  });

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get("https://restcountries.com/v3.1/all");
        const countryList = response.data
          .map((country) => ({
            name: country.name.common,
            code: country.cca2,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryList);
      } catch (err) {
        console.error("Error fetching countries:", err.message);
        setError("Failed to fetch countries. Please try again.");
      }
    };
    fetchCountries();

    const fetchCurrencies = async () => {
      try {
        const token = Cookies.get("jwt");
        const role = Cookies.get("role") || "guest";
        const response = await axios.get(
          `http://localhost:4000/${role}/currencies`,
          {
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

    fetchHistoricalTags();
  }, []);

  const fetchHistoricalTags = async () => {
    try {
      const token = Cookies.get("jwt");
      const role = Cookies.get("role") || "guest";

      const response = await axios.get(
        `http://localhost:4000/${role}/historical-tag`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setHistoricalTags(response.data);
    } catch (err) {
      console.error("Error fetching historical tags:", err.message);
      setError("Failed to fetch tags. Please try again.");
    }
  };

  const fetchCities = async (country) => {
    setCitiesLoading(true);
    setIsCityDisabled(true);
    try {
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries/cities",
        {
          method: "POST",
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

      const sortedCities = data.data.sort();
      setCities(sortedCities);
      setIsCityDisabled(sortedCities.length === 0);
    } catch (err) {
      console.error("Error fetching cities: ", err);
      setCities([]);
      setIsCityDisabled(true);
    } finally {
      setCitiesLoading(false);
      trigger("location.city");
    }
  };

  const handleCountryChange = (event) => {
    const country = event.target.value;
    fetchCities(country);
  };

  const handlePicturesUpload = (e) => {
    const files = e.target.files;
    if (files) {
      setPictures([...pictures, ...Array.from(files)]);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    const token = Cookies.get("jwt");

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("location[address]", data.location.address);
    formData.append("location[city]", data.location.city);
    formData.append("location[country]", data.location.country);
    data.historicalTag.forEach((tag, index) => {
      formData.append(`historicalTag[${index}]`, tag.value);
    });
    formData.append("openingHours[weekdays]", data.openingHours.weekdays);
    formData.append("openingHours[weekends]", data.openingHours.weekends);
    formData.append("ticketPrices[foreigner]", data.ticketPrices.foreigner);
    formData.append("ticketPrices[native]", data.ticketPrices.native);
    formData.append("ticketPrices[student]", data.ticketPrices.student);

    pictures.forEach((picture, index) => {
      formData.append(`pictures`, picture);
    });

    try {
      const response = await axios.post(
        `http://localhost:4000/tourism-governor/historical-places`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        setShowDialog(true);
      } else {
        throw new Error("Failed to create historical place.");
      }
    } catch (err) {
      setError("Failed to create historical place. Please try again.");
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setShowDialog(false);
    navigate("/all-historical-places");
  };

  const handleCreateNew = () => {
    setShowDialog(false);
    window.location.reload();
  };

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
              Create Historical Place
            </h2>
            <p className="text-sm mb-6 text-[#1A3B47]">
              Add a new historical place to your collection. Fill in all the
              details carefully to ensure accurate information for visitors.
            </p>
          </div>
          <div className="w-full md:w-3/4 p-6">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-4 gap-4"
            >
              <div className="col-span-2">
                <Label htmlFor="title">Name</Label>
                <Input id="title" {...register("title")} />
                {errors.title && (
                  <p className="text-red-500 text-xs">{errors.title.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} />
                {errors.description && (
                  <p className="text-red-500 text-xs">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="country">Country</Label>
                <select
                  {...register("location.country")}
                  onChange={handleCountryChange}
                  className="w-full h-10 border border-gray-300 rounded-md"
                  id="country"
                >
                  <option value="">Select a country</option>
                  {countries.map((country) => (
                    <option key={country.name} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.location?.country && (
                  <p className="text-red-500 text-xs">
                    {errors.location.country.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="city">City {isCityDisabled ? "" : "*"}</Label>
                <select
                  {...register("location.city")}
                  disabled={isCityDisabled}
                  className="w-full h-10 border border-gray-300 rounded-md"
                  id="city"
                >
                  <option value="">Select a city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                {errors.location?.city && (
                  <p className="text-red-500 text-xs">
                    {errors.location.city.message}
                  </p>
                )}
                {isCityDisabled && (
                  <p className="text-blue-500 text-xs">
                    No cities available for this country. You can proceed
                    without selecting a city.
                  </p>
                )}
              </div>

              <div className="col-span-4">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  {...register("location.address")}
                  placeholder="Address"
                />
                {errors.location?.address && (
                  <p className="text-red-500 text-xs">
                    {errors.location.address.message}
                  </p>
                )}
              </div>

              <div className="col-span-4">
                <Label>Historical Tags</Label>
                <Controller
                  name="historicalTag"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isMulti
                      options={historicalTags.map((tag) => ({
                        value: tag._id,
                        label: `${tag.type} `,
                      }))}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  )}
                />
                {errors.historicalTag && (
                  <p className="text-red-500 text-xs">
                    {errors.historicalTag.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="weekdays">Opening Hours (Weekdays)</Label>
                <Input
                  id="weekdays"
                  {...register("openingHours.weekdays")}
                  placeholder="e.g., 9 AM - 5 PM"
                />
                {errors.openingHours?.weekdays && (
                  <p className="text-red-500 text-xs">
                    {errors.openingHours.weekdays.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="weekends">Opening Hours (Weekends)</Label>
                <Input
                  id="weekends"
                  {...register("openingHours.weekends")}
                  placeholder="e.g., 10 AM - 4 PM"
                />
                {errors.openingHours?.weekends && (
                  <p className="text-red-500 text-xs">
                    {errors.openingHours.weekends.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="foreigner">
                  Ticket Prices (in USD) (Foreigner)
                </Label>
                <Input
                  id="foreigner"
                  type="number"
                  min="0"
                  {...register("ticketPrices.foreigner")}
                  placeholder="Enter foreigner ticket price (USD)"
                />
                {errors.ticketPrices?.foreigner && (
                  <p className="text-red-500 text-xs">
                    {errors.ticketPrices.foreigner.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="native">Ticket Prices (in USD) (Native)</Label>
                <Input
                  id="native"
                  type="number"
                  min="0"
                  {...register("ticketPrices.native")}
                  placeholder="Enter native ticket price (USD)"
                />
                {errors.ticketPrices?.native && (
                  <p className="text-red-500 text-xs">
                    {errors.ticketPrices.native.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="student">
                  Ticket Prices (in USD) (Student)
                </Label>
                <Input
                  id="student"
                  type="number"
                  min="0"
                  {...register("ticketPrices.student")}
                  placeholder="Enter student ticket price (USD)"
                />
                {errors.ticketPrices?.student && (
                  <p className="text-red-500 text-xs">
                    {errors.ticketPrices.student.message}
                  </p>
                )}
              </div>

              <div className="col-span-4">
                <Label htmlFor="pictures">Pictures</Label>
                <Input
                  id="pictures"
                  type="file"
                  multiple
                  onChange={handlePicturesUpload}
                />
              </div>

              <Button
                type="submit"
                className="col-span-4 bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Historical Place"}
              </Button>

              {error && (
                <p className="col-span-4 text-red-500 text-xs">{error}</p>
              )}
            </form>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Success!</DialogTitle>
            <DialogDescription>
              The historical place was created successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={handleGoBack}
              className="bg-[#5D9297] text-white hover:bg-[#1A3B47]"
            >
              Go to All Historical Places
            </Button>
            <Button variant="outline" onClick={handleCreateNew}>
              Create Another
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
