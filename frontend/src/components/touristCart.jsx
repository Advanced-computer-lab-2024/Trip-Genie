import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Minus,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Popup from "./popup";
import "@/styles/Popup.css";

const ShoppingCart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalAmountLoading, setTotalAmountLoading] = useState(true);
  const [streetName, setStreetName] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [floorUnit, setFloorUnit] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState("");
  const [quantityError, setQuantityError] = useState(false);
  const [allPurchasesSuccessful, setAllPurchasesSuccessful] = useState(false);
  const [allPurchasesSuccessfulPopup, setAllPurchasesSuccessfulPopup] =
    useState(false);
  const [actionError, setActionError] = useState(null);
  const [popupType, setPopupType] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showOrderSummary, setShowOrderSummary] = useState(true);
  const [showProductList, setShowProductList] = useState(false);

  const [promoCode, setPromoCode] = useState("");
  const [promoDetails, setPromoDetails] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [discountedTotal, setDiscountedTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [currentPromoCode, setCurrentPromoCode] = useState("");

  const [userRole, setUserRole] = useState("guest");
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencies, setCurrencies] = useState([]);
  const openSuccessPopup = (message) => {
    setPopupType("success");
    setPopupOpen(true);
    setPopupMessage(message);
  };

  const openErrorPopup = (message) => {
    setPopupType("error");
    setPopupOpen(true);
    setPopupMessage(message);
  };

  const closePopup = () => {
    setPopupOpen(false);
  };

  const isCheckoutDisabled = cartItems.some(
    (item) =>
      item?.product?.quantity === 0 || item?.quantity > item?.product?.quantity
  );

  const blueButtonStyle =
    "bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300";

  const resetFields = () => {
    setPaymentMethod("");
    setDeliveryDate("");
    setDeliveryTime("");
    setDeliveryType("");
    setStreetName("");
    setStreetNumber("");
    setFloorUnit("");
    setState("");
    setCity("");
    setPostalCode("");
    setLandmark("");
    setLocationType("");
    setLocation("");
  };

  useEffect(() => {
    if (location) {
      console.log("Location updated:", location);
      handlePurchase();
    }
  }, [location]);

  const calculateDeliveryCost = (type) => {
    switch (type) {
      case "Standard":
        return 2.99;
      case "Express":
        return 4.99;
      case "Next-Same":
        return 6.99;
      case "International":
        return 14.99;
      default:
        return 0;
    }
  };

  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    setPromoError("");
    setPromoDetails(null);
    setDiscountAmount(0);
    setDiscountedTotal(totalAmount);

    if (!promoCode.trim()) {
      return;
    }

    try {
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/get/promo-code",
        {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${Cookies.get("jwt")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: promoCode }),
        }
      );

      if (response.status === 404) {
        setPromoError("Promo Code Not Found.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch promo code details");
      }

      const data = await response.json();
      const promo = data.promoCode;
      console.log(promo);
      console.log(promo.status);
      if (promo.status === "inactive") {
        setPromoError("This promo code is currently inactive.");
        return;
      }

      const currentDate = new Date();
      const startDate = new Date(promo?.dateRange?.start);
      const endDate = new Date(promo?.dateRange?.end);

      if (currentDate < startDate || currentDate > endDate) {
        setPromoError("This promo code is not valid for the current date.");
        return;
      }

      if (promo.timesUsed >= promo.usage_limit) {
        setPromoError("This promo code has reached its usage limit.");
        return;
      }

      setPromoDetails(promo);
      const discount = totalAmount * (promo.percentOff / 100);
      setDiscountAmount(discount);
      setDiscountedTotal(totalAmount - discount);
    } catch (error) {
      console.log(error);
      setPromoError("Failed to apply promo code. Please try again.");
    }
  };

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/rates"
      );
      setExchangeRates(response.data.rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  }, []);

  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/tourist/currencies",
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setCurrencies(response.data);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  }, []);

  const fetchUserInfo = useCallback(async () => {
    const role = Cookies.get("role") || "guest";
    setUserRole(role);

    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/tourist/",
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const currencyId = response.data.preferredCurrency;
      console.log("userperfeered", currencyId);
      setCurrentPromoCode(response.data.currentPromoCode || "");

      const response2 = await axios.get(
        `https://trip-genie-apis.vercel.app/tourist/getCurrency/${currencyId}`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserPreferredCurrency(response2.data);
      console.log("hereeeeeeeeeeeeeeeeeeeeeeeee", response2.data);

      if (response.data.currentPromoCode) {
        setPromoCode(response.data.currentPromoCode.code);
        handlePromoSubmit({ preventDefault: () => {} });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserInfo();
    fetchExchangeRates();
    fetchCurrencies();
    fetchCartItems();
  }, [cartItems, fetchUserInfo, fetchExchangeRates, fetchCurrencies]);

  useEffect(() => {
    calculateTotalAmount();
  }, [cartItems, exchangeRates, userPreferredCurrency]);

  const fetchCartItems = useCallback(async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/cart",
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  }, []);

  const formatPrice = useCallback(
    (price, productCurrency) => {
      console.log(userPreferredCurrency);
      if (userRole === "tourist" && userPreferredCurrency) {
        const baseRate = exchangeRates[productCurrency] || 1;
        const targetRate = exchangeRates[userPreferredCurrency.code] || 1;
        const exchangedPrice = (price / baseRate) * targetRate;
        return `${userPreferredCurrency.symbol}${exchangedPrice.toFixed(2)}`;
      }
      const currency = currencies.find((c) => c._id === productCurrency);
      return `${currency ? currency.symbol : "$"}${price.toFixed(2)}`;
    },
    [userRole, userPreferredCurrency, exchangeRates, currencies]
  );

  const calculateTotalAmount = useCallback(() => {
    setTotalAmountLoading(true);
    let total = 0;
    for (const item of cartItems) {
      if (
        userRole === "tourist" &&
        userPreferredCurrency &&
        userPreferredCurrency.code !== item.product?.currency
      ) {
        const baseRate = exchangeRates[item.product?.currency] || 1;
        const targetRate = exchangeRates[userPreferredCurrency.code] || 1;
        total += (item.product?.price / baseRate) * targetRate * item.quantity;
      } else {
        total += item?.product?.price * item.quantity;
      }
    }
    setTotalAmount(total);
    setTotalAmountLoading(false);
  }, [cartItems, userRole, userPreferredCurrency, exchangeRates]);

  const emptyCart = useCallback(async () => {
    try {
      setCartItems([]);
      const token = Cookies.get("jwt");
      const emptyCartResponse = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/empty/cart",
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (emptyCartResponse.ok) {
        console.log("Cart emptied successfully.");
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        console.error("Failed to empty the cart.");
        throw new Error("Failed to empty the cart");
      }
    } catch (error) {
      console.error("Error emptying cart items:", error);
      setActionError("Failed to empty the cart. Please try again.");
    }
  }, []);

  const handleRemoveItem = async (productId) => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `https://trip-genie-apis.vercel.app/tourist/remove/cart/${productId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: productId }),
        }
      );
      if (response.ok) {
        setCartItems((prevItems) =>
          prevItems.filter((item) => item.product._id !== productId)
        );
        calculateTotalAmount();
        fetchCartItems();
        openSuccessPopup("Item removed successfully!");
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } catch (error) {
      console.error("Error removing item:", error);
      setActionError(error.message);
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `https://trip-genie-apis.vercel.app/tourist/update/cart`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newQuantity, productId }),
        }
      );
      if (response.ok) {
        const updatedItems = cartItems.map((item) => {
          if (item.product?._id === productId) {
            return {
              ...item,
              quantity: newQuantity,
              priceLoading: true,
            };
          }
          return item;
        });

        setCartItems(updatedItems);
        calculateTotalAmount();

        // Simulate a delay for price recalculation
        setTimeout(() => {
          setCartItems((prevItems) =>
            prevItems.map((item) =>
              item.product?._id === productId
                ? { ...item, priceLoading: false }
                : item
            )
          );
        }, 500);
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      setActionError(error.message);
    }
  };

  const handleCheckout = () => {
    setShowPurchaseConfirm(true);
  };

  const handlePurchase = async () => {
    try {
      const token = Cookies.get("jwt");

      const products = cartItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      }));

      const response = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/purchase",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            products,
            totalAmount,
            paymentMethod,
            shippingAddress: location,
            locationType,
            deliveryType,
            deliveryTime,
            deliveryDate,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Purchase failed");
      }

      await emptyCart();

      setAllPurchasesSuccessful(true);
      setAllPurchasesSuccessfulPopup(true);
      console.log("Purchase successful for all items!");
    } catch (error) {
      setActionError(error.message);
      setAllPurchasesSuccessful(false);
      setAllPurchasesSuccessfulPopup(false);
      console.error("Error making purchase:", error);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const getActivePromoCode = () => {
    return promoDetails ? promoCode : currentPromoCode;
  };

  return (
    <div>
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>

      <div className="flex h-screen ml-10 ">
        <div className="flex-1 p-8">
          <h1 className="text-5xl text-[#1A3B47] font-bold mb-6 flex justify-between items-center">
            Shopping Cart
            <span className="text-xl font-normal">
              ({cartItems.length} items)
            </span>
          </h1>
          {cartItems?.length === 0 ? (
            <p className="text-center text-gray-500 my-8">No items in cart</p>
          ) : (
            <div className="space-y-6">
              {/* Cart Items Wrapper with Scrollable Area */}
              <div className="max-h-[500px] overflow-y-auto">
                {cartItems.length > 4
                  ? cartItems.map((item) => (
                      <div
                        key={item.product?._id}
                        className="flex items-center justify-between border-b py-4"
                      >
                        <div className="flex items-center">
                          <img
                            src={item.product?.pictures[0]?.url}
                            alt={item?.product?.name || "Product"}
                            className="w-20 h-20 object-cover mr-4 cursor-pointer"
                            onClick={() => handleProductClick(item.product._id)}
                          />
                          <div>
                            <h2
                              className="text-lg font-semibold cursor-pointer hover:underline"
                              onClick={() =>
                                handleProductClick(item.product._id)
                              }
                            >
                              {item?.product?.name}
                            </h2>
                            <p className="text-sm text-gray-600 max-w-xs overflow-hidden text-ellipsis whitespace-normal break-words">
                              {item.product.description?.length > 50
                                ? `${item.product.description?.slice(0, 50)}...`
                                : item.product.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex items-center justify-between w-32 h-10 border border-gray-300 rounded-md">
                            <Button
                              onClick={() =>
                                handleQuantityChange(
                                  item?.product?._id,
                                  Math.max(1, item?.quantity - 1)
                                )
                              }
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-black"
                              disabled={
                                item?.quantity <= 1 ||
                                item?.product?.quantity === 0
                              }
                            >
                              <Minus className="h-5 w-5 text-[#388A94] font-semibold" />
                            </Button>
                            <span className="text-center font-semibold text-xl text-black w-8">
                              {item?.quantity}
                            </span>
                            <Button
                              onClick={() =>
                                handleQuantityChange(
                                  item?.product?._id,
                                  item?.quantity + 1
                                )
                              }
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-black"
                              disabled={
                                item?.quantity >= item?.product?.quantity
                              }
                            >
                              <Plus className="h-5 w-5 text-[#388A94] font-semibold" />
                            </Button>
                          </div>
                          <span className="ml-4 font-semibold w-24 text-right text-2xl">
                            {item.priceLoading ? (
                              <div className="animate-pulse bg-gray-200 h-6 w-full rounded-full"></div>
                            ) : (
                              formatPrice(
                                item?.product?.price * item?.quantity,
                                item?.product?.currency
                              )
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            onClick={() => handleRemoveItem(item?.product?._id)}
                            className="p-2 w-8 h-8 ml-4 text-red-500 hover:text-red-700 transition duration-300 ease-in-out"
                          >
                            <Trash2 className="h-6 w-6 " />
                          </Button>
                        </div>
                      </div>
                    ))
                  : // If less than 4 items, render normally without scroll
                    cartItems.map((item) => (
                      <div
                        key={item.product?._id}
                        className="flex items-center justify-between border-b py-4"
                      >
                        <div className="flex items-center">
                          <img
                            src={item.product?.pictures[0]?.url}
                            alt={item?.product?.name || "Product"}
                            className="w-20 h-20 object-cover mr-4 cursor-pointer"
                            onClick={() => handleProductClick(item.product._id)}
                          />
                          <div>
                            <h2
                              className="text-lg font-semibold cursor-pointer hover:underline"
                              onClick={() =>
                                handleProductClick(item.product._id)
                              }
                            >
                              {item?.product?.name}
                            </h2>
                            <p className="text-sm text-gray-600 max-w-xs overflow-hidden text-ellipsis whitespace-normal break-words">
                              {item.product.description?.length > 50
                                ? `${item.product.description?.slice(0, 50)}...`
                                : item.product.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex items-center justify-between w-32 h-10 border border-gray-300 rounded-md">
                            <Button
                              onClick={() =>
                                handleQuantityChange(
                                  item?.product?._id,
                                  Math.max(1, item?.quantity - 1)
                                )
                              }
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-black"
                              disabled={
                                item?.quantity <= 1 ||
                                item?.product?.quantity === 0
                              }
                            >
                              <Minus className="h-5 w-5 text-[#388A94] font-semibold" />
                            </Button>
                            <span className="text-center font-semibold text-xl text-black w-8">
                              {item?.quantity}
                            </span>
                            <Button
                              onClick={() =>
                                handleQuantityChange(
                                  item?.product?._id,
                                  item?.quantity + 1
                                )
                              }
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-black"
                              disabled={
                                item?.quantity >= item?.product?.quantity
                              }
                            >
                              <Plus className="h-5 w-5 text-[#388A94] font-semibold" />
                            </Button>
                          </div>
                          <span className="ml-4 font-semibold w-24 text-right text-2xl">
                            {item.priceLoading ? (
                              <div className="animate-pulse bg-gray-200 h-6 w-full rounded-full"></div>
                            ) : (
                              formatPrice(
                                item?.product?.price * item?.quantity,
                                item?.product?.currency
                              )
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            onClick={() => handleRemoveItem(item?.product?._id)}
                            className="p-2 w-8 h-8 ml-4 text-red-500 hover:text-red-700 transition duration-300 ease-in-out"
                          >
                            <Trash2 className="h-6 w-6 " />
                          </Button>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}
        </div>
        <div className="w-1/3 bg-gray-100 p-8 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-[#1A3B47]">
            Order Summary ({cartItems.length})
          </h2>
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={index}
                className={`flex justify-between ${
                  index === cartItems.length - 1 ? "pb-2" : ""
                }`}
              >
                <div>
                  <p className="font-medium text-[#1A3B47]">
                    {item?.product?.name} x {item?.quantity}
                  </p>
                </div>
                <span className="text-[#388A94] font-semibold">
                  {formatPrice(item?.totalPrice)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between  text-lg">
              <span className="text-[#1A3B47]">Subtotal</span>
              <span className="font-semibold text-[#388A94]">
                {formatPrice(
                  totalAmount,
                  userPreferredCurrency ? userPreferredCurrency.code : "USD"
                )}
              </span>
            </div>
            {promoDetails && (
              <div className="flex justify-between  mt-2">
                <span className="text-[#1A3B47]">Discount:</span>
                <span className="font-semibold text-green-600">
                  -
                  {formatPrice(
                    discountAmount,
                    userPreferredCurrency ? userPreferredCurrency.code : "USD"
                  )}
                </span>
              </div>
            )}
            <div className="border-t  mt-4"></div>
            <div className="flex justify-between text-[#1A3B47] font-bold text-xl mt-4">
              <span>Total</span>
              <span className="text-[#388A94]">
                {formatPrice(
                  promoDetails ? discountedTotal : totalAmount,
                  userPreferredCurrency ? userPreferredCurrency.code : "USD"
                )}
              </span>
            </div>
          </div>
          <form onSubmit={handlePromoSubmit} className="mt-4">
            <div className="flex mt-1">
              <Input
                id="promo-code"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder={"Enter promo code"}
                className="flex-grow"
              />
              <Button
                type="submit"
                className="ml-2 bg-[#388A94] hover:bg-[#2e6b77]"
                disabled={!promoCode.trim()}
              >
                Apply
              </Button>
            </div>
          </form>
          {promoError && <p className="text-red-500 mt-2">{promoError}</p>}
          {promoDetails && (
            <div className="mt-2">
              <p className="text-green-600 mt-2">
                Congratulations! You've saved {promoDetails.percentOff}% on this
                purchase!
              </p>
            </div>
          )}
          <Button
            className="w-full mt-6 bg-[#1A3B47] text-white py-3 text-lg"
            onClick={() => navigate("/checkout2")}
            disabled={cartItems.length === 0}
          >
            Proceed to Checkout
          </Button>
        </div>

        <Dialog
          open={actionError !== null}
          onOpenChange={() => setActionError(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <XCircle className="w-6 h-6 text-red-500 inline-block mr-2" />
                Error
              </DialogTitle>
            </DialogHeader>
            <p>{actionError}</p>
            <DialogFooter>
              <Button variant="default" onClick={() => setActionError(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
export default ShoppingCart;
