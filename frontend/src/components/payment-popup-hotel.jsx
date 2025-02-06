import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { set } from "date-fns";
import { Input } from "@/components/ui/input";
import Cookies from "js-cookie";

const PaymentPopup = ({
  isBookingConfirmationOpen,
  setIsBookingConfirmationOpen,
  selectedRoom,
  price,
  currencyCode,
  currencySymbol,
  checkinDate,
  checkoutDate,
  numberOfAdults,
  hotelName,
  stripeKey,
  hotelID,
  roomName,
  maxRooms = 10,
  onWalletPayment,
  onError,
  onSuccess,
  returnLocation,
  promo,
  setPromo,
}) => {
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [paymentType, setPaymentType] = useState("CreditCard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPrice, setTotalPrice] = useState(Number(price));
  const [bookingPopupError, setBookingPopupError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountedTotal, setDiscountedTotal] = useState(totalPrice);

  useEffect(() => {
    setTotalPrice(Number(price) * numberOfRooms);
    setDiscountedTotal(totalPrice - discountAmount);
  }, [numberOfRooms, price, discountAmount, totalPrice]);

  const handlePromoSubmit = async (e) => {
    if (e) e.preventDefault();
    setPromoError("");
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
      setPromo(data.promoCode);
      const promo2 = data.promoCode;

      if (promo2.status === "inactive") {
        setPromoError("This promo code is currently inactive.");
        return;
      }

      const currentDate = new Date();
      const startDate = new Date(promo2?.dateRange?.start);
      const endDate = new Date(promo2?.dateRange?.end);

      if (currentDate < startDate || currentDate > endDate) {
        setPromoError("This promo code is not valid for the current date.");
        return;
      }

      if (promo2.timesUsed >= promo2.usage_limit) {
        setPromoError("This promo code has reached its usage limit.");
        return;
      }

      const discount = totalPrice * (promo2.percentOff / 100);
      setDiscountAmount(discount);
      setDiscountedTotal(totalPrice - discount);
    } catch (error) {
      console.error(error);
      setPromoError("Failed to apply promo code. Please try again.");
    }
  };

  const handleConfirmBooking = async () => {
    setIsProcessing(true);
    setBookingPopupError("");

    if (paymentType === "Wallet") {
      try {
        await onWalletPayment(
          "Wallet",
          "10",
          "selectedDateStr",
          hotelID,
          roomName,
          checkinDate,
          checkoutDate,
          numberOfRooms,
          numberOfAdults,
          discountedTotal,
          promo
        );
      } catch (error) {
        setBookingPopupError(error.message);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const stripe = await loadStripe(stripeKey);
      if (!stripe) throw new Error("Stripe initialization failed");

      const payload = {
        hotelID,
        hotelName,
        checkinDate,
        checkoutDate,
        numberOfRooms,
        roomName,
        price: discountedTotal, // Total price for all rooms after discount
        numberOfAdults,
        paymentType,
        returnLocation,
        currency: currencyCode,
        promoCode: promo,
        discountPercentage: promo.percentOff,
      };

      const response = await fetch(
        "https://trip-genie-apis.vercel.app/create-hotel-booking-session",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create booking session");
      }

      const { id: sessionId } = await response.json();
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        throw new Error(result.error.message);
      }

      onSuccess();
    } catch (error) {
      setBookingPopupError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={isBookingConfirmationOpen}
      onOpenChange={setIsBookingConfirmationOpen}
    >
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Booking</DialogTitle>
          <DialogDescription>
            Please confirm your room booking details.
          </DialogDescription>
        </DialogHeader>
        {selectedRoom && (
          <div className="mt-4 space-y-4">
            <p>
              <strong>Room:</strong> {roomName || selectedRoom.name}
            </p>
            {/* <p>
              <strong>Price:</strong>{currencySymbol}{totalPrice.toFixed(2)} 
            </p> */}
            <p>
              <strong>Check-in Date:</strong> {checkinDate}
            </p>
            <p>
              <strong>Check-out Date:</strong> {checkoutDate}
            </p>
            <p>
              <strong>Number of Adults:</strong> {numberOfAdults}
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="numberOfRooms" className="text-md">
                  <strong>Number of Rooms</strong>
                </Label>
                <Select
                  value={numberOfRooms.toString()}
                  onValueChange={(value) => setNumberOfRooms(parseInt(value))}
                >
                  <SelectTrigger id="numberOfRooms">
                    <SelectValue placeholder="Select number of rooms" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxRooms }, (_, i) => i + 1).map(
                      (num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-left text-md">
                  <strong>Payment Type</strong>
                </Label>
                <RadioGroup
                  value={paymentType}
                  onValueChange={setPaymentType}
                  className="col-span-3"
                >
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
              <div>
                <Label htmlFor="promoCode" className="text-right text-md">
                  <strong>Promo Code</strong>
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
                    className="bg-[#1A3B47] hover:bg-[#1A3B47]/90 text-white w-1/5"
                  >
                    Apply
                  </Button>
                </div>
                {promoError && (
                  <div className="text-red-500 text-sm mt-2">{promoError}</div>
                )}
                {discountAmount > 0 && (
                  <div className="text-green-600 text-sm mt-2">
                    Congratulations! You've saved {promo.percentOff}% on this
                    purchase!
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-right mt-10 text-md">
                  <strong>Total Price</strong>
                </Label>
                <div className="text-xl text-right font-semibold">
                  {currencySymbol}
                  {discountedTotal.toFixed(2)}
                </div>
              </div>
              {bookingPopupError && (
                <div className="text-red-500 text-sm mt-2">
                  {bookingPopupError}
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={() => {
              setIsBookingConfirmationOpen(false), setBookingPopupError("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBooking}
            disabled={isProcessing}
            className="bg-[#1A3B47] hover:bg-[#1A3B47]/90 text-white"
          >
            {isProcessing ? "Processing..." : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentPopup;
