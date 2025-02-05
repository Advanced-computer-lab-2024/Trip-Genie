import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import defaultImage from "../assets/images/default-image.jpg";
import Loader from "./Loader.jsx";
import { Star } from "lucide-react";

export function ProductViewer() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState(Cookies.get("role") || "guest");
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencySymbol, setCurrencySymbol] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = Cookies.get("jwt");
        let role = Cookies.get("role") || "guest";
        const response = await axios.get(
          `http://localhost:4000/${role}/products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.data.slice(0, 4);
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
    fetchUserInfo();
  }, []);

  const fetchExchangeRate = async (productCurrency) => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `http://localhost:4000/${userRole}/populate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base: productCurrency,
            target: userPreferredCurrency._id,
          }),
        }
      );
      const data = await response.json();
      // console.log("data mn fetch", data);
      if (response.ok) {
        setExchangeRates((prevRates) => ({
          ...prevRates,
          [productCurrency]: data.conversion_rate,
        }));
      } else {
        console.error("Error in fetching exchange rate:", data.message);
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  };

  const getCurrencySymbol = async (productCurrency) => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `http://localhost:4000/${userRole}/getCurrency/${productCurrency}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrencySymbol(response.data);
    } catch (error) {
      console.error("Error fetching currency symbol:", error);
    }
  };

  const formatPrice = (price, currency) => {
    if (userRole === "tourist" && userPreferredCurrency) {
      // console.log("exchangerates:", exchangeRates);
      // console.log("currency:", currency);
      // console.log("henaaaaaaa", exchangeRates[currency]);
      if (userPreferredCurrency._id === currency) {
        return `${userPreferredCurrency.symbol}${price}`;
      } else if (exchangeRates[currency]) {
        const convertedPrice = price * exchangeRates[currency];
        return `${userPreferredCurrency.symbol}${convertedPrice.toFixed(2)}`;
      }
    } else if (currencySymbol) {
      return `${currencySymbol.symbol}${price}`;
    }
    // return `$${price}`;
  };

  const fetchUserInfo = async () => {
    const role = Cookies.get("role") || "guest";
    setUserRole(role);

    if (role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get("http://localhost:4000/tourist/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currencyId = response.data.preferredCurrency;
        const response2 = await axios.get(
          `http://localhost:4000/tourist/getCurrency/${currencyId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUserPreferredCurrency(response2.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  useEffect(() => {
    products.forEach((product) => {
      if (
        userRole === "tourist" &&
        userPreferredCurrency &&
        userPreferredCurrency._id !== product.currency
      ) {
        // console.log("ba fetch exchange rate", product.currency);
        fetchExchangeRate(product.currency);
        // console.log("exchangerates:", exchangeRates);
      } else {
        // console.log("fetch currency symbol");
        getCurrencySymbol(product.currency);
      }
    });
  }, [userRole, userPreferredCurrency, products]);

  const handleViewAllProducts = () => {
    setIsLoading(true);
    navigate(`/all-products`);
    setIsLoading(false);
  };

  const handleProductClick = (id) => {
    setIsLoading(true);
    navigate(`/product/${id}`);
    setIsLoading(false);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? "text-[#F88C33] fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-24 py-12 flex flex-col md:flex-row">
      {isLoading && <Loader />}
      <div className="w-full md:w-1/3 pr-8 mb-8 md:mb-0">
        <h1 className="text-4xl font-bold text-[#1A3B47] mb-4">Products</h1>
        <p className="text-[#1A3B47] mb-4">
          Discover our unique collection of locally-inspired keepsakes. Each
          item tells a story and celebrates the culture of our vibrant
          destination, making it a perfect gift for yourself or a loved one.
          Bring home a piece of your adventure!
        </p>
        <div className="flex justify-center">
          <div className="relative">
            <button
              onClick={handleViewAllProducts}
              className="bg-[#388A94] hover:bg-[#5D9297] text-white px-8 py-2 rounded-full text-lg font-medium transition-colors duration-300"
            >
              View More
            </button>
          </div>
        </div>
      </div>
      <div className="w-full md:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product._id}
            className="relative overflow-hidden rounded-lg cursor-pointer group h-72"
            onClick={() => handleProductClick(product._id)}
          >
            <img
              src={product.pictures[0]?.url || defaultImage}
              alt={product.name}
              className="w-full h-full object-cover transition duration-300 transform group-hover:-translate-y-8"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-white p-4 transform translate-y-full transition duration-300 group-hover:translate-y-0">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  {"BUY ONLINE"}
                </span>
                <span className="text-lg font-bold">
                  {formatPrice(product.price, product.currency)}
                </span>
              </div>
              <h2 className="text-sm mb-2 truncate">{product.name}</h2>
              <div className="flex justify-between items-center">
                <div className="text-[#F88C33] text-xs">
                  {renderStars(product.rating)}
                </div>
                <span className="text-xs text-gray-600">
                  {product.rating} stars
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
