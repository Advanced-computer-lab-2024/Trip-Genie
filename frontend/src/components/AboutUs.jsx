"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapPin, DollarSign, Building2, Users, Package } from "lucide-react";
import aboutUsImage from "../assets/images/about-us.jpg";

export function AboutUs() {
  const [counts, setCounts] = useState({
    destinations: 0,
    partners: 0,
    sellers: 0,
  });

  const targetCounts = {
    destinations: 928,
    partners: 1020,
    sellers: 540,
  };

  const [hasAnimated, setHasAnimated] = useState(false);
  const statsSectionRef = useRef(null);

  useEffect(() => {
    const duration = 2000; // Animation duration in milliseconds
    const steps = 50; // Number of steps in the animation
    const interval = duration / steps;

    const incrementCounts = (step) => {
      setCounts({
        destinations: Math.min(
          Math.floor((targetCounts.destinations * step) / steps),
          targetCounts.destinations
        ),
        partners: Math.min(
          Math.floor((targetCounts.partners * step) / steps),
          targetCounts.partners
        ),
        sellers: Math.min(
          Math.floor((targetCounts.sellers * step) / steps),
          targetCounts.sellers
        ),
      });
    };

    let currentStep = 0;
    const startAnimation = () => {
      const timer = setInterval(() => {
        currentStep++;
        incrementCounts(currentStep);
        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, interval);
    };

    const handleIntersect = (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !hasAnimated) {
        startAnimation();
        setHasAnimated(true);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.1, // Trigger when 10% of the section is visible
    });

    if (statsSectionRef.current) {
      observer.observe(statsSectionRef.current);
    }

    return () => {
      if (statsSectionRef.current) {
        observer.unobserve(statsSectionRef.current);
      }
    };
  }, [hasAnimated]);

  return (
    <div className="w-full mb-24">
      {/* Experience Section */}
      <section className="container mx-auto px-24 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mx-auto px-4">
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-[#1A3B47] mb-4">
                Experience The New Adventure
              </h2>
              <p className="text-[#1A3B47] mb-8">
                Discover extraordinary journeys and unforgettable experiences
                with our expert travel services. We combine luxury, adventure,
                and comfort to create the perfect getaway for every traveler.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-[#F88C33] rounded-full ">
                  <MapPin className="w-8 h-8 pl-2 pr-2 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#1A3B47] mb-2">
                    Safe Traveling
                  </h3>
                  <p className="text-[#1A3B47]">
                    Experience worry-free adventures with our comprehensive
                    safety measures and expert local guides ensuring your
                    security throughout the journey.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-[#F88C33] rounded-full ">
                  <DollarSign className="w-8 h-8 pl-2 pr-2 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#1A3B47] mb-2">
                    Affordable Price
                  </h3>
                  <p className="text-[#1A3B47]">
                    Enjoy premium travel experiences at competitive prices, with
                    transparent pricing and value-added services that maximize
                    your travel investment.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-[#F88C33] rounded-full ">
                  <Package className="w-8 h-8 pl-2 pr-2 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#1A3B47] mb-2">
                    Exceptional Products
                  </h3>
                  <p className="text-[#1A3B47]">
                    Explore our curated selection of travel products that
                    enhance your journey, offering quality and functionality for
                    a memorable experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative h-[500px] rounded-lg overflow-hidden">
            <img
              src={aboutUsImage}
              alt="Travel Adventure"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <div className="relative w-full">
        <div className="absolute inset-0 bg-[#1A3B47] w-[100vw] left-[calc(-50vw+50%)]" />
        <section ref={statsSectionRef} className="relative bg-[#1A3B47] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-0">
                We Are The Most Popular Travel & Tour Company
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 place-items-center">
              <div className="flex flex-col items-center text-center">
                <Building2 className="w-10 h-10 text-[#388A94] mb-4" />
                <div className="text-5xl font-bold text-white mb-1">
                  {counts.destinations}+
                </div>
                <div className="text-lg text-white/80">Travel Destinations</div>
              </div>
              <div className="flex flex-col items-center text-center">
                <Users className="w-10 h-10 text-[#388A94] mb-4" />
                <div className="text-5xl font-bold text-white mb-1">
                  {counts.partners}+
                </div>
                <div className="text-lg text-white/80">Tour Partners</div>
              </div>
              <div className="flex flex-col items-center text-center">
                <Package className="w-10 h-10 text-[#388A94] mb-4" />
                <div className="text-5xl font-bold text-white mb-1">
                  {counts.sellers}+
                </div>
                <div className="text-lg text-white/80">Partnering Sellers</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
