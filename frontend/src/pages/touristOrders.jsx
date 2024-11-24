'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { format, isValid } from 'date-fns'
import axios from 'axios'
import { Link } from 'react-router-dom';

import Cookies from 'js-cookie'
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { useNavigate } from "react-router-dom";


export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [userRole, setUserRole] = useState('guest')
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null)
  const [rates, setRates] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState(null)
  const ordersPerPage = 6

  const navigate = useNavigate();
  const { toast } = useToast();



  useEffect(() => {
    fetchUserInfo()
    fetchRates()
    fetchOrders()
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
        const currencyId = response.data.preferredCurrency

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

  const handleCancelConfirm = (orderId) => {
    setOrderToCancel(orderId)
    setCancelConfirmOpen(true)
  }

  const handleCancel = async (orderId) => {
    if (!orderToCancel) return
    try {
      const token = Cookies.get("jwt")
      const response = await axios.put(`http://localhost:4000/tourist/cancelPurchase/${orderToCancel}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log("Order canceled:", response.data)
      fetchOrders()
      toast({
        title: "Order Cancelled",
        description: "Your order has been successfully cancelled.",
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel the order. Please try again.",
        duration: 3000,
        variant: "destructive",
      })
      console.error("Error canceling order:", error)
    } finally {
      setCancelConfirmOpen(false)
      setOrderToCancel(null)
    }
  }

  const handleProductClick = (product) => {
    console.log(product.isDeleted);
    if (product.isDeleted) {
      toast({
        title: "Product Unavailable",
        description: "This product is currently unavailable.",
        duration: 3000,
      })
    } else {
      navigate(`/product/${product._id}`);    }
  }

  const fetchRates = async () => {
    try {
      const response = await axios.get("http://localhost:4000/rates")
      setRates(response.data.rates)
    } catch (error) {
      console.error("Error fetching rates:", error)
    }
  }

  const fetchOrders = async () => {
    try {
      const token = Cookies.get("jwt")
      const response = await axios.get("http://localhost:4000/tourist/purchase", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const displayPrice = (priceUSD) => {
    if (!userPreferredCurrency) return `$${priceUSD}`
    const rate = rates[userPreferredCurrency.code]
    return `${userPreferredCurrency.symbol}${(priceUSD * rate).toFixed(2)}`
  }

  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase()
    const matchesFilter = filter === 'all' || order.status === filter
    const matchesSearch = searchQuery === '' || 
      order.products.some(item => 
        item.product?.name?.toLowerCase().includes(searchLower)
      ) ||
      order.deliveryType.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower)
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-[#F88C33] text-white'
      case 'delivered':
        return 'bg-[#5D9297] text-white'
      case 'cancelled':
        return 'bg-gray-300 text-[#1A3B47]'
      default:
        return 'bg-gray-100 text-[#1A3B47]'
    }
  }

  const getOrderIdentifier = (index) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const number = Math.floor(index / 26) + 1
    const letter = letters[index % 26]
    return `${letter}${number}`
  }

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder)
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        </div>
      </div>
      <div className="container mx-auto p-6">
      <Toaster />
      <h1 className="text-5xl font-bold mb-3 text-[#1A3B47]">Orders</h1>
        <div className="flex justify-between items-center mb-6">
        <div className='mr-2' >
  <button 
    onClick={() => setFilter('all')} 
    className={`px-4 py-2 mr-2 rounded ${filter === 'all' ? 'bg-[#388A94] text-white' : 'bg-white text-black'}`}>
    All
  </button>
  <button 
    onClick={() => setFilter('pending')} 
    className={`px-4 py-2 mr-2 rounded ${filter === 'pending' ? 'bg-[#388A94] text-white' : 'bg-white text-black'}`}>
    Pending
  </button>
  <button 
    onClick={() => setFilter('delivered')} 
    className={`px-4 py-2 mr-2 rounded ${filter === 'delivered' ? 'bg-[#388A94] text-white' : 'bg-white text-black'}`}>
    Delivered
  </button>
  <button 
    onClick={() => setFilter('cancelled')} 
    className={`px-4 py-2 mr-2 rounded ${filter === 'cancelled' ? 'bg-[#388A94] text-white' : 'bg-white text-black'}`}>
    Cancelled
  </button>
</div>

          
          <div className="relative w-[350px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="    Search products, delivery type, or status..."
              className="pl-9 border-[#B5D3D1]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-[#1A3B47]">No orders found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentOrders.map((order, index) => (
              <Card key={order._id} className="bg-white w-full">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="bg-[#B5D3D1] text-[#1A3B47] font-bold text-2xl px-3 py-2 rounded">
                        {getOrderIdentifier(index)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-medium">{order.deliveryType}</span>
                        <span className="text-xs text-muted-foreground">Order #{order._id.slice(-5)}</span>
                      </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-base font-medium ${getStatusColor(order.status)}`}>
                      {order.status === 'pending' ? 'Pending' : 
                       order.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 text-base text-muted-foreground">
                  <span>
  {order.status === 'delivered' 
    ? `Delivered on ${format(new Date(order.deliveryDate), 'EEE, MMM dd, yyyy')}` // Show delivered date if delivered
    : `Purchased on ${format(new Date(order.purchaseDate), 'EEE, MMM dd, yyyy')}`} 
</span>

<span>
  {order.status === 'delivered' 
    ? `at ${format(new Date(order.deliveryDate), 'hh:mm a')}` // Show delivery time if delivered
    : `at ${format(new Date(order.purchaseDate), 'hh:mm a')}`} 
</span>

</div>

                </CardHeader>
                
                <CardContent className="border-y border-[#B5D3D1]">
                  <div className="grid grid-cols-[1fr,auto,auto] gap-4 mb-2 mt-2 text-sm text-muted-foreground">
                    <span>Items</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Price</span>
                  </div>
                  <div className="space-y-2 min-h-[120px] relative">
                {order.products.slice(0, 3).map((item, idx) => (
                  <div 
                    key={idx} 
                    className="grid grid-cols-[1fr,auto,auto] gap-4 items-center cursor-pointer hover:bg-gray-100"
                    onClick={() => handleProductClick(item.product)}
                  >
                    <span className="text-base break-words">{item.product.name}</span>
                    <span className="text-sm text-center text-gray-500">x{item.quantity}</span>
                    <span className="text-sm text-right">{displayPrice(item.product.price * item.quantity)}</span>
                  </div>
                    ))}
                    {order.products.length >= 3 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent flex items-end justify-center">
                        {order.products.length > 3 && (
                        <span className="text-sm text-[#388A94] font-medium">
                          +{order.products.length - 3} more items
                        </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col gap-4 pt-4">
  <div className="flex justify-between items-center w-full">
    <span className="text-base font-semibold">Total</span>
    <span className="text-lg font-semibold">{displayPrice(order.totalPrice)}</span>
  </div>
  
  <div className="flex gap-2 w-full">
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="flex-1 text-base bg-gray-200 text-[#388A94] hover:bg-gray-300"
                      onClick={() => setSelectedOrder(order)}
                    >
                      See Details
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-[800px] max-h-[80vh] p-6 bg-white rounded-lg shadow-lg overflow-y-auto">
                    {selectedOrder && (
                      <>
                        <DialogHeader className="space-y-2">
                          <DialogTitle className="text-2xl font-bold">Order Details</DialogTitle>
                          <DialogDescription className="text-lg text-gray-500">
                            Order #{selectedOrder._id.slice(-5)} • Purchased on {format(new Date(selectedOrder.purchaseDate), 'EEE, MMM dd, yyyy')}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="py-6">
                          {/* Products and Total Section */}
                          <div className="bg-gray-50 rounded-md shadow-sm p-4">
                            <h3 className="text-2xl font-semibold mb-4">Products</h3>

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
{selectedOrder.products.map((item, idx) => (
                                <div 
                                  key={idx}
                                  className="bg-white p-3 rounded-md shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                                  onClick={() => handleProductClick(item.product)}
                                >
                                  <p className="font-medium">{item.product.name}</p>
                                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                  <p className="text-sm font-semibold mt-1">{displayPrice(item.product.price * item.quantity)}</p>
                                </div>
  ))}
</div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                              <span className="text-2xl font-semibold">Total</span>
                              <span className="text-2xl font-bold">{displayPrice(selectedOrder.totalPrice)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                          {/* Order Info Card */}
                          <div className="bg-gray-100 p-4 rounded-md shadow-sm">
                            <h3 className="text-2xl font-semibold mb-4">Order Information</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-label text-xl font-semibold">Status:</span>
                              <span
                                className={`font-semibold text-xl text-value ${
                                  selectedOrder?.status?.toLowerCase()?.trim() === 'delivered'
                                    ? 'text-[#388A94]'
                                    : selectedOrder?.status?.toLowerCase()?.trim() === 'cancelled'
                                    ? 'text-[#1A3B47]'
                                    : selectedOrder?.status?.toLowerCase()?.trim() === 'pending'
                                    ? 'text-[#F88C33]'
                                    : 'text-[#B5D3D1]'
                                }`}
                              >
                                {selectedOrder?.status?.toLowerCase()?.trim() === 'delivered'
                                  ? 'Delivered'
                                  : selectedOrder?.status?.toLowerCase()?.trim() === 'cancelled'
                                  ? 'Cancelled'
                                  : selectedOrder?.status?.toLowerCase()?.trim() === 'pending'
                                  ? 'Pending'
                                  : 'Unknown Status'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-label font-semibold">Delivery Type:</span>
                              <span className="text-value">{selectedOrder.deliveryType}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-label font-semibold">Delivery Date:</span>
                              <span className="text-value">
                                {isValid(new Date(selectedOrder.deliveryDate)) 
                                  ? format(new Date(selectedOrder.deliveryDate), 'EEE, MMM dd, yyyy') 
                                  : 'Invalid Delivery Date'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-label font-semibold">Delivery Time:</span>
                              <span className="text-value">{selectedOrder.deliveryTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-label font-semibold">Payment Method:</span>
                              <span className="text-value">{selectedOrder.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                            </div>
                          </div>

                          {/* Shipping Info Card */}
                          {selectedOrder.shippingAddress && (
                            <div className="bg-gray-100 p-4 rounded-md shadow-sm">
                              <h3 className="text-2xl font-semibold mb-4">Shipping Information</h3>
                              <div className="text-value">
                                <p><strong>Street Name:</strong> {selectedOrder.shippingAddress?.split(',')[0]?.split(':')[1]?.trim()}</p>
                                <p><strong>Street Number:</strong> {selectedOrder.shippingAddress?.split(',')[1]?.split(':')[1]?.trim()}</p>
                                <p><strong>Floor/Unit:</strong> {selectedOrder.shippingAddress?.split(',')[2]?.split(':')[1]?.trim()}</p>
                                <p><strong>State:</strong> {selectedOrder.shippingAddress?.split(',')[3]?.split(':')[1]?.trim()}</p>
                                <p><strong>City:</strong> {selectedOrder.shippingAddress?.split(',')[4]?.split(':')[1]?.trim()}</p>
                                <p><strong>Postal Code:</strong> {selectedOrder.shippingAddress?.split(',')[5]?.split(':')[1]?.trim()}</p>
                                <p><strong>Landmark:</strong> {selectedOrder.shippingAddress?.split(',')[6]?.split(':')[1]?.trim()}</p>
                              </div>
                              {/* Delivered To Section */}
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold text-gray-700">Delivered To:</span>
                                <span className="text-lg text-gray-900">{selectedOrder.locationType}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sticky Close Button */}
                        <div className="sticky -bottom-6 bg-white py-4 border-t flex justify-end gap-4 z-10">
                          <Button className="bg-gray-300 text-gray-700 hover:bg-gray-400" onClick={() => setIsOpen(false)}>
                            Close
                          </Button>
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
    
    {order.status === 'pending' && (
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
          <div className="flex justify-center mt-8 gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-[#388A94] text-white hover:bg-[#2e6b77]"
            >
              Previous
            </Button>
            <span className="flex items-center px-4 py-2 bg-white rounded-md">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-[#388A94] text-white hover:bg-[#2e6b77]"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelConfirmOpen(false)}>
              No, keep order
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Yes, cancel order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}