import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Cookies from "js-cookie";
import defaultImage from "../assets/images/default-image.jpg";
import { Link } from "react-router-dom";

export function HistoricalPlaces() {
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistoricalPlaces = async () => {
      try {
        const token = Cookies.get("jwt");
        let role = Cookies.get("role");
        if (role === undefined) role = "guest";
        if (
          role !== "tourist" &&
          role !== "tourism-governor" &&
          role != "guest"
        )
          return;
        const api = `https://trip-genie-apis.vercel.app/${role}/historical-places`;
        const response = await axios.get(api, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPlaces(response.data.slice(0, 4)); // Only get first 4 places
      } catch (err) {
        setError(err.message);
      }
    };

    fetchHistoricalPlaces();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-2 bg-[#E6DCCF]">
      {/* Centered header section */}
      <div className="text-center max-w-2xl mx-auto mb-4">
        <h1 className="text-4xl font-bold text-[#1A3B47] mb-4">
          Historical Places
        </h1>
        <p className="text-[#1A3B47] mb-4">
          Explore the world's most captivating historical landmarks, where rich
          cultural heritage and architectural wonders come to life. Each
          destination tells a story of the past, offering a unique journey
          through history. Plan your adventure today!
        </p>
        <Link to="/all-historical-places">
          <Button
            variant="primary"
            className="bg-[#388A94] hover:bg-[#5D9297] text-white px-8a py-3 rounded-full text-lg font-medium transition-colors duration-300"
          >
            View More
          </Button>
        </Link>
      </div>

      {/* Grid layout for places */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-8 md:px-12 lg:px-16">
        {places.length > 0 && (
          <>
            {/* Large card */}
            <Link
              to={`/historical-place/${places[0]._id}`}
              className="md:col-span-6 aspect-[3/4] relative group max-h-[560px] w-full justify-self-end"
            >
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <img
                  src={
                    Array.isArray(places[0].pictures) &&
                    places[0].pictures.length > 0
                      ? places[0].pictures[0].url
                      : defaultImage
                  }
                  alt={places[0].title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-semibold">{places[0].title}</h3>
                  <p className="flex items-center mt-2">
                    <MapPin className="w-5 h-5 mr-2" />
                    {places[0].location.city}, {places[0].location.country}
                  </p>
                </div>
              </div>
            </Link>

            {/* Right side smaller cards */}
            <div className="md:col-span-6 grid grid-cols-2 gap-4">
              {places.slice(1, 4).map((place, index) => (
                <Link
                  to={`/historical-place/${place._id}`}
                  key={place._id}
                  className={`relative group aspect-[4/3] ${
                    index === 2 ? "col-span-2 max-h-[300px] w-full" : ""
                  }`}
                >
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <img
                      src={
                        Array.isArray(place.pictures) &&
                        place.pictures.length > 0
                          ? place.pictures[0].url
                          : defaultImage
                      }
                      alt={place.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-semibold">{place.title}</h3>
                      <p className="flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {place.location.city}, {place.location.country}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
