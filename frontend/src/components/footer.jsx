import React, { useEffect, useState } from "react";
import { Facebook, Twitter, Instagram } from "lucide-react";
import teapot from "../assets/images/teapot.svg";
import Cookies from "js-cookie";

const FooterSection = ({ title, items }) => (
  <div className="mb-6 md:mb-0">
    <h2 className="text-sm font-semibold text-white uppercase mb-4">{title}</h2>
    <ul className="text-gray-300">
      {items.map((item, index) => (
        <li key={index} className="mb-2">
          <a href={item.link} className="hover:underline">
            {item.name}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const SocialIcon = ({ Icon, href }) => (
  <a
    href={href}
    className="text-gray-300 hover:text-white"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Icon className="w-5 h-5" />
  </a>
);

export function FooterComponent() {
  const [userRole, setUserRole] = useState("guest");
  const year = new Date().getFullYear();

  useEffect(() => {
    const role = Cookies.get("role");
    setUserRole(role || "guest");
  }, []);

  const getMenuItems = () => {
    const baseItems = [
      { name: "FAQ's", link: "/faqs" },
      { name: "Terms & Conditions", link: "/terms" },
      { name: "Privacy", link: "/privacy" },
    ];

    const roleSpecificItems = {
      tourist: [
        { name: "Historical Places", link: "/all-historical-places" },
        { name: "Activities", link: "/activity" },
        { name: "Itineraries", link: "/all-itineraries" },
        { name: "Products", link: "/all-products" },
      ],
      // admin: [
      //   { name: 'Historical Places', link: 'all-historical-places' },
      //   { name: 'Activities', link: '/activity' },
      //   { name: 'Itineraries', link: '/all-itineraries' },
      //   { name: 'Products', link: '/all-products' }
      // ],
      guest: [
        { name: "Historical Places", link: "/all-historical-places" },
        { name: "Activities", link: "/activity" },
        { name: "Itineraries", link: "/all-itineraries" },
        { name: "Products", link: "/all-products" },
      ],
      seller: [{ name: "Products", link: "/all-products" }],
      "tour-guide": [
        { name: "Activities", link: "/activity" },
        { name: "Itineraries", link: "/all-itineraries" },
      ],
      "tourism-governor": [
        { name: "Historical Places", link: "all-historical-places" },
      ],
      advertiser: [{ name: "Activities", link: "/activity" }],
    };

    return [...(roleSpecificItems[userRole] || [])];
  };

  return (
    <footer className="bg-[#1A3B47] text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and Copyright */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <div className="flex items-center mb-4">
              <img src={teapot} alt="Logo" className="w-8 h-8 mr-2" />
              <span className="text-xl font-bold">Trip Genie</span>
            </div>
            <p className="text-sm text-gray-300">
              Copyright © Trip Genie {year} All rights reserved
            </p>
          </div>

          {/* Menu */}
          <FooterSection title="Menu" items={getMenuItems()} />

          {/* Information */}
          <FooterSection
            title="Information"
            items={[
              { name: "FAQ's", link: "/faqs" },
              { name: "Terms & Conditions", link: "/terms" },
              { name: "Privacy", link: "/privacy" },
            ]}
          />

          {/* Contact Info */}
          <div>
            <h2 className="text-sm font-semibold text-white uppercase mb-4">
              Contact Info
            </h2>
            <ul className="text-gray-300">
              <li className="mb-2">+20 1069070700</li>
              <li className="mb-2">tripgenieservice@gmail.com</li>
              <li className="mb-2">13523, Cairo, Egypt</li>
            </ul>
          </div>
        </div>

        {/* Social Media Icons */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex justify-center md:justify-end space-x-6">
            <SocialIcon Icon={Facebook} href="https://facebook.com/tripgenie" />
            <SocialIcon Icon={Twitter} href="https://twitter.com/tripgenie" />
            <SocialIcon
              Icon={Instagram}
              href="https://instagram.com/tripgenie"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
