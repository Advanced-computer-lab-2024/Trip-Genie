import { useState, useEffect, useRef } from "react";
import { ArrowDown, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import Cookies from "js-cookie";
import { format, addDays, addBusinessDays, add } from "date-fns";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserGuide } from "@/components/UserGuide";

import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import ShippingAddress from "@/pages/AddShippingAddress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const checkoutSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  streetName: z.string().min(1, "Street name is required"),
  streetNumber: z.string().min(1, "Street number is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().optional(),
  locationType: z.string().min(1, "Location type is required"),
  deliveryTime: z.string().min(1, "Delivery time is required"),
  deliveryType: z.string().min(1, "Delivery type is required"),
  paymentMethod: z.enum(
    ["credit_card", "debit_card", "wallet", "cash_on_delivery"],
    {
      required_error: "Payment method is required",
    }
  ),
  selectedCard: z
    .string()
    .optional()
    .refine((val) => val && val.length > 0, {
      message: "Please select a card",
      path: ["selectedCard"],
    }),
});

export default function CheckoutPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [paySucess, setPaySucess] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [userRole, setUserRole] = useState("tourist");
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencySymbol, setCurrencySymbol] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [showSavedCards, setShowSavedCards] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const navigate = useNavigate();
  const [isAddressDialogOpenDetail, setIsAddressDialogOpenDetail] =
    useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(null);
  const [addressDetails, setAddressDetails] = useState({
    streetName: "",
    streetNumber: "",
    floorUnit: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    landmark: "",
    locationType: "",
    default: false,
  });
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    holderName: "",
    cvv: "",
    cardType: "",
  });
  const [errors, setErrors] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const [purchaseError, setPurchaseError] = useState(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoDetails, setPromoDetails] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountedTotal, setDiscountedTotal] = useState(0);
  const [currentPromoCode, setCurrentPromoCode] = useState("");
  const [paySuccess, setPaySuccess] = useState(false);
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState("");
  const purchaseProcessedRef = useRef(false);

  const [deliveryType, setDeliveryType] = useState("Standard");
  const [deliveryTime, setDeliveryTime] = useState("morning");
  const [paymentMethod, setPaymentMethod] = useState("");
  const paymentMethodRef = useRef(null);
  const [tourist, setTourist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddressLoaded, setIsAddressLoaded] = useState(false);
  const [isExchangeRateLoaded, setIsExchangeRateLoaded] = useState(false);
  const [isCurrencySymbolLoaded, setIsCurrencySymbolLoaded] = useState(false);

  const form = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      streetName: "",
      streetNumber: "",
      city: "",
      state: "",
      postalCode: "",
      locationType: "",
      deliveryType: searchParams.get("deliveryType") || "",
      deliveryTime: searchParams.get("deliveryTime") || "",
      paymentMethod: "",
      selectedCard: "",
    },
  });

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (!isAddressDialogOpen) fetchUserInfo();
  }, [isAddressDialogOpen]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchUserInfo();
      await fetchCart();
      await fetchExchangeRate();
      await getCurrencySymbol();
      setIsLoading(false);
    };
    loadData();
  }, [isAddressLoaded, isExchangeRateLoaded, isCurrencySymbolLoaded]);

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
        const userData = response.data;
        const currencyId = userData.preferredCurrency;
        setSavedCards(userData.cards || []);
        setSavedAddresses(userData.shippingAddresses || []);
        setTourist(userData);

        const defaultAddress = userData.shippingAddresses?.find(
          (addr) => addr.default
        );
        const defaultCard = userData.cards?.find((card) => card.default);

        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
          Object.keys(defaultAddress).forEach((key) => {
            if (key !== "default") {
              form.setValue(key, defaultAddress[key]);
            }
          });
        }

        if (defaultCard) {
          setSelectedCard(defaultCard);
          form.setValue(
            "paymentMethod",
            defaultCard.cardType === "Credit Card"
              ? "credit_card"
              : "debit_card"
          );
          form.setValue("selectedCard", defaultCard.cardNumber);
        }

        form.setValue("firstName", userData.fname || "");
        form.setValue("lastName", userData.lname || "");
        form.setValue("email", userData.email || "");
        form.setValue("phone", userData.mobile || "");

        if (
          response.data.currentPromoCode &&
          response.data.currentPromoCode.code
        ) {
          setCurrentPromoCode(response.data.currentPromoCode.code);
          setPromoCode(response.data.currentPromoCode.code);
        }

        console.log("Currency ID:", currencyId);
        const response2 = await axios.get(
          `https://trip-genie-apis.vercel.app/tourist/getCurrency/${currencyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setUserPreferredCurrency(response2.data);
        if (
          response.data.currentPromoCode &&
          response.data.currentPromoCode.code
        ) {
          await handlePromoSubmit({ preventDefault: () => {} });
        }
        setIsAddressLoaded(true);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsAddressLoaded(true);
      }
    }
  };

  //sam here, you can use this useeffect to check if the sessionID is valid but I am gonna do it l8r <3
  // useEffect(() => {
  //   const checkPaymentStatus = async () => {
  //     const sessionId = searchParams.get("session_id")
  //     if (sessionId) {
  //       try {
  //         const response = await axios.get(`https://trip-genie-apis.vercel.app/check-payment-status?session_id=${sessionId}`)
  //         if (response.data.status === "complete") {
  //           setPaySuccess(true)
  //           await completePurchase(form.getValues())
  //         }
  //       } catch (error) {
  //         console.error("Error checking payment status:", error)
  //       }
  //     }
  //   }

  //   checkPaymentStatus()
  //   fetchCart()
  // }, [searchParams])

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const sessionId = searchParams.get("session_id");
      const success = searchParams.get("success");
      const deliveryType = searchParams.get("deliveryType");
      const deliveryTime = searchParams.get("deliveryTime");
      const shippingId = searchParams.get("shippingId");
      const promoCode = searchParams.get("promoCode");

      await fetchUserInfo();

      let selectedAddress = null;

      if (shippingId) {
        try {
          const token = Cookies.get("jwt");
          const response = await axios.get(
            `https://trip-genie-apis.vercel.app/tourist/shippingAdds`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const addresses = response.data.shippingAddresses;
          setSavedAddresses(addresses); // Update saved addresses

          selectedAddress = addresses.find((addr) => addr._id === shippingId);
          if (!selectedAddress) {
            console.warn("Shipping address not found for given ID.");
          }
        } catch (error) {
          console.error("Error fetching shipping address:", error);
        }
      }

      let cartItemsNew = null;
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/cart",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        cartItemsNew = response.data;
        console.log("cartitemsnew", cartItemsNew);
        setCartItems(response.data);
        calculateTotal(response.data);
      } catch (error) {
        console.log("Error fetching cart items");
      }

      console.log("Session ID:", sessionId);

      if (sessionId && success === "true") {
        try {
          const response = await axios.get(
            `https://trip-genie-apis.vercel.app/check-payment-status?session_id=${sessionId}`
          );

          console.log("Payment status response:", response.data);

          if (response.data.status === "paid") {
            setPaySuccess(true);
            setDeliveryType(deliveryType);
            setDeliveryTime(deliveryTime);
            setPaymentMethod("credit_card");

            console.log("Completing purchase...");
            await completePurchase({
              cartItemsNew,
              address: selectedAddress,
              deliveryType,
              deliveryTime,
              paymentMethod: "credit_card",
              promoCode,
            });
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
        }
      }
    };

    checkPaymentStatus();
    fetchCart();
  }, [searchParams]);

  const completePurchase = async (data) => {
    if (purchaseProcessedRef.current) {
      console.log("Booking already processed");
      return;
    }
    purchaseProcessedRef.current = true;

    try {
      console.log("Completing purchase... here");
      console.log("Data:", data);

      const token = Cookies.get("jwt");
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/purchase",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            products: (data.cartItemsNew || cartItems).map((item) => ({
              product: item.product._id,
              quantity: item.quantity,
            })),
            totalAmount,
            paymentMethod:
              data.paymentMethod === "credit_card"
                ? data.paymentMethod
                : paymentMethod,
            shippingAddress: data.address || selectedAddress,
            locationType: data.address
              ? data.address.locationType
              : selectedAddress.locationType,
            deliveryType:
              data.paymentMethod === "credit_card"
                ? data.deliveryType
                : deliveryType,
            deliveryTime:
              data.paymentMethod === "credit_card"
                ? data.deliveryTime
                : deliveryTime,
            promoCode:
              data.paymentMethod === "credit_card" ? data.promoCode : promoCode,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      console.log("Purchase completed successfully.");

      setPurchaseStatus("success");
      setIsStatusDialogOpen(true);
    } catch (error) {
      console.error("Error completing purchase:", error);
      setPurchaseStatus("error");
      setPurchaseError(error.message);
      setIsStatusDialogOpen(true);
    }
  };

  const fetchCart = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/tourist/cart",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCartItems(response.data || []);
      calculateTotal(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
    setTotalAmount(total);
  };

  const handlePromoSubmit = async (e) => {
    if (e) e.preventDefault();
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
      console.error(error);
      setPromoError("Failed to apply promo code. Please try again.");
    }
  };

  const handleStripeRedirect = async () => {
    try {
      console.log("Redirecting to Stripe...");

      const API_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      const stripe = await loadStripe(API_KEY);

      console.log("discountedTotal", formatPrice2(discountAmount));

      const response = await fetch(
        "https://trip-genie-apis.vercel.app/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cartItems.map((item) => ({
              product: {
                name: item.product.name,
              },
              quantity: item.quantity,
              totalPrice: formatPrice2(item.totalPrice),
            })),
            currency: userPreferredCurrency.code,
            deliveryInfo: {
              shippingId: selectedAddress._id,
              type: deliveryType,
              time: deliveryTime,
              deliveryPrice: getDeliveryPrice(deliveryType),
            },
            promoCode,
            discountPercentage: promoDetails?.percentOff || 0,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server response:", errorData);
        throw new Error(
          `Failed to create checkout session: ${
            errorData.error || response.statusText
          }`
        );
      }

      const { id: sessionId } = await response.json();

      if (!sessionId) {
        throw new Error("No session ID returned from the server");
      }

      console.log("Session ID received:", sessionId);

      const result = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (result.error) {
        console.error("Stripe redirect error:", result.error);
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Error in redirecting to Stripe:", error);
      // Handle the error appropriately (e.g., show an error message to the user)
    }
  };

  const scrollToPaymentMethod = () => {
    // Scroll to the Payment Method section if there's an error
    if (paymentMethodRef.current) {
      paymentMethodRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const onSubmit = async () => {
    if (!paymentMethod) {
      setErrors(true);
      scrollToPaymentMethod(); // Scroll to the payment method section
      return;
    }

    if (paymentMethod === "credit_card") {
      await handleStripeRedirect();
    } else {
      await completePurchase({
        paymentMethod,
        deliveryType,
        deliveryTime,
      });
    }
  };

  const emptyCart = async () => {
    try {
      setCartItems([]);

      const token = Cookies.get("jwt");
      const emptyCartResponse = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/empty/cart",
        {
          method: "DELETE",
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
      }
    } catch (error) {
      console.error("Error emptying cart items:", error);
    }
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? "" : section);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setAddressDetails((prev) => ({ ...prev, [name]: checked }));
    } else {
      setAddressDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeliveryTypeChange = (value) => {
    setDeliveryType(value);
  };

  const fetchExchangeRate = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `https://trip-genie-apis.vercel.app/${userRole}/populate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base: cartItems[0]?.product.currency,
            target: userPreferredCurrency._id,
          }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        setExchangeRates(data.conversion_rate);
      } else {
        console.error("Error in fetching exchange rate:", data.message);
      }
      setIsExchangeRateLoaded(true);
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  };

  const getCurrencySymbol = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/${userRole}/getCurrency/${cartItems[0]?.product.currency}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrencySymbol(response.data);
      setIsCurrencySymbolLoaded(true);
    } catch (error) {
      console.error("Error fetching currency symbol:", error);
    }
  };

  const formatPrice2 = (price) => {
    const roundedPrice = price;
    if (cartItems.length > 0) {
      if (userRole === "tourist" && userPreferredCurrency) {
        if (userPreferredCurrency._id === cartItems[0].product.currency) {
          return roundedPrice;
        } else {
          const exchangedPrice = (roundedPrice * exchangeRates).toFixed(2);
          return exchangedPrice;
        }
      }
    }
  };

  const formatPrice = (price) => {
    if (
      isLoading ||
      !isAddressLoaded ||
      !isExchangeRateLoaded ||
      !isCurrencySymbolLoaded
    ) {
      return (
        <div className="w-16 h-6 bg-gray-300 rounded-full animate-pulse"></div>
      );
    }
    const roundedPrice = price;
    if (cartItems.length > 0) {
      if (userRole === "tourist" && userPreferredCurrency) {
        if (userPreferredCurrency._id === cartItems[0].product.currency) {
          return `${userPreferredCurrency.symbol}${roundedPrice.toFixed(2)}`;
        } else {
          const exchangedPrice = (roundedPrice * exchangeRates).toFixed(2);
          return `${userPreferredCurrency.symbol}${exchangedPrice}`;
        }
      } else {
        if (currencySymbol) {
          return `${currencySymbol.symbol}${roundedPrice.toFixed(2)}`;
        }
      }
    }
    return `${roundedPrice}`;
  };

  const getDeliveryPrice = (deliveryType) => {
    switch (deliveryType) {
      case "Express":
        return formatPrice2(4.99);
      case "Next-Same":
        return formatPrice2(6.99);
      case "International":
        return formatPrice2(14.99);
      default:
        return formatPrice2(2.99);
    }
  };

  const guideSteps = [
    {
      target: "body",
      content:
        "You're just one step away from completing your order. Review your items and your delivery details to proceed to payment and confirm your purchase!",
      placement: "center",
    },
    {
      target: ".userInfo",
      content:
        "Here you can find your personal information, including your name, email, and phone number.",
      placement: "right",
    },
    {
      target: ".deliveryOptions",
      content:
        "Choose your delivery option based on how quickly you would like to receive your products. Choose from Standard, Express, Next Day, or International Shipping.",
      placement: "right",
    },
    {
      target: ".deliverTime",
      content:
        "Select your preferred delivery time. Choose from Morning, Afternoon, Evening, or Night.",
      placement: "right",
    },
    {
      target: ".deliveryAddress",
      content:
        "You can check your delievey adress from here and change it if needed!",
      placement: "right",
    },
    {
      target: ".payment",
      content:
        "Choose your payment method. You can pay with a credit card, debit card, wallet, or cash on delivery.",
      placement: "right",
    },
    {
      target: ".completePurchase",
      content: "Click here to complete your purchase and place your order!",
      placement: "left",
    },
  ];

  const calculateDeliveryTime = (deliveryTime) => {
    switch (deliveryTime) {
      case "morning":
        return "08:00 AM";
      case "afternoon":
        return "12:00 PM";
      case "evening":
        return "04:00 PM";
      case "night":
        return "08:00 PM";
      default:
        return "";
    }
  };

  const calculateEstimatedDeliveryDate = (deliveryType) => {
    const today = new Date();
    switch (deliveryType) {
      case "Standard":
        return addBusinessDays(today, 8);
      case "Express":
        return addBusinessDays(today, 3);
      case "Next-Same":
        return addDays(today, 1);
      case "International":
        return addBusinessDays(today, 21);
      default:
        return addBusinessDays(today, 8);
    }
  };

  return (
    <div className="">
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />
      </div>
      <div className=" mx-auto py-8 px-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] max-h-[500px] overflow-y-auto">
          {/* Main Checkout Form */}
          <div className="space-y-8 pr-8">
            <h1 className="text-5xl font-bold ml-5 text-[#1A3B47]">Checkout</h1>

            {/* User Info Section */}
            <div className="bg-white pt-6 pr-6 pl-6 pb-4 userInfo">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-gray-400">01</span>
                <h2 className="text-2xl font-semibold text-[#1A3B47]">
                  User Info
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-4 text-base">
                <div>
                  <Label className="font-semibold text-lg text-[#1A3B47]">
                    Name
                  </Label>
                  <p className="mt-1 text-[#388A94]">
                    {form.watch("firstName")} {form.watch("lastName")}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold text-lg text-[#1A3B47]">
                    Email
                  </Label>
                  <p className="mt-1 text-[#388A94]">{form.watch("email")}</p>
                </div>
                <div>
                  <Label className="font-semibold text-lg text-[#1A3B47]">
                    Phone Number
                  </Label>
                  <p className="mt-1 text-[#388A94]">{form.watch("phone")}</p>
                </div>
              </div>
            </div>

            {/* Delivery Options Section */}
            <div className="bg-white pr-6 pl-6 pb-4">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-gray-400">02</span>
                <h2 className="text-2xl font-semibold text-[#1A3B47]">
                  Delivery Options
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 deliveryOptions">
                <label className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer bg-gray-100">
                  {/* Checkbox with peer class for styling when checked */}
                  <Checkbox
                    checked={deliveryType === "Standard"}
                    onCheckedChange={() => handleDeliveryTypeChange("Standard")}
                    className={`peer border-gray-400 cursor-pointer ${
                      deliveryType === "Standard"
                        ? "bg-[#388A94] border-[#388A94]"
                        : ""
                    }`}
                    id="standard"
                  />
                  <div className="flex-1">
                    <Label className="font-medium text-[#1A3B47] text-base">
                      Standard Delivery
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">
                      2–8 business days
                    </p>
                    <span className="text-[#1A3B47] font-semibold">
                      {formatPrice(2.99)}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer bg-gray-100">
                  <Checkbox
                    checked={deliveryType === "Express"}
                    onCheckedChange={() => handleDeliveryTypeChange("Express")}
                    className="peer border-gray-400 text-[#388A94] checked:border-[#388A94] checked:bg-[#388A94] cursor-pointer"
                    id="express"
                  />
                  <div className="flex-1">
                    <Label className="font-medium text-[#1A3B47] text-base">
                      Express Delivery
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">
                      1–3 business days
                    </p>
                    <span className="text-[#1A3B47] font-semibold">
                      {formatPrice(4.99)}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer bg-gray-100">
                  <Checkbox
                    checked={deliveryType === "Next-Same"}
                    onCheckedChange={() =>
                      handleDeliveryTypeChange("Next-Same")
                    }
                    className="peer border-gray-400 text-[#388A94] checked:border-[#388A94] checked:bg-[#388A94] cursor-pointer"
                    id="next-same"
                  />
                  <div className="flex-1">
                    <Label className="font-medium text-[#1A3B47] text-base">
                      Next Day Delivery
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Next business day
                    </p>
                    <span className="text-[#1A3B47] font-semibold">
                      {formatPrice(6.99)}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer bg-gray-100">
                  <Checkbox
                    checked={deliveryType === "International"}
                    onCheckedChange={() =>
                      handleDeliveryTypeChange("International")
                    }
                    className="peer border-gray-400 text-[#388A94] checked:border-[#388A94] checked:bg-[#388A94] cursor-pointer"
                    id="international"
                  />
                  <div className="flex-1">
                    <Label className="font-medium text-[#1A3B47] text-base">
                      International Shipping
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">
                      7–21 business days
                    </p>
                    <span className="text-[#1A3B47] font-semibold">
                      {formatPrice(14.99)}
                    </span>
                  </div>
                </label>
              </div>
              <div className="mt-4 deliverTime">
                <Label className="font-medium text-base mb-4 block text-[#1A3B47]">
                  Delivery Time
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Morning */}
                  <label
                    htmlFor="morning"
                    className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer bg-gray-100"
                  >
                    <RadioGroup
                      value={deliveryTime}
                      onValueChange={setDeliveryTime}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="morning"
                          id="morning"
                          className="border-gray-400 text-[#388A94]"
                        />
                        <div>
                          <Label
                            htmlFor="morning"
                            className="text-base font-medium text-[#1A3B47]"
                          >
                            Morning
                          </Label>
                          <p className="text-sm text-[#388A94]">8am - 12pm</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </label>

                  {/* Afternoon */}
                  <label
                    htmlFor="afternoon"
                    className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer bg-gray-100"
                  >
                    <RadioGroup
                      value={deliveryTime}
                      onValueChange={setDeliveryTime}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="afternoon"
                          id="afternoon"
                          className="border-gray-400 text-[#388A94]"
                        />
                        <div>
                          <Label
                            htmlFor="afternoon"
                            className="text-base font-medium text-[#1A3B47]"
                          >
                            Afternoon
                          </Label>
                          <p className="text-sm text-[#388A94]">12pm - 4pm</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </label>

                  {/* Evening */}
                  <label
                    htmlFor="evening"
                    className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer bg-gray-100"
                  >
                    <RadioGroup
                      value={deliveryTime}
                      onValueChange={setDeliveryTime}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="evening"
                          id="evening"
                          className="border-gray-400 text-[#388A94]"
                        />
                        <div>
                          <Label
                            htmlFor="evening"
                            className="text-base font-medium text-[#1A3B47]"
                          >
                            Evening
                          </Label>
                          <p className="text-sm text-[#388A94]">4pm - 8pm</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </label>

                  {/* Night */}
                  <label
                    htmlFor="night"
                    className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer bg-gray-100"
                  >
                    <RadioGroup
                      value={deliveryTime}
                      onValueChange={setDeliveryTime}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="night"
                          id="night"
                          className="border-gray-400 text-[#388A94]"
                        />
                        <div>
                          <Label
                            htmlFor="night"
                            className="text-base font-medium text-[#1A3B47]"
                          >
                            Night
                          </Label>
                          <p className="text-sm text-[#388A94]">8pm - 10pm</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </label>
                </div>
              </div>
            </div>

            {/* Delivery Address Section */}
            <div className="bg-white  pr-6 pl-6 pb-4  deliveryAddress">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl font-bold text-gray-400">03</span>
                <h2 className="text-2xl font-semibold text-[#1A3B47]">
                  Delivery Address
                </h2>
              </div>
              {selectedAddress ? (
                <div className="space-y-4">
                  <div className="">
                    <h3 className="font-bold text-lg text-[#1A3B47]">
                      {selectedAddress.locationType}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      {selectedAddress.streetNumber}{" "}
                      {selectedAddress.streetName},
                      <br />
                      {selectedAddress.city}, {selectedAddress.state}{" "}
                      {selectedAddress.postalCode}
                    </p>
                    <div className="flex gap-2 mt-4 ml-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSavedAddresses(true)}
                        className="text-[#388A94] font-bold p-0 hover:bg-white"
                      >
                        Ship to a different address?
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddressDialogOpenDetail(true)}
                        className="text-[#388A94] font-bold hover:bg-white"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddressDialogOpen(true)}
                        className="text-[#388A94] font-bold  hover:bg-white"
                      >
                        Add New Address
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsAddressDialogOpen(true)}
                  className="w-full bg-[#1A3B47] text-white hover:bg-[#388A94]"
                >
                  Add New Address
                </Button>
              )}
            </div>

            {/* Payment Method Section */}
            <div
              ref={paymentMethodRef}
              className="bg-white  pr-6 pl-6 pb-4 payment"
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-gray-400">04</span>
                <h2 className="text-2xl font-semibold text-[#1A3B47]">
                  Payment Method
                </h2>
              </div>

              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {/* Wallet */}
                <label
                  htmlFor="wallet"
                  className="flex items-center bg-gray-100 p-3 border rounded-lg cursor-pointer"
                >
                  <RadioGroupItem
                    value="wallet"
                    id="wallet"
                    className="w-4 h-4 rounded-full border-[#5D9297] text-[#5D9297] checked:ring-[#5D9297] checked:bg-[#5D9297] focus:ring-1 focus:ring-[#5D9297]"
                  />
                  <div>
                    <Label
                      htmlFor="wallet"
                      className="text-base font-medium ml-4 text-[#1A3B47]"
                    >
                      Wallet
                    </Label>
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label
                  htmlFor="cash_on_delivery"
                  className="flex items-center bg-gray-100 p-3 border rounded-lg cursor-pointer"
                >
                  <RadioGroupItem
                    value="cash_on_delivery"
                    id="cash_on_delivery"
                    className="w-4 h-4 rounded-full border-[#5D9297] text-[#5D9297] checked:ring-[#5D9297] checked:bg-[#5D9297] focus:ring-1 focus:ring-[#5D9297]"
                  />
                  <div>
                    <Label
                      htmlFor="cash_on_delivery"
                      className="text-base font-medium ml-4 text-[#1A3B47]"
                    >
                      Cash on Delivery
                    </Label>
                  </div>
                </label>

                {/* Credit Card */}
                <label
                  htmlFor="credit_card"
                  className="flex items-center bg-gray-100 p-3 border rounded-lg cursor-pointer"
                >
                  <RadioGroupItem
                    value="credit_card"
                    id="credit_card"
                    className="w-4 h-4 rounded-full border-[#5D9297] text-[#5D9297] checked:ring-[#5D9297] checked:bg-[#5D9297] focus:ring-1 focus:ring-[#5D9297]"
                  />
                  <div>
                    <Label
                      htmlFor="credit_card"
                      className="text-base font-medium ml-4 text-[#1A3B47]"
                    >
                      Credit/Debit Card
                    </Label>
                  </div>
                </label>
              </RadioGroup>

              {errors && !paymentMethod && (
                <p className="text-red-500 text-sm mt-2">
                  Please select a payment method.
                </p>
              )}
            </div>

            <button
              onClick={() => navigate("/TouristCart")}
              className="flex items-center mb-4 justify-center text-[#1A3B47] hover:text-[#388A94] transition-colors"
            >
              <ArrowLeft className="ml-6 mr-2 h-7 w-7 " />
              <p className="text-2xl font-bold">Back to cart</p>{" "}
              {/* Added margin to separate text from the icon */}
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-100 min-h-full p-6 lg:sticky lg:top-0 overview">
            <h2 className="text-2xl font-bold mb-4 text-[#1A3B47]">
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

              {/* Delivery Information Section */}
              <div className="border-t pt-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#1A3B47] mb-2">
                    Delivery Information
                  </h3>
                  <div className="">
                    <p className="text-[#B0B0B0] text-sm font-semibold">
                      Delivering to:
                    </p>
                    {selectedAddress ? (
                      <>
                        <p className="text-[#388A94] font-bold text-lg mb-0">
                          {selectedAddress?.locationType}
                        </p>{" "}
                        {/* Location Type in bold */}
                        <p className="text-[#1A3B47]">
                          {selectedAddress?.streetNumber}{" "}
                          {selectedAddress?.streetName}, {selectedAddress?.city}
                          , {selectedAddress?.state}
                        </p>
                      </>
                    ) : (
                      <p className="text-red-500">No address selected</p>
                    )}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="mb-4">
                  <h3 className="text-sm text-[#B0B0B0] font-semibold">
                    Date & Time
                  </h3>

                  {/* Estimated Delivery Date */}
                  <p className="text-[#1A3B47] font-semibold">
                    {calculateDeliveryTime(deliveryTime)}{" "}
                    {format(
                      calculateEstimatedDeliveryDate(deliveryType),
                      "eee, dd MMM yyyy"
                    )}
                  </p>
                </div>

                {/* <div>
        <Label className="font-semibold text-lg text-[#1A3B47]">Name</Label>
        <p className="mt-1 text-[#388A94]">
          {form.watch("firstName")} {form.watch("lastName")}
        </p>
      </div>
      <div>
        <Label className="font-semibold text-lg text-[#1A3B47]">Email</Label>
        <p className="mt-1 text-[#388A94]">{form.watch("email")}</p>
      </div>
      <div>
        <Label className="font-semibold text-lg text-[#1A3B47]">Phone Number</Label>
        <p className="mt-1 text-[#388A94]">{form.watch("phone")}</p>
      </div> */}

                {/* Subtotal and Delivery Charges */}
                <div className="flex justify-between border-t pt-4">
                  <span className="text-[#1A3B47]">Subtotal</span>
                  <span className="text-[#388A94] font-semibold">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[#1A3B47]">Delivery</span>
                  <span className="text-[#388A94] font-semibold">
                    {formatPrice(
                      form.watch("deliveryType") === "Express"
                        ? 4.99
                        : form.watch("deliveryType") === "Next-Same"
                        ? 6.99
                        : form.watch("deliveryType") === "International"
                        ? 14.99
                        : 2.99
                    )}
                  </span>
                </div>
                {promoDetails && (
                  <div className="flex justify-between mt-2 text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between mt-4 text-xl font-bold">
                  <span className="text-[#1A3B47]">Total</span>
                  <span className="text-[#388A94]">
                    {formatPrice(
                      (promoDetails ? discountedTotal : totalAmount) +
                        (form.watch("deliveryType") === "Express"
                          ? 4.99
                          : form.watch("deliveryType") === "Next-Same"
                          ? 6.99
                          : form.watch("deliveryType") === "International"
                          ? 14.99
                          : 2.99)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="mt-6">
              <form onSubmit={handlePromoSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="border-[#1A3B47]"
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="border-[#388A94] bg-[#388A94] hover:bg-[#2e6b77] text-white"
                >
                  Apply
                </Button>
              </form>
              {promoError && <p className="text-red-500 mt-2">{promoError}</p>}
              {promoDetails && (
                <>
                  <p className="text-green-600 mt-2">
                    Congratulations! You've saved {promoDetails.percentOff}% on
                    this purchase!
                  </p>
                </>
              )}
            </div>

            {/* Complete Purchase Button */}
            <Button
              className="w-full text-lg mt-6 bg-[#1A3B47] text-white hover:bg-[#388A94] completePurchase "
              size="lg"
              onClick={onSubmit}
            >
              Complete Purchase
            </Button>
          </div>
        </div>
      </div>

      {/* Address Dialog */}
      <Dialog
        open={isAddressDialogOpenDetail}
        onOpenChange={setIsAddressDialogOpenDetail}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Address Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4 bg-[#F4F4F4] rounded-b-lg">
            <p>
              <strong className="text-[#1A3B47]">Street:</strong>{" "}
              {selectedAddress?.streetName} {selectedAddress?.streetNumber}
            </p>
            {selectedAddress?.floorUnit && (
              <p>
                <strong className="text-[#1A3B47]">Floor/Unit:</strong>{" "}
                {selectedAddress.floorUnit}
              </p>
            )}
            <p>
              <strong className="text-[#1A3B47]">City:</strong>{" "}
              {selectedAddress?.city}
            </p>
            <p>
              <strong className="text-[#1A3B47]">State:</strong>{" "}
              {selectedAddress?.state}
            </p>
            <p>
              <strong className="text-[#1A3B47]">Country:</strong>{" "}
              {selectedAddress?.country}
            </p>
            <p>
              <strong className="text-[#1A3B47]">Postal Code:</strong>{" "}
              {selectedAddress?.postalCode}
            </p>
            {selectedAddress?.landmark && (
              <p>
                <strong className="text-[#1A3B47]">Landmark:</strong>{" "}
                {selectedAddress.landmark}
              </p>
            )}
            <p>
              <strong className="text-[#1A3B47]">Location Type:</strong>{" "}
              {selectedAddress?.locationType}
            </p>
          </div>

          <DialogFooter>
            <Button
              className="bg-[#1A3B47]"
              onClick={() => setIsAddressDialogOpenDetail(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Addresses Dialog */}
      <Dialog open={showSavedAddresses} onOpenChange={setShowSavedAddresses}>
        <DialogContent className="sm:max-w-[425px] dialog-content">
          <div className="space-y-4 overflow-y-auto max-h-[520px]">
            <DialogHeader>
              <DialogTitle>Saved Addresses</DialogTitle>
            </DialogHeader>
            <div className="space-y-4  overflow-y-auto">
              {savedAddresses.map((address, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h3 className="font-medium">{address.locationType}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {address.streetNumber} {address.streetName},
                    <br />
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("Selected Address:", address);
                      setSelectedAddress(address);
                      Object.keys(address).forEach((key) => {
                        if (key !== "default") {
                          form.setValue(key, address[key]);
                        }
                      });
                      setShowSavedAddresses(false);
                    }}
                    className="mt-2"
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                className="bg-[#1A3B47]"
                onClick={() => setShowSavedAddresses(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}

      <Dialog
        open={isStatusDialogOpen}
        onOpenChange={(open) => {
          setIsStatusDialogOpen(open);
          if (!open) {
            // Call emptyCart when the dialog is closed
            emptyCart();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="flex items-center gap-2">
            {purchaseStatus === "success" ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                <DialogTitle>Purchase Successful</DialogTitle>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-500" />
                <DialogTitle>Purchase Failed</DialogTitle>
              </>
            )}
          </DialogHeader>
          <p className="mt-2 text-gray-600">
            {purchaseStatus === "success"
              ? "Your purchase has been completed successfully."
              : "There was an error processing your purchase. Please try again."}
          </p>
          {purchaseStatus === "success" && paymentMethod === "wallet" && (
            <div className="mt-4 text-gray-600">
              <p>
                <strong>Amount Paid: </strong>{" "}
                {formatPrice(
                  (promoDetails ? discountedTotal : totalAmount) +
                    (form.watch("deliveryType") === "Express"
                      ? 4.99
                      : form.watch("deliveryType") === "Next-Same"
                      ? 6.99
                      : form.watch("deliveryType") === "International"
                      ? 14.99
                      : 2.99)
                )}
              </p>
              <p>
                <strong>New Wallet Balance: </strong>
                {formatPrice(tourist.wallet)}
              </p>
            </div>
          )}
          {purchaseStatus !== "success" && (
            <p className="text-red-500">{purchaseError}</p>
          )}
          <DialogFooter className="mt-4 flex justify-between">
            <Button
              onClick={() => {
                navigate("/all-products");
                emptyCart();
              }}
              className="bg-[#1A3B47] text-white hover:bg-[#3E5963]"
            >
              Continue Shopping
            </Button>

            <Button
              onClick={() => {
                navigate("/");
                emptyCart();
              }}
              className="bg-gray-300 text-white hover:bg-gray-400"
            >
              Go to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <ShippingAddress onCancel={() => setIsAddressDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      {(userRole === "guest" || userRole === "tourist") && (
        <UserGuide steps={guideSteps} pageName="Checkout" />
      )}
    </div>
  );
}
