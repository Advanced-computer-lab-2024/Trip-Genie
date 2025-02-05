"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import axios from "axios";
import * as jwtDecode from "jwt-decode";
import { Search, ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loader from "@/components/Loader.jsx";
import defaultImage from "../assets/images/default-image.jpg";
import historicalPlaceImage from "../assets/images/hp.png";

const HistoricalPlaceCard = ({
  historicalPlace,
  onSelect,
  userRole,
  userPreferredCurrency,
  onDeleteConfirm,
}) => {
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencySymbol, setCurrencySymbol] = useState({});
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (
      userRole === "tourist" &&
      userPreferredCurrency !== historicalPlace.currency
    ) {
      fetchExchangeRate();
    } else {
      getCurrencySymbol();
    }
  }, [userRole, userPreferredCurrency, historicalPlace.currency]);

  const fetchExchangeRate = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `https://trip-genie-apis.vercel.app/${userRole}/populate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base: historicalPlace.currency,
            target: userPreferredCurrency,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setExchangeRates(data.conversion_rate);
      } else {
        console.error("Error in fetching exchange rate:", data.message);
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  };

  const getCurrencySymbol = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/${userRole}/getCurrency/${historicalPlace.currency}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrencySymbol(response.data);
    } catch (error) {
      console.error("Error fetching currency symbol:", error);
    }
  };

  const formatPrice = (price, type) => {
    if (userRole === "tourist") {
      if (userPreferredCurrency._id === historicalPlace.currency._id) {
        return `${userPreferredCurrency.symbol}${price}/Day`;
      } else {
        const exchangedPrice = price * exchangeRates;
        return `${userPreferredCurrency.symbol}${exchangedPrice.toFixed(
          2
        )}/Day`;
      }
    } else {
      return `${currencySymbol.symbol}${price}/Day`;
    }
  };

  useEffect(() => {
    const token = Cookies.get("jwt");
    if (token) {
      const decodedToken = jwtDecode.jwtDecode(token);
      setUserId(decodedToken.id);
    }
  }, []);

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="p-0" onClick={() => onSelect(historicalPlace._id)}>
        <img
          src={historicalPlace.pictures?.[0]?.url || defaultImage}
          alt={historicalPlace.title}
          className="w-full h-40 object-cover"
        />
      </CardHeader>
      <CardContent
        className="p-4"
        onClick={() => onSelect(historicalPlace._id)}
      >
        <CardTitle className="text-lg text-[#1A3B47]">
          {historicalPlace.title}
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2 break-words">
          {historicalPlace.description.length > 70
            ? `${historicalPlace.description.slice(0, 70)}...`
            : historicalPlace.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center border-t">
        <div className="flex flex-col">
          {historicalPlace.ticketPrices?.native && (
            <span className="text-md font-bold text-gray-900">
              Native:{" "}
              {formatPrice(historicalPlace.ticketPrices.native, "native")}
            </span>
          )}
          {historicalPlace.ticketPrices?.student && (
            <span className="text-md font-bold text-gray-900">
              Student:{" "}
              {formatPrice(historicalPlace.ticketPrices.student, "student")}
            </span>
          )}
          {historicalPlace.ticketPrices?.foreigner && (
            <span className="text-md font-bold text-gray-900">
              Foreigner:{" "}
              {formatPrice(historicalPlace.ticketPrices.foreigner, "foreigner")}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {historicalPlace.location.city}, {historicalPlace.location.country}
        </span>
      </CardFooter>
      <div className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {historicalPlace.historicalTag.map((tag, index) => (
            <Badge key={`type-${index}`} variant="secondary">
              {tag.type}
            </Badge>
          ))}
        </div>
      </div>
      {userRole === "tourism-governor" &&
        userId === historicalPlace?.governor && (
          <div className="absolute top-2 right-2 flex space-x-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/update-historical-place/${historicalPlace._id}`;
              }}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              aria-label="Edit Historical Place"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConfirm(historicalPlace._id, historicalPlace.title);
              }}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              aria-label="Delete Historical Place"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
    </Card>
  );
};

