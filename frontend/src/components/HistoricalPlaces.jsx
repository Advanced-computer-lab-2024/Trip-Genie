import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { role } from "./login";
import axios from "axios";
import Cookies from "js-cookie";

export function HistoricalPlacesComponent() {
  const [places, setPlaces] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);

  // Number of visible slides (4 cards at a time)
  const visibleSlides = 4;

  useEffect(() => {
    const fetchHistoricalPlaces = async () => {
      try {
        const token = Cookies.get("jwt");
        const api = `https://trip-genie-apis.vercel.app/tourism-governor/historical-places`;
        const response = await axios.get(api, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPlaces(response.data.slice(0, 10));
      } catch (err) {
        setError(err.message);
      }
    };

    fetchHistoricalPlaces();
  }, [role]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => {
      // Only increment if there are more cards ahead
      if (prevIndex < places.length - visibleSlides) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">Historical Places</h2>
          <hr className="border-red-500 w-1/2 mb-3 mt-1" />
          <p className="text-gray-600 mt-2 ">
            Most popular historical places around the world.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            aria-label="Previous place"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            aria-label="Next place"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Outer container (with overflow hidden) */}
      <div className="overflow-hidden">
        {/* Inner sliding container */}
        <div
          className="flex gap-6 transition-transform duration-300"
          style={{
            // Adjust the total translation to ensure the last few cards are fully visible
            transform: `translateX(-${currentIndex * (100 / visibleSlides)}%)`,
          }}
        >
          {places.map((place) => (
            <div
              key={place.id}
              className="flex-shrink-0 w-full sm:w-1/2 md:w-1/4 transition-transform duration-300 hover:-translate-y-12 hover:z-10 relative"
            >
              <div className=" cursor-pointer relative aspect-[3/4] rounded-lg overflow-hidden mt-12">
                <img
                  src={
                    Array.isArray(place.pictures)
                      ? place.pictures[0]
                      : place.pictures
                  }
                  alt={place.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-semibold">{place.title}</h3>
                  <p className="flex items-center mt-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {place.location.city}, {place.location.country}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View More Button */}
      <div className="flex justify-end mt-4">
        <Button
          variant="primary"
          onClick={() => alert("View More clicked!")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          View More
        </Button>
      </div>
    </div>
  );
}
