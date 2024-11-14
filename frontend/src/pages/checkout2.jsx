'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Edit2, PlusCircle, ChevronRight } from 'lucide-react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { format, addDays } from 'date-fns'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  deliveryDate: z.string().refine(
    (date) => new Date(date) > new Date(),
    "Delivery date must be in the future"
  ),
  deliveryTime: z.string().min(1, "Delivery time is required"),
  deliveryType: z.string().min(1, "Delivery type is required"),
  paymentMethod: z.enum(["credit_card", "debit_card", "wallet", "cash_on_delivery"], {
    required_error: "Payment method is required",
  }),
  selectedCard: z.string().optional().refine((val) => val && val.length > 0, {
    message: "Please select a card",
    path: ["selectedCard"],
  }),
})

export default function CheckoutPage() {
  const [activeSection, setActiveSection] = useState('personal')
  const [userRole, setUserRole] = useState('tourist')
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null)
  const [exchangeRates, setExchangeRates] = useState({})
  const [currencySymbol, setCurrencySymbol] = useState({})
  const [cartItems, setCartItems] = useState([])
  const [savedCards, setSavedCards] = useState([])
  const [savedAddresses, setSavedAddresses] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddCardForm, setShowAddCardForm] = useState(false)
  const [showSavedAddresses, setShowSavedAddresses] = useState(false)
  const [showSavedCards, setShowSavedCards] = useState(false)
  const [addressDetails, setAddressDetails] = useState({
    streetName: '',
    streetNumber: '',
    floorUnit: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    landmark: '',
    locationType: '',
    default: false,
  })
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    holderName: '',
    cvv: '',
    cardType: '',
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseStatus, setPurchaseStatus] = useState(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)

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
      deliveryDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      deliveryTime: "",
      deliveryType: "",
      paymentMethod: "",
      selectedCard: "",
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
        setSavedAddresses(userData.shippingAddresses || [])

        // Set default address if available
        const defaultAddress = userData.shippingAddresses?.find(addr => addr.default)
        if (defaultAddress) {
          Object.keys(defaultAddress).forEach(key => {
            if (key !== 'default') {
              form.setValue(key, defaultAddress[key])
            }
          })
        }

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

  const handleAddNewAddress = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const token = Cookies.get("jwt")
      const response = await axios.post(
        "http://localhost:4000/tourist/addAddress",
        addressDetails,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      
      if (response.status === 200) {
        const userResponse = await axios.get("http://localhost:4000/tourist/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSavedAddresses(userResponse.data.shippingAddresses || [])
        
        setShowAddForm(false)
        Object.keys(addressDetails).forEach(key => {
          form.setValue(key, addressDetails[key])
        })
      }
    } catch (error) {
      console.error("Error adding new address:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNewCard = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const token = Cookies.get("jwt")
      const response = await axios.post(
        "http://localhost:4000/tourist/addCard",
        cardDetails,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      
      if (response.status === 200) {
        const userResponse = await axios.get("http://localhost:4000/tourist/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSavedCards(userResponse.data.cards || [])
        
        setShowAddCardForm(false)
        form.setValue("paymentMethod", cardDetails.cardType === "Credit Card" ? "credit_card" : "debit_card")
        form.setValue("selectedCard", cardDetails.cardNumber)
      }
    } catch (error) {
      console.error("Error adding new card:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data) => {
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
          paymentMethod: data.paymentMethod,
          selectedCard: data.selectedCard,
          shippingAddress: `${data.streetNumber} ${data.streetName}, ${data.city}, ${data.state} ${data.postalCode}`,
          locationType: data.locationType,
          deliveryType: data.deliveryType,
          deliveryTime: data.deliveryTime,
          deliveryDate: data.deliveryDate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message)
      }

      setPurchaseStatus('success')
      setIsStatusDialogOpen(true)
      emptyCart()
    } catch (error) {
      console.error('Error making purchase:', error)
      setPurchaseStatus('error')
      setIsStatusDialogOpen(true)
    }
  }

  const emptyCart = async () => {
    try {
      setCartItems([])

      const token = Cookies.get("jwt")
      const emptyCartResponse = await fetch("http://localhost:4000/tourist/empty/cart", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (emptyCartResponse.ok) {
        console.log('Cart emptied successfully.')
      } else {
        console.error('Failed to empty the cart.')
      }
    } catch (error) {
      console.error('Error emptying cart items:', error)
    }
  }

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? '' : section)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setAddressDetails(prev => ({ ...prev, [name]: checked }))
    } else {
      setAddressDetails(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleCardInputChange = (e) => {
    const { name, value } = e.target
    setCardDetails(prev => ({ ...prev, [name]: value }))
  }

  const resetAddressDetails = () => {
    setAddressDetails({
      streetName: '',
      streetNumber: '',
      floorUnit: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      landmark: '',
      locationType: '',
      default: false,
    })
  }

  const resetCardDetails = () => {
    setCardDetails({
      cardNumber: '',
      expiryDate: '',
      holderName: '',
      cvv: '',
      cardType: '',
    })
  }

  const handleNextSection = (currentSection) => {
    const sections = ['personal', 'address', 'payment', 'delivery']
    const currentIndex = sections.indexOf(currentSection)
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1])
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-6">
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />
      </div>
      <div className="max-w-6xl mx-auto pt-6">
        <h1 className="text-4xl font-bold mb-8 text-center text-[#1A3B47]">Checkout</h1>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-2/3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="bg-white">
                  <CardContent className="p-6">
                    {/* Personal Details Section */}
                    <div className="mb-6">
                      <div 
                        className="flex justify-between items-center cursor-pointer" 
                        onClick={() => toggleSection('personal')}
                      >
                        <h2 className="text-2xl font-bold text-[#1A3B47]">Personal Details</h2>
                        {activeSection === 'personal' ? <ChevronUp /> : <ChevronDown />}
                      </div>
                      {activeSection === 'personal' && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <Label>First Name</Label>
                            <p>{form.watch('firstName')}</p>
                          </div>
                          <div>
                            <Label>Last Name</Label>
                            <p>{form.watch('lastName')}</p>
                          </div>
                          <div>
                            <Label>Email</Label>
                            <p>{form.watch('email')}</p>
                          </div>
                          <div>
                            <Label>Mobile</Label>
                            <p>{form.watch('phone')}</p>
                          </div>
                          <Button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); handleNextSection('personal'); }}
                            className="col-span-2 mt-4 bg-[#B5D3D1] hover:bg-[#5D9297] text-[#1A3B47]"
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Address Section */}
                    <div className="mb-6">
                      <div 
                        className="flex justify-between items-center cursor-pointer" 
                        onClick={() => toggleSection('address')}
                      >
                        <h2 className="text-2xl font-bold text-[#1A3B47]">Delivery Address</h2>
                        {activeSection === 'address' ? <ChevronUp /> : <ChevronDown />}
                      </div>
                      {activeSection === 'address' && (
                        <div className="mt-4">
                          {savedAddresses.length > 0 && (
                            <div className="mb-4">
                              <h3 className="font-semibold mb-2">Default Address</h3>
                              <div className="flex justify-between items-center">
                                <p>{`${savedAddresses[0].locationType} ${savedAddresses[0].streetNumber} ${savedAddresses[0].streetName}, ${savedAddresses[0].city}`}</p>
                                <div className="flex items-center">
                                  <button onClick={(e) => { e.preventDefault(); setShowSavedAddresses(true); }} className="text-[#388A94] hover:underline mr-4">Change</button>
                                  <Popover>
                                    <PopoverTrigger>
                                      <ChevronRight className="cursor-pointer" />
                                    </PopoverTrigger>
                                    <PopoverContent>
                                      <h4 className="font-bold mb-2">{savedAddresses[0].locationType}</h4>
                                      <p>{savedAddresses[0].streetNumber} {savedAddresses[0].streetName}</p>
                                      <p>{savedAddresses[0].city}, {savedAddresses[0].state} {savedAddresses[0].postalCode}</p>
                                      <p>{savedAddresses[0].country}</p>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            </div>
                          )}
                          <button onClick={(e) => { e.preventDefault(); setShowAddForm(true); }} className="text-[#388A94] hover:underline">Add New</button>
                          
                          {showSavedAddresses && (
                            <Dialog open={showSavedAddresses} onOpenChange={setShowSavedAddresses}>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Saved Addresses</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {savedAddresses.map((address, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                      <div>
                                        <p className="font-semibold">{address.locationType}</p>
                                        <p>{address.streetNumber} {address.streetName}, {address.city}</p>
                                      </div>
                                      <Button onClick={() => {
                                        Object.keys(address).forEach(key => {
                                          if (key !== 'default') {
                                            form.setValue(key, address[key])
                                          }
                                        })
                                        setShowSavedAddresses(false)
                                      }}>
                                        Select
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {showAddForm && (
                            <form onSubmit={handleAddNewAddress} className="mt-4 border border-gray-300 rounded-md p-4 bg-white">
                              <h3 className="text-lg font-semibold mb-4">Add New Address</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="streetName">Street Name</Label>
                                  <Input
                                    id="streetName"
                                    name="streetName"
                                    value={addressDetails.streetName}
                                    onChange={handleInputChange}
                                    className={errors.streetName ? 'border-red-500' : ''}
                                  />
                                  {errors.streetName && <span className="text-red-500 text-sm">{errors.streetName}</span>}
                                </div>
                                <div>
                                  <Label htmlFor="streetNumber">Street Number</Label>
                                  <Input
                                    id="streetNumber"
                                    name="streetNumber"
                                    value={addressDetails.streetNumber}
                                    onChange={handleInputChange}
                                    className={errors.streetNumber ? 'border-red-500' : ''}
                                  />
                                  {errors.streetNumber && <span className="text-red-500 text-sm">{errors.streetNumber}</span>}
                                </div>
                                <div>
                                  <Label htmlFor="floorUnit">Floor/Unit</Label>
                                  <Input
                                    id="floorUnit"
                                    name="floorUnit"
                                    value={addressDetails.floorUnit}
                                    onChange={handleInputChange}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="city">City</Label>
                                  <Input
                                    id="city"
                                    name="city"
                                    value={addressDetails.city}
                                    onChange={handleInputChange}
                                    className={errors.city ? 'border-red-500' : ''}
                                  />
                                  {errors.city && <span className="text-red-500 text-sm">{errors.city}</span>}
                                </div>
                                <div>
                                  <Label htmlFor="state">State</Label>
                                  <Input
                                    id="state"
                                    name="state"
                                    value={addressDetails.state}
                                    onChange={handleInputChange}
                                    className={errors.state ? 'border-red-500' : ''}
                                  />
                                  {errors.state && <span className="text-red-500 text-sm">{errors.state}</span>}
                                </div>
                                <div>
                                  <Label htmlFor="postalCode">Postal Code</Label>
                                  <Input
                                    id="postalCode"
                                    name="postalCode"
                                    value={addressDetails.postalCode}
                                    onChange={handleInputChange}
                                    className={errors.postalCode ? 'border-red-500' : ''}
                                  />
                                  {errors.postalCode && <span className="text-red-500 text-sm">{errors.postalCode}</span>}
                                </div>
                                <div>
                                  <Label htmlFor="country">Country</Label>
                                  <Input
                                    id="country"
                                    name="country"
                                    value={addressDetails.country}
                                    onChange={handleInputChange}
                                    className={errors.country ? 'border-red-500' : ''}
                                  />
                                  {errors.country && <span className="text-red-500 text-sm">{errors.country}</span>}
                                </div>
                                <div>
                                  <Label htmlFor="landmark">Landmark</Label>
                                  <Input
                                    id="landmark"
                                    name="landmark"
                                    value={addressDetails.landmark}
                                    onChange={handleInputChange}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label htmlFor="locationType">Location Type</Label>
                                  <Select name="locationType" value={addressDetails.locationType} onValueChange={(value) => handleInputChange({ target: { name: 'locationType', value } })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select location type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="home">Home</SelectItem>
                                      <SelectItem value="work">Work</SelectItem>
                                      <SelectItem value="apartment">Apartment</SelectItem>
                                      <SelectItem value="friend_family">Friend/Family</SelectItem>
                                      <SelectItem value="po_box">PO Box</SelectItem>
                                      <SelectItem value="office">Office</SelectItem>
                                      <SelectItem value="pickup_point">Pickup Point</SelectItem>
                                      <SelectItem value="vacation">Vacation</SelectItem>
                                      <SelectItem value="school">School</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="col-span-2">
                                  <Label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      name="default"
                                      checked={addressDetails.default}
                                      onChange={handleInputChange}
                                      className="rounded-md"
                                    />
                                    <span>Set as Default Address</span>
                                  </Label>
                                </div>
                              </div>
                              <div className="flex justify-end mt-4">
                                <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); resetAddressDetails(); }} className="mr-2">
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                  {isLoading ? 'Processing...' : 'Submit'}
                                </Button>
                              </div>
                            </form>
                          )}
                          <Button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); handleNextSection('address'); }}
                            className="mt-4 bg-[#B5D3D1] hover:bg-[#5D9297] text-[#1A3B47]"
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Payment Section */}
                    <div className="mb-6">
                      <div 
                        className="flex justify-between items-center cursor-pointer" 
                        onClick={() => toggleSection('payment')}
                      >
                        <h2 className="text-2xl font-bold text-[#1A3B47]">Payment</h2>
                        {activeSection === 'payment' ? <ChevronUp /> : <ChevronDown />}
                      </div>
                      {activeSection === 'payment' && (
                        <div className="mt-4">
                          <RadioGroup defaultValue={form.watch('paymentMethod')} onValueChange={(value) => form.setValue('paymentMethod', value)}>
                            {savedCards.length > 0 && (
                              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                                <RadioGroupItem value="credit_card" id="credit_card" />
                                <Label htmlFor="credit_card">{savedCards[0].cardType} (**** **** **** {savedCards[0].cardNumber.slice(-4)})</Label>
                                <button onClick={(e) => { e.preventDefault(); setShowSavedCards(true); }} className="text-[#388A94] hover:underline ml-auto">Change</button>
                              </div>
                            )}
                            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                              <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                              <Label htmlFor="cash_on_delivery">Cash on Delivery</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                              <RadioGroupItem value="wallet" id="wallet" />
                              <Label htmlFor="wallet">Wallet</Label>
                            </div>
                          </RadioGroup>
                          <button onClick={(e) => { e.preventDefault(); setShowAddCardForm(true); }} className="text-[#388A94] hover:underline mt-4">Add New Card</button>
                          
                          {showSavedCards && (
                            <Dialog open={showSavedCards} onOpenChange={setShowSavedCards}>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Saved Cards</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {savedCards.map((card, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                      <div>
                                        <p className="font-semibold">{card.cardType}</p>
                                        <p>**** **** **** {card.cardNumber.slice(-4)}</p>
                                      </div>
                                      <Button onClick={() => {
                                        form.setValue("paymentMethod", card.cardType === "Credit Card" ? "credit_card" : "debit_card")
                                        form.setValue("selectedCard", card.cardNumber)
                                        setShowSavedCards(false)
                                      }}>
                                        Select
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {showAddCardForm && (
                            <form onSubmit={handleAddNewCard} className="mt-4 border border-gray-300 rounded-md p-4 bg-white">
                              <h3 className="text-lg font-semibold mb-4">Add New Card</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                  <Label htmlFor="cardNumber">Card Number</Label>
                                  <Input
                                    id="cardNumber"
                                    name="cardNumber"
                                    value={cardDetails.cardNumber}
                                    onChange={handleCardInputChange}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="expiryDate">Expiry Date</Label>
                                  <Input
                                    id="expiryDate"
                                    name="expiryDate"
                                    value={cardDetails.expiryDate}
                                    onChange={handleCardInputChange}
                                    placeholder="MM/YY"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="cvv">CVV</Label>
                                  <Input
                                    id="cvv"
                                    name="cvv"
                                    value={cardDetails.cvv}
                                    onChange={handleCardInputChange}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label htmlFor="holderName">Card Holder Name</Label>
                                  <Input
                                    id="holderName"
                                    name="holderName"
                                    value={cardDetails.holderName}
                                    onChange={handleCardInputChange}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label htmlFor="cardType">Card Type</Label>
                                  <Select name="cardType" value={cardDetails.cardType} onValueChange={(value) => handleCardInputChange({ target: { name: 'cardType', value } })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select card type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                                      <SelectItem value="Debit Card">Debit Card</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex justify-end mt-4">
                                <Button type="button" variant="outline" onClick={() => { setShowAddCardForm(false); resetCardDetails(); }} className="mr-2">
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                  {isLoading ? 'Processing...' : 'Add Card'}
                                </Button>
                              </div>
                            </form>
                          )}
                          <Button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); handleNextSection('payment'); }}
                            className="mt-4 bg-[#B5D3D1] hover:bg-[#5D9297] text-[#1A3B47]"
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Delivery Section */}
                    <div className="mb-6">
                      <div 
                        className="flex justify-between items-center cursor-pointer" 
                        onClick={() => toggleSection('delivery')}
                      >
                        <h2 className="text-2xl font-bold text-[#1A3B47]">Delivery</h2>
                        {activeSection === 'delivery' ? <ChevronUp /> : <ChevronDown />}
                      </div>
                      {activeSection === 'delivery' && (
                        <div className="mt-4">
                          <FormField
                            control={form.control}
                            name="deliveryType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Delivery Type</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select delivery type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="standard">Standard Delivery - {formatPrice(5.99)}</SelectItem>
                                      <SelectItem value="express">Express Delivery - {formatPrice(9.99)}</SelectItem>
                                      <SelectItem value="nextday">Next Day Delivery - {formatPrice(14.99)}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={form.control}
                              name="deliveryDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Delivery Date</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      {...field} 
                                      min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                                    />
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
                                  <FormControl>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select time" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                                        <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                                        <SelectItem value="evening">Evening (4 PM - 8 PM)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full bg-[#1A3B47] hover:bg-[#388A94]">
                      Complete Purchase
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div className="w-full md:w-1/3">
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-[#1A3B47] mb-4">Order Summary</h2>
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item?.product?.name} x {item?.quantity}</span>
                      <span>{formatPrice(item?.totalPrice)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold">
                      <span>Subtotal</span>
                      <span>{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>{formatPrice(form.watch('deliveryType') === 'express' ? 9.99 : 5.99)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatPrice(totalAmount + (form.watch('deliveryType') === 'express' ? 9.99 : 5.99))}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {purchaseStatus === 'success' ? 'Purchase Successful!' : 'Purchase Failed'}
            </DialogTitle>
          </DialogHeader>
          <p>
            {purchaseStatus === 'success'
              ? 'Your order has been placed successfully. Thank you for your purchase!'
              : 'There was an error processing your purchase. Please try again or contact support.'}
          </p>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsStatusDialogOpen(false)
                // Navigate to home page
              }}
              className="bg-[#5D9297] hover:bg-[#388A94]"
            >
              Go to Home
            </Button>
            <Button
              onClick={() => {
                setIsStatusDialogOpen(false)
                // Navigate to all products page
              }}
              className="bg-[#1A3B47] hover:bg-[#388A94]"
            >
              Continue Shopping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}