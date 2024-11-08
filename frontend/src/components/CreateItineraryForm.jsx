'use client'

import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
import { format, parseISO } from "date-fns";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash, Plus, Trash2, CheckCircle, Edit } from "lucide-react";
import backgroundPicture from "../assets/images/backgroundPattern.png";

const worldLanguages = [
  "Abkhaz", "Afar", "Afrikaans", "Akan", "Albanian", "Amharic", "Arabic", "Aragonese", "Armenian", "Assamese",
  "Avaric", "Avestan", "Aymara", "Azerbaijani", "Bambara", "Bashkir", "Basque", "Belarusian", "Bengali", "Bihari",
  "Bislama", "Bosnian", "Breton", "Bulgarian", "Burmese", "Catalan", "Chamorro", "Chechen", "Chichewa", "Chinese",
  "Chuvash", "Cornish", "Corsican", "Cree", "Croatian", "Czech", "Danish", "Divehi", "Dutch", "Dzongkha", "English",
  "Esperanto", "Estonian", "Ewe", "Faroese", "Fijian", "Finnish", "French", "Fula", "Galician", "Georgian", "German",
  "Greek", "Guaraní", "Gujarati", "Haitian", "Hausa", "Hebrew", "Herero", "Hindi", "Hiri Motu", "Hungarian",
  "Interlingua", "Indonesian", "Interlingue", "Irish", "Igbo", "Inupiaq", "Ido", "Icelandic", "Italian", "Inuktitut",
  "Japanese", "Javanese", "Kalaallisut", "Kannada", "Kanuri", "Kashmiri", "Kazakh", "Khmer", "Kikuyu", "Kinyarwanda",
  "Kirghiz", "Komi", "Kongo", "Korean", "Kurdish", "Kwanyama", "Latin", "Luxembourgish", "Luganda", "Limburgish",
  "Lingala", "Lao", "Lithuanian", "Luba-Katanga", "Latvian", "Manx", "Macedonian", "Malagasy", "Malay", "Malayalam",
  "Maltese", "Māori", "Marathi", "Marshallese", "Mongolian", "Nauru", "Navajo", "Norwegian Bokmål", "North Ndebele",
  "Nepali", "Ndonga", "Norwegian Nynorsk", "Norwegian", "Nuosu", "South Ndebele", "Occitan", "Ojibwe", "Old Church Slavonic",
  "Oromo", "Oriya", "Ossetian", "Panjabi", "Pāli", "Persian", "Polish", "Pashto", "Portuguese", "Quechua", "Romansh",
  "Kirundi", "Romanian", "Russian", "Sanskrit", "Sardinian", "Sindhi", "Northern Sami", "Samoan", "Sango", "Serbian",
  "Scottish Gaelic", "Shona", "Sinhala", "Slovak", "Slovene", "Somali", "Southern Sotho", "Spanish", "Sundanese",
  "Swahili", "Swati", "Swedish", "Tamil", "Telugu", "Tajik", "Thai", "Tigrinya", "Tibetan", "Turkmen", "Tagalog",
  "Tswana", "Tonga", "Turkish", "Tsonga", "Tatar", "Twi", "Tahitian", "Uighur", "Ukrainian", "Urdu", "Uzbek",
  "Venda", "Vietnamese", "Volapük", "Walloon", "Welsh", "Wolof", "Western Frisian", "Xhosa", "Yiddish", "Yoruba",
  "Zhuang", "Zulu"
];

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
      return 50;
  }
};

const activitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  location: z.object({
    address: z.string().min(1, "Address is required"),
    coordinates: z.object({
      longitude: z.number(),
      latitude: z.number(),
    }),
  }),
  duration: z.number().min(1, "Duration is required"),
  activityDate: z.string().min(1, "Date is required"),
  activityTime: z.string().min(1, "Time is required"),
  tags: z.array(z.string()).min(1, "Choose at least one Tag"),
  category: z.array(z.string()).min(1, "Choose at least one Category"),
});


