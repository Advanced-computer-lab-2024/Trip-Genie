import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Cookies from "js-cookie";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

const PaymentPopup = ({
  isOpen,
  onClose,
  title,
  items,
  onWalletPayment,
  stripeKey,
  onConfirm,
  initialTickets = 1,
  maxTickets = 15,
  priceOne,
  currency,
  returnLoc,
  symbol,
  error,
  availableDates,
  selectedItineraryDate,
  setError,
  selectedTransportID,
  transportationSeats,
  promoDetails,
  setPromoDetails,
  loyaltyPoints,
  onDiscountedTotalChange,
}) => {
  const formatDate = (date) => {
    const localDate = new Date(date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    return `${day}-${month}-${year}`;
  };

  console.log(items);

  // State to keep the date as a string for both display and selection
  const [formattedDate, setFormattedDate] = useState(
    selectedItineraryDate ? formatDate(selectedItineraryDate) : ""
  );

  console.log(items);
  const [paymentType, setPaymentType] = useState("CreditCard");
  const [numberOfTickets, setNumberOfTickets] = useState(initialTickets);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPrice, setTotalPrice] = useState(Number(priceOne));
  const [promoCode, setPromoCode] = useState("");

  const [promoError, setPromoError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountedTotal, setDiscountedTotal] = useState(totalPrice);

  useEffect(() => {
    setTotalPrice(Number(priceOne) * numberOfTickets);
    const newDiscountedTotal = totalPrice - discountAmount;
    setDiscountedTotal(newDiscountedTotal);
    onDiscountedTotalChange(newDiscountedTotal); // Notify parent component of the change
  }, [
    numberOfTickets,
    priceOne,
    discountAmount,
    totalPrice,
    onDiscountedTotalChange,
  ]);

  useEffect(() => {
    if (selectedItineraryDate) {
      setFormattedDate(formatDate(selectedItineraryDate));
    }
  }, [selectedItineraryDate]);

  const handlePromoSubmit = async (e) => {
    if (e) e.preventDefault();
    setPromoError("");
    setPromoDetails(null);
    setDiscountAmount(0);
    setDiscountedTotal(totalPrice);

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
      const discount = totalPrice * (promo.percentOff / 100);
      setDiscountAmount(discount);
      setDiscountedTotal(totalPrice - discount);
    } catch (error) {
      console.error(error);
      setPromoError("Failed to apply promo code. Please try again.");
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);

    // Convert the formattedDate string back to a Date object
    const selectedDate = new Date(formattedDate.split("-").reverse().join("-")); // Convert to Date object

    if (paymentType === "Wallet") {
      onWalletPayment(
        paymentType,
        numberOfTickets,
        selectedDate,
        selectedTransportID,
        promoCode
      ); // Pass the Date object here
    } else {
      try {
        const stripe = await loadStripe(stripeKey);
        if (!stripe) throw new Error("Stripe failed to initialize");

        const payload = {
          items: items.map((item) => ({
            product: { name: item.name },
            quantity: numberOfTickets,
            totalPrice: item.price / 100, // Divide by 100 again
          })),
          currency: currency.toLowerCase(),
          returnLocation: returnLoc,
          quantity: numberOfTickets,
          promoCode,
          discountPercentage: promoDetails?.percentOff || 0,
        };

        // Include the selectedDate only if there are available dates
        if (availableDates && availableDates.length > 0) {
          payload.selectedDate = selectedDate.toISOString(); // Pass the Date object as ISO string
        }

        if (selectedTransportID) {
          payload.selectedTransportID = selectedTransportID; // Pass the Date object as ISO string
        }

        if (loyaltyPoints) {
          payload.loyaltyPoints = loyaltyPoints;
        }

        const response = await fetch(
          "https://trip-genie-apis.vercel.app/create-booking-session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to create checkout session: ${
              errorData.error || response.statusText
            }`
          );
        }

        const { id: sessionId } = await response.json();
        const result = await stripe.redirectToCheckout({ sessionId });

        if (result.error) {
          throw new Error(result.error.message);
        }
      } catch (error) {
        console.error("Error in Stripe checkout:", error);
      }
    }
    setIsProcessing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[425px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{`Booking for`}</DialogTitle>
          <DialogTitle className="text-3xl font-bold text-[#5D9297]">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {availableDates && availableDates.length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="dates" className="text-left font-semibold">
                Select Date
              </Label>
              <Select
                id="dates"
                value={formattedDate} // Use the formatted string date for display and selection
                onValueChange={(value) => {
                  setFormattedDate(value); // Directly update the formatted date string
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    value={formattedDate}
                    placeholder="Choose a date"
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map(({ date, _id }) => (
                    <SelectItem key={_id} value={formatDate(date)}>
                      {formatDate(date)} {/* Display formatted date */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="tickets" className="text-left font-semibold">
              {transportationSeats ? "Seats" : "Tickets"}
            </Label>
            <Input
              id="tickets"
              type="number"
              value={numberOfTickets}
              onChange={(e) =>
                setNumberOfTickets(
                  Math.min(
                    transportationSeats || maxTickets,
                    Math.max(1, parseInt(e.target.value))
                  )
                )
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="promoCode" className="text-left font-semibold">
              Promo Code
            </Label>
            <div className="flex gap-2">
              <Input
                id="promoCode"
                type="text"
                value={promoCode}
                className="w-4/5"
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <Button
                onClick={handlePromoSubmit}
                className="bg-[#B5D3D1] hover:bg-[#1A3B47]/90 text-white w-1/5"
              >
                Apply
              </Button>
            </div>
            {promoError && (
              <div className="text-red-500 text-sm mt-2">{promoError}</div>
            )}
            {promoDetails && (
              <div className="text-green-600 text-sm mt-2">
                Congratulations! You've saved {promoDetails.percentOff}% on this
                purchase!
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label className="text-left font-semibold">Total Price</Label>
            <div className="text-xl text-right">
              {symbol}
              {discountedTotal.toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Label className="text-left font-semibold">Payment Type</Label>
            <RadioGroup value={paymentType} onValueChange={setPaymentType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CreditCard" id="credit" />
                <Label htmlFor="CreditCard">Credit Card/Debit Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Wallet" id="Wallet" />
                <Label htmlFor="Wallet">Wallet</Label>
              </div>
            </RadioGroup>
          </div>

          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              setError("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              isProcessing ||
              (availableDates && availableDates.length > 0 && !formattedDate)
            }
            className="w-full sm:w-auto bg-[#1A3B47] hover:bg-[#1A3B47]/90 text-white"
          >
            {isProcessing ? "Processing..." : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentPopup;
