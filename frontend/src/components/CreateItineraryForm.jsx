"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
import { format, parseISO } from "date-fns";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Trash,
  Plus,
  Trash2,
  CheckCircle,
  Edit,
} from "lucide-react";
import backgroundPicture from "../assets/images/backgroundPattern.png";

const worldLanguages = [
  "Abkhaz",
  "Afar",
  "Afrikaans",
  "Akan",
  "Albanian",
  "Amharic",
  "Arabic",
  "Aragonese",
  "Armenian",
  "Assamese",
  "Avaric",
  "Avestan",
  "Aymara",
  "Azerbaijani",
  "Bambara",
  "Bashkir",
  "Basque",
  "Belarusian",
  "Bengali",
  "Bihari",
  "Bislama",
  "Bosnian",
  "Breton",
  "Bulgarian",
  "Burmese",
  "Catalan",
  "Chamorro",
  "Chechen",
  "Chichewa",
  "Chinese",
  "Chuvash",
  "Cornish",
  "Corsican",
  "Cree",
  "Croatian",
  "Czech",
  "Danish",
  "Divehi",
  "Dutch",
  "Dzongkha",
  "English",
  "Esperanto",
  "Estonian",
  "Ewe",
  "Faroese",
  "Fijian",
  "Finnish",
  "French",
  "Fula",
  "Galician",
  "Georgian",
  "German",
  "Greek",
  "Guaraní",
  "Gujarati",
  "Haitian",
  "Hausa",
  "Hebrew",
  "Herero",
  "Hindi",
  "Hiri Motu",
  "Hungarian",
  "Interlingua",
  "Indonesian",
  "Interlingue",
  "Irish",
  "Igbo",
  "Inupiaq",
  "Ido",
  "Icelandic",
  "Italian",
  "Inuktitut",
  "Japanese",
  "Javanese",
  "Kalaallisut",
  "Kannada",
  "Kanuri",
  "Kashmiri",
  "Kazakh",
  "Khmer",
  "Kikuyu",
  "Kinyarwanda",
  "Kirghiz",
  "Komi",
  "Kongo",
  "Korean",
  "Kurdish",
  "Kwanyama",
  "Latin",
  "Luxembourgish",
  "Luganda",
  "Limburgish",
  "Lingala",
  "Lao",
  "Lithuanian",
  "Luba-Katanga",
  "Latvian",
  "Manx",
  "Macedonian",
  "Malagasy",
  "Malay",
  "Malayalam",
  "Maltese",
  "Māori",
  "Marathi",
  "Marshallese",
  "Mongolian",
  "Nauru",
  "Navajo",
  "Norwegian Bokmål",
  "North Ndebele",
  "Nepali",
  "Ndonga",
  "Norwegian Nynorsk",
  "Norwegian",
  "Nuosu",
  "South Ndebele",
  "Occitan",
  "Ojibwe",
  "Old Church Slavonic",
  "Oromo",
  "Oriya",
  "Ossetian",
  "Panjabi",
  "Pāli",
  "Persian",
  "Polish",
  "Pashto",
  "Portuguese",
  "Quechua",
  "Romansh",
  "Kirundi",
  "Romanian",
  "Russian",
  "Sanskrit",
  "Sardinian",
  "Sindhi",
  "Northern Sami",
  "Samoan",
  "Sango",
  "Serbian",
  "Scottish Gaelic",
  "Shona",
  "Sinhala",
  "Slovak",
  "Slovene",
  "Somali",
  "Southern Sotho",
  "Spanish",
  "Sundanese",
  "Swahili",
  "Swati",
  "Swedish",
  "Tamil",
  "Telugu",
  "Tajik",
  "Thai",
  "Tigrinya",
  "Tibetan",
  "Turkmen",
  "Tagalog",
  "Tswana",
  "Tonga",
  "Turkish",
  "Tsonga",
  "Tatar",
  "Twi",
  "Tahitian",
  "Uighur",
  "Ukrainian",
  "Urdu",
  "Uzbek",
  "Venda",
  "Vietnamese",
  "Volapük",
  "Walloon",
  "Welsh",
  "Wolof",
  "Western Frisian",
  "Xhosa",
  "Yiddish",
  "Yoruba",
  "Zhuang",
  "Zulu",
];

const activitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  location: z.object({
    address: z.string().min(1, "Address is required"),
  }),
  duration: z.number().min(1, "Duration is required"),
  activityTime: z.string().min(1, "Time is required"),
  tags: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  day: z.number().min(1, "Day is required"),
});

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  language: z.string().min(1, "Language is required"),
  price: z.number().min(1, "Price is required"),
  pickUpLocation: z.string().min(1, "Pick-up location is required"),
  dropOffLocation: z.string().min(1, "Drop-off location is required"),
  availableDates: z
    .array(
      z.object({
        date: z.string().min(1, "Date is required"),
      })
    )
    .min(1, "At least one date is required"),
  accessibility: z.boolean(),
  // isRepeated: z.boolean(),
});

const ActivityForm = ({
  onSave,
  onClose,
  initialData = null,
  itineraryDate,
}) => {
  console.log(itineraryDate);
  const [tags, setTags] = useState([]);
  const [category, setCategory] = useState([]);
  const [pictures, setPictures] = useState([]);
  const [base64Pictures, setBase64Pictures] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: initialData || {},
  });

  useEffect(() => {
    fetchTags();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialData) {
      if (initialData.timing) {
        const dateTime = new Date(initialData.timing);

        // Check if dateTime is valid
        if (!isNaN(dateTime.getTime())) {
          const hours = dateTime.getHours();
          const minutes = dateTime.getMinutes();

          // Check if both hours and minutes are set (i.e., not 0 or NaN)
          if (hours !== null && minutes !== null) {
            setValue("activityTime", format(dateTime, "HH:mm"));
          }
        }
      }

      setValue("tags", initialData.tags);
      setValue("category", initialData.category);
      setPictures(initialData.pictures || []);
      const base64Files = (initialData.pictures || []).map((file) =>
        URL.createObjectURL(file)
      );
      setBase64Pictures(base64Files);
    }
  }, [initialData, setValue]);

  const fetchTags = async () => {
    const response = await fetch(
      "https://trip-genie-apis.vercel.app/api/getAllTags"
    );
    const data = await response.json();
    setTags(data.map((tag) => ({ value: tag._id, label: tag.type })));
  };

  const fetchCategories = async () => {
    const response = await fetch(
      "https://trip-genie-apis.vercel.app/api/getAllCategories"
    );
    const data = await response.json();
    setCategory(data.map((cat) => ({ value: cat._id, label: cat.name })));
  };

  const handlePicturesUpload = (e) => {
    const files = e.target.files;
    if (files) {
      setPictures([...pictures, ...Array.from(files)]);
    }
    const base64Files = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    setBase64Pictures([...base64Pictures, ...base64Files]);
  };

  const removePicture = (index) => {
    const updatedPictures = pictures.filter((_, i) => i !== index);
    const updatedBase64Pictures = base64Pictures.filter((_, i) => i !== index);
    setPictures(updatedPictures);
    setBase64Pictures(updatedBase64Pictures);
  };

  const handleAddActivity = (data) => {
    // console.log("Activity data:", data)
    const newActivity = {
      ...data,
      timing: itineraryDate + "T" + data.activityTime,
      pictures: pictures,
    };
    onSave(newActivity);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(handleAddActivity)} className="space-y-4">
      <div className="flex space-x-4">
        <div className="flex-1">
          <Label htmlFor="day" className="text-sm font-medium">
            Day
          </Label>
          <Input
            id="day"
            type="number"
            min="1"
            {...register("day", { valueAsNumber: true })}
          />
          {errors.day && (
            <p className="text-red-500 text-xs">
              {errors.numberOfDays.message}
            </p>
          )}
        </div>

        <div className="flex-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-red-500 text-xs">{errors.name.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} />
        {errors.description && (
          <p className="text-red-500 text-xs">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register("location.address")} />
        {errors.location?.address && (
          <p className="text-red-500 text-xs">
            {errors.location.address.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="0"
            {...register("duration", { valueAsNumber: true })}
          />
          {errors.duration && (
            <p className="text-red-500 text-xs">{errors.duration.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="activityTime">Start Time</Label>
          <Input id="activityTime" type="time" {...register("activityTime")} />
          {errors.activityTime && (
            <p className="text-red-500 text-xs">
              {errors.activityTime.message}
            </p>
          )}
        </div>
      </div>

      {/* {(
        <div>
          <Label htmlFor="activityDate">Activity Date</Label>
          <Input
            id="activityDate"
            type="date"
            {...register("activityDate")}
            min={itineraryDate}
          />
          {errors.activityDate && (
            <p className="text-red-500 text-xs">
              {errors.activityDate.message}
            </p>
          )}
        </div>
      )} */}

      <div className="grid grid-cols-2 gap-2"></div>

      <div className="col-span-2">
        <Label>Tags (Optional)</Label>
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
              value={tags.filter((option) =>
                field.value?.includes(option.value)
              )}
              onChange={(selectedOptions) =>
                field.onChange(selectedOptions.map((option) => option.value))
              }
            />
          )}
        />
      </div>

      <div className="col-span-2">
        <Label>Categories (Optional)</Label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <ReactSelect
              {...field}
              options={category}
              isMulti
              className="react-select-container"
              classNamePrefix="react-select"
              value={category.filter((option) =>
                field.value?.includes(option.value)
              )}
              onChange={(selectedOptions) =>
                field.onChange(selectedOptions.map((option) => option.value))
              }
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pictures" className="text-sm font-medium">
          Add Activity Pictures (Optional)
        </Label>
        <Input
          id="pictures"
          type="file"
          multiple
          onChange={handlePicturesUpload}
        />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        {base64Pictures.map((picture, index) => (
          <div key={`new-${index}`} className="relative">
            <img
              src={picture}
              alt={`Activity ${index + 1}`}
              className="w-full h-32 object-cover rounded cursor-pointer"
              onClick={() => {
                setSelectedImage(picture);
              }}
            />
            <button
              type="button"
              onClick={() => removePicture(index)}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-end pr-4">
        <Button
          type="submit"
          className="bg-[#1A3B47] hover:bg-[#3E5963] text-white px-4 py-2 rounded-lg"
        >
          Save Activity
        </Button>
      </div>
    </form>
  );
};

const ItineraryForm = () => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent the default Enter behavior
    }
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activities, setActivities] = useState([]);
  const [editingActivityIndex, setEditingActivityIndex] = useState(null);
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      language: "",
      price: "",
      pickUpLocation: "",
      dropOffLocation: "",
      availableDates: [{ date: "" }],
      accessibility: false,
      day: 1,
      // isRepeated: false,
    },
  });

  const availableDates = watch("availableDates");
  // const isRepeated = watch("isRepeated")
  const itineraryDate = watch("availableDates[0].date");

  const handleCreateItinerary = async (data) => {
    console.log("handleCreateItinerary called with data:", data);
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (activities.length === 0) {
        setError("Please add at least one activity.");
        setLoading(false);
        console.log("Error: No activities added.");
        return;
      }

      // const hasEmptyDateOrTime = data.availableDates.some((date) => !date.date);

      // if (hasEmptyDateOrTime) {
      //   setError("Please fill in all dates and times.");
      //   setLoading(false);
      //   console.log("Error: Empty date or time detected.");
      //   return;
      // }

      // Sort activities by day and then by start time
      activities.sort((a, b) => {
        if (a.day === b.day) {
          return (
            new Date(`1970-01-01T${a.activityTime}`) -
            new Date(`1970-01-01T${b.activityTime}`)
          );
        }
        return a.day - b.day;
      });
      console.log("Activities sorted by day and time:", activities);

      const overlappingActivities = [];

      // Loop through the activities and check for overlaps within the same day
      for (let i = 0; i < activities.length - 1; i++) {
        const currentActivity = activities[i];
        const nextActivity = activities[i + 1];

        // Only check for overlaps if they are on the same day
        if (currentActivity.day === nextActivity.day) {
          const currentEndTime = new Date(
            `1970-01-01T${currentActivity.activityTime}`
          );
          currentEndTime.setMinutes(
            currentEndTime.getMinutes() + currentActivity.duration
          );

          const nextStartTime = new Date(
            `1970-01-01T${nextActivity.activityTime}`
          );

          console.log("Checking overlap:");
          console.log(
            "Current activity time string:",
            currentActivity.activityTime
          );
          console.log("Next activity time string:", nextActivity.activityTime);
          console.log("Current end time:", currentEndTime);
          console.log("Next start time:", nextStartTime);

          // Check if the next activity starts before the current one ends
          if (nextStartTime < currentEndTime) {
            overlappingActivities.push({
              current: currentActivity,
              next: nextActivity,
            });
            console.log(
              "Overlap detected between activities:",
              currentActivity.name,
              "and",
              nextActivity.name
            );
          }
        }
      }

      if (overlappingActivities.length > 0) {
        const errorMessage = overlappingActivities
          .map(
            ({ current, next }) =>
              `Activity "${current.name}" overlaps with "${next.name}" on day ${current.day}`
          )
          .join("\n");

        setError(`Error: Overlapping activities detected:\n${errorMessage}`);
        setLoading(false);
        console.log("Error: Overlapping activities detected:\n", errorMessage);
        return;
      } else {
        console.log("No overlapping activities found.");
      }

      const token = Cookies.get("jwt");
      const role = Cookies.get("role") || "guest";
      console.log("Token:", token);
      console.log("Role:", role);

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("language", data.language);
      formData.append("price", data.price);
      formData.append("pickUpLocation", data.pickUpLocation);
      formData.append("dropOffLocation", data.dropOffLocation);
      formData.append("accessibility", data.accessibility);
      formData.append("availableDates", JSON.stringify(data.availableDates));
      formData.append("activities", JSON.stringify(activities));
      activities?.forEach((activity, index) => {
        activity?.pictures?.forEach((file, fileIndex) => {
          formData.append(`activities[${index}][pictures][${fileIndex}]`, file);
        });
      });
      console.log("Form data prepared:", formData);

      const response = await axios.post(
        `https://trip-genie-apis.vercel.app/${role}/itineraries`,
        formData,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess("Itinerary created successfully!");
      console.log("Created itinerary:", response.data);
      setShowDialog(true);
    } catch (err) {
      setError("Failed to create itinerary. Please try again.");
      console.error("Error during itinerary creation:", err.message);
    } finally {
      setLoading(false);
      console.log("Itinerary creation process completed.");
    }
  };

  const handleGoBack = () => {
    setShowDialog(false);
    navigate("/all-itineraries");
  };

  const handleCreateNew = () => {
    setShowDialog(false);
    window.location.reload();
  };

  const handleAddActivity = (activity) => {
    console.log("Activity:", activity);
    if (editingActivityIndex !== null) {
      const updatedActivities = [...activities];
      updatedActivities[editingActivityIndex] = activity;
      setActivities(updatedActivities);
      setEditingActivityIndex(null);
    } else {
      setActivities([...activities, activity]);
    }
    setValue("activities", activities);
    setShowActivityForm(false);
  };

  const handleEditActivity = (index) => {
    const activityToEdit = activities[index];
    const dateTime = new Date(activityToEdit.timing);
    setEditingActivityIndex(index);
    setShowActivityForm(true);
  };
  const handleDeleteActivity = (index) => {
    const updatedActivities = activities.filter((_, i) => i !== index);
    setActivities(updatedActivities);
    setValue("activities", updatedActivities);
  };

  const addDate = (e) => {
    e.preventDefault();
    setValue("availableDates", [...availableDates, { date: "" }]);
  };

  const removeDate = (dateIndex) => {
    const newDates = [...availableDates];
    newDates.splice(dateIndex, 1);
    setValue("availableDates", newDates);
  };

  // const addTime = (dateIndex) => {
  //   const newDates = [...availableDates];
  //   newDates[dateIndex].times.push({ startTime: "", endTime: "" });
  //   setValue("availableDates", newDates);
  // };

  // const removeTime = (dateIndex, timeIndex) => {
  //   const newDates = [...availableDates];
  //   newDates[dateIndex].times.splice(timeIndex, 1);

  //   if (newDates[dateIndex].times.length === 0) {
  //     newDates.splice(dateIndex, 1);
  //   }

  //   setValue("availableDates", newDates);
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
        <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-5xl flex flex-col md:flex-row">
          <div className="w-full md:w-1/4 bg-[#B5D3D1] p-6">
            <h2 className="text-3xl font-bold text-[#1A3B47] mb-2">
              Create New Itinerary
            </h2>
            <p className="text-sm mb-6 text-[#1A3B47]">
              Plan a new itinerary for your tours. Fill in the details carefully
              to ensure accurate information for your customers.
            </p>
          </div>
          <div className="w-full md:w-3/4 p-6">
            <form
              onSubmit={handleSubmit(handleCreateItinerary)}
              className="grid grid-cols-4 gap-4"
            >
              <div className="col-span-4">
                <Label htmlFor="title" className="text-sm font-medium">
                  Itinerary Title
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  onKeyDown={handleKeyDown}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs">{errors.title.message}</p>
                )}
              </div>
              <div className="col-span-1">
                <Label htmlFor="language" className="text-sm font-medium">
                  Language
                </Label>
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent>
                        {worldLanguages.map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.language && (
                  <p className="text-red-500 text-xs">
                    {errors.language.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="price" className="text-sm font-medium">
                  Price (in USD)
                </Label>
                <Input
                  id="price"
                  type="number"
                  {...register("price", { valueAsNumber: true })}
                  onKeyDown={handleKeyDown}
                />
                {errors.price && (
                  <p className="text-red-500 text-xs">{errors.price.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="pickUpLocation" className="text-sm font-medium">
                  Pick-Up Location
                </Label>
                <Input
                  id="pickUpLocation"
                  {...register("pickUpLocation")}
                  onKeyDown={handleKeyDown}
                />
                {errors.pickUpLocation && (
                  <p className="text-red-500 text-xs">
                    {errors.pickUpLocation.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="dropOffLocation"
                  className="text-sm font-medium"
                >
                  Drop-Off Location
                </Label>
                <Input
                  id="dropOffLocation"
                  {...register("dropOffLocation")}
                  onKeyDown={handleKeyDown}
                />
                {errors.dropOffLocation && (
                  <p className="text-red-500 text-xs">
                    {errors.dropOffLocation.message}
                  </p>
                )}
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <Controller
                  name="accessibility"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="accessibility"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="accessibility" className="text-sm font-medium">
                  Accessible for Disabled
                </Label>
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                {/* 
                <div className="flex items-center space-x-2">
                  <Controller
                    name="isRepeated"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="isRepeated"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="isRepeated" className="text-sm font-medium">
                    Repeatable Itinerary
                  </Label>
                </div> */}

                {/* Explanation text below checkbox */}
                {/* <p className="text-sm text-gray-600">
                  {isRepeated
                    ? "If the itinerary is repeated, it means it's a one-day itinerary and can be repeated on other days. You only need to pick the activity times."
                    : "If the itinerary is not repeated, then it can span over multiple days but it only occurs once. You'll need to specify dates for each activity."}
                </p> 
                */}
              </div>

              <div className="col-span-2 space-y-4 p-4 border rounded">
                <Label className="text-sm font-medium">Available Dates</Label>

                {availableDates.map((dateObj, dateIndex) => (
                  <div
                    key={dateIndex}
                    className="flex items-center space-x-2 mb-2"
                  >
                    <Controller
                      name={`availableDates.${dateIndex}.date`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="date"
                          {...field}
                          value={dateObj.date.split("T")[0]}
                          min={
                            new Date(
                              new Date().setDate(new Date().getDate() + 1)
                            )
                              .toISOString()
                              .split("T")[0]
                          } // Sets min date to tomorrow
                          className={`w-40 ${
                            errors.availableDates?.[dateIndex]?.date
                              ? "border-red-500"
                              : ""
                          }`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                            }
                          }}
                        />
                      )}
                    />
                    {/* Show remove button only if isRepeated is true or there's more than one date */}
                    {availableDates.length > 1 && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeDate(dateIndex)}
                        className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition duration-300 ease-in-out"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}

                {/* Show add date button only if isRepeated is true or no dates have been added */}
                {
                  <Button variant="outline" onClick={addDate} className="mt-2">
                    <Plus className="mr-2 h-4 w-4" /> Add Date
                  </Button>
                }

                {/* Error message when no dates are added */}
                {availableDates.length === 0 && (
                  <p className="text-red-500 text-xs mt-2">
                    Please add at least one date
                  </p>
                )}
                {errors.availableDates && (
                  <span className="text-red-500 block mt-2">
                    {errors.availableDates.message}
                  </span>
                )}
              </div>

              <div className="col-span-2">
                <Label className="text-sm font-medium">Activities</Label>
                {activities.map((activity, index) => (
                  <div
                    key={index}
                    className="mb-2 p-2 border rounded flex justify-between items-center"
                  >
                    <span>
                      {activity.name}, Day:{activity.day}
                    </span>
                    <div>
                      <Button
                        type="button"
                        onClick={() => handleEditActivity(index)}
                        className="p-2 h-10 w-10 rounded-full bg-[#B5D3D1] hover:bg-[#5D9297] transition duration-300 ease-in-out mr-2"
                      >
                        <Edit className="h-4 w-4 text-[#1A3B47]" />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDeleteActivity(index)}
                        className="p-2 h-10 w-10 rounded-full bg-red-100 hover:bg-red-200 transition duration-300 ease-in-out"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="relative">
                  <Button
                    type="button"
                    onClick={() => {
                      setEditingActivityIndex(null);
                      setShowActivityForm(true);
                    }}
                    className="w-full mt-2 bg-[#1A3B47]"
                    disabled={!itineraryDate}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Activity
                  </Button>

                  {/* Tooltip message when button is disabled */}
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="col-span-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="col-span-4 bg-[#5D9297] text-white mt-2 hover:bg-[#1A3B47]"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Itinerary"}
              </Button>
            </form>
          </div>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="text-left">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span>Success!</span>
              </DialogTitle>
              <DialogDescription>
                The Itinerary was created successfully.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end space-x-4 mt-2">
              <Button
                onClick={handleGoBack}
                className="bg-[#5D9297] text-white hover:bg-[#4C7A80] px-4 py-2 rounded"
              >
                Go to all itineraries
              </Button>
              <Button
                variant="outline"
                onClick={handleCreateNew}
                className="bg-[#1A3B47] text-white hover:bg-[#142B36] px-4 py-2 rounded"
              >
                Create Another
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showActivityForm} onOpenChange={setShowActivityForm}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                {editingActivityIndex !== null
                  ? "Edit Activity"
                  : "Add New Activity"}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[80vh]">
              <ActivityForm
                onSave={handleAddActivity}
                onClose={() => setShowActivityForm(false)}
                initialData={
                  editingActivityIndex !== null
                    ? activities[editingActivityIndex]
                    : null
                }
                // isRepeated={isRepeated}
                itineraryDate={itineraryDate}
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ItineraryForm;
