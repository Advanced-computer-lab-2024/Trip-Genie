'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import Loader from "./Loader.jsx";


export function Activities() {
  const [activities, setActivities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Number of visible slides (3 cards at a time)
  const visibleSlides = 3;

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const token = Cookies.get('jwt')
        let role = Cookies.get('role')
        if (role === undefined) 
          role = 'guest'
        const api = `http://localhost:4000/${role}/activities`
        const response = await axios.get(api, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setActivities(response.data);
        
      } catch (err) {
        setError(err.message);
      }
    };

    fetchActivities();
    setIsLoading(false);
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex < activities.length - visibleSlides) {
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
        <div className="w-full sm:w-1/2">
          <h2 className="text-3xl font-bold">Activities</h2>
          <hr className="border-red-500 w-1/2 mb-3 mt-1 border-t-2" />
          <p className="text-gray-600 mt-2 mb-8">
          Explore a range of exciting activities on our travel website! Whether it's guided tours, outdoor adventures, or cultural experiences, we have something for every traveler. Start planning today for unforgettable memories!
          </p>
        </div>
        <div className="flex gap-2">
        <div className="flex">
        <Link to="/activity">
        <Button
                variant="primary"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md text-lg font-medium"
              >
                View More
              </Button>
              </Link>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            aria-label="Previous place"
            className="bg-black text-white hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            aria-label="Next place"
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Activity Cards */}
      <div>
        <div
          className="flex gap-6 transition-transform duration-300"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleSlides + 1)}%)`,
          }}
        >
          {activities.map((act) => (
            <div
              key={act._id}
              className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 rounded-lg overflow-hidden shadow-lg"
              style={{ backgroundColor: 'rgb(255, 248, 241)' }}
            >
              <img
                src={Array.isArray(act.pictures) ? act.pictures[0] : act.pictures}
                alt={act.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{act.name}</h3>
                <div className="flex mb-2">
                  {Array.from({ length: 5 }, (_, i) => {
                    if (i < Math.floor(act.rating)) {
                      return <span key={i} className="text-yellow-400">★</span>;
                    } else if (i < act.rating) {
                      return <span key={i} className="text-yellow-400">☆</span>;
                    } else {
                      return <span key={i} className="text-gray-300">☆</span>;
                    }
                  })}
                </div>
                <p className="text-sm text-gray-600 mb-2">{`Description: ${act.description}`}</p>
                <p className="text-sm text-gray-600 mb-2">{`Location: ${act.location.address}`}</p>
                <p className="text-sm text-gray-600 mb-2">{`Duration: ${act.duration}`}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">From ${act.price}</span>
                  {/* Details button with hover effect */}
                  <Link to={`/activity/${act._id}`}>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Details
                  </button>
                </Link>
                  
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
