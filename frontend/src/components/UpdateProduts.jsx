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
import signUpPicture from "../assets/images/signUpPicture.jpeg";
import { Modal } from "@/components/Modal";
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

const UpdateProduct = () => {
  const { id } = useParams();
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

  useEffect(() => {
    const fetchProductDetails = async () => {
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
        setProduct({
          name: productData.name,
          price: productData.price.toString(),
          description: productData.description,
          quantity: productData.quantity.toString(),
        });
        setPictures(productData.pictures || []);
        setError(null);
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

  const handleUpdate = async () => {
    if (!isFormValid) {
      setError("Please fill in all fields correctly before updating.");
      return;
    }

    setLoading(true);
    try {
      const token = Cookies.get("jwt");
      const formData = new FormData();
      formData.append("name", product.name);
      formData.append("price", product.price);
      formData.append("description", product.description);
      formData.append("quantity", product.quantity);
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
    setModalOpen(true);
    setDropdownOpen(false); // Close the dropdown when opening the modal
    setSelectedImage(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalOpen(false);
    setImageModalOpen(false);
  };

  if (loading) {
    return <LoadingSpinner />;
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
        <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row">
          <div className="w-full md:w-2/5 bg-[#B5D3D1] p-6">
            <h2 className="text-3xl font-bold text-[#1A3B47] mb-2">
              Update Product
            </h2>
            <p className="text-sm mb-6 text-[#1A3B47]">
              Update your product details. Fill in the information carefully to
              ensure accurate product information.
            </p>
          </div>
          <div className="w-full md:w-3/5 p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate();
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Product Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                />
                {product.name.trim() === "" && (
                  <p className="text-red-500 text-xs">Name is required</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">
                    Price (in USD)
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={product.price}
                    onChange={handleChange}
                  />
                  {(product.price === "" ||
                    isNaN(parseFloat(product.price)) ||
                    parseFloat(product.price) < 0) && (
                    <p className="text-red-500 text-xs">
                      Price must be a non-negative number
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={product.quantity}
                    onChange={handleChange}
                  />
                  {product.quantity === "" && (
                    <p className="text-red-500 text-xs">Quantity is required</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description (min. 200 characters)
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  className="h-24"
                />
                {product.description.trim() === "" && (
                  <p className="text-red-500 text-xs">
                    Description is required
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pictures" className="text-sm font-medium">
                  Add Product Pictures
                </Label>
                <Input
                  id="pictures"
                  type="file"
                  multiple
                  onChange={handlePicturesUpload}
                />
              </div>
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
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                disabled={!isFormValid || loading}
              >
                {loading ? "Updating..." : "Update Product"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Dialog open={showSuccessPopup} onOpenChange={setShowSuccessPopup}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Check className="w-6 h-6 text-green-500 mr-2" />
              Product Updated
            </DialogTitle>
            <DialogDescription>
              The product has been successfully updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex justify-end mt-2">
              <Button
                onClick={() => navigate("/all-products")}
                className="bg-[#1A3B47] hover:bg-[#142B36] text-white px-4 py-2 rounded"
              >
                Back to All Products
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Modal
        show={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        isImageViewer={true}
        imageUrl={selectedImage?.url || selectedImage}
      />
      {/* {selectedImage && (
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
      )} */}
    </div>
  );
};

export default UpdateProduct;
