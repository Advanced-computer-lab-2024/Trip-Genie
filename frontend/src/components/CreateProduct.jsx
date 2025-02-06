import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
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
  const [showDialog, setShowDialog] = useState(false);
  const [pictures, setPictures] = useState([]);
  const [base64Pictures, setBase64Pictures] = useState([]);
  const [currencies, setCurrencies] = useState([]);
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
            credentials: "include",
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
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Server response:", response.data);
      setSuccess("Product created successfully!");
      setShowDialog(true);
    } catch (err) {
      setError("Failed to create product. Please try again.");
      console.error(
        "Error creating product:",
        err.response ? err.response.data : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setShowDialog(false);
    navigate("/all-products");
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
        <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row">
          <div className="w-full md:w-2/5 bg-[#B5D3D1] p-6">
            <h2 className="text-3xl font-bold text-[#1A3B47] mb-2">
              Create New Product
            </h2>
            <p className="text-sm mb-6 text-[#1A3B47]">
              Add a new product to your inventory. Fill in the details carefully
              to ensure accurate product information.
            </p>
          </div>
          <div className="w-full md:w-3/5 p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Product Name
                </Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-red-500 text-xs">{errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    {...register("quantity", { valueAsNumber: true })}
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-xs">
                      {errors.quantity.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">
                    Price (in USD)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    {...register("price", { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-xs">
                      {errors.price.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description (min. 200 characters)
                </Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  className="h-24"
                />
                {errors.description && (
                  <p className="text-red-500 text-xs">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pictures" className="text-sm font-medium">
                  Product Pictures
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
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Product"}
              </Button>
            </form>
          </div>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Success!</DialogTitle>
              <DialogDescription>
                The Product was created successfully.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="bg-[#5D9297]" onClick={handleGoBack}>
                Go to all products
              </Button>
              <Button variant="outline" onClick={handleCreateNew}>
                Create Another
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CreateProductForm;
