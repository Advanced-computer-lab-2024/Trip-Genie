import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Search, ChevronLeft, ChevronRight, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ItineraryDetail from "./ItineraryDetail.jsx";
import FilterComponent from "./Filter.jsx";
import defaultImage from "../assets/images/default-image.jpg";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Loader from "./Loader.jsx";
import { Button } from "@/components/ui/button";
import * as jwtDecode from "jwt-decode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { set } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const ItineraryCard = ({ itinerary, onSelect, role, canModify }) => (
  <div
    className="cursor-pointer bg-white rounded-lg overflow-hidden shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl"
    onClick={() => onSelect(itinerary._id)}
  >
    <div className="overflow-hidden">
      <img
        src={
          itinerary.activities &&
            itinerary.activities.length > 0 &&
            itinerary.activities[0].pictures &&
            itinerary.activities[0].pictures.length > 0
            ? itinerary.activities[0].pictures[0]
            : defaultImage
        }
        alt={itinerary.title}
        className="w-full h-48 object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
      />
    </div>
    <div className="p-4 ">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold mt-2">{itinerary.title}</h3>
        {!itinerary.isActivated && role === "tour-guide" && (
          <Badge className="bg-red-500 text-white hover:bg-red-500 hover:text-white">Deactivated</Badge>
        )}

        {!itinerary.isActivated && role === "tourist" && (
          <Badge className="bg-red-500 text-white hover:bg-red-500 hover:text-white">Currently Unavailable</Badge>
        )}
      </div>
      <h3 className="text-sm mt-2 text-gray-700">{itinerary.timeline}</h3>
      <div className="flex justify-between items-center mt-4">
        <span className="text-lg font-bold text-blue-600">
          ${itinerary.price}/Day
        </span>
        <span className="text-sm text-gray-500">{itinerary.language}</span>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {Array.isArray(itinerary.activities) && itinerary.activities.map((activity, index) => (
          <div key={index} className="w-full">
            {Array.isArray(activity.category) && activity.category.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {activity.category.map((cat) => (
                  <Badge key={cat.id || cat.name} variant="secondary">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            )}
            {Array.isArray(activity.tags) && activity.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {activity.tags.map((tag) => (
                  <Badge key={tag.id || tag.type} variant="outline">
                    {tag.type}
                  </Badge>

                ))}

              </div>
            )}
          </div>
        ))}
      </div>
      {role === "tour-guide" && canModify && (
        <div className="mt-6 flex justify-end space-x-4">
          <Button
            onClick={() => navigate(`/update-itinerary/${itinerary.id}`)}
            variant="default"
            className="flex items-center bg-[#1a202c] hover:bg-[#2d3748]"
          >
            <Edit className="w-4 h-4 mr-2" />
            Update
          </Button>
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="destructive"
            className="flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      )}
    </div>
  </div>
);

const getUniqueTags = (itinerary) => {
  const allTags = itinerary.activities.flatMap(activity =>
    activity.tags.map(tag => tag.type)
  );
  return [...new Set(allTags)];
};

export function AllItinerariesComponent() {
  const [itineraries, setItineraries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [myItineraries, setmyItineraries] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [price, setPrice] = useState("");
  const [dateRange, setDateRange] = useState({ lower: "", upper: "" });
  const [selectedTypes, setSelectedTypes] = useState([]); // Changed to selectedTypes array
  const [selectedLanguages, setSelectedLanguages] = useState([]); // Changed to selectedLanguages array
  const tripsPerPage = 6;
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [typesOptions, setTypesOptions] = useState([]);
  const [languagesOptions, setLanguagesOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooked, setIsBooked] = useState(false);
  const [canModify, setCanModify] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isSortedByPreference, setIsSortedByPreference] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);


  const navigate = useNavigate();

  const getUserRole = () => {
    let role = Cookies.get("role");
    if (!role) role = "guest";
    return role;
  };



  const handleItinerarySelect = (id) => {
    navigate(`/itinerary/${id}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [typesResponse, languagesResponse] = await Promise.all([
          axios.get("http://localhost:4000/api/getAllTypes"),
          axios.get("http://localhost:4000/api/getAllLanguages")
        ]);
        setTypesOptions(typesResponse.data);
        setLanguagesOptions(languagesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchItineraries();  // Only search if a term is provided
      } else {
        fetchItineraries();  // Fetch all itineraries if search is empty
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);  // Clean up the timeout
  }, [searchTerm]);


  useEffect(() => {
    searchItineraries();
  }, [myItineraries]);

  const handleSort = (attribute) => {
    setIsLoading(true);
    const newSortOrder = sortOrder === 1 ? -1 : 1;
    setSortOrder(newSortOrder);
    setSortBy(attribute);
    setIsLoading(false);
  };

  useEffect(() => {
    if (sortBy || sortOrder || searchTerm ) {
      setIsSortedByPreference(false);
      searchItineraries();
    }
  }, [sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    if (sortBy || currentPage || sortOrder) {
      searchItineraries();
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    scrollToTop();
  }, [currentPage]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageChange = (pageNumber) => {
    setIsLoading(true);
    setCurrentPage(pageNumber);
    setIsLoading(false);
  };
  const handlemyItineraries = (attribute) => {
    setIsLoading(true);
    setmyItineraries(attribute);
    setIsLoading(false);
  };

  const fetchItineraries = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("jwt");
      const role = getUserRole();

      if (role === 'tourist' && !isInitialized) {
        const preferredItineraries = await fetch("http://localhost:4000/tourist/itineraries-preference", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then(res => res.json());

        const otherItineraries = await fetch("http://localhost:4000/tourist/itineraries-not-preference", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then(res => res.json());

        setItineraries([...preferredItineraries, ...otherItineraries]);
        setIsSortedByPreference(true);
        setIsInitialized(true);
      } else {
        const url = new URL(`http://localhost:4000/${role}/itineraries`);
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setItineraries(data);
      }

      setError(null);
      setCurrentPage(1);
      setCanModify(true);
    } catch (error) {
      console.error("Error fetching itineraries:", error);
      setError("Error fetching itineraries");
      setItineraries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    // Reset all filter states to initial values
    setIsSortedByPreference(false);
    setSearchTerm("");
    setPrice("");
    setDateRange({ lower: "", upper: "" });
    setSelectedTypes([]); // Reset selected types
    setSelectedLanguages([]); // Reset selected languages
    setSortBy(""); // Reset sorting
    setSortOrder(""); // Reset sort order
    setmyItineraries(false)
    setIsBooked(false);

    // Fetch itineraries without any filters
    fetchItineraries();
  };

  const searchItineraries = async () => {
    setIsSortedByPreference(false);
    try {
      const role = getUserRole();
      const url = new URL(`http://localhost:4000/${role}/itineraries`);

      if (priceRange[0] !== 0 || priceRange[1] !== maxPrice) {
        url.searchParams.append("minPrice", priceRange[0].toString());
        url.searchParams.append("maxPrice", priceRange[1].toString());
      }

      if (myItineraries) {
        url.searchParams.append("myItineraries", myItineraries);
      }
      if (searchTerm) {
        url.searchParams.append("searchBy", searchTerm);
      }
      if (price && price !== "") {
        url.searchParams.append("budget", price);
      }

      if (dateRange.upper) {
        url.searchParams.append("upperDate", dateRange.upper);
      }
      if (dateRange.lower) {
        url.searchParams.append("lowerDate", dateRange.lower);
      }
      if (selectedTypes.length > 0) {
        url.searchParams.append("types", selectedTypes.join(","));
      }
      if (selectedLanguages.length > 0) {
        url.searchParams.append("languages", selectedLanguages.join(","));
      }
      if (isBooked) {
        url.searchParams.append("isBooked", isBooked);
      }

      if (sortBy) {
        url.searchParams.append("sort", sortBy);
      }
      if (sortOrder) {
        url.searchParams.append("asc", sortOrder);
      }
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

      setItineraries(data);
      setError(null);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching filtered results:", error);
      setError("Error fetching filtered results");
      setItineraries([]);
    }
  };


  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  // Handle type and language selections
  const handleTypeSelection = (option) => {
    setSelectedTypes((prev) =>
      prev.includes(option)
        ? prev.filter((type) => type !== option)
        : [...prev, option]
    );
  };

  const handleLanguageSelection = (option) => {
    setSelectedLanguages((prev) =>
      prev.includes(option)
        ? prev.filter((lang) => lang !== option)
        : [...prev, option]
    );
  };



  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    setDeleteError(null);
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `http://localhost:4000/${userRole}/itineraries/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          setDeleteError(errorData.message);
          return;
        }
        if (response.status === 403) {
          setDeleteError(errorData.message);
          return;
        }
        throw new Error("Failed to delete itinerary");
      }

      setShowDeleteSuccess(true);
    } catch (err) {
      setError("Error deleting itinerary. Please try again later.");
      console.error("Error deleting itinerary:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="min-h-screen bg-gray-100 py-12 px-4 pt-20 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <>
              <h1 className="text-4xl font-bold text-gray-900 mb-8">
                All Trip Plans
              </h1>

              {isSortedByPreference && getUserRole() === 'tourist' && (
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Sorted based on your preferences
                </h2>
              )}

              <div className="flex flex-col mb-8">
                <div className="relative w-full mb-4">
                  <input
                    type="text"
                    placeholder="Search trips..."
                    className="w-full pl-10 pr-4 py-2 border rounded-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" />
                </div>

                <FilterComponent
                  filtersVisible={filtersVisible}
                  toggleFilters={toggleFilters}
                  sortOrder={sortOrder}
                  sortBy={sortBy}
                  myItineraries={myItineraries}
                  handlemyItineraries={handlemyItineraries}
                  handleSort={handleSort}
                  clearFilters={clearFilters}
                  // sortItineraries={sortItineraries}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  maxPrice={maxPrice}
                  price={price}
                  setPrice={setPrice}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  selectedTypes={selectedTypes} // Pass selectedTypes array
                  setSelectedTypes={setSelectedTypes} // Pass setSelectedTypes function
                  selectedLanguages={selectedLanguages} // Pass selectedLanguages array
                  setSelectedLanguages={setSelectedLanguages} // Pass setSelectedLanguages function
                  searchItineraries={searchItineraries}
                  typesOptions={typesOptions}
                  languagesOptions={languagesOptions}
                  role={getUserRole()}
                  isBooked={isBooked}
                  setIsBooked={setIsBooked}
                />
              </div>

              {error && (
                <div className="text-red-500 text-center mb-4">{error}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {itineraries
                  .slice(
                    (currentPage - 1) * tripsPerPage,
                    currentPage * tripsPerPage
                  )
                  .map((itinerary) => (
                    <ItineraryCard
                      key={itinerary._id} // Use the unique _id as the key
                      itinerary={itinerary}
                      onSelect={handleItinerarySelect}
                      role={getUserRole()}
                      canModify={canModify}
                    />
                  ))}
              </div>

              {/* Pagination Component here */}
              <div className="mt-8 flex justify-center items-center space-x-4">
                <button
                  onClick={() => {
                    handlePageChange(currentPage - 1);
                  }}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-full bg-white shadow ${currentPage === 1 ? "text-gray-300" : "text-blue-600"
                    }`}
                >
                  <ChevronLeft />
                </button>

                {/* Page X of Y */}
                <span className="text-lg font-medium">
                  {/* {setIsLoading(false)} */}
                  {itineraries.length > 0
                    ? `Page ${currentPage} of ${Math.ceil(
                      itineraries.length / tripsPerPage
                    )}`
                    : "No pages available"}
                </span>

                <button
                  onClick={() => {
                    handlePageChange(currentPage + 1);
                  }}
                  disabled={
                    currentPage ===
                    Math.ceil(itineraries.length / tripsPerPage) ||
                    itineraries.length === 0
                  }
                  className={`px-4 py-2 rounded-full bg-white shadow ${currentPage === Math.ceil(itineraries.length / tripsPerPage)
                    ? "text-gray-300"
                    : "text-blue-600"
                    }`}
                >
                  <ChevronRight />
                </button>
              </div>
            </>
          </div>
        </div>
      )}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Itinerary</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this itinerary?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteSuccess} onOpenChange={setShowDeleteSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <CheckCircle className="w-6 h-6 text-green-500 inline-block mr-2" />
              Itinerary Deleted
            </DialogTitle>
            <DialogDescription>
              The itinerary has been successfully deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => navigate("/all-itineraries")}
            >
              Back to All Itineraries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={deleteError !== null}
        onOpenChange={() => setDeleteError(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <XCircle className="w-6 h-6 text-red-500 inline-block mr-2" />
              Failed to Delete Itinerary
            </DialogTitle>
            <DialogDescription>
              {deleteError || "Itinerary is already booked!"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="default" onClick={() => setDeleteError(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
}
