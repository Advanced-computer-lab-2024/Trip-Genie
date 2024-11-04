"use client"

import { useState, useEffect } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { format } from 'date-fns'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import AddCard from "@/pages/AddCard"

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  streetName: z.string().min(1, "Street name is required"),
  streetNumber: z.string().min(1, "Street number is required"),
  floorUnit: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().optional(),
  landmark: z.string().optional(),
  locationType: z.string().min(1, "Location type is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  deliveryTime: z.string().min(1, "Delivery time is required"),
  deliveryType: z.string().min(1, "Delivery type is required"),
})

const steps = [
  { id: 1, name: 'Personal Details' },
  { id: 2, name: 'Address Details' },
  { id: 3, name: 'Delivery Details' },
  { id: 4, name: 'Payment Details' },
  { id: 5, name: 'Receipt' }
]

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [userRole, setUserRole] = useState('tourist')
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null)
  const [exchangeRates, setExchangeRates] = useState({})
  const [currencySymbol, setCurrencySymbol] = useState({})
  const [cartItems, setCartItems] = useState([])
  const [savedCards, setSavedCards] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      streetName: "",
      streetNumber: "",
      floorUnit: "",
      city: "",
      state: "",
      postalCode: "",
      landmark: "",
      locationType: "",
      paymentMethod: "",
      deliveryDate: "",
      deliveryTime: "",
      deliveryType: "",
    },
  })

  useEffect(() => {
    fetchUserInfo()
    fetchCart()
  }, [])

  const fetchUserInfo = async () => {
    const role = Cookies.get("role") || "guest"
    setUserRole(role)

    if (role === "tourist") {
      try {
        const token = Cookies.get("jwt")
        const response = await axios.get("http://localhost:4000/tourist/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const userData = response.data
        const currencyId = userData.preferredCurrency
        setSavedCards(userData.cards || [])

        form.setValue("firstName", userData.fname || "")
        form.setValue("lastName", userData.lname || "")
        form.setValue("email", userData.email || "")
        form.setValue("phone", userData.mobile || "")

        const response2 = await axios.get(
          `http://localhost:4000/tourist/getCurrency/${currencyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        setUserPreferredCurrency(response2.data)
      } catch (error) {
        console.error("Error fetching user profile:", error)
      }
    }
  }

  const fetchCart = async () => {
    try {
      const token = Cookies.get("jwt")
      const response = await axios.get("http://localhost:4000/tourist/cart", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCartItems(response.data || [])
      calculateTotal(response.data)
    } catch (error) {
      console.error("Error fetching cart:", error)
    }
  }

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0)
    setTotalAmount(total)
  }

  const fetchExchangeRate = async () => {
    try {
      const token = Cookies.get("jwt")
      const response = await fetch(
        `http://localhost:4000/${userRole}/populate`,
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
      )
      const data = await response.json()

      if (response.ok) {
        setExchangeRates(data.conversion_rate)
      } else {
        console.error("Error in fetching exchange rate:", data.message)
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error)
    }
  }

  const getCurrencySymbol = async () => {
    try {
      const token = Cookies.get("jwt")
      const response = await axios.get(
        `http://localhost:4000/${userRole}/getCurrency/${cartItems[0]?.product.currency}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setCurrencySymbol(response.data)
    } catch (error) {
      console.error("Error fetching currency symbol:", error)
    }
  }

  const formatPrice = (price) => {
    const roundedPrice = price
    if (cartItems.length > 0) {
      if (userRole === "tourist" && userPreferredCurrency) {
        if (userPreferredCurrency._id === cartItems[0].product.currency) {
          return `${userPreferredCurrency.symbol}${roundedPrice}`
        } else {
          const exchangedPrice = (roundedPrice * exchangeRates).toFixed(2)
          return `${userPreferredCurrency.symbol}${exchangedPrice}`
        }
      } else {
        if (currencySymbol) {
          return `${currencySymbol.symbol}${roundedPrice}`
        }
      }
    }
    return `$${roundedPrice}`
  }

  useEffect(() => {
    if (cartItems.length > 0) {
      if (
        userRole === "tourist" &&
        userPreferredCurrency &&
        userPreferredCurrency._id !== cartItems[0].product.currency
      ) {
        fetchExchangeRate()
      } else {
        getCurrencySymbol()
      }
    }
  }, [userRole, userPreferredCurrency, cartItems])

  const handleNext = () => {
    const currentStepData = form.getValues()
    const currentStepSchema = formSchema.pick(Object.keys(currentStepData))
    const result = currentStepSchema.safeParse(currentStepData)

    if (result.success) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1)
      } else {
        handlePurchase(form.getValues())
      }
    } else {
      result.error.issues.forEach((issue) => {
        form.setError(issue.path[0], {
          type: "manual",
          message: issue.message,
        })
      })
    }
  }

  const handlePurchase = async (formData) => {
    try {
      const token = Cookies.get("jwt")
      const products = cartItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      }))

      const response = await fetch("http://localhost:4000/tourist/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          products,
          totalAmount,
          paymentMethod: formData.paymentMethod,
          shippingAddress: `${formData.streetNumber} ${formData.streetName}, ${formData.floorUnit}, ${formData.city}, ${formData.state} ${formData.postalCode}`,
          locationType: formData.locationType,
          deliveryType: formData.deliveryType,
          deliveryTime: formData.deliveryTime,
          deliveryDate: formData.deliveryDate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message)
      }

      // Handle successful purchase
      setCurrentStep(5) // Move to receipt step
    } catch (error) {
      console.error('Error making purchase:', error)
      // Handle error (show error message to user)
    }
  }

  return (
    <div className="min-h-screen bg-white ">
          <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        </div>
      </div>
      <div className="max-w-6xl mx-auto pt-6">
        <h1 className="text-4xl font-bold mb-8 text-center text-[#1A3B47]">Checkout</h1>
        <div className="flex gap-12">
          {/* Left sidebar with steps */}
          <div className="w-64 bg-white rounded-xl p-4 shadow-md">
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center">
                  <div className="relative flex-1">
                    <div
                      className={`w-full h-16 rounded-xl flex items-center justify-center ${
                        currentStep >= step.id ? 'bg-[#1A3B47]' : 'bg-[#B5D3D1]'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-white text-lg">{step.id}</span>
                      )}
                    </div>
                    {step.id < steps.length && (
                      <div className="absolute left-1/2 top-16 h-4 w-0.5 bg-[#B5D3D1]" />
                    )}
                  </div>
                  <span className="ml-4 text-[#1A3B47] font-medium">{step?.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1">
            <Card className="p-6 bg-[#B5D3D1]">
              <Form {...form}>
                <form className="space-y-6">
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-[#1A3B47]">Personal Details</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-[#1A3B47]">Address Details</h2>
                      <FormField
                        control={form.control}
                        name="streetName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="streetNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Number</FormLabel>
                            <FormControl>
                              <Input {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      
                      />
                      <FormField
                        control={form.control}
                        name="floorUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Floor/Unit</FormLabel>
                            <FormControl>
                              <Input {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province/Region</FormLabel>
                            <FormControl>
                              <Input {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal/ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="landmark"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Landmark/Additional Info</FormLabel>
                            <FormControl>
                              <Input {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="locationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select location type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="home">Home</SelectItem>
                                <SelectItem value="work">Work</SelectItem>
                                <SelectItem value="apartment">Apartment/Condo</SelectItem>
                                <SelectItem value="friend_family">Friend/Family's Address</SelectItem>
                                <SelectItem value="po_box">PO Box</SelectItem>
                                <SelectItem value="office">Office/Business</SelectItem>
                                <SelectItem value="pickup_point">Pickup Point</SelectItem>
                                <SelectItem value="vacation">Vacation/Temporary Address</SelectItem>
                                <SelectItem value="school">School/University</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-[#1A3B47]">Delivery Details</h2>
                      <FormField
                        control={form.control}
                        name="deliveryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deliveryTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Time</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select delivery time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                                <SelectItem value="midday">Midday (12 PM - 3 PM)</SelectItem>
                                <SelectItem value="afternoon">Afternoon (3 PM - 6 PM)</SelectItem>
                                <SelectItem value="night">Night (6 PM - 9 PM)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deliveryType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select delivery type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Standard">Standard Shipping (5-7 days) - {formatPrice(2.99)}</SelectItem>
                                <SelectItem value="Express">Express Shipping (2-3 days) - {formatPrice(4.99)}</SelectItem>
                                <SelectItem value="Next-Same">Next/Same Day Shipping - {formatPrice(6.99)}</SelectItem>
                                <SelectItem value="International">International Shipping - {formatPrice(14.99)}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-[#1A3B47]">Payment Details</h2>
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="space-y-4"
                              >
                                <div className="flex items-center space-x-2 bg-white p-4 rounded-xl">
                                  <RadioGroupItem value="debit" id="debit" />
                                  <Label htmlFor="debit">Debit Card</Label>
                                </div>
                                <div className="flex items-center space-x-2 bg-white p-4 rounded-xl">
                                  <RadioGroupItem value="credit" id="credit" />
                                  <Label htmlFor="credit">Credit Card</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {(form.watch("paymentMethod") === "debit" || form.watch("paymentMethod") === "credit") && (
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold text-[#1A3B47]">Select a Card</h3>
                          <RadioGroup defaultValue={savedCards[0]?.cardNumber}>
                            {savedCards.map((card) => (
                              <div key={card.cardNumber} className="flex items-center space-x-2 bg-white p-4 rounded-xl">
                                <RadioGroupItem value={card.cardNumber} id={card.cardNumber} />
                                <Label htmlFor={card.cardNumber}>
                                  {card.cardType} ending in {card.cardNumber.slice(-4)}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                          <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline">Add New Card</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Add New Card</DialogTitle>
                              </DialogHeader>
                              <AddCard onClose={() => setIsAddCardOpen(false)} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-[#1A3B47]">Receipt</h2>
                      <div className="bg-white rounded-xl p-6 space-y-4">
                        {cartItems.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{item?.product?.name} x {item?.quantity}</span>
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
                          <p>{`${form.getValues("streetNumber")} ${form.getValues("streetName")}, ${form.getValues("floorUnit")}, ${form.getValues("city")}, ${form.getValues("state")} ${form.getValues("postalCode")}`}</p>
                          <p>Location Type: {form.getValues("locationType")}</p>
                        </div>
                        <div className="border-t pt-4">
                          <h3 className="font-semibold">Payment Method:</h3>
                          <p>{form.getValues("paymentMethod")}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-6">
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
                      {currentStep === 5 ? 'Complete Purchase' : 'Next'}
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}