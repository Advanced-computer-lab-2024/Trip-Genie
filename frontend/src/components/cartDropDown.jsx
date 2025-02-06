"use client";

import { useState, useEffect, useCallback } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";

export default function CartDropdown({
  isOpen = false,
  onClose,
  isCartOpen,
  setIsCartOpen,
  fetchCartItems,
  cartItems,
  setCartItems,
}) {
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencies, setCurrencies] = useState([]);
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [userRole, setUserRole] = useState("guest");
  const navigate = useNavigate();

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
        const currencyId = response.data.preferredCurrency;

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
  }, []);

  const formatPrice = useCallback(
    (price, productCurrency) => {
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
        fetchCartItems();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

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
        }
      );
      if (response.ok) {
        // Directly update cartItems state to remove the item
        setCartItems((prevItems) =>
          prevItems.filter((item) => item.product._id !== productId)
        );
      }
      fetchCartItems();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    fetchExchangeRates();
    fetchCurrencies();
    fetchCartItems();
  }, [fetchUserInfo, fetchExchangeRates, fetchCurrencies, fetchCartItems]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-[100]">
      <div className="relative w-full pt-2">
        <div className="flex justify-between items-center mb-4 w-full border-b border-gray-300 px-4 py-2">
          <h2 className="text-base font-semibold text-black">
            My Cart ({cartItems.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
      </div>

      <div className="pr-4 pl-4 pb-4 flex flex-col">
        {cartItems.length === 0 ? (
          <p className="text-center text-base text-gray-500">
            No products in cart
          </p>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[275px] flex-1">
            {cartItems.slice(0, 3).map((item, index) => (
              <div
                key={item.product._id}
                className={`flex items-center gap-4 p-2 ${
                  index < cartItems.length - 1 ? "border-b" : ""
                }`}
              >
                <div
                  onClick={() => {
                    navigate(`/product/${item.product._id}`);
                    setIsCartOpen(false);
                  }}
                  className="flex-shrink-0 cursor-pointer"
                >
                  <img
                    src={item.product.pictures[0]?.url || "/placeholder.svg"}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span
                        onClick={() => {
                          navigate(`/product/${item.product._id}`);
                          setIsCartOpen(false);
                        }}
                        className="font-semibold text-base text-black cursor-pointer hover:underline"
                      >
                        {item.product.name}
                      </span>
                      <p className="text-xs text-gray-400 font-semibold mt-1">
                        {formatPrice(item.product.price, item.product.currency)}
                      </p>
                    </div>
                    <p className="font-semibold text-lg text-black">
                      {formatPrice(
                        item.product.price * item.quantity,
                        item.product.currency
                      )}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-between w-24 h-8 border border-gray-300 rounded-md">
                        <Button
                          onClick={() =>
                            handleQuantityChange(
                              item.product._id,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-black"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <span className="text-center font-semibold text-black w-8 text-sm">
                          {item.quantity}
                        </span>

                        <Button
                          onClick={() =>
                            handleQuantityChange(
                              item.product._id,
                              item.quantity + 1
                            )
                          }
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-black"
                          disabled={item.quantity >= item.product.quantity}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleRemoveItem(item.product._id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {cartItems.length > 0 && (
          <div className="flex flex-col justify-between w-full mt-4 space-y-4">
            <div className="flex justify-between items-center w-full border-t border-gray-300 px-4 py-2">
              <Button
                className="w-full text-white text-sm font-semibold bg-[#1A3B47] hover:bg-[#14303A] transition duration-300 ease-in-out"
                onClick={() => {
                  navigate("/touristCart");
                  setIsCartOpen(false);
                  onClose();
                }}
              >
                View All
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
