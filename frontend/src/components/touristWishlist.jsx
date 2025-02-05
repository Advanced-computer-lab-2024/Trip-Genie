import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle } from "lucide-react";
import Loader from "./Loader";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState("guest");
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencies, setCurrencies] = useState([]);

  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setIsToastOpen(true);
  };

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:4000/rates");
      setExchangeRates(response.data.rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  }, []);

  const fetchCurrencies = useCallback(async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "http://localhost:4000/tourist/currencies",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrencies(response.data);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  }, []);

  const formatPrice = useCallback(
    (price, productCurrency) => {
      if (!price || !productCurrency || !userRole) {
        console.error("Missing required parameters for formatPrice");
        return "";
      }

      const roundedPrice = Math.round(price);
      if (userRole === "tourist" && userPreferredCurrency) {
        const baseRate = exchangeRates[productCurrency] || 1;
        const targetRate = exchangeRates[userPreferredCurrency.code] || 1;
        const exchangedPrice = Math.round(
          (roundedPrice / baseRate) * targetRate
        );
        return `${userPreferredCurrency.symbol}${exchangedPrice}`;
      }
      const currency = currencies.find((c) => c._id === productCurrency);
      return `${currency ? currency.symbol : "$"}${roundedPrice}`;
    },
    [userRole, userPreferredCurrency, exchangeRates, currencies]
  );

  const fetchUserInfo = useCallback(async () => {
    const role = Cookies.get("role") || "guest";
    setUserRole(role);

    if (role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        if (!token) {
          console.error("No JWT token found");
          return;
        }

        const response = await axios.get("http://localhost:4000/tourist/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currencyId = response.data.preferredCurrency;

        if (currencyId) {
          const response2 = await axios.get(
            `http://localhost:4000/tourist/getCurrency/${currencyId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setUserPreferredCurrency(response2.data);
        } else {
          console.error("No preferred currency found for user");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  }, []);

  const fetchWishlistItems = useCallback(async () => {
    if (!userRole) {
      console.error("User role not set");
      return;
    }

    setLoading(true);
    try {
      const token = Cookies.get("jwt");
      if (!token) {
        console.error("No JWT token found");
        setError("Authentication error. Please log in again.");
        setTimeout(() => setLoading(false), 1000);
        return;
      }

      const response = await fetch("http://localhost:4000/tourist/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch wishlist items");
      }
      const data = await response.json();

      const formattedData = data.map((item) => {
        if (!item.product || !item.product.price || !item.product.currency) {
          console.error("Invalid product data:", item);
          return null;
        }
        return {
          ...item,
          formattedPrice: formatPrice(
            item.product.price,
            item.product.currency
          ),
        };
      });

      setWishlistItems(formattedData.filter(Boolean));
      setTimeout(() => setLoading(false), 1000);
    } catch (err) {
      setError("Error fetching wishlist items. Please try again later.");
      console.error("Error fetching wishlist items:", err);
      setTimeout(() => setLoading(false), 1000);
    }
  }, [userRole, formatPrice]);

  useEffect(() => {
    fetchUserInfo();
    fetchExchangeRates();
    fetchCurrencies();
  }, [fetchUserInfo, fetchExchangeRates, fetchCurrencies]);

  useEffect(() => {
    if (userRole && (userRole === "guest" || userPreferredCurrency)) {
      fetchWishlistItems();
    }
  }, [userRole, userPreferredCurrency, fetchWishlistItems]);

  const handleRemoveFromWishlist = async (productId) => {
    if (!productId) {
      console.error("No product ID provided for removal");
      return;
    }

    try {
      const token = Cookies.get("jwt");
      if (!token) {
        setActionError("Authentication error. Please log in again.");
        return;
      }

      const response = await fetch(
        `http://localhost:4000/tourist/remove/wishlist/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to remove item from wishlist");
      }
      setWishlistItems(
        wishlistItems.filter((item) => item.product._id !== productId)
      );
      showToast("success", "Item removed from wishlist successfully!");
    } catch (error) {
      setActionError("Error removing item from wishlist. Please try again.");
      console.error("Error removing item from wishlist:", error);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!productId) {
      console.error("No product ID provided for adding to cart");
      return;
    }

    try {
      const token = Cookies.get("jwt");
      if (!token) {
        setActionError("Authentication error. Please log in again.");
        return;
      }

      const response = await fetch(
        `http://localhost:4000/tourist/move/wishlist/${productId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to add item to cart");
      }
      showToast("success", "Item added to cart successfully!");
      window.dispatchEvent(new Event("cartUpdated"));
      fetchWishlistItems();
    } catch (error) {
      setActionError("Error adding item to cart. Please try again.");
      console.error("Error adding item to cart:", error);
    }
  };

  const handleAddAllToCart = async () => {
    try {
      const token = Cookies.get("jwt");
      if (!token) {
        setActionError("Authentication error. Please log in again.");
        return;
      }

      const response = await fetch(
        "http://localhost:4000/tourist/move/all/wishlist",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to add all items to cart");
      }
      showToast("success", "All items added to cart successfully!");
      window.dispatchEvent(new Event("cartUpdated"));
      fetchWishlistItems();
    } catch (error) {
      setActionError("Error adding all items to cart. Please try again.");
      console.error("Error adding all items to cart:", error);
    }
  };

  const handleEmptyWishlist = async () => {
    try {
      const token = Cookies.get("jwt");
      if (!token) {
        setActionError("Authentication error. Please log in again.");
        return;
      }

      const response = await fetch(
        "http://localhost:4000/tourist/remove/all/wishlist",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to empty wishlist");
      }
      setWishlistItems([]);
      showToast("success", "Wishlist emptied successfully!");
    } catch (error) {
      setActionError("Error emptying wishlist. Please try again.");
      console.error("Error emptying wishlist:", error);
    }
  };

  const WishlistSkeleton = () => (
    <div>
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 text-left">My Wishlist</h1>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col lg:flex-row items-start lg:items-center border-b border-gray-300"
            >
              <div className="w-28 h-28 mb-4 ">
                <Skeleton className="w-28 h-28 mb-4" />
              </div>
              <div className="flex flex-col flex-grow mb-4 pl-4">
                <Skeleton className="w-60 h-6" />
                <Skeleton className="w-40 h-6 mt-2" />
                <Skeleton className="w-80 h-4 mt-2" />
                <Skeleton className="w-80 h-4 mt-1" />
              </div>
              <div className="flex items-end space-x-2">
                <Skeleton className="w-24 h-8" />
                <Skeleton className="w-24 h-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) return <WishlistSkeleton />;

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  return (
    <ToastProvider>
      <div>
        <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-6 text-left">My Wishlist</h1>
          {wishlistItems.length === 0 ? (
            <p className="text-center text-gray-500 text-lg mb-24">
              Your wishlist is empty.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="">
                {wishlistItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col lg:flex-row items-start lg:items-center border-b border-gray-300 "
                  >
                    <div
                      className="w-28 h-28 mb-4 mt-4 lg:mb-0 cursor-pointer relative"
                      onClick={() => navigate(`/product/${item.product._id}`)}
                    >
                      <img
                        src={item.product.pictures[0]?.url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-grow mb-4 lg:mb-0 lg:pl-4">
                      <h2
                        className="cursor-pointer hover:underline text-xl font-semibold"
                        onClick={() => navigate(`/product/${item.product._id}`)}
                      >
                        {item.product.name}
                      </h2>
                      <p className="text-2xl font-semibold mb-2">
                        {item.formattedPrice}
                      </p>
                      <p className="text-sm text-gray-600 mb-4 overflow-hidden text-ellipsis whitespace-normal break-words line-clamp-2 max-h-12">
                        {item.product.description.length > 70
                          ? item.product.description.substring(0, 70) + "..."
                          : item.product.description}
                      </p>
                    </div>
                    <div className="flex items-end space-x-2">
                      <Button
                        onClick={() => handleAddToCart(item.product._id)}
                        className="bg-[#5D9297] hover:bg-[#388A94] text-white px-3 py-1 text-sm"
                      >
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#1A3B47] text-[#1A3B47] hover:bg-[#1A3B47] hover:text-white transition duration-300 ease-in-out px-3 py-1 text-sm"
                        onClick={() =>
                          handleRemoveFromWishlist(item.product._id)
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {wishlistItems.length > 0 && (
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                className="border-[#1A3B47] text-[#1A3B47] hover:bg-[#1A3B47] hover:text-white transition duration-300 ease-in-out px-3 py-1 text-sm"
                onClick={handleEmptyWishlist}
              >
                Empty Wishlist
              </Button>
              <Button
                onClick={handleAddAllToCart}
                className="bg-[#1A3B47] hover:bg-[#388A94] text-white px-3 py-1 text-sm"
              >
                Add All to Cart
              </Button>
            </div>
          )}

          <Dialog
            open={actionSuccess !== null}
            onOpenChange={() => setActionSuccess(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                    Success
                  </div>
                </DialogTitle>
                <DialogDescription>{actionSuccess}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={() => setActionSuccess(null)}
                  className="bg-[#1A3B47] hover:bg-[#3E5963] text-white py-2 px-4 rounded"
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={actionError !== null}
            onOpenChange={() => setActionError(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  <div className="flex items-center">
                    <XCircle className="w-6 h-6 text-red-500 mr-2" />
                    Error
                  </div>
                </DialogTitle>
                <DialogDescription>{actionError}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setActionError(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <ToastViewport className="fixed top-0 right-0 p-4" />
        {isToastOpen && (
          <Toast
            onOpenChange={setIsToastOpen}
            open={isToastOpen}
            duration={5000}
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

export default WishlistPage;
