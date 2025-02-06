"use client";

import { useState, useEffect } from "react";
import { Check, ChevronRight, PlusCircle } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import { format, addDays } from "date-fns";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import AddCard from "@/pages/AddCard";
import ShippingAddress from "@/pages/AddShippingAddress";

const personalDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
});

const addressDetailsSchema = z.object({
  streetName: z.string().min(1, "Street name is required"),
  streetNumber: z.string().min(1, "Street number is required"),
  floorUnit: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().optional(),
  landmark: z.string().optional(),
  locationType: z.string().min(1, "Location type is required"),
});

const deliveryDetailsSchema = z.object({
  deliveryDate: z
    .string()
    .refine(
      (date) => new Date(date) > new Date(),
      "Delivery date must be in the future"
    ),
  deliveryTime: z.string().min(1, "Delivery time is required"),
  deliveryType: z.string().min(1, "Delivery type is required"),
});

const paymentDetailsSchema = z.object({
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

const steps = [
  { id: 1, name: "Personal Details" },
  { id: 2, name: "Address Details" },
  { id: 3, name: "Delivery Details" },
  { id: 4, name: "Payment Details" },
  { id: 5, name: "Receipt" },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [userRole, setUserRole] = useState("tourist");
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencySymbol, setCurrencySymbol] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  const personalDetailsForm = useForm({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const addressDetailsForm = useForm({
    resolver: zodResolver(addressDetailsSchema),
    defaultValues: {
      streetName: "",
      streetNumber: "",
      floorUnit: "",
      city: "",
      state: "",
      postalCode: "",
      landmark: "",
      locationType: "",
    },
  });

  const deliveryDetailsForm = useForm({
    resolver: zodResolver(deliveryDetailsSchema),
    defaultValues: {
      deliveryDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      deliveryTime: "",
      deliveryType: "",
    },
  });

  const paymentDetailsForm = useForm({
    resolver: zodResolver(paymentDetailsSchema),
    defaultValues: {
      paymentMethod: "",
      selectedCard: "",
    },
  });

  useEffect(() => {
    fetchUserInfo();
    fetchCart();
  }, []);

  const fetchUserInfo = async () => {
    const role = Cookies.get("role") || "guest";
    setUserRole(role);

    if (role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/",
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const userData = response.data;
        const currencyId = userData.preferredCurrency;
        setSavedCards(userData.cards || []);
        setSavedAddresses(userData.shippingAddresses || []);

        // Set default address if available
        const defaultAddress = userData.shippingAddresses?.find(
          (addr) => addr.default
        );
        if (defaultAddress) {
          Object.keys(defaultAddress).forEach((key) => {
            if (key !== "default") {
              addressDetailsForm.setValue(key, defaultAddress[key]);
            }
          });
        }

        personalDetailsForm.setValue("firstName", userData.fname || "");
        personalDetailsForm.setValue("lastName", userData.lname || "");
        personalDetailsForm.setValue("email", userData.email || "");
        personalDetailsForm.setValue("phone", userData.mobile || "");

        const response2 = await axios.get(
          `https://trip-genie-apis.vercel.app/tourist/getCurrency/${currencyId}`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserPreferredCurrency(response2.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  const handleAddNewAddress = async (addressData) => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.post(
        "https://trip-genie-apis.vercel.app/tourist/addAddress",
        addressData,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        const userResponse = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/",
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSavedAddresses(userResponse.data.shippingAddresses || []);

        setIsAddAddressOpen(false);
        Object.keys(addressData).forEach((key) => {
          addressDetailsForm.setValue(key, addressData[key]);
        });
      }
    } catch (error) {
      console.error("Error adding new address:", error);
    }
  };

  const fetchCart = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/tourist/cart",
        {
          credentials: "include",
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

  const fetchExchangeRate = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `https://trip-genie-apis.vercel.app/${userRole}/populate`,
        {
          method: "POST",
          credentials: "include",
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
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrencySymbol(response.data);
    } catch (error) {
      console.error("Error fetching currency symbol:", error);
    }
  };

  const formatPrice = (price) => {
    const roundedPrice = price;
    if (cartItems.length > 0) {
      if (userRole === "tourist" && userPreferredCurrency) {
        if (userPreferredCurrency._id === cartItems[0].product.currency) {
          return `${userPreferredCurrency.symbol}${roundedPrice}`;
        } else {
          const exchangedPrice = (roundedPrice * exchangeRates).toFixed(2);
          return `${userPreferredCurrency.symbol}${exchangedPrice}`;
        }
      } else {
        if (currencySymbol) {
          return `${currencySymbol.symbol}${roundedPrice}`;
        }
      }
    }
    return `$${roundedPrice}`;
  };

  useEffect(() => {
    if (cartItems.length > 0) {
      if (
        userRole === "tourist" &&
        userPreferredCurrency &&
        userPreferredCurrency._id !== cartItems[0].product.currency
      ) {
        fetchExchangeRate();
      } else {
        getCurrencySymbol();
      }
    }
  }, [userRole, userPreferredCurrency, cartItems]);

  const handleNext = async () => {
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = await personalDetailsForm.trigger();
        if (isValid) {
          setFormData({ ...formData, ...personalDetailsForm.getValues() });
        }
        break;
      case 2:
        isValid = await addressDetailsForm.trigger();
        if (isValid) {
          setFormData({ ...formData, ...addressDetailsForm.getValues() });
        }
        break;
      case 3:
        isValid = await deliveryDetailsForm.trigger();
        if (isValid) {
          setFormData({ ...formData, ...deliveryDetailsForm.getValues() });
        }
        break;
      case 4:
        isValid = await paymentDetailsForm.trigger();
        if (isValid) {
          setFormData({ ...formData, ...paymentDetailsForm.getValues() });
        }
        break;
      case 5:
        isValid = true;
        break;
    }

    if (isValid) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        handlePurchase(formData);
      }
    }
  };

  const handlePurchase = async (data) => {
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
            paymentMethod: data.paymentMethod,
            selectedCard: data.selectedCard,
            shippingAddress: `${data.streetNumber} ${data.streetName}, ${data.floorUnit}, ${data.city}, ${data.state} ${data.postalCode}`,
            locationType: data.locationType,
            deliveryType: data.deliveryType,
            deliveryTime: data.deliveryTime,
            deliveryDate: data.deliveryDate,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      setPurchaseStatus("success");
      setIsStatusDialogOpen(true);
    } catch (error) {
      console.error("Error making purchase:", error);
      setPurchaseStatus("error");
      setIsStatusDialogOpen(true);
    }
  };

  useEffect(() => {
    if (purchaseStatus === "success") {
      emptyCart();
    } else {
      console.error("Failed to complete purchase for some items.");
    }
  }, [purchaseStatus]);

  const emptyCart = async () => {
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
      } else {
        console.error("Failed to empty the cart.");
      }
    } catch (error) {
      console.error("Error emptying cart items:", error);
    }
  };

  const handleAddNewCard = async (cardData) => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.post(
        "https://trip-genie-apis.vercel.app/tourist/addCard",
        cardData,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        // Refetch user cards
        const userResponse = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/",
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSavedCards(userResponse.data.cards || []);

        setIsAddCardOpen(false);
        paymentDetailsForm.setValue(
          "paymentMethod",
          cardData.cardType === "Credit Card" ? "credit_card" : "debit_card"
        );
        paymentDetailsForm.setValue("selectedCard", cardData.cardNumber);
      }
    } catch (error) {
      console.error("Error adding new card:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-6">
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />
      </div>
      <div className="max-w-6xl mx-auto pt-6">
        <h1 className="text-4xl font-bold mb-8 text-center text-[#1A3B47]">
          Checkout
        </h1>
        <div className="flex gap-12">
          {/* Left sidebar with steps */}
          <div className="w-64 bg-white rounded-xl p-4 shadow-md">
            <div className="space-y-8">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center">
                  <div className="relative flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= step.id ? "bg-[#1A3B47]" : "bg-[#B5D3D1]"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-white text-sm">{step.id}</span>
                      )}
                    </div>
                    {step.id < steps.length && (
                      <div className="absolute left-[21%] top-10 h-6 w-0.5 -translate-x-1/2 translate-y-[-15%] bg-[#B5D3D1]" />
                    )}
                  </div>
                  <span className="ml-4 text-[#1A3B47] font-medium">
                    {step?.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1">
            <Card className="p-6 bg-[#B5D3D1]">
              {currentStep === 1 && (
                <Form {...personalDetailsForm}>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-[#1A3B47]">
                        Personal Details
                      </h2>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <FormField
                            control={personalDetailsForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  First Name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="rounded-md mt-1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={personalDetailsForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  Email Address
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="email"
                                    className="rounded-md mt-1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="space-y-4">
                          <FormField
                            control={personalDetailsForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  Last Name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="rounded-md mt-1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={personalDetailsForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  Phone Number
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="tel"
                                    className="rounded-md mt-1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              )}

              {currentStep === 2 && (
                <Form {...addressDetailsForm}>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-[#1A3B47]">
                        Address Details
                      </h2>

                      {savedAddresses.length > 0 && (
                        <FormField
                          control={addressDetailsForm.control}
                          name="selectedAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Saved Addresses</FormLabel>
                              <RadioGroup
                                onValueChange={(value) => {
                                  const address = savedAddresses.find(
                                    (addr) =>
                                      addr.streetNumber ===
                                        value.split("|")[0] &&
                                      addr.streetName === value.split("|")[1]
                                  );
                                  if (address) {
                                    Object.keys(address).forEach((key) => {
                                      if (key !== "default") {
                                        addressDetailsForm.setValue(
                                          key,
                                          address[key]
                                        );
                                      }
                                    });
                                  }
                                }}
                                className="space-y-4"
                              >
                                {savedAddresses.map((address, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-2 bg-white p-4 rounded-xl"
                                  >
                                    <RadioGroupItem
                                      value={`${address.streetNumber}|${address.streetName}`}
                                      id={`address-${index}`}
                                    />
                                    <Label htmlFor={`address-${index}`}>
                                      {`${address.streetNumber} ${address.streetName}, ${address.city}, ${address.state} ${address.postalCode}`}
                                      {address.default && " (Default)"}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormItem>
                          )}
                        />
                      )}

                      <Dialog
                        open={isAddAddressOpen}
                        onOpenChange={setIsAddAddressOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Address
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[2000px] h-[600px]">
                          <DialogHeader>
                            <DialogTitle>Add New Address</DialogTitle>
                          </DialogHeader>
                          <ShippingAddress onClose={handleAddNewAddress} />
                        </DialogContent>
                      </Dialog>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <FormField
                            control={addressDetailsForm.control}
                            name="streetName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  Street Name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="rounded-md mt-1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={addressDetailsForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  City
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="rounded-md mt-1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={addressDetailsForm.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  Postal Code
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="rounded-md mt-1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="space-y-4">
                          <FormField
                            control={addressDetailsForm.control}
                            name="streetNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  Street Number
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="rounded-md mt-1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={addressDetailsForm.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  State
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="rounded-md mt-1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={addressDetailsForm.control}
                            name="locationType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  Location Type
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="rounded-md mt-1">
                                      <SelectValue placeholder="Select location type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="home">Home</SelectItem>
                                    <SelectItem value="work">Work</SelectItem>
                                    <SelectItem value="apartment">
                                      Apartment/Condo
                                    </SelectItem>
                                    <SelectItem value="friend_family">
                                      Friend/Family's Address
                                    </SelectItem>
                                    <SelectItem value="po_box">
                                      PO Box
                                    </SelectItem>
                                    <SelectItem value="office">
                                      Office/Business
                                    </SelectItem>
                                    <SelectItem value="pickup_point">
                                      Pickup Point
                                    </SelectItem>
                                    <SelectItem value="vacation">
                                      Vacation/Temporary Address
                                    </SelectItem>
                                    <SelectItem value="school">
                                      School/University
                                    </SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              )}

              {currentStep === 3 && (
                <Form {...deliveryDetailsForm}>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-[#1A3B47]">
                        Delivery Details
                      </h2>
                      <FormField
                        control={deliveryDetailsForm.control}
                        name="deliveryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Date</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                className="rounded-xl"
                                min={format(
                                  addDays(new Date(), 1),
                                  "yyyy-MM-dd"
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={deliveryDetailsForm.control}
                        name="deliveryTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Time</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select delivery time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="morning">
                                  Morning (8 AM - 12 PM)
                                </SelectItem>
                                <SelectItem value="midday">
                                  Midday (12 PM - 3 PM)
                                </SelectItem>
                                <SelectItem value="afternoon">
                                  Afternoon (3 PM - 6 PM)
                                </SelectItem>
                                <SelectItem value="night">
                                  Night (6 PM - 9 PM)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={deliveryDetailsForm.control}
                        name="deliveryType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select delivery type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Standard">
                                  Standard Shipping (5-7 days) -{" "}
                                  {formatPrice(2.99)}
                                </SelectItem>
                                <SelectItem value="Express">
                                  Express Shipping (2-3 days) -{" "}
                                  {formatPrice(4.99)}
                                </SelectItem>
                                <SelectItem value="Next-Same">
                                  Next/Same Day Shipping - {formatPrice(6.99)}
                                </SelectItem>
                                <SelectItem value="International">
                                  International Shipping - {formatPrice(14.99)}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              )}

              {currentStep === 4 && (
                <Form {...paymentDetailsForm}>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-[#1A3B47]">
                        Payment Details
                      </h2>
                      <FormField
                        control={paymentDetailsForm.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  if (
                                    value !== "credit_card" &&
                                    value !== "debit_card"
                                  ) {
                                    paymentDetailsForm.setValue(
                                      "selectedCard",
                                      ""
                                    );
                                  }
                                }}
                                value={field.value}
                                className="space-y-4"
                              >
                                {savedCards.some(
                                  (card) => card.cardType === "Credit Card"
                                ) && (
                                  <div className="flex items-center space-x-2 bg-white p-4 rounded-xl">
                                    <RadioGroupItem
                                      value="credit_card"
                                      id="credit_card"
                                    />
                                    <Label htmlFor="credit_card">
                                      Credit Card
                                    </Label>
                                  </div>
                                )}
                                {savedCards.some(
                                  (card) => card.cardType === "Debit Card"
                                ) && (
                                  <div className="flex items-center space-x-2 bg-white p-4 rounded-xl">
                                    <RadioGroupItem
                                      value="debit_card"
                                      id="debit_card"
                                    />
                                    <Label htmlFor="debit_card">
                                      Debit Card
                                    </Label>
                                  </div>
                                )}
                                <div className="flex items-center space-x-2 bg-white p-4 rounded-xl">
                                  <RadioGroupItem value="wallet" id="wallet" />
                                  <Label htmlFor="wallet">Wallet</Label>
                                </div>
                                <div className="flex items-center space-x-2 bg-white p-4 rounded-xl">
                                  <RadioGroupItem
                                    value="cash_on_delivery"
                                    id="cash_on_delivery"
                                  />
                                  <Label htmlFor="cash_on_delivery">
                                    Cash on Delivery
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {(paymentDetailsForm.watch("paymentMethod") ===
                        "credit_card" ||
                        paymentDetailsForm.watch("paymentMethod") ===
                          "debit_card") && (
                        <FormField
                          control={paymentDetailsForm.control}
                          name="selectedCard"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select a Card</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a card" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {savedCards
                                    .filter(
                                      (card) =>
                                        card.cardType ===
                                        (paymentDetailsForm.watch(
                                          "paymentMethod"
                                        ) === "credit_card"
                                          ? "Credit Card"
                                          : "Debit Card")
                                    )
                                    .map((card) => (
                                      <SelectItem
                                        key={card.cardNumber}
                                        value={card.cardNumber}
                                      >
                                        **** **** ****{" "}
                                        {card.cardNumber.slice(-4)}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <Dialog
                        open={isAddCardOpen}
                        onOpenChange={setIsAddCardOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Card
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[2000px] h-[600px]">
                          <DialogHeader>
                            <DialogTitle>Add New Card</DialogTitle>
                          </DialogHeader>
                          <AddCard onClose={handleAddNewCard} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </form>
                </Form>
              )}

              {currentStep === 5 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-[#1A3B47]">Receipt</h2>
                  <div className="bg-white rounded-xl p-6 space-y-4">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>
                          {item?.product?.name} x {item?.quantity}
                        </span>
                        <span>{formatPrice(item?.totalPrice)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-4">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatPrice(totalAmount)}</span>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h3 className="font-semibold">Delivery Address:</h3>
                      <p>{`${formData.streetNumber} ${formData.streetName}, ${formData.floorUnit}, ${formData.city}, ${formData.state} ${formData.postalCode}`}</p>
                      <p>Location Type: {formData.locationType}</p>
                    </div>
                    <div className="border-t pt-4">
                      <h3 className="font-semibold">Payment Method:</h3>
                      <p>{formData.paymentMethod}</p>
                      {(formData.paymentMethod === "credit_card" ||
                        formData.paymentMethod === "debit_card") && (
                        <p>**** **** **** {formData.selectedCard.slice(-4)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-4">
                  {purchaseStatus === "success" ? (
                    <Alert variant="default">
                      <AlertTitle>Purchase Successful!</AlertTitle>
                      <AlertDescription>
                        Your order has been placed successfully. Thank you for
                        your purchase!
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTitle>Purchase Failed</AlertTitle>
                      <AlertDescription>
                        There was an error processing your purchase. Please try
                        again or contact support.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      onClick={() => router.push("/")}
                      className="rounded-xl bg-[#5D9297] hover:bg-[#388A94]"
                    >
                      Go to Home
                    </Button>
                    <Button
                      type="button"
                      onClick={() => router.push("/all-products")}
                      className="rounded-xl bg-[#1A3B47] hover:bg-[#388A94]"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-[#5D9297]">
                <div className="flex justify-between">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className="rounded-xl bg-[#5D9297] hover:bg-[#388A94]"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="rounded-xl bg-[#1A3B47] hover:bg-[#388A94]"
                  >
                    {currentStep === 5 ? "Complete Purchase" : "Next"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {purchaseStatus === "success"
                ? "Purchase Successful!"
                : "Purchase Failed"}
            </DialogTitle>
          </DialogHeader>
          <p>
            {purchaseStatus === "success"
              ? "Your order has been placed successfully. Thank you for your purchase!"
              : "There was an error processing your purchase. Please try again or contact support."}
          </p>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsStatusDialogOpen(false);
                navigate("/");
              }}
              className="rounded-xl bg-[#5D9297] hover:bg-[#388A94]"
            >
              Go to Home
            </Button>
            <Button
              onClick={() => {
                setIsStatusDialogOpen(false);
                navigate("/all-products");
              }}
              className="rounded-xl bg-[#1A3B47] hover:bg-[#388A94]"
            >
              Continue Shopping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