const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  timeline: z.string().min(1, "Timeline is required"),
  language: z.string().min(1, "Language is required"),
  price: z.number().min(1, "Price is required"),
  pickUpLocation: z.string().min(1, "Pick-up location is required"),
  dropOffLocation: z.string().min(1, "Drop-off location is required"),
  activities: z.array(activitySchema).min(1, "At least one activity is required"),
  availableDates: z
    .array(
      z.object({
        date: z.string().min(1, "Date is required"),
        times: z.array(
          z.object({
            startTime: z.string().min(1, "Start time is required"),
            endTime: z.string().min(1, "End time is required"),
          })
        ).min(1, "At least one time slot is required"),
      })
    )
    .min(1, "At least one date is required"),
  accessibility: z.boolean(),
});

const ActivityForm = ({ onSave, onClose, initialData = null }) => {
  const [tags, setTags] = useState([]);
  const [category, setCategory] = useState([]);

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
        setValue('activityDate', format(dateTime, 'yyyy-MM-dd'));
        setValue('activityTime', format(dateTime, 'HH:mm'));
      }
      setValue('tags', initialData.tags);
      setValue('category', initialData.category);
    }
  }, [initialData, setValue]);
  
    const fetchTags = async () => {
      const response = await fetch("http://localhost:4000/api/getAllTags");
      const data = await response.json();
      setTags(data.map((tag) => ({ value: tag._id, label: tag.type })));
    };
  
    const fetchCategories = async () => {
      const response = await fetch("http://localhost:4000/api/getAllCategories");
      const data = await response.json();
      setCategory(data.map((cat) => ({ value: cat._id, label: cat.name })));
    };
  
    const handleAddActivity = (data) => {
      const formattedData = {
        ...data,
        timing: `${data.activityDate}T${data.activityTime}`,
      };
      onSave(formattedData);
      onClose();
    };
    

  
    return (
      <form onSubmit={handleSubmit(handleAddActivity)} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>
  
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} />
          {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
        </div>
  
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("location.address")} />
          {errors.location?.address && <p className="text-red-500 text-xs">{errors.location.address.message}</p>}
        </div>
  
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input id="longitude" type="number" step="any" {...register("location.coordinates.longitude", { valueAsNumber: true })} />
          </div>
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input id="latitude" type="number" step="any" {...register("location.coordinates.latitude", { valueAsNumber: true })} />
          </div>
        </div>
  
        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input id="duration" type="number" {...register("duration", { valueAsNumber: true })} />
          {errors.duration && <p className="text-red-500 text-xs">{errors.duration.message}</p>}
        </div>
  
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="activityDate">Date</Label>
            <Input id="activityDate" type="date" {...register("activityDate")} />
            {errors.activityDate && <p className="text-red-500 text-xs">{errors.activityDate.message}</p>}
          </div>
          <div>
            <Label htmlFor="activityTime">Time</Label>
            <Input id="activityTime" type="time" {...register("activityTime")} />
            {errors.activityTime && <p className="text-red-500 text-xs">{errors.activityTime.message}</p>}
          </div>
        </div>
  
        <div className="col-span-2">
          <Label>Categories</Label>
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
                value={category.filter(option => field.value?.includes(option.value))}
                onChange={(selectedOptions) => field.onChange(selectedOptions.map(option => option.value))}
              />
            )}
          />
          {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
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
                value={tags.filter(option => field.value?.includes(option.value))}
                onChange={(selectedOptions) => field.onChange(selectedOptions.map(option => option.value))}
              />
            )}
          />
          {errors.tags && <p className="text-red-500 text-xs">{errors.tags.message}</p>}
        </div>
  
        <Button type="submit" className="bg-[#1A3B47] hover:bg-[#388A94] rounded-full">Save Activity</Button>
      </form>
    );
  }
  
  
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
      timeline: "",
      language: "",
      price: "",
      pickUpLocation: "",
      dropOffLocation: "",
      availableDates: [{ date: "", times: [{ startTime: "", endTime: "" }] }],
      accessibility: false,
      activities: [],
    },
  });

  const availableDates = watch("availableDates");

  const handleCreateItinerary = async (data) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (activities.length === 0) {
        setError("Please add at least one activity.");
        setLoading(false);
        return;
      }

      const hasEmptyDateOrTime = data.availableDates.some(
        (date) => !date.date || date.times.some((time) => !time.startTime || !time.endTime)
      );

      if (hasEmptyDateOrTime) {
        setError("Please fill in all dates and times.");
        setLoading(false);
        return;
      }

      const token = Cookies.get("jwt");
      const role = Cookies.get("role") || "guest";

      const response = await axios.post(
        `http://localhost:4000/${role}/itineraries`,
        { ...data, activities },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess("Itinerary created successfully!");
      console.log("Created itinerary:", response.data);
      setShowDialog(true);
    } catch (err) {
      setError("Failed to create itinerary. Please try again.");
      console.error(err.message);
    } finally {
      setLoading(false);
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
    const newActivity = {
      ...activity,
      timing: `${activity.activityDate}T${activity.activityTime}`,
    };
    if (editingActivityIndex !== null) {
      const updatedActivities = [...activities];
      updatedActivities[editingActivityIndex] = newActivity;
      setActivities(updatedActivities);
      setEditingActivityIndex(null);
    } else {
      setActivities([...activities, newActivity]);
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

  const addDate = () => {
    setValue("availableDates", [
      ...availableDates,
      { date: "", times: [{ startTime: "", endTime: "" }] },
    ]);
  };

  const addTime = (dateIndex) => {
    const newDates = [...availableDates];
    newDates[dateIndex].times.push({ startTime: "", endTime: "" });
    setValue("availableDates", newDates);
  };

  const removeTime = (dateIndex, timeIndex) => {
    const newDates = [...availableDates];
    newDates[dateIndex].times.splice(timeIndex, 1);
  
    if (newDates[dateIndex].times.length === 0) {
      newDates.splice(dateIndex, 1);
    }
  
    setValue("availableDates", newDates);
  };

  const removeDate = (dateIndex) => {
    const newDates = [...availableDates];
    newDates.splice(dateIndex, 1);
    setValue("availableDates", newDates);
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
        <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-5xl flex flex-col md:flex-row">
          <div className="w-full md:w-1/4 bg-[#B5D3D1] p-6">
            <h2 className="text-3xl font-bold text-[#1A3B47] mb-2">
              Create New Itinerary
            </h2>
            <p className="text-sm mb-6 text-[#1A3B47]">
              Plan a new itinerary for your tours. Fill in the details carefully to ensure accurate information for your customers.
            </p>
          </div>
          <div className="w-full md:w-3/4 p-6">
            <form onSubmit={handleSubmit(handleCreateItinerary)} className="grid grid-cols-4 gap-4">
                   <div className="col-span-2">
                <Label htmlFor="title" className="text-sm font-medium">Itinerary Title</Label>
                <Input id="title" {...register("title")} onKeyDown={handleKeyDown} />
                {errors.title && (
                  <p className="text-red-500 text-xs">{errors.title.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="timeline" className="text-sm font-medium">Timeline</Label>
                <Input id="timeline" {...register("timeline")} onKeyDown={handleKeyDown}/>
                {errors.timeline && (
                  <p className="text-red-500 text-xs">{errors.timeline.message}</p>
                )}
              </div>

              <div className="col-span-1">
                <Label htmlFor="language" className="text-sm font-medium">Language</Label>
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <p className="text-red-500 text-xs">{errors.language.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="price" className="text-sm font-medium">Price (in USD)</Label>
                <Input
                  id="price"
                  type="number"
                  {...register("price", { valueAsNumber: true })}onKeyDown={handleKeyDown}/>
                {errors.price && (
                  <p className="text-red-500 text-xs">{errors.price.message}</p>
                )}
                
              </div>

              <div>
                <Label htmlFor="pickUpLocation" className="text-sm font-medium">Pick-Up Location</Label>
                <Input id="pickUpLocation" {...register("pickUpLocation")} onKeyDown={handleKeyDown} />
                {errors.pickUpLocation && (
                  <p className="text-red-500 text-xs">{errors.pickUpLocation.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="dropOffLocation" className="text-sm font-medium">Drop-Off Location</Label>
                <Input id="dropOffLocation" {...register("dropOffLocation")} onKeyDown={handleKeyDown}/>
                {errors.dropOffLocation && (
                  <p className="text-red-500 text-xs">{errors.dropOffLocation.message}</p>
                )}
              </div>

              <div className="col-span-3 space-y-1">
  <Label className="text-sm font-medium">Available Dates</Label>
  {availableDates.map((dateObj, dateIndex) => (
    <div key={dateIndex} className="mb-4 p-4 border rounded">
      <div className="flex items-center space-x-2 mb-2">
        <Controller
          name={`availableDates.${dateIndex}.date`}
          control={control}
          render={({ field }) => (
            <Input
              type="date"
              {...field}
              className={`w-40 ${errors.availableDates?.[dateIndex]?.date ? 'border-red-500' : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();  // Prevent the "Enter" key's default behavior
                  e.stopPropagation(); // Stop the event from bubbling up
                }
              }}
            />
          )}
        />
        <Button
          variant="destructive"
          size="icon"
          onClick={() => removeDate(dateIndex)}
          className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition duration-300 ease-in-out"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
      {dateObj.times.map((timeObj, timeIndex) => (
        <div key={timeIndex} className="flex items-center space-x-2 mb-2">
          <Controller
            name={`availableDates.${dateIndex}.times.${timeIndex}.startTime`}
            control={control}
            render={({ field }) => (
              <Input
                type="time"
                {...field}
                className={`w-32 ${errors.availableDates?.[dateIndex]?.times?.[timeIndex]?.startTime ? 'border-red-500' : ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();  // Prevent the "Enter" key's default behavior
                    e.stopPropagation(); // Stop the event from bubbling up
                  }
                }}
              />
            )}
          />
          <Controller
            name={`availableDates.${dateIndex}.times.${timeIndex}.endTime`}
            control={control}
            render={({ field }) => (
              <Input
                type="time"
                {...field}
                className={`w-32 ${errors.availableDates?.[dateIndex]?.times?.[timeIndex]?.endTime ? 'border-red-500' : ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();  // Prevent the "Enter" key's default behavior
                    e.stopPropagation(); // Stop the event from bubbling up
                  }
                }}
              />
            )}
          />
          <Button
            variant="destructive"
            size="icon"
            onClick={() => removeTime(dateIndex, timeIndex)}
            className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition duration-300 ease-in-out"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={() => addTime(dateIndex)}>
        <Plus className="mr-2 h-4 w-4" /> Add Time
      </Button>
      {dateObj.times.length === 0 && (
        <p className="text-red-500 text-xs mt-2">Please add at least one time</p>
      )}
    </div>
  ))}
  <Button variant="outline" onClick={addDate}>
    <Plus className="mr-2 h-4 w-4" /> Add Date
  </Button>
  {availableDates.length === 0 && (
    <p className="text-red-500 text-xs mt-2">Please add at least one date</p>
  )}
  {errors.availableDates && <span className="text-red-500 block mt-2">{errors.availableDates.message}</span>}
</div>


              <div className="col-span-1">
                <Label className="text-sm font-medium">Activities</Label>
                {activities.map((activity, index) => (
                  <div key={index} className="mb-2 p-2 border rounded flex justify-between items-center">
                    <span>{activity.name}</span>
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
                <Button
                  type="button"
                  onClick={() => {
                    setEditingActivityIndex(null);
                    setShowActivityForm(true);
                  }}
                  className="w-full mt-2 bg-[#1A3B47]"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Activity
                </Button>
                {activities.length === 0 && (
                  <p className="text-red-500 text-xs mt-2">Please add at least one activity</p>
                )}
              </div>


              <div className="col-span-4 flex items-center space-x-2">
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

              {error && (
                <Alert variant="destructive" className="col-span-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
  <Button 
                type="submit"
                className="col-span-4 bg-[#5D9297] text-white hover:bg-[#1A3B47]"
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
            <DialogFooter className="flex justify-center mr-16 mt-2">
              <Button
                onClick={handleGoBack}
                className="bg-[#5D9297] text-white hover:bg-[#4C7A80]"
              >
                Go to all itineraries
              </Button>
              <Button
                variant="outline"
                onClick={handleCreateNew}
                className="bg-[#1A3B47] text-white hover:bg-[#142B36]"
              >
                Create Another
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showActivityForm} onOpenChange={setShowActivityForm}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{editingActivityIndex !== null ? "Edit Activity" : "Add New Activity"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <ActivityForm
            onSave={handleAddActivity}
            onClose={() => setShowActivityForm(false)}
            initialData={editingActivityIndex !== null ? activities[editingActivityIndex] : null}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>

      </div>
    </div>
  );
};

export default ItineraryForm;