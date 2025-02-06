"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, BedDoubleIcon, UsersIcon, StarIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_KEY = import.meta.env.VITE_HOTELS_API_KEY3;
const API_HOST = "hotels-com-provider.p.rapidapi.com";

export default function HotelSearch() {
  const [city, setCity] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [adults, setAdults] = useState("1");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelDetails, setHotelDetails] = useState(null);
  const [roomOffers, setRoomOffers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const searchRegionId = async () => {
    const url = `https://${API_HOST}/v2/regions?query=${encodeURIComponent(
      city
    )}&domain=AR&locale=es_AR`;

    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": API_HOST,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch region ID");
      }

      const data = await response.json();
      if (data.length > 0 && data[0].gaiaId) {
        return data[0].gaiaId;
      } else {
        throw new Error("No region found for the given city");
      }
    } catch (error) {
      console.error("Error fetching region ID:", error);
      throw error;
    }
  };

  const searchHotels = async () => {
    setError("");
    setLoading(true);
    try {
      const regionId = await searchRegionId();
      const url = `https://hotels-com-provider.p.rapidapi.com/v2/hotels/search?amenities=WIFI%2CPARKING&meal_plan=FREE_BREAKFAST&available_filter=SHOW_AVAILABLE_ONLY&price_min=10&payment_type=PAY_LATER%2CFREE_CANCELLATION&star_rating_ids=3%2C4%2C5&guest_rating_min=8&children_ages=4%2C0%2C15&checkin_date=2025-05-26&locale=es_AR&adults_number=1&sort_order=REVIEW&page_number=1&domain=AR&price_max=500&region_id=2872&lodging_type=HOTEL%2CHOSTEL%2CAPART_HOTEL&checkout_date=2025-05-27`;

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": API_HOST,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.properties || []);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      setError(error.message || "Failed to search hotels. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const fetchHotelDetails = async (hotelId) => {
    setError("");
    setLoading(true);
    try {
      const url = `https://${API_HOST}/v2/hotels/details?domain=AR&hotel_id=${hotelId}&locale=es_AR`;

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": API_HOST,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch hotel details");
      }

      const data = await response.json();
      setHotelDetails(data.propertyInfo || null);
    } catch (error) {
      console.error("Error fetching hotel details:", error);
      setError("Failed to fetch hotel details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomOffers = async (hotelId) => {
    setError("");
    setLoading(true);
    try {
      const url = `https://${API_HOST}/v3/hotels/offers?domain=AR&hotel_id=${hotelId}&checkin_date=${checkInDate}&checkout_date=${checkOutDate}&adults_number=${adults}&locale=es_AR`;

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": API_HOST,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch room offers");
      }

      const data = await response.json();
      setRoomOffers(data.data?.rooms || []);
    } catch (error) {
      console.error("Error fetching room offers:", error);
      setError("Failed to fetch room offers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHotelSelect = async (hotel) => {
    setSelectedHotel(hotel);
    await fetchHotelDetails(hotel.id);
    await fetchRoomOffers(hotel.id);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Hotel Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="city">City/Region</Label>
              <Input
                id="city"
                placeholder="Enter city or region"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="check-in">Check-in</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="check-in"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="check-out">Check-out</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="check-out"
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="adults">Adults</Label>
              <Select value={adults} onValueChange={setAdults}>
                <SelectTrigger id="adults">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={searchHotels} disabled={loading}>
            {loading ? "Searching..." : "Search Hotels"}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {searchResults.map((hotel) => (
            <Card
              key={hotel.id}
              className="cursor-pointer"
              onClick={() => handleHotelSelect(hotel)}
            >
              <CardHeader>
                <CardTitle>{hotel.name}</CardTitle>
                <CardDescription className="flex items-center">
                  <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
                  <span>{hotel.star}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <img
                  src={hotel.propertyImage?.image?.url || "/placeholder.svg"}
                  alt={hotel.name}
                  className="w-full h-48 object-cover rounded-lg mb-2"
                />
                <p className="text-sm text-gray-600">
                  {hotel.neighborhood?.name}
                </p>
                <p className="font-bold mt-2">{hotel.price?.lead?.formatted}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedHotel && hotelDetails && (
        <Card className="w-full max-w-4xl mx-auto mb-8">
          <CardHeader>
            <CardTitle>{hotelDetails.summary.name}</CardTitle>
            <CardDescription>
              {hotelDetails.summary.location.address.addressLine}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <img
              src={
                hotelDetails.propertyGallery.images[0]?.image.url ||
                "/placeholder.svg"
              }
              alt={hotelDetails.summary.name}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            <p className="text-sm text-gray-600 mb-4">
              {hotelDetails.summary.tagline}
            </p>
            <h3 className="text-lg font-semibold mb-2">Amenities</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {hotelDetails.amenities.topAmenities.items.map(
                (amenity, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded"
                  >
                    {amenity.text}
                  </span>
                )
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">Room Offers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roomOffers.map((room) => (
                <Card key={room.unitId}>
                  <CardHeader>
                    <CardTitle>{room.header.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">
                      {room.ratePlans[0]?.priceDetails[0]?.price.lead.formatted}
                    </p>
                    <div className="flex items-center">
                      <UsersIcon className="w-5 h-5 mr-2" />
                      <span>
                        Max occupancy:{" "}
                        {room.ratePlans[0]?.priceDetails[0]?.availability
                          ?.minRoomsLeft || "N/A"}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Book Now</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
