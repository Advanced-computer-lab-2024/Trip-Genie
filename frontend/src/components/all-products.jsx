"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import { cartEvents } from "@/service/cartEvents";

import axios from "axios";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  Filter,
  Plus,
  Heart,
  ShoppingCart,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Loader from "./Loader";
import defaultImage from "../assets/images/default-image.jpg";
import DualHandleSliderComponent from "./dual-handle-slider";
import LazyLoad from "react-lazyload";
import productImage from "../assets/images/prod.png";
import productImage2 from "../assets/images/products2.png";
import { UserGuide } from "@/components/UserGuide";
import backgroundImage from "../assets/images/allProducts.jpg";

import { role } from "@/pages/login";

const renderStars = (rating) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-[#F88C33] fill-current" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

let exchangeRateForFilter = 1;

const ProductCard = ({
  product,
  onSelect,
  userInfo,
  onBuyNow,
  cartItems,
  wishlistItems,
  onAddToCart,
  onAddToWishlist,
  onRemoveFromWishlist,
}) => {
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isInWishlistLocal, setIsInWishlistLocal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isInCart = cartItems.some((item) => item.product?._id === product._id);
  const isInWishlist = wishlistItems.some(
    (item) => item?.product?._id === product._id
  );

  useEffect(() => {
    const initializeCard = async () => {
      // Wait for currency and wishlist state to be set
      await Promise.all([
        userInfo &&
        userInfo.role === "tourist" &&
        userInfo.preferredCurrency !== product.currency
          ? fetchExchangeRate()
          : getCurrencySymbol(),
        setIsInWishlistLocal(
          wishlistItems.some((item) => item.product._id === product._id)
        ),
      ]);
      setIsInitialized(true);
    };

    initializeCard();
  }, [userInfo, product, wishlistItems]);

  const fetchExchangeRate = useCallback(async () => {
    if (userInfo && userInfo.role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await fetch(
          `http://localhost:4000/${userInfo.role}/populate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              base: product.currency,
              target: userInfo.preferredCurrency._id,
            }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setExchangeRate(data.conversion_rate);
          exchangeRateForFilter = data.conversion_rate;
        } else {
          console.error("Error in fetching exchange rate:", data.message);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    }
  }, [userInfo, product]);

  const getCurrencySymbol = useCallback(async () => {
    if (userInfo) {
      setCurrencySymbol("$");
    }
  }, [userInfo, product]);

  const formatPrice = (price) => {
    if (userInfo && userInfo.role === "tourist" && userInfo.preferredCurrency) {
      if (userInfo.preferredCurrency === product.currency) {
        return `${userInfo.preferredCurrency.symbol}${price}`;
      } else if (exchangeRate) {
        const exchangedPrice = price * exchangeRate;
        return `${userInfo.preferredCurrency.symbol}${exchangedPrice.toFixed(
          2
        )}`;
      }
    } else if (currencySymbol) {
      return `${currencySymbol}${price}`;
    }
  };

  useEffect(() => {
    const isInWishlist = wishlistItems.some(
      (item) => item.product._id === product._id
    );
    setIsInWishlistLocal(isInWishlist);
  }, [wishlistItems, product._id]);

  if (!isInitialized) {
    return (
      <div className="h-[400px] animate-pulse bg-gray-100 rounded-lg"></div>
    ); // Loading placeholder
  }

  return (
    <Card className="relative overflow-hidden transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 hover:shadow-xl product-card">
      <CardHeader className="p-0" onClick={() => onSelect(product._id)}>
        <img
          src={product.pictures[0]?.url || defaultImage}
          alt={product.name}
          className="w-full h-40 object-cover"
        />
      </CardHeader>
      <CardContent className="p-4" onClick={() => onSelect(product._id)}>
        <CardTitle className="text-lg text-[#1A3B47]">{product.name}</CardTitle>
        <div className="mt-1">{renderStars(product.rating)}</div>
        <p className="text-sm text-gray-600 mt-2 break-words">
          {product.description.length > 70
            ? `${product.description.slice(0, 70)}...`
            : product.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center border-t">
        <span className="text-2xl font-bold text-[#388A94]">
          {formatPrice(product.price)}
        </span>

        {userInfo?.role === "tourist" && product.quantity > 0 ? (
          <Button
            className="bg-[#F88C33] hover:bg-orange-500 text-white"
            style={{
              borderRadius: "20px",
              padding: "4px 12px",
              fontSize: "14px",
            }}
            onClick={() => {
              // Handle the add to cart action here
              onAddToCart(product);
            }}
          >
            Add to Cart
          </Button>
        ) : (
          userInfo?.role === "tourist" && (
            <span className="text-red-500 text-lg font-bold">Out of stock</span>
          )
        )}
      </CardFooter>

      {userInfo?.role === "tourist" && (
        <div className="absolute top-2 right-2 flex space-x-2">
          <Button
            className={`rounded-full w-10 h-10 p-0 ${
              isInWishlistLocal
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gray-200 hover:bg-gray-300"
            } text-white`}
            onClick={(e) => {
              e.stopPropagation();
              setIsInWishlistLocal(!isInWishlistLocal);
              if (isInWishlistLocal) {
                onRemoveFromWishlist(product);
              } else {
                onAddToWishlist(product);
              }
            }}
          >
            <Heart
              className={`w-5 h-5 ${isInWishlistLocal ? "fill-current" : ""}`}
            />
            <span className="sr-only">Add to Wishlist</span>
          </Button>
        </div>
      )}
    </Card>
  );
};

export function AllProducts() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState(1);
  const [sortBy, setSortBy] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [myProducts, setMyProducts] = useState(false);
  const [maxPriceOfProducts, setMaxPriceOfProducts] = useState(1000);
  const [priceRange, setPriceRange] = useState([0, maxPriceOfProducts]);
  const [maxPrice, setMaxPrice] = useState(maxPriceOfProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [locationType, setLocationType] = useState("");
  const [location, setLocation] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isPriceInitialized, setIsPriceInitialized] = useState(false);
  const tripsPerPage = 6;

  const navigate = useNavigate();

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const getUserRole = useCallback(() => {
    let role = Cookies.get("role");
    return role || "guest";
  }, []);

  const fetchUserInfo = useCallback(async () => {
    const role = Cookies.get("role") || "guest";
    const token = Cookies.get("jwt");

    if (role === "tourist") {
      try {
        const response = await axios.get("http://localhost:4000/tourist/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currencyId = response.data.preferredCurrency;

        const currencyResponse = await axios.get(
          `http://localhost:4000/tourist/getCurrency/${currencyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setUserInfo({
          role,
          preferredCurrency: currencyResponse.data,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserInfo({ role });
      }
    } else {
      setUserInfo({ role });
    }
  }, []);

  const getSymbol = () => {
    if (userInfo && userInfo.role === "tourist" && userInfo.preferredCurrency) {
      return `${userInfo.preferredCurrency.symbol}`;
    } else {
      return "$";
    }
  };

  const fetchProducts = useCallback(
    async (params = {}) => {
      setIsLoading(true);
      try {
        const token = Cookies.get("jwt");
        const role = getUserRole();
        const url = new URL(`http://localhost:4000/${role}/products`);

        if (params.searchBy)
          url.searchParams.append("searchBy", params.searchBy);
        if (products.length > 0) {
          handlePageChange(1);
        }
        if (params.sort) url.searchParams.append("sort", params.sort);
        if (params.asc !== undefined)
          url.searchParams.append("asc", params.asc);
        if (params.myproducts)
          url.searchParams.append("myproducts", params.myproducts);
        if (params.minPrice)
          url.searchParams.append("minPrice", params.minPrice);
        if (params.maxPrice)
          url.searchParams.append("maxPrice", params.maxPrice);
        if (params.rating) url.searchParams.append("rating", params.rating);
        if (params.categories && params.categories.length > 0) {
          url.searchParams.append("categories", params.categories.join(","));
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setProducts(data);

        setError(null);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Error fetching products");
        setProducts([]);
        setIsLoading(false);
      }
    },
    [getUserRole]
  );

  useEffect(() => {
    if (!isPriceInitialized) {
      fetchMaxPrice();
    }
  }, [role]);

  const fetchMaxPrice = async () => {
    const role = getUserRole();
    const token = Cookies.get("jwt");
    const url = new URL(`http://localhost:4000/${role}/max-price-products`);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    setMaxPriceOfProducts(data);
    setPriceRange([0, data]);
    setMaxPrice(data);
    setIsPriceInitialized(true);
  };

  const fetchCartItems = useCallback(async () => {
    if (role == "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await fetch("http://localhost:4000/tourist/cart", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCartItems(data);
          // cartEvents.emit("cartUpdated", data);
        }
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    }
  }, []);

  const fetchWishlistItems = useCallback(async () => {
    if (userInfo?.role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await fetch("http://localhost:4000/tourist/wishlist", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched wishlist items:", data);
          setWishlistItems(data); // This should be an array of products from the tourist's wishlist
        }
      } catch (error) {
        console.error("Error fetching wishlist items:", error);
      }
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo) {
      fetchProducts();
      fetchCartItems();
      fetchWishlistItems();
    }
  }, [userInfo, fetchProducts, fetchCartItems, fetchWishlistItems]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    setIsLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchProducts({
        searchBy: searchTerm,
        myproducts: myProducts,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        rating: selectedRating,
        sort: sortBy,
        asc: sortOrder,
        categories: selectedCategories,
      });
    }, 0.01);
    setCurrentPage(1);
    setIsLoading(false);

    return () => clearTimeout(delayDebounceFn);
  }, [
    searchTerm,
    sortBy,
    sortOrder,
    myProducts,
    priceRange,
    selectedRating,
    selectedCategories,
    fetchProducts,
  ]);

  const handleProductSelect = (id) => {
    navigate(`/product/${id}`);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSort = (attribute) => {
    setIsLoading(true);
    setSortOrder((prevOrder) => (prevOrder === 1 ? -1 : 1));
    setSortBy(attribute);
    setIsLoading(false);
  };

  const handleMyProducts = (attribute) => {
    setMyProducts(attribute);
  };

  const clearFilters = () => {
    setIsLoading(true);
    setSearchTerm("");
    setSortBy("");
    setSortOrder(1);
    setMyProducts(false);
    setPriceRange([0, maxPriceOfProducts]);
    setSelectedRating(null);
    setSelectedCategories([]);
    fetchProducts();
    setIsLoading(false);
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleBuyNow = (product) => {
    // Redirect to checkout page
    window.location.href = "/checkout"; // Replace with your actual checkout URL
  };

  const handleAddToCart = async (product) => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        "http://localhost:4000/tourist/product/addToCart",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product._id,
            quantity: 1,
            totalAmount: product.price,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }
      console.log(response);
      setAlertMessage({
        type: "success",
        message: "Product added to cart successfully!",
      });
      fetchCartItems();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.log(error);
      setAlertMessage({
        type: "error",
        message: "Error adding product to cart. Please try again.",
      });
    }
  };

  const handleAddToWishlist = async (product) => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `http://localhost:4000/tourist/product/addToWishlist/${product._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add to wishlist");
      }

      setAlertMessage({
        type: "success",
        message: "Product added to wishlist successfully!",
      });
      fetchWishlistItems();
    } catch (error) {
      setAlertMessage({
        type: "error",
        message: "Error adding product to wishlist. Please try again.",
      });
    }
  };

  const handleRemoveFromWishlist = async (product) => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `http://localhost:4000/tourist/remove/wishlist/${product._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove from wishlist");
      }

      setAlertMessage({
        type: "success",
        message: "Product removed from wishlist successfully!",
      });
      fetchWishlistItems();
    } catch (error) {
      setAlertMessage({
        type: "error",
        message: "Error removing product from wishlist. Please try again.",
      });
    }
  };

  const handlePurchase = async () => {
    try {
      const token = Cookies.get("jwt");

      const totalAmount = selectedProduct.price * quantity;

      const response = await fetch("http://localhost:4000/tourist/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          products: [
            {
              product: selectedProduct._id,
              quantity: quantity,
            },
          ],
          totalAmount,
          paymentMethod: paymentMethod,
          shippingAddress: location,
          locationType: locationType,
          deliveryType: deliveryType,
          deliveryTime: deliveryTime,
          deliveryDate: deliveryDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to complete purchase");
      }

      setAlertMessage({
        type: "success",
        message: "Purchase completed successfully!",
      });
      setShowPurchaseConfirm(false);
    } catch (error) {
      setAlertMessage({
        type: "error",
        message: "Error completing purchase. Please try again.",
      });
    }
  };

  const guideSteps = [
    {
      target: "body",
      content:
        "Welcome to the Products page! Here you can view all the products available for purchase.",
      placement: "center",
    },
    {
      target: ".filter",
      content:
        "Use the filters to narrow down your search based on your preferences.",
      placement: "right",
    },
    {
      target: ".product-card",
      content:
        "Each card represents a unique product. Click on a card to learn more about it.",
      placement: "bottom",
    },
  ];
  const AllProductsSkeleton = () => {
    return (
      <div className="bg-gray-100">
        <div className="">
          <div className="flex gap-8">
            {/* Sidebar Skeleton */}

            {/* Main Content Skeleton */}
            <div className="flex-1">
              {/* Search and Filters Skeleton */}

              {/* Cards Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col bg-white shadow-lg rounded-lg overflow-hidden animate-pulse"
                  >
                    <div className="h-40 bg-gray-300"></div>
                    <div className="p-4 space-y-4">
                      <div className="h-8 w-3/4 bg-gray-300 rounded"></div>
                      <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
                      <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="p-4 border-t space-y-3">
                      <div className="h-5 w-1/3 bg-gray-300 rounded"></div>
                      <div className="h-5 w-1/4 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Skeleton */}
              <div className="mt-8 flex justify-center items-center space-x-4">
                <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100">
      <div
        className="relative h-[330px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        <div className="absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="flex-1">
            <h1 className="text-5xl font-bold text-white mb-4">All Products</h1>
            <p className="text-gray-200">
              <Link
                to="/"
                className="font-bold text-gray-200 hover:text-gray-300 hover:underline"
              >
                Home
              </Link>
              / Products
            </p>
          </div>
        </div>
      </div>
      <div className="container py-8">
        <div className="flex gap-8">
          <div className="hidden md:block w-80 h-100 bg-white rounded-lg shadow-lg p-6 filter">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A3B47]">Filters</h2>
              <Button
                onClick={clearFilters}
                size="sm"
                className="text-gray-400 hover:text-gray-200 bg-transparent border-none"
              >
                Clear All
              </Button>
            </div>
            <div className="mb-6">
              <h3 className="font-medium text-[#1A3B47] mb-2">Price Range</h3>
              {isPriceInitialized && (
                <DualHandleSliderComponent
                  min={0}
                  max={maxPriceOfProducts}
                  symbol={getSymbol()}
                  step={Math.max(
                    1,
                    Math.ceil(
                      (maxPriceOfProducts * exchangeRateForFilter) / 100
                    )
                  )}
                  values={priceRange}
                  exchangeRate={exchangeRateForFilter}
                  middleColor="#5D9297"
                  colorRing="#388A94"
                  onChange={(values) => setPriceRange(values)}
                />
              )}
            </div>
            <div className="mb-6">
              <h3 className="font-medium text-[#1A3B47] mb-2">Rating</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(rating)}
                    className={`flex items-center w-full p-2 rounded hover:bg-gray-100 ${
                      selectedRating === rating ? "bg-[#B5D3D1]" : ""
                    }`}
                  >
                    {renderStars(rating)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-medium text-[#1A3B47] mb-4">
                Featured Products
              </h3>
              <div className="space-y-4">
                {isLoading ? (
                  // Skeleton Loading for Historical Places
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 animate-pulse"
                    >
                      {/* Skeleton for Image */}
                      <div className="w-16 h-16 bg-gray-300 rounded-md" />
                      <div className="flex-1 space-y-2">
                        {/* Skeleton for Title */}
                        <div className="h-4 w-2/3 bg-gray-300 rounded" />
                        {/* Skeleton for Location */}
                        <div className="h-3 w-1/2 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))
                ) : products && products.length > 0 ? (
                  products.slice(0, 3).map((product) => (
                    <Link
                      key={product._id}
                      to={`/product/${product._id}`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <img
                        src={product.pictures[0]?.url || defaultImage}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div>
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <div className="mt-1">
                          {renderStars(product.rating)}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No products available.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5D9297]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                </div>
                <span className="text-gray-500 text-sm whitespace-nowrap">
                  ({products.length} items)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap rounded-full"
                  onClick={() => handleSort("rating")}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort by Rating
                  {sortBy === "rating" && (
                    <span className="ml-2">{sortOrder === 1 ? "↓" : "↑"}</span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap rounded-full"
                  onClick={() => handleSort("price")}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort by Price
                  {sortBy === "price" && (
                    <span className="ml-2">{sortOrder === 1 ? "↓" : "↑"}</span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  onClick={toggleFilters}
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-center mb-4">{error}</div>
            )}

            {isLoading ? (
              <AllProductsSkeleton />
            ) : (
              <>
                <div>
                  {products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.length > 0 &&
                        products
                          .slice(
                            (currentPage - 1) * tripsPerPage,
                            currentPage * tripsPerPage
                          )
                          .map((product) => (
                            <ProductCard
                              key={product._id}
                              product={product}
                              userInfo={userInfo}
                              onSelect={handleProductSelect}
                              onBuyNow={handleBuyNow}
                              cartItems={cartItems}
                              wishlistItems={wishlistItems}
                              onAddToCart={handleAddToCart}
                              onAddToWishlist={handleAddToWishlist}
                              onRemoveFromWishlist={handleRemoveFromWishlist}
                            />
                          ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No products available.
                    </p>
                  )}
                </div>

                <div className="mt-8 flex justify-center items-center space-x-4">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="icon"
                    className="text-[#1A3B47] border-[#1A3B47]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-[#1A3B47]">
                    Page {currentPage} of{" "}
                    {Math.max(1, Math.ceil(products.length / tripsPerPage))}
                  </span>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={
                      currentPage ===
                      Math.max(1, Math.ceil(products.length / tripsPerPage))
                    }
                    variant="outline"
                    size="icon"
                    className="text-[#1A3B47] border-[#1A3B47]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {alertMessage && (
        <Alert
          className={`fixed bottom-4 right-4 w-96 ${
            alertMessage.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white z-50`}
        >
          <AlertTitle>
            {alertMessage.type === "success" ? "Success" : "Error"}
          </AlertTitle>
          <AlertDescription>{alertMessage.message}</AlertDescription>
        </Alert>
      )}
      {(getUserRole() === "guest" || getUserRole() === "tourist") && (
        <UserGuide steps={guideSteps} pageName="Products" />
      )}
    </div>
  );
}
