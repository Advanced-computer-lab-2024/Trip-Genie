"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isValid } from "date-fns";
import axios from "axios";
import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeleteConfirmation from "@/components/ui/deletionConfirmation";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState("guest");
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [rates, setRates] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const ordersPerPage = 6;
  const [tourist, setTourist] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserInfo();
    fetchRates();
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter or search changes
  }, [filter, searchQuery]);

  const getDeliveryPrice = (deliveryType) => {
    switch (deliveryType) {
      case "Express":
        return displayPrice(4.99);
      case "Next-Same":
        return displayPrice(6.99);
      case "International":
        return displayPrice(14.99);
      default:
        return displayPrice(2.99);
    }
  };

  function formatPaymentType(paymentType) {
    const paymentTypes = {
      credit_card: "Credit Card",
      debit_card: "Debit Card",
      wallet: "Wallet",
      cash_on_delivery: "Cash on Delivery",
    };

    return paymentTypes[paymentType] || "Unknown Payment Type"; // Default to "Unknown Payment Type" if not found
  }

  const fetchUserInfo = async () => {
    const role = Cookies.get("role") || "guest";
    setUserRole(role);

    if (role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const currencyId = response.data.preferredCurrency;

        const response2 = await axios.get(
          `https://trip-genie-apis.vercel.app/tourist/getCurrency/${currencyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserPreferredCurrency(response2.data);
        setTourist(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  const handleCancelConfirm = (orderId) => {
    setOrderToCancel(orderId);
    setDeleteConfirmOpen(true);
  };

  const handleCancel = async () => {
    if (!orderToCancel) return;
    try {
      const token = Cookies.get("jwt");
      const response = await axios.put(
        `https://trip-genie-apis.vercel.app/tourist/cancelPurchase/${orderToCancel}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchOrders();
      console.log(response);
      // Assuming response.data contains the order products and payment details
      const formattedTotalPrice = displayPrice(response.data.refundedAmount); // Assuming response contains total price
      const newwallet = response.data.newWalletBalance;
      const payment = response.data.paymentMethod; // Assuming response contains the updated wallet balance

      // Show a success toast notification
      toast({
        title: (
          <div className="flex items-center">
            <CheckCircle className="text-green-500 mr-2" />
            <span>Order Cancelled</span>
          </div>
        ),
        description: (
          <>
            <p>Your order has been successfully cancelled.</p>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Label className="text-right">Amount Refunded:</Label>
                <div>{formattedTotalPrice}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Label className="text-right">New Wallet Balance:</Label>
                <div>{displayPrice(newwallet.toFixed(2))}</div>
              </div>
            </div>
          </>
        ),
        duration: 5000,
        className: "bg-green-100",
      });
    } catch (error) {
      toast({
        title: (
          <div className="flex items-center">
            <XCircle className="text-red-500 mr-2" />
            <span>Error</span>
          </div>
        ),
        description: "Failed to cancel the order. Please try again.",
        duration: 5000,
        className: "bg-red-100",
      });
      console.error("Error canceling order:", error);
    } finally {
      setCancelConfirmOpen(false);
      setOrderToCancel(null);
    }
  };

  const handleProductClick = (product) => {
    console.log(product.isDeleted);
    if (product.isDeleted) {
      toast({
        title: "Product Unavailable",
        description: "This product is currently unavailable.",
        duration: 3000,
      });
    } else {
      navigate(`/product/${product._id}`);
    }
  };

  const fetchRates = async () => {
    try {
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/rates"
      );
      setRates(response.data.rates);
    } catch (error) {
      console.error("Error fetching rates:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/tourist/purchase",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const sortedOrders = response.data.sort(
        (a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate)
      );
      setOrders(sortedOrders);
      console.log(sortedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const displayPrice = (priceUSD) => {
    if (!userPreferredCurrency) return `$${priceUSD}`;
    const rate = rates[userPreferredCurrency.code];
    return `${userPreferredCurrency.symbol}${(priceUSD * rate).toFixed(2)}`;
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesFilter = filter === "all" || order.status === filter;
    const matchesSearch =
      searchQuery === "" ||
      order.products.some((item) =>
        item.product?.name?.toLowerCase().includes(searchLower)
      ) ||
      order.deliveryType.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-[#F88C33] text-white";
      case "delivered":
        return "bg-[#5D9297] text-white";
      case "cancelled":
        return "bg-gray-300 text-[#1A3B47]";
      default:
        return "bg-gray-100 text-[#1A3B47]";
    }
  };

  const getOrderIdentifier = (order, index) => {
    let prefix;
    switch (order.deliveryType.toLowerCase()) {
      case "international":
        prefix = "Intl";
        break;
      case "express":
        prefix = "Ex";
        break;
      case "next-same":
        prefix = "NS";
        break;
      default:
        prefix = "Std"; // Standard
    }
    return `${prefix}`;
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Ensure currentOrders is sorted in reverse chronological order
  const sortedOrders = [...currentOrders].sort(
    (a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>
      <Toaster />

      <div className=" bg-white rounded-lg mx-auto px-4 py-8">
        <div className="flex w-full  justify-between  items-center mb-6">
          <div className="flex-[2]">
            <Tabs defaultValue="all" onValueChange={setFilter}>
              <TabsList className="grid grid-cols-4 bg-white">
                <TabsTrigger
                  value="all"
                  className={`relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                    filter === "all"
                      ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                      : "border-gray-300 text-gray-500 bg-white"
                  }`}
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className={`relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                    filter === "pending"
                      ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                      : "border-gray-300 text-gray-500 bg-white"
                  }`}
                >
                  Pending
                </TabsTrigger>
                <TabsTrigger
                  value="delivered"
                  className={`relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                    filter === "delivered"
                      ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                      : "border-gray-300 text-gray-500 bg-white"
                  }`}
                >
                  Delivered
                </TabsTrigger>
                <TabsTrigger
                  value="cancelled"
                  className={`relative flex items-center justify-center px-3 py-1 font-medium rounded-none border-b ${
                    filter === "cancelled"
                      ? "border-[#1A3B47] text-[#1A3B47] border-b-2 shadow-none"
                      : "border-gray-300 text-gray-500 bg-white"
                  }`}
                >
                  Cancelled
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex-[1] ml-2 relative">
            {/* Only show the icon when searchQuery is empty */}
            {!searchQuery && (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}

            <Input
              placeholder="    Search products, delivery type, or status..."
              className="pl-9 border-[#B5D3D1]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: ordersPerPage }).map((_, index) => (
              <Card key={index} className="bg-white w-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      {/* Skeleton for Order Identifier */}
                      <Skeleton className="w-10 h-10 bg-[#B5D3D1] text-[#1A3B47] font-bold text-xl px-3 py-2 rounded" />

                      {/* Skeleton for Delivery Type and Order Number */}
                      <div className="flex flex-col gap-2">
                        <Skeleton className="w-24 h-5 bg-gray-300" />
                        <Skeleton className="w-20 h-4 bg-gray-200" />
                      </div>
                    </div>

                    {/* Skeleton for Status Badge */}
                    <Skeleton className="w-24 h-7 bg-gray-300 text-[#1A3B47] text-sm px-3 py-1 rounded-full" />
                  </div>

                  {/* Skeleton for Date and Time */}
                  <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                    <Skeleton className="w-full h-4 bg-gray-200" />
                  </div>
                </CardHeader>

                <CardContent className="overflow-hidden h-[200px] ">
                  <Separator className="my-4" />

                  {/* Skeleton for Product Details */}
                  <div className="flex gap-4 items-center mb-2">
                    <Skeleton className="w-12 h-12 rounded" />
                    <Skeleton className="flex-1 h-4" />
                  </div>
                  <div className="flex gap-4 items-center mb-2">
                    <Skeleton className="w-12 h-12 rounded" />
                    <Skeleton className="flex-1 h-4" />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Separator className="my-2" />

                  {/* Row with small skeletons on the left and right */}
                  <div className="flex justify-between w-full">
                    {/* Small skeleton on the left */}
                    <Skeleton className="w-24 h-6 bg-gray-300" />

                    {/* Small skeleton on the right */}
                    <Skeleton className="w-16 h-6 bg-gray-300" />
                  </div>

                  {/* Large skeleton below them */}
                  <div className="mt-2">
                    <Skeleton className="w-72 h-8 bg-gray-300" />{" "}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-[#1A3B47]">No orders found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedOrders.map((order, index) => (
              <Card key={order._id} className="bg-white w-full">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="bg-[#B5D3D1] text-[#1A3B47] font-bold text-xl px-3 py-2 rounded">
                        {getOrderIdentifier(order, index)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-medium">
                          {order.deliveryType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Order #{order._id.slice(-5)}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-base font-medium text-sm ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status === "pending"
                        ? "Pending"
                        : order.status === "delivered"
                        ? "Delivered"
                        : "Cancelled"}
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                    <span>
                      {order.status === "delivered"
                        ? `Delivered on ${format(
                            new Date(order.deliveryDate),
                            "EEE, MMM dd, yyyy"
                          )}` // Show delivered date if delivered
                        : `Purchased on ${format(
                            new Date(order.purchaseDate),
                            "EEE, MMM dd, yyyy"
                          )}`}
                    </span>

                    <span>
                      {order.status === "delivered"
                        ? `at ${format(
                            new Date(order.deliveryDate),
                            "hh:mm a"
                          )}` // Show delivery time if delivered
                        : `at ${format(
                            new Date(order.purchaseDate),
                            "hh:mm a"
                          )}`}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className=" overflow-hidden h-[200px]">
                  <Separator className="my-2" />

                  <div className="grid grid-cols-[1fr,auto,auto] gap-4 mb-2 mt-2 text-xs text-muted-foreground">
                    <span>Items</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Price</span>
                  </div>
                  <div className="space-y-2 min-h-[120px] relative">
                    {order.products.slice(0, 2).map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[auto,1fr,auto,auto] gap-4 items-center cursor-pointer hover:underline"
                        onClick={() => handleProductClick(item.product)}
                      >
                        <img
                          src={
                            item.product.pictures[0]?.url ||
                            "/images/broken_genie_lamp.png"
                          }
                          alt={
                            item.product.pictures[0]?.url
                              ? item.product.pictures[0]?.url
                              : "/images/broken_genie_lamp.png"
                          }
                          className="w-12 h-12 object-cover rounded"
                        />

                        <span className="text-base break-words text-sm">
                          {item.product.name}
                        </span>
                        <span className="text-sm text-center text-gray-500">
                          x{item.quantity}
                        </span>
                        <span className="text-sm text-right">
                          {displayPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    {order.products.length >= 2 && (
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center">
                        {order.products.length > 2 && (
                          <span className="text-sm text-[#388A94] font-medium">
                            +{order.products.length - 2} more items
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-1 pt-4 min-h-[180px]">
                  {/* <div className="flex justify-between items-center w-full">
    <span className="text-sm font-semibold">Subtotal</span>
    <span className="text-lg font-semibold">
      {displayPrice(order.products.reduce((acc, item) => acc + item.product.price * item.quantity, 0))}
    </span>
  </div>


  <div className="flex justify-between items-center w-full text-gray-500">
  <div className="flex items-center gap-1">
  <Info className="h-4 w-4 text-gray-400" />
    <span className="text-sm font-semibold text-gray-400">Delivery</span>
    </div>
      <span className="text-sm">{getDeliveryPrice(order.deliveryType)}</span>
    
  </div>

  {order.promoCode && order.promoCode.percentOff ? (
  <div className="flex justify-between items-center w-full text-[#388A94]">
    <span className="text-sm font-semibold">{order.promoCode.percentOff}% Discount!</span>
    <span className="text-sm">
      -{displayPrice(
        order.products.reduce((acc, item) => acc + (item.product.price * item.quantity * (order.promoCode.percentOff / 100)), 0)
      )}
    </span>
  </div>
) : (
  // Empty space for consistency when no promo code exists
  <div className="flex justify-between items-center w-full">
    <span className="text-sm text-transparent">-</span> 
    <span className="text-sm text-transparent">-</span> 
  </div>
)}
  */}

                  <Separator className="my-2" />

                  {/* Total Price */}
                  <div className="flex justify-between items-center w-full mb-4">
                    <span className="text-base font-semibold">Total</span>
                    <span className="text-lg font-semibold">
                      {displayPrice(
                        order.totalPrice // Fallback to 0 if no promo code is present or percentOff is invalid
                      )}
                    </span>
                  </div>

                  <div className="flex gap-2 w-full ">
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="flex-1 text-base bg-gray-200 text-[#388A94] hover:bg-gray-300"
                          onClick={() => setSelectedOrder(order)}
                        >
                          See Details
                        </Button>
                      </DialogTrigger>

                      {/* Apply custom overlay background styling */}
                      <DialogOverlay className="fixed inset-0 bg-gray-900 bg-opacity-10" />

                      <DialogContent className="max-w-[400px] max-h-[630px] p-6 bg-white rounded-lg shadow-lg overflow-y-auto">
                        {selectedOrder && (
                          <>
                            {/* Header Section */}
                            <DialogHeader className="text-center ">
                              <div>
                                <span
                                  className={`block text-2xl font-bold uppercase ${
                                    selectedOrder?.status
                                      ?.toLowerCase()
                                      ?.trim() === "delivered"
                                      ? "text-[#388A94]"
                                      : selectedOrder?.status
                                          ?.toLowerCase()
                                          ?.trim() === "cancelled"
                                      ? "text-[#1A3B47]"
                                      : selectedOrder?.status
                                          ?.toLowerCase()
                                          ?.trim() === "pending"
                                      ? "text-[#F88C33]"
                                      : "text-[#B5D3D1]"
                                  }`}
                                >
                                  {selectedOrder?.status
                                    ?.toLowerCase()
                                    ?.trim() === "delivered"
                                    ? "Delivered"
                                    : selectedOrder?.status
                                        ?.toLowerCase()
                                        ?.trim() === "cancelled"
                                    ? "Cancelled"
                                    : selectedOrder?.status
                                        ?.toLowerCase()
                                        ?.trim() === "pending"
                                    ? "Pending"
                                    : "Unknown Status"}
                                </span>
                                <span className="block text-sm text-gray-500">
                                  {selectedOrder?.status?.toLowerCase() ===
                                  "delivered"
                                    ? `Delivered on ${format(
                                        new Date(selectedOrder.deliveryDate),
                                        "EEE, MMM dd, yyyy"
                                      )}`
                                    : `Purchased on ${format(
                                        new Date(selectedOrder.purchaseDate),
                                        "EEE, MMM dd, yyyy"
                                      )}`}
                                </span>
                                <span className="block text-sm font-medium text-gray-600">
                                  Order ID: #{selectedOrder._id.slice(-5)}
                                </span>
                              </div>
                            </DialogHeader>

                            <hr className="" />

                            {/* Delivered To Section */}
                            <div className="text-center text-gray-700">
                              {selectedOrder.shippingAddress ? (
                                <>
                                  <div>
                                    <strong>Delivery Address:</strong>
                                  </div>
                                  {selectedOrder.shippingAddress
                                    .split(",")
                                    .map((part) => {
                                      const value = part.split(":")[1]?.trim();
                                      return value ? value : null;
                                    })
                                    .filter((value) => value).length > 0 // Remove undefined or null values
                                    ? selectedOrder.shippingAddress
                                        .split(",")
                                        .map((part) => {
                                          const value = part
                                            .split(":")[1]
                                            ?.trim();
                                          return value ? value : null;
                                        })
                                        .filter((value) => value) // Remove undefined or null values
                                        .join(", ")
                                    : "No Address Provided"}
                                </>
                              ) : (
                                <>
                                  <div>
                                    <strong>Delivery Address:</strong>
                                  </div>
                                  'No Address Provided'
                                </>
                              )}
                            </div>

                            <hr className="" />

                            {/* Order Summary Section */}
                            <div className="">
                              <h3 className="text-xl text-center font-bold mb-2">
                                Order Summary
                              </h3>
                              <div className="bg-gray-50 rounded-md shadow-sm p-4">
                                <ul className="space-y-2">
                                  {selectedOrder.products.map((item, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-center justify-between"
                                    >
                                      <img
                                        src={
                                          item.product.pictures[0]?.url ||
                                          "/images/broken_genie_lamp.png"
                                        }
                                        alt={item.product.name}
                                        className="w-12 h-12 object-cover rounded-md"
                                      />
                                      <span className="flex-1 px-4 text-sm font-medium">
                                        {item.product.name} x {item.quantity}
                                      </span>
                                      <span className="text-sm font-semibold">
                                        {displayPrice(
                                          item.product.price * item.quantity
                                        )}
                                      </span>
                                    </li>
                                  ))}
                                </ul>

                                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
                                  <span className="text-sm font-semibold">
                                    Subtotal:
                                  </span>
                                  <span className="text-sm font-bold">
                                    {displayPrice(
                                      selectedOrder.products.reduce(
                                        (acc, item) =>
                                          acc +
                                          item.product.price * item.quantity,
                                        0
                                      )
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between mt-1 items-center">
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Info className="h-4 w-4 " />
                                    <span className="text-sm font-semibold">
                                      Delivery
                                    </span>
                                  </div>
                                  <span className="text-sm font-bold">
                                    {getDeliveryPrice(order.deliveryType)}
                                  </span>
                                </div>

                                {selectedOrder.promoCode &&
                                  selectedOrder.promoCode.percentOff && (
                                    <div className="flex justify-between mt-1 items-center w-full text-[#388A94]">
                                      <span className="text-sm font-semibold">
                                        {selectedOrder.promoCode.percentOff}%
                                        Discount!
                                      </span>
                                      <span className="text-sm">
                                        -
                                        {displayPrice(
                                          selectedOrder.products.reduce(
                                            (acc, item) =>
                                              acc +
                                              item.product.price *
                                                item.quantity *
                                                (selectedOrder.promoCode
                                                  .percentOff /
                                                  100),
                                            0
                                          )
                                        )}
                                      </span>
                                    </div>
                                  )}

                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                                  <span className="text-xl font-bold">
                                    Total:
                                  </span>
                                  <div className="text-right">
                                    <span className="text-xl font-bold block">
                                      {displayPrice(selectedOrder.totalPrice)}
                                    </span>
                                    {selectedOrder.paymentMethod && (
                                      <span className="text-base font-semibold text-gray-500 block">
                                        Via{" "}
                                        {formatPaymentType(
                                          selectedOrder.paymentMethod
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className=" pt-2 text-center">
                              <p className="text-sm text-[#1A3B47] font-medium">
                                Thank you for your purchase!
                              </p>
                              <div className="flex items-center text-xs text-gray-500 mt-2">
                                <Info className="h-6 w-6 text-gray-400 mr-1 mb-1" />
                                <span>
                                  Please keep this receipt for your records. You
                                  may use it for returns or exchanges if needed.
                                </span>
                              </div>
                            </div>

                            {/* Footer Section */}
                            {selectedOrder.status === "pending" && (
                              <div className=" text-center">
                                <Button
                                  variant="destructive"
                                  className="text-base bg-[#F88C33] hover:bg-[#e67d24] text-white"
                                  onClick={() =>
                                    handleCancelConfirm(selectedOrder._id)
                                  }
                                >
                                  Cancel Order
                                </Button>
                              </div>
                            )}

                            {/* Sticky Close Button */}
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                    {order.status === "pending" && (
                      <Button
                        variant="destructive"
                        className="flex-1 text-base bg-[#F88C33] hover:bg-[#e67d24] text-white"
                        onClick={() => handleCancelConfirm(order._id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {filteredOrders.length > 0 && (
          <div className="mt-8 flex justify-center items-center space-x-4">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="icon"
              className="text-[#1A3B47] border-[#1A3B47]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-[#1A3B47]">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              variant="outline"
              size="icon"
              className="text-[#1A3B47] border-[#1A3B47]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelConfirmOpen(false)}
            >
              No, keep order
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Yes, cancel order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteConfirmation
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        itemType="order"
        onConfirm={handleCancel}
        type="cancel"
      />
    </div>
  );
}
