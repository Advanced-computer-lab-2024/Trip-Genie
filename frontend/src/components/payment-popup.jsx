import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  currency
}) => {
  const [paymentType, setPaymentType] = useState('credit');
  const [numberOfTickets, setNumberOfTickets] = useState(initialTickets);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPrice, setTotalPrice] = useState(priceOne);

  useEffect(() => {
    setTotalPrice(priceOne * numberOfTickets);
  }, [numberOfTickets]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    if (paymentType === 'wallet') {
      onWalletPayment();
    } else {
      try {
        const stripe = await loadStripe(stripeKey);
        if (!stripe) throw new Error('Stripe failed to initialize');

        const response = await fetch("http://localhost:4000/create-booking-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map(item => ({
              product: { name: item.name },
              quantity: numberOfTickets,
              totalPrice: (item.price) / 100, // divide by 100 again
            })),
            currency: currency.toLowerCase(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to create checkout session: ${errorData.error || response.statusText}`);
        }

        const { id: sessionId } = await response.json();
        const result = await stripe.redirectToCheckout({ sessionId });

        if (result.error) {
          throw new Error(result.error.message);
        }
      } catch (error) {
        console.error("Error in Stripe checkout:", error);
        // Handle error (e.g., show error message to user)
      }
    }
    setIsProcessing(false);
    onConfirm(paymentType, numberOfTickets);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tickets" className="text-right">
              Tickets
            </Label>
            <Input
              id="tickets"
              type="number"
              value={numberOfTickets}
              onChange={(e) => setNumberOfTickets(Math.min(maxTickets, Math.max(1, parseInt(e.target.value))))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Total Price</Label>
            <div className="col-span-3 font-medium">
              {totalPrice} {currency}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Payment Type</Label>
            <RadioGroup
              value={paymentType}
              onValueChange={setPaymentType}
              className="col-span-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit" id="credit" />
                <Label htmlFor="credit">Credit Card/Debit Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet">Wallet</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Confirm Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentPopup;

