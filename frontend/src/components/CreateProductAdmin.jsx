import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { X, Plus, CheckCircle, XCircle } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import signUpPicture from "../assets/images/signUpPicture.jpeg";
import backgroundPicture from "../assets/images/backgroundPattern.png";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";

const formSchema = z.object({
  name: z.string().min(1, "Please enter a product name"),
  price: z.number().min(1, "Please enter a valid price"),
  description: z
    .string()
    .min(200, "Description must be at least 200 characters"),
  quantity: z.number().min(1, "Please enter a valid quantity"),
});

const CreateProductForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");
  const [pictures, setPictures] = useState([]);
  const [base64Pictures, setBase64Pictures] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [toastTimeout, setToastTimeout] = useState(null);
  const navigate = useNavigate();
  const userRole = Cookies.get("role") || "guest";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: "",
      description: "",
      quantity: "",
    },
  });

  useEffect(() => {
    const fetchSupportedCurrencies = async () => {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          `https://trip-genie-apis.vercel.app/${userRole}/currencies`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCurrencies(response.data);
      } catch (error) {
        console.error("Error fetching supported currencies:", error);
      }
    };

    fetchSupportedCurrencies();
  }, []);

  const handlePicturesUpload = (e) => {
    const files = e.target.files;
    if (files) {
      setPictures([...pictures, ...Array.from(files)]);
    }

    const base64Files = Array.from(files).map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    });
    Promise.all(base64Files).then((base64Files) => {
      setBase64Pictures([...base64Pictures, ...base64Files]);
    });
  };

  const removePicture = (index) => {
    const updatedPictures = pictures.filter((_, i) => i !== index);
    const updatedBase64Pictures = base64Pictures.filter((_, i) => i !== index);
    setPictures(updatedPictures);
    setBase64Pictures(updatedBase64Pictures);
  };

  const showToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    setToastTimeout(setTimeout(() => setIsToastOpen(false), 3000));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("price", data.price);
    formData.append("description", data.description);
    formData.append("quantity", data.quantity);
    pictures.forEach((picture, index) => {
      formData.append("pictures", picture);
    });

    const token = Cookies.get("jwt");
    try {
      const response = await axios.post(
        `https://trip-genie-apis.vercel.app/${userRole}/products`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Server response:", response.data);
      setSuccess("Product created successfully!");
      showToast("Product created successfully!", "success");
      form.reset();
    } catch (err) {
      setError("Failed to create product. Please try again.");
      showToast("Failed to create product. Please try again.", "error");
      console.error(
        "Error creating product:",
        err.response ? err.response.data : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      description: "",
      quantity: 0,
    },
  });

  const formStyles = "space-y-6";
  const containerStyles = "grid grid-cols-1 md:grid-cols-2 gap-6";
  const columnStyles = "flex flex-col space-y-6 h-full";
  const labelStyles = "text-[#003f66]";
  const buttonStyles =
    "bg-[#1A3B47] hover:bg-[#1A3B47]/90 text-white px-6 py-3 text-lg";

  return (
    <ToastProvider>
      <div className="">
        <div className="">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={formStyles}>
              <div className={containerStyles}>
                <div className={columnStyles}>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelStyles}>
                          Product Name
                        </FormLabel>
                        <FormControl>
                          <Input id="name" {...field} className="w-full" />
                        </FormControl>
                        <FormDescription>
                          Enter the name of the product.
                        </FormDescription>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelStyles}>
                          Price (in USD)
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the price of the product in USD.
                        </FormDescription>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pictures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelStyles}>
                          Product Pictures
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="pictures"
                            type="file"
                            multiple
                            onChange={handlePicturesUpload}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Upload pictures of the product.
                        </FormDescription>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
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
                </div>
                <div className={columnStyles}>
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelStyles}>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the quantity of the product.
                        </FormDescription>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelStyles}>
                          Description (min. 200 characters)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            id="description"
                            {...field}
                            className="h-24 w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of the product.
                        </FormDescription>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
          <div className="flex justify-end mb-6 mr-6">
            <Button
              type="submit"
              className="bg-[#1A3B47] hover:bg-[#1A3B47]/90 text-white px-8 py-4 text-xl"
              disabled={loading}
            >
              <Plus className="mr-2 h-6 w-6" />
              {loading ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </div>

        <ToastViewport />
        {isToastOpen && (
          <Toast
            onOpenChange={setIsToastOpen}
            open={isToastOpen}
            duration={3000}
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
      </div>
    </ToastProvider>
  );
};

export default CreateProductForm;
