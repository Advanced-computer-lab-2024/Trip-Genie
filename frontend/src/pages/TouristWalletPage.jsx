"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import WalletHistory from "../components/WalletHistory";
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  parseISO,
} from "date-fns";
import {
  Activity,
  ShoppingCart,
  Plane,
  Hotel,
  Calendar,
  Wallet,
  Award,
  Bell,
  ShoppingBasket,
  CheckCircle,
  XCircle,
  Bus,
  Map,
  User,
  Car,
} from "lucide-react";

const TouristWalletPage = () => {
  const [exchangeRates, setExchangeRates] = useState(null);
  const [tourist, setTourist] = useState(null);
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [currencies, setCurrencies] = useState(null);
  const [currencyCode, setCurrencyCode] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(null);

  const fetchCurrencies = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch("http://localhost:4000/tourist/currencies", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch currencies");
      }
      const data = await response.json();
      setCurrencies(data);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  };

  const convertPrice = (price, fromCurrency, toCurrency) => {
    if (!exchangeRates || !fromCurrency || !toCurrency) {
      return price;
    }
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    return ((price * toRate) / fromRate).toFixed(2);
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch("http://localhost:4000/rates");
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      const data = await response.json();
      setExchangeRates(data.rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  };

  const fetchUserInfo = async () => {
    const role = Cookies.get("role") || "guest";
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get("http://localhost:4000/tourist/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTourist(response.data);
      const currencyId = response.data.preferredCurrency;

      const response2 = await axios.get(
        `http://localhost:4000/tourist/getCurrency/${currencyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserPreferredCurrency(response2.data);
      setCurrencyCode(response2.data.code);
      setCurrencySymbol(response2.data.symbol);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    Promise.all([fetchUserInfo(), fetchExchangeRate(), fetchCurrencies()]);
  }, []);

  const getTransactionIcon = (details) => {
    if (details.toLowerCase().includes("activity"))
      return <Activity className="w-6 h-6" />;
    if (details.toLowerCase().includes("itinerary"))
      return <Map className="w-6 h-6" />;
    if (details.toLowerCase().includes("bus"))
      return <Bus className="w-6 h-6" />;
    if (details.toLowerCase().includes("car"))
      return <Car className="w-6 h-6" />;
    if (details.toLowerCase().includes("order"))
      return <ShoppingBasket className="w-6 h-6" />;
    if (details.toLowerCase().includes("flight"))
      return <Plane className="w-6 h-6" />;
    if (details.toLowerCase().includes("hotel"))
      return <Hotel className="w-6 h-6" />;

    return <Wallet className="w-6 h-6" />;
  };

  const groupTransactionsByDate = (transactions) => {
    const grouped = {
      Today: { transactions: [], total: 0, sign: "" },
      Yesterday: { transactions: [], total: 0, sign: "" },
      "This Week": { transactions: [], total: 0, sign: "" },
      "This Month": { transactions: [], total: 0, sign: "" },
      Earlier: {},
    };

    transactions.forEach((transaction) => {
      const date = parseISO(transaction.timestamp);
      const amount =
        transaction.transactionType === "deposit"
          ? transaction.amount
          : -transaction.amount;
      const absAmount = Math.abs(amount); // Use the absolute value for total
      const sign = amount >= 0 ? "positive" : "negative"; // Set the sign based on the transaction type

      if (isToday(date)) {
        grouped.Today.transactions.push(transaction);
        grouped.Today.total += absAmount;
        grouped.Today.sign = sign; // Set the sign for Today
      } else if (isYesterday(date)) {
        grouped.Yesterday.transactions.push(transaction);
        grouped.Yesterday.total += absAmount;
        grouped.Yesterday.sign = sign; // Set the sign for Yesterday
      } else if (isThisWeek(date)) {
        grouped["This Week"].transactions.push(transaction);
        grouped["This Week"].total += absAmount;
        grouped["This Week"].sign = sign; // Set the sign for This Week
      } else if (isThisMonth(date)) {
        grouped["This Month"].transactions.push(transaction);
        grouped["This Month"].total += absAmount;
        grouped["This Month"].sign = sign; // Set the sign for This Month
      } else {
        const monthYear = format(date, "MMMM yyyy");
        if (!grouped.Earlier[monthYear]) {
          grouped.Earlier[monthYear] = { transactions: [], total: 0, sign: "" };
        }
        grouped.Earlier[monthYear].transactions.push(transaction);
        grouped.Earlier[monthYear].total += absAmount;
        grouped.Earlier[monthYear].sign = sign; // Set the sign for Earlier
      }
    });

    // Sort transactions within each group
    Object.keys(grouped).forEach((key) => {
      if (Array.isArray(grouped[key].transactions)) {
        grouped[key].transactions.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
      } else if (typeof grouped[key] === "object") {
        Object.keys(grouped[key]).forEach((subKey) => {
          grouped[key][subKey].transactions.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          );
        });
      }
    });

    return grouped;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Wallet</h1>
      <p className="text-sm text-gray-500 mb-2">
        Settings and Privacy / Wallet History
      </p>
      <WalletHistory
        tourist={tourist}
        currencyCode={currencyCode}
        getTransactionIcon={getTransactionIcon}
        groupTransactionsByDate={groupTransactionsByDate}
        convertCurrency={convertPrice}
        currencySymbol={currencySymbol}
      />{" "}
    </div>
  );
};

export default TouristWalletPage;
