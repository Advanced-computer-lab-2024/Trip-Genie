import React, { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";

const PromoBanner = ({ setPromoMargin }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [promoData, setPromoData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPromoCode = async () => {
      try {
        console.log("fetching promo code");
        const token = Cookies.get("jwt");
        const role = Cookies.get("role");
        if (role !== "tourist") return;
        const api = `https://trip-genie-apis.vercel.app/tourist/promo-codes`;
        const response = await axios.get(api, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const promoCodes = response.data.promoCodes;
        setPromoData(promoCodes[promoCodes.length - 1]);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromoCode();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(promoData.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isVisible || isLoading || error || !promoData) {
    setPromoMargin(0);
    return null;
  } else {
    setPromoMargin(53);
  }

  return (
    <div className="bg-black text-white py-3 px-4 flex items-center justify-between text-sm">
      <div className="flex items-center space-x-4">
        <p className="font-medium">
          Get {promoData.percentOff}% off your next booking or order with code
        </p>
        <code className="bg-white text-black px-2 py-0.5 rounded font-bold">
          {promoData.code}
        </code>
        <button
          className="text-white hover:text-gray-200 p-1 rounded"
          onClick={copyToClipboard}
        >
          {isCopied ? <Check size={16} /> : <Copy size={16} />}
          <span className="sr-only">
            {isCopied ? "Copied" : "Copy promo code"}
          </span>
        </button>
      </div>
      <button
        className="text-white hover:text-gray-200 p-1 rounded"
        onClick={() => setIsVisible(false)}
      >
        <X size={16} />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
};

export default PromoBanner;