export default function MyHistoricalPlacesComponent() {
  const [historicalPlaces, setHistoricalPlaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [userRole, setUserRole] = useState("guest");
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);
  const [typesOptions, setTypesOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [historicalPlaceToDelete, setHistoricalPlaceToDelete] = useState(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const navigate = useNavigate();
  const tripsPerPage = 6;

  const getUserRole = useCallback(() => {
    return Cookies.get("role") || "guest";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchHistoricalPlaces(),
          fetchTypesAndPeriods(),
          fetchUserInfo(),
        ]);
      } catch (error) {
        console.error("Error in fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    searchHistoricalPlaces();
  }, [searchTerm, selectedTypes]);

  const fetchUserInfo = async () => {
    const role = getUserRole();
    setUserRole(role);
    if (role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const currencyId = response.data.preferredCurrency;
        const currencyResponse = await axios.get(
          `https://trip-genie-apis.vercel.app/tourist/getCurrency/${currencyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserPreferredCurrency(currencyResponse.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  const fetchHistoricalPlaces = async () => {
    try {
      const token = Cookies.get("jwt");
      const role = getUserRole();
      const response = await fetch(
        `https://trip-genie-apis.vercel.app/${role}/historical-places?myPlaces=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHistoricalPlaces(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching historical places:", error);
      setError("Error fetching historical places");
      setHistoricalPlaces([]);
    }
  };

  const fetchTypesAndPeriods = async () => {
    try {
      const [typesResponse] = await Promise.all([
        axios.get(
          "https://trip-genie-apis.vercel.app/api/getAllHistoricalTypes"
        ),
      ]);
      setTypesOptions(typesResponse.data);
    } catch (error) {
      console.error("Error fetching types ", error);
    }
  };

  const handleHistoricalPlaceSelect = (id) => {
    navigate(`/historical-place/${id}`);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTypes([]);
    fetchHistoricalPlaces();
  };

  const handleDeleteConfirm = (id, name) => {
    setHistoricalPlaceToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!historicalPlaceToDelete) return;
    setIsLoading(true);
    setDeleteError(null);
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `https://trip-genie-apis.vercel.app/${userRole}/historical-places/${historicalPlaceToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 || response.status === 403) {
          setDeleteError(errorData.message);
          return;
        }
        throw new Error("Failed to delete Historical Place");
      }
      await fetchHistoricalPlaces();
      setShowDeleteSuccess(true);
    } catch (err) {
      setError("Error deleting Historical Place. Please try again later.");
      console.error("Error deleting Historical Place:", err);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setHistoricalPlaceToDelete(null);
    }
  };

  const searchHistoricalPlaces = async () => {
    try {
      const role = getUserRole();
      const url = new URL(
        `https://trip-genie-apis.vercel.app/${role}/historical-places?myPlaces=true`
      );
      if (searchTerm) url.searchParams.append("searchBy", searchTerm);
      if (selectedTypes.length > 0)
        url.searchParams.append("types", selectedTypes.join(","));

      const token = Cookies.get("jwt");
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHistoricalPlaces(data);
      setError(null);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching filtered results:", error);
      setError("Error fetching filtered results");
      setHistoricalPlaces([]);
    }
  };

  const backgroundImage = "url('./src/assets/images/allHP.jpg')";

  return (
    <div className="bg-gray-100">
      <div
        className="relative h-[330px] bg-cover bg-center"
        style={{ backgroundImage }}
      >
        <div className="absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="flex-1">
            <h1 className="text-5xl font-bold text-white mb-4">
              My Historical Places
            </h1>
            <p className="text-gray-200">
              <Link
                to="/"
                className="font-bold text-gray-200 hover:text-gray-300 hover:underline"
              >
                Home
              </Link>{" "}
              / My Historical Places
            </p>
          </div>
        </div>
      </div>
      <div className="container py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className="hidden md:block w-80 h-100 bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A3B47]">Filters</h2>
              <Button
                onClick={clearFilters}
                size="sm"
                className="text-gray-400 hover:text-gray-200 bg-transparent border-none"
              >
                Clear All
              </Button>
            </div>
            {/* Type Filter */}
            <div className="mb-6">
              <h3 className="font-medium text-[#1A3B47] mb-2"> Type</h3>
              <ScrollArea className="h-[150px]">
                {typesOptions.map((type) => (
                  <div
                    key={type._id}
                    className="flex items-center space-x-2 mb-2"
                  >
                    <Checkbox
                      id={`type-${type}`}
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        setSelectedTypes((prev) =>
                          checked
                            ? [...prev, type]
                            : prev.filter((t) => t !== type)
                        );
                      }}
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Featured Historical Places Section */}
            <div className="mt-6">
              <h3 className="font-medium text-[#1A3B47] mb-4">
                Featured Historical Places
              </h3>
              <div className="space-y-4">
                {historicalPlaces && historicalPlaces.length > 0 ? (
                  historicalPlaces.slice(0, 3).map((place) => (
                    <Link
                      key={place._id}
                      to={`/historical-place/${place._id}`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <img
                        src={place.pictures[0]?.url || defaultImage}
                        alt={place.title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div>
                        <h4 className="font-medium text-sm">{place.title}</h4>
                        <p className="text-xs text-gray-500">
                          {place.location.city}, {place.location.country}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No historical places available.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Filter Controls */}
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search historical places..."
                    className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5D9297]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                </div>
                <span className="text-gray-500 text-sm whitespace-nowrap">
                  ({historicalPlaces.length} places)
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <Loader />
            ) : (
              <>
                {/* Historical Places Grid */}
                {historicalPlaces.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {historicalPlaces
                      .slice(
                        (currentPage - 1) * tripsPerPage,
                        currentPage * tripsPerPage
                      )
                      .map((place) => (
                        <HistoricalPlaceCard
                          key={place._id}
                          historicalPlace={place}
                          onSelect={handleHistoricalPlaceSelect}
                          userRole={userRole}
                          userPreferredCurrency={userPreferredCurrency}
                          onDeleteConfirm={handleDeleteConfirm}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-lg text-gray-600">
                      No historical places found.
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {historicalPlaces.length > 0 && (
                  <div className="mt-8 flex justify-center items-center space-x-4">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="icon"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      Page {currentPage} of{" "}
                      {Math.max(
                        1,
                        Math.ceil(historicalPlaces.length / tripsPerPage)
                      )}
                    </span>
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={
                        currentPage ===
                        Math.max(
                          1,
                          Math.ceil(historicalPlaces.length / tripsPerPage)
                        )
                      }
                      variant="outline"
                      size="icon"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Historical Place</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{historicalPlaceToDelete?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Success Dialog */}
      <Dialog open={showDeleteSuccess} onOpenChange={setShowDeleteSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historical Place Deleted</DialogTitle>
            <DialogDescription>
              The historical place has been successfully deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDeleteSuccess(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Error Dialog */}
      <Dialog
        open={deleteError !== null}
        onOpenChange={() => setDeleteError(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{deleteError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeleteError(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
