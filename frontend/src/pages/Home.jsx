"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TravelHero from "../components/TravelHero";
import { HistoricalPlaces } from "../components/HistoricalPlacesSlider";
import { Activities } from "../components/ActivitiesSlider";
import { ItineraryCards } from "../components/ItineraryCards";
import { ProductViewer } from "../components/ProductView";
import { AboutUs } from "../components/AboutUs";
import { BookingForm } from "../pages/FlightsandHotels";
import Cookies from "js-cookie";
import { TestimonialBannerJsx } from "../components/testimonial-banner";
import { UserGuide } from "@/components/UserGuide";

export default function Home() {
  const [activeTab, setActiveTab] = useState("activities");
  const [role, setRole] = useState("guest");

  useEffect(() => {
    setRole(Cookies.get("role") || "guest");
    incrementVisitCount();
  }, []);

  const incrementVisitCount = async () => {
    const response = await fetch(
      "http://localhost:4000/increment-visit-count",
      {
        method: "POST",
      }
    );
    const data = await response.json();
  };

  const tabs = {
    activities: <Activities />,
    itineraries: <ItineraryCards />,
    products: <ProductViewer />,
  };

  const handleStepChange = (step) => {
    console.log(`Step changed to: ${step}`);
    switch (step) {
      case 1:
        setActiveTab("activities");
        break;
      case 2:
        setActiveTab("itineraries");
        break;
      case 3:
        setActiveTab("products");
        break;
      // Add more cases as needed
    }
  };

  const homeSteps = [
    {
      target: "body",
      content:
        "Welcome to Trip Genie! Your personal travel guide for all your adventures. Let's take a quick tour to get you started.",
      placement: "center",
    },
    {
      target: ".navbar-activities",
      content: "Explore exciting activities and experiences here.",
      placement: "bottom",
    },
    {
      target: ".navbar-itineraries",
      content: "Check out curated travel itineraries for your next adventure.",
      placement: "bottom",
    },
    {
      target: ".navbar-historical-places",
      content: "Discover fascinating historical places to visit.",
      placement: "bottom",
    },
    {
      target: ".navbar-products",
      content: "Browse travel-related products and gear.",
      placement: "bottom",
    },
    ...(role === "guest"
      ? [
          {
            target: ".navbar-signup-or-login",
            content:
              "Sign up or log in to start your journey with us and access more features.",
            placement: "bottom",
            genieOrientation: "left",
          },
        ]
      : []),
    ...(role === "tourist"
      ? [
          {
            target: ".navbar-transportation",
            content: "Find transportation options for your travels.",
            placement: "bottom",
          },
          {
            target: ".navbar-hotels",
            content: "Book accommodations for your stay.",
            placement: "bottom",
          },
          {
            target: ".navbar-cart",
            content: "View your shopping cart here.",
            placement: "bottom",
            genieOrientation: "left",
          },
          {
            target: ".navbar-wishlist",
            content: "Access your travel wishlist.",
            placement: "bottom",
            genieOrientation: "left",
          },
          {
            target: ".navbar-profile",
            content: "Manage your profile settings.",
            placement: "bottom",
            genieOrientation: "left",
          },
        ]
      : []),
  ];

  const renderContent = () => {
    switch (role) {
      case "tourism-governor":
        return <HistoricalPlaces />;
      case "advertiser":
        return <Activities />;
      case "seller":
        return <ProductViewer />;
      case "tour-guide":
        return <ItineraryCards />;
      case "admin":
        return (
          <>
            <div className="about-us-section">
              <AboutUs />
            </div>
            <div className="testimonials-section">
              <TestimonialBannerJsx />
            </div>
            <HistoricalPlaces />
            <div className="text-center max-w-2xl mx-auto mb-4 mt-24">
              <h1 className="text-4xl font-bold text-[#1A3B47] mb-4">
                Explore Your Next Adventure
              </h1>
              <p className="text-[#1A3B47] mb-4">
                Discover a variety of thrilling activities, thoughtfully
                designed itineraries, and unique travel products that will
                enhance your journey. Whether you&apos;re looking for cultural
                experiences or exciting excursions, we have everything you need
                to make your travels unforgettable. Start planning your next
                adventure today!
              </p>
            </div>
            <div className="mb-2 max-w-2xl mx-auto">
              <div className="flex justify-center">
                <div className="inline-flex rounded-full p-1 w-full max-w-2xl border-2 border-[#1A3B47]">
                  {Object.keys(tabs).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 w-full ${
                        activeTab === tab
                          ? "bg-[#388A94] text-white"
                          : "text-[#1A3B47] hover:text-[#5D9297]"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`${activeTab}-section`}>{tabs[activeTab]}</div>
              </motion.div>
            </AnimatePresence>
          </>
        );

      default: // tourist, guest
        return (
          <>
            <div className="about-us-section">
              <AboutUs />
            </div>
            <BookingForm />
            <HistoricalPlaces />
            <div className="text-center max-w-2xl mx-auto mb-4 mt-24">
              <h1 className="text-4xl font-bold text-[#1A3B47] mb-4">
                Explore Your Next Adventure
              </h1>
              <p className="text-[#1A3B47] mb-4">
                Discover a variety of thrilling activities, thoughtfully
                designed itineraries, and unique travel products that will
                enhance your journey. Whether you&apos;re looking for cultural
                experiences or exciting excursions, we have everything you need
                to make your travels unforgettable. Start planning your next
                adventure today!
              </p>
            </div>
            <div className="mb-2 max-w-2xl mx-auto">
              <div className="flex justify-center">
                <div className="inline-flex rounded-full p-1 w-full max-w-2xl border-2 border-[#1A3B47]">
                  {Object.keys(tabs).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 w-full ${
                        activeTab === tab
                          ? "bg-[#388A94] text-white"
                          : "text-[#1A3B47] hover:text-[#5D9297]"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`${activeTab}-section`}>{tabs[activeTab]}</div>
              </motion.div>
            </AnimatePresence>
            <div className="estimonials-section mt-20">
              <TestimonialBannerJsx />
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#E6DCCF]">
      <TravelHero userRole={role} />

      <div className="mx-auto px-4 py-16">
        {(role === "guest" || role === "tourist") && (
          <UserGuide
            onStepChange={handleStepChange}
            steps={homeSteps}
            pageName="home"
          />
        )}
        {renderContent()}
      </div>
    </div>
  );
}
