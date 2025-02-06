"use client";

import React, { useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";
import { ChevronLeft, Check, X } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Modal } from "@/components/Modal";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  name: z.string().min(1, "Please enter a product name"),
  price: z.number().min(1, "Please enter a valid price"),
  description: z
    .string()
    .min(200, "Description must be at least 200 characters"),
  quantity: z.number().min(1, "Please enter a valid quantity"),
});

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

const UpdateProduct = ({ id, onBack }) => {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
    quantity: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(Cookies.get("role") || "guest");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [pictures, setPictures] = useState([]);
  const [newPictures, setNewPictures] = useState([]);
  const [base64Pictures, setBase64Pictures] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      description: "",
      quantity: 0,
    },
  });

  useEffect(() => {
    const fetchProductDetails = async () => {
      console.log("id", id);
      setLoading(true);
      try {
        const token = Cookies.get("jwt");
        const response = await fetch(
          `https://trip-genie-apis.vercel.app/${userRole}/products/${id}`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const productData = await response.json();
        console.log("productData", productData);
        setProduct({
          name: productData.name,
          price: productData.price.toString(),
          description: productData.description,
          quantity: productData.quantity.toString(),
        });
        setPictures(productData.pictures || []);
        setError(null);

        // Set initial values in the form
        form.reset({
          name: productData.name,
          price: productData.price,
          description: productData.description,
          quantity: productData.quantity,
        });
      } catch (err) {
        setError("Error fetching data. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, userRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
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
      setNewPictures(newPictures2);
    }

    setSelectedImage(null);
  };

  const isFormValid = useMemo(() => {
    return (
      product.name.trim() !== "" &&
      product.description.trim() !== "" &&
      product.price !== "" &&
      product.quantity !== "" &&
      !isNaN(parseFloat(product.price)) &&
      parseFloat(product.price) >= 0
    );
  }, [product]);

  const handleUpdate = async (data) => {
    setLoading(true);
    try {
      const token = Cookies.get("jwt");
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("price", data.price);
      formData.append("description", data.description);
      formData.append("quantity", data.quantity);
      formData.append("oldPictures", JSON.stringify(pictures));

      newPictures.forEach((picture) => {
        formData.append("newPictures", picture);
      });

      const response = await fetch(
        `https://trip-genie-apis.vercel.app/${userRole}/products/${id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      setShowSuccessPopup(true);
      setError(null);
    } catch (err) {
      setError("Error updating product. Please try again later.");
      console.error("Error updating product:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setSelectedImage(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsImageViewerOpen(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const formStyles = "";
  const containerStyles = "grid grid-cols-1 md:grid-cols-2 gap-6";
  const columnStyles = "flex flex-col space-y-6 h-full";
  const labelStyles = "text-[#003f66]";
  const buttonStyles =
    "bg-[#1A3B47] hover:bg-[#1A3B47]/90 text-white px-6 py-3 text-lg";

  return (
    <ToastProvider>
      <div className="">
        <div className="w-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUpdate)}
              className={formStyles}
            >
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
                    {pictures.map((picture, index) => (
                      <div key={`existing-${index}`} className="relative">
                        <img
                          src={picture.url}
                          alt={`Product Existing ${index + 1}`}
                          className="w-full h-32 object-cover rounded cursor-pointer"
                          onClick={() => {
                            setSelectedImage(picture.url);
                            setIsImageViewerOpen(true);
                          }}
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
                          onClick={() => {
                            setSelectedImage(picture);
                            setIsImageViewerOpen(true);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removePicture(index, false)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-[#1A3B47] hover:bg-[#1A3B47]/90 text-white px-8 py-4 text-xl"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Product"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <ToastViewport />
        {showSuccessPopup && (
          <Toast
            onOpenChange={setShowSuccessPopup}
            open={showSuccessPopup}
            duration={3000}
            className="bg-green-100"
          >
            <div className="flex items-center">
              <Check className="text-green-500 mr-2" />
              <div>
                <ToastTitle>Success</ToastTitle>
                <ToastDescription>
                  Product updated successfully!
                </ToastDescription>
              </div>
            </div>
            <ToastClose />
          </Toast>
        )}
      </div>
    </ToastProvider>
  );
};

export { UpdateProduct };
