import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useLocation, Link } from "react-router-dom";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import CartDropdown from "@/components/cartDropDown";
import axios from "axios";
import { cartEvents } from "@/service/cartEvents";
import { Modal, Button } from "react-bootstrap";
import PromoBanner from "./PromoBanner";

import { NotificationsDropdownSeller } from "@/components/SellerNotificationsDropdown";
// import { NotificationsDropdownTourGuide } from "@/components/TourGuideNotificationsDropdown";
// import { NotificationsDropdownAdvertiser } from "@/components/AdvertiserNotificationsDropdown";
// import { NotificationsDropdownAdmin } from "@/components/AdminNotificationsDropdown";
import { NotificationsDropdownTourist } from "@/components/TouristNotificationsDropdown";

import logo from "../assets/images/TGlogo.svg";
import {
  Menu,
  X,
  User,
  HistoryIcon,
  Calendar,
  AlertTriangle,
  LogOut,
  ChevronDown,
  List,
  Folder,
  PlusCircle,
  ShoppingCart,
  Heart,
  Bell,
  ChevronUp,
  ArchiveIcon,
  Package,
} from "lucide-react";

const NavLinkIcon = ({ to, children }) => (
  <Link
    to={to}
    className="text-white rounded-full transition-colors duration-200 text-sm font-medium"
  >
    {children}
  </Link>
);

const NavLink = ({ to, children, className }) => (
  <Link
    to={to}
    className={`text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium ${
      className ? className : ""
    }`}
    onClick={() => setIsCartOpen(false)}
  >
    {children}
  </Link>
);

export function NavbarComponent() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [role, setRole] = useState(Cookies.get("role"));
  const navigate = useNavigate();
  const itinerariesRef = useRef(null);
  const productsRef = useRef(null);
  const reportsRef = useRef(null);

  const userMenuRef = useRef(null);
  const activitiesRef = useRef(null);
  const historicalRef = useRef(null);
  const transportationRef = useRef(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [promoBannerMargin, setPromoBannerMargin] = useState(0);
  const [hasUnseenNotificationsSeller, setHasUnseenNotificationsSeller] =
    useState(false);
  const [hasUnseenNotificationsTourGuide, setHasUnseenNotificationsTourGuide] =
    useState(false);
  const [
    hasUnseenNotificationsAdvertiser,
    setHasUnseenNotificationsAdvertiser,
  ] = useState(false);
  const [hasUnseenNotificationsAdmin, setHasUnseenNotificationsAdmin] =
    useState(false);
  const [hasUnseenNotificationsTourist, setHasUnseenNotificationsTourist] =
    useState(false);

  const [key, setKey] = useState(0);
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    // Increment the key to force a re-render of the Navbar
    setKey((prevKey) => prevKey + 1);

    // Close any open dropdowns when the route changes
    setOpenDropdown(null);

    // Reset scroll position
    window.scrollTo(0, 0);
  }, [location]);

  const handleClickOutside = (event) => {
    if (
      !itinerariesRef.current?.contains(event.target) &&
      !productsRef.current?.contains(event.target) &&
      !reportsRef.current?.contains(event.target) &&
      !activitiesRef.current?.contains(event.target) &&
      !historicalRef.current?.contains(event.target) &&
      !userMenuRef.current?.contains(event.target) &&
      !transportationRef.current?.contains(event.target) &&
      !document.querySelector(".logout-popup")?.contains(event.target) // Exclude modal
    ) {
      closeDropdown();
    }
  };

  useEffect(() => {
    if (role === "seller") {
      checkUnseenNotificationsSeller();
    }
    if (role === "tour-guide") {
      checkUnseenNotificationsTourGuide();
    }
    if (role === "advertiser") {
      checkUnseenNotificationsAdvertiser();
    }
    if (role === "admin") {
      checkUnseenNotificationsAdmin();
    }
    if (role === "tourist") {
      checkUnseenNotificationsTourist();
    }
  }, [role]);

  const checkUnseenNotificationsTourist = async () => {
    try {
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/tourist/unseen-notifications`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setHasUnseenNotificationsTourist(response.data.hasUnseen);
    } catch (error) {
      console.error("Error checking unseen notifications:", error);
      // Silently fail but don't show the notification dot
      setHasUnseenNotificationsTourist(false);
    }
  };

  const checkUnseenNotificationsAdmin = async () => {
    try {
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/admin/unseen-notifications`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setHasUnseenNotificationsAdmin(response.data.hasUnseen);
    } catch (error) {
      console.error("Error checking unseen notifications:", error);
      // Silently fail but don't show the notification dot
      setHasUnseenNotificationsAdmin(false);
    }
  };

  const checkUnseenNotificationsSeller = async () => {
    try {
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/seller/unseen-notifications`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setHasUnseenNotificationsSeller(response.data.hasUnseen);
    } catch (error) {
      console.error("Error checking unseen notifications:", error);
      // Silently fail but don't show the notification dot
      setHasUnseenNotificationsSeller(false);
    }
  };
  const checkUnseenNotificationsTourGuide = async () => {
    try {
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/tour-guide/unseen-notifications`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setHasUnseenNotificationsTourGuide(response.data.hasUnseen);
    } catch (error) {
      console.error("Error checking unseen notifications:", error);
      // Silently fail but don't show the notification dot
      setHasUnseenNotificationsTourGuide(false);
    }
  };
  const checkUnseenNotificationsAdvertiser = async () => {
    try {
      const response = await axios.get(
        `https://trip-genie-apis.vercel.app/advertiser/unseen-notifications`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setHasUnseenNotificationsAdvertiser(response.data.hasUnseen);
    } catch (error) {
      console.error("Error checking unseen notifications:", error);
      // Silently fail but don't show the notification dot
      setHasUnseenNotificationsAdvertiser(false);
    }
  };

  useEffect(() => {
    setRole(Cookies.get("role"));
    document.addEventListener("mousedown", handleClickOutside);

    const handleScroll = () => {
      const heroHeight =
        document.querySelector(".hero-section")?.offsetHeight || 0;
      setIsScrolled(window.scrollY > heroHeight);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = useCallback(async () => {
    try {
      const token = Cookies.get("jwt");
      const role = Cookies.get("role");
      if (role !== "tourist") return;
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/tourist/cart",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  }, []);

  useEffect(() => {
    fetchCartItems();

    // Set up event listener for cart updates
    window.addEventListener("cartUpdated", fetchCartItems);

    // Clean up the event listener
    return () => {
      window.removeEventListener("cartUpdated", fetchCartItems);
    };
  }, [fetchCartItems]);

  const LogoutPopup = ({ onConfirm, onCancel }) => {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        onClick={onCancel} // Closes modal if the background is clicked
      >
        <div
          className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent background click from propagating
          }}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Are you sure you want to log out?
          </h3>
          <div className="flex justify-end gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent button click from affecting parent
                onCancel();
              }}
              type="button"
              className="px-4 py-2 text-sm text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent button click from affecting parent
                onConfirm();
              }}
              type="button"
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    console.log("showLogoutModal state updated:", showLogoutModal);
  }, [showLogoutModal]);
  const handleLogoutConfirm = () => {
    setOpenDropdown(false); // Ensure the dropdown is closed
    setShowLogoutModal(true);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleLogout = () => {
    logOut();
    setShowLogoutModal(false);
  };

  const logOut = async () => {
    console.log("Logging out...");
    try {
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/auth/logout"
      );

      if (response.ok) {
        Cookies.set("jwt", "");
        Cookies.set("role", "");
        Cookies.remove("jwt");
        Cookies.remove("role");
        console.log("Logged out successfully");
        navigate("/login");
        window.location.reload();
      } else {
        console.error("Logout failed.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown((prevDropdown) =>
      prevDropdown === dropdown ? false : dropdown
    );
  };

  const closeDropdown = () => {
    setOpenDropdown(false);
  };

  const promoBanner = <PromoBanner setPromoMargin={setPromoBannerMargin} />;

  return (
    <div style={{ marginBottom: `${promoBannerMargin}px` }}>
      <nav
        key={key}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          role === "admin"
            ? isScrolled
              ? "bg-black/50"
              : "bg-[#1A3B47]"
            : isScrolled
            ? "bg-black/50"
            : ""
        }`}
        style={isScrolled ? { backdropFilter: "saturate(180%) blur(8px)" } : {}}
      >
        {promoBanner}
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 ml-8">
              <Link to="/" className="flex items-center">
                <img
                  src={logo}
                  alt="logo"
                  onClick={() => setIsCartOpen(false)}
                  className="h-10 w-auto"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block" style={{ marginRight: 30 }}>
              <div className="inline-flex items-center border-2 border-white/30 rounded-full px-2 py-1">
                {role === "tour-guide" && (
                  <>
                    <div className="relative" ref={itinerariesRef}>
                      <button
                        onClick={() => toggleDropdown("itineraries")}
                        className="text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium flex items-center"
                      >
                        Itineraries
                        {openDropdown === "itineraries" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </button>
                      {openDropdown === "itineraries" && (
                        <div className="absolute left-0 mt-2 w-60 bg-black/90 rounded-xl border border-white/20 shadow-lg">
                          <Link
                            to="/all-itineraries"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <List className="mr-2 h-4 w-4" /> All Itineraries
                          </Link>
                          <Link
                            to="/my-itineraries"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <Folder className="mr-2 h-4 w-4" /> My Itineraries
                          </Link>
                          <Link
                            to="/create-itinerary"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" /> Create
                            Itinerary
                          </Link>
                        </div>
                      )}
                    </div>
                    <NavLink to="/tourguide-report">Sales Report</NavLink>
                  </>
                )}
                {role === "seller" && (
                  <>
                    <div className="relative" ref={productsRef}>
                      <button
                        onClick={() => toggleDropdown("products")}
                        className="text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium flex items-center"
                      >
                        Products
                        {openDropdown === "products" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </button>
                      {openDropdown === "products" && (
                        <div className="absolute left-0 mt-2 w-60 bg-black/90 rounded-xl border border-white/20 shadow-lg">
                          <Link
                            to="/all-products"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <List className="mr-2 h-4 w-4" /> All Products
                          </Link>
                          <Link
                            to="/my-products"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <Folder className="mr-2 h-4 w-4" /> My Products
                          </Link>
                          <Link
                            to="/create-product"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" /> Create
                            Product
                          </Link>
                          <Link
                            to="/product-archive"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <ArchiveIcon className="mr-2 h-4 w-4" /> Archived
                            Products
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="relative" ref={reportsRef}>
                      <button
                        onClick={() => toggleDropdown("reports")}
                        className="text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium flex items-center"
                      >
                        Reports
                        {openDropdown === "reports" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </button>
                      {openDropdown === "reports" && (
                        <div className="absolute left-0 mt-2 w-60 bg-black/90 rounded-xl border border-white/20 shadow-lg">
                          <Link
                            to="/seller-report"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <List className="mr-2 h-4 w-4" /> Sales report
                          </Link>
                          <Link
                            to="/seller-stock-report"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <Folder className="mr-2 h-4 w-4" /> Stock report
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {role === "tourist" && (
                  <>
                    <NavLink to="/activity" className="navbar-activities">
                      Activities
                    </NavLink>
                    <NavLink
                      to="/all-itineraries"
                      className="navbar-itineraries"
                    >
                      Itineraries
                    </NavLink>
                    <NavLink
                      to="/all-historical-places"
                      className="navbar-historical-places"
                    >
                      Historical Places
                    </NavLink>
                    <NavLink to="/all-products" className="navbar-products">
                      Products
                    </NavLink>

                    <div>
                      {/* Transportation Dropdown */}
                      <div
                        className="relative navbar-transportation"
                        ref={transportationRef}
                      >
                        <button
                          onClick={() => (
                            toggleDropdown("transportation"),
                            setIsCartOpen(false)
                          )}
                          className="text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium flex items-center"
                        >
                          Transportation
                          {openDropdown === "transportation" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </button>
                        {openDropdown === "transportation" && (
                          <div className="absolute left-0 mt-2 w-48 bg-black/90 rounded-xl border border-white/20 shadow-lg">
                            <Link
                              to="/transportation"
                              className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200"
                              onClick={closeDropdown}
                            >
                              Vehicles
                            </Link>
                            <Link
                              to="/flights"
                              className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200"
                              onClick={closeDropdown}
                            >
                              Flights
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    <NavLink to="/hotels" className="navbar-hotels">
                      Hotels
                    </NavLink>
                  </>
                )}
                {role === "advertiser" && (
                  <>
                    <div className="relative" ref={activitiesRef}>
                      <button
                        onClick={() => toggleDropdown("activities")}
                        className="text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium flex items-center"
                      >
                        Activities
                        {openDropdown === "activities" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </button>
                      {openDropdown === "activities" && (
                        <div className="absolute left-0 mt-2 w-60 bg-black/90 rounded-xl border border-white/20 shadow-lg">
                          <Link
                            to="/activity"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <List className="mr-2 h-4 w-4" /> All activities
                          </Link>
                          <Link
                            to="/my-activities"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <Folder className="mr-2 h-4 w-4" /> My activities
                          </Link>
                          <Link
                            to="/create-activity"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" /> Create
                            activities
                          </Link>
                        </div>
                      )}
                    </div>
                    <NavLink to="/transportation">Transportation</NavLink>
                    <NavLink to="/advertiser-report">Sales Report</NavLink>
                  </>
                )}
                {role === "admin" && (
                  <div className="flex justify-between items-center">
                    <NavLink to="/all-itineraries">Itineraries</NavLink>

                    <div className="relative" ref={productsRef}>
                      <button
                        onClick={() => toggleDropdown("adminProducts")}
                        className="text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium flex items-center"
                      >
                        Products
                        {openDropdown === "adminProducts" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </button>
                      {openDropdown === "adminProducts" && (
                        <div className="absolute left-0 mt-2 w-60 bg-black/90 rounded-xl border border-white/20 shadow-lg">
                          <Link
                            to="/all-products"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <List className="mr-2 h-4 w-4" /> All Products
                          </Link>
                          <Link
                            to="/my-products"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <Folder className="mr-2 h-4 w-4" /> My Products
                          </Link>
                          <Link
                            to="/create-product"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" /> Create
                            Product
                          </Link>
                          <Link
                            to="/product-archive"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <ArchiveIcon className="mr-2 h-4 w-4" /> Archived
                            Products
                          </Link>
                        </div>
                      )}
                    </div>

                    <NavLink to="/all-historical-places">
                      Historical Places
                    </NavLink>

                    <NavLink
                      to="/activity"
                      className="hover:bg-white/10 px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium"
                    >
                      Activities
                    </NavLink>
                  </div>
                )}
                {role === "tourism-governor" && (
                  <>
                    <div className="relative" ref={historicalRef}>
                      <button
                        onClick={() => toggleDropdown("historical")}
                        className="text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium flex items-center"
                      >
                        Historical Places
                        {openDropdown === "historical" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </button>
                      {openDropdown === "historical" && (
                        <div className="absolute left-0 mt-2 w-60 bg-black/90 rounded-xl border border-white/20 shadow-lg">
                          <Link
                            to="/all-historical-places"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <List className="mr-2 h-4 w-4" /> All Historical
                            Places
                          </Link>
                          <Link
                            to="/my-historical-places"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <Folder className="mr-2 h-4 w-4" /> My Historical
                            Places
                          </Link>
                          <Link
                            to="/create-historicalPlace"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" /> Create
                            Historical Place
                          </Link>
                        </div>
                      )}
                    </div>
                    <NavLink to="/create-historical-tag">
                      Create Historical Tag
                    </NavLink>
                  </>
                )}
                {(role === "guest" || role === undefined) && (
                  <>
                    <NavLink to="/activity" className="navbar-activities">
                      Activities
                    </NavLink>
                    <NavLink
                      to="/all-itineraries"
                      className="navbar-itineraries"
                    >
                      Itineraries
                    </NavLink>
                    <NavLink
                      to="/all-historical-places"
                      className="navbar-historical-places"
                    >
                      Historical Places
                    </NavLink>
                    <NavLink to="/all-products" className="navbar-products">
                      Products
                    </NavLink>
                  </>
                )}
              </div>
            </div>

            {/* Login, Sign Up, Notifications, and Menu Button */}
            <div className="hidden md:flex items-center">
              {role !== undefined && role !== "guest" && (
                <>
                  {(role === "seller" ||
                    role === "tour-guide" ||
                    role === "advertiser" ||
                    role === "admin") && <NotificationsDropdownSeller />}
                  {/* {role === "tour-guide" && <NotificationsDropdownTourGuide />}
                  {role === "advertiser" && <NotificationsDropdownAdvertiser />}
                  {role === "admin" && <NotificationsDropdownAdmin />} */}
                  {role === "tourist" && (
                    <>
                      <NotificationsDropdownTourist />
                      <div className="relative mr-2 navbar-cart">
                        <button
                          onClick={() => setIsCartOpen(!isCartOpen)}
                          className="relative text-white hover:bg-white/10 p-2 rounded-full transition-colors duration-200"
                        >
                          <ShoppingCart className="h-7 w-7 text-white" />{" "}
                          {/* Larger icon size */}
                          {cartItems.length > 0 && (
                            <div className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[12px] text-white bg-red-500 rounded-full">
                              {" "}
                              {/* Smaller red circle */}
                              {cartItems.length}
                            </div>
                          )}
                        </button>
                        <CartDropdown
                          isOpen={isCartOpen}
                          setIsCartOpen={setIsCartOpen}
                          isCartOpen={isCartOpen}
                          onClose={() => setIsCartOpen(false)}
                          fetchCartItems={fetchCartItems}
                          cartItems={cartItems}
                          setCartItems={setCartItems}
                        />
                      </div>

                      <NavLinkIcon to="/touristWishlist">
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="text-white hover:bg-white/10 p-2 rounded-full transition-colors duration-200 mr-2 navbar-wishlist"
                        >
                          <Heart className="h-7 w-7" />
                          <span className="sr-only">Wishlist</span>
                        </button>
                      </NavLinkIcon>
                    </>
                  )}
                </>
              )}
              {role === undefined ? (
                <div className="navbar-signup-or-login">
                  <NavLink to="/login">Login</NavLink>
                  <Link
                    to="/sign-up"
                    className="ml-3 bg-white text-black hover:bg-white/90 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                  >
                    Sign up
                  </Link>
                </div>
              ) : role !== "admin" || role === "admin" ? (
                <div className="relative navbar-profile" ref={userMenuRef}>
                  <button
                    onClick={() => toggleDropdown("userMenu")}
                    className="inline-flex items-center justify-center p-2 rounded-full text-white hover:bg-white/10 focus:outline-none transition-colors duration-200"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                  {openDropdown === "userMenu" && (
                    <div className="absolute right-0 mt-2 w-48 bg-black/90 rounded-2xl border border-white/20 shadow-lg py-1">
                      <Link
                        to={
                          role === "tourism-governor"
                            ? "/account/faqs"
                            : "/account/info"
                        }
                        className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                        onClick={closeDropdown}
                      >
                        <User className="mr-2 h-4 w-4" />
                        My Account
                      </Link>
                      {role === "tourist" && (
                        <>
                          <Link
                            to="/orders"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Orders
                          </Link>
                          <Link
                            to="/account/history"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <HistoryIcon className="mr-2 h-4 w-4" />
                            Give Feedback
                          </Link>
                          <Link
                            to="/account/upcoming"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                          <Link
                            to="/account/my-complaints"
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                            onClick={closeDropdown}
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Help & Support
                          </Link>
                        </>
                      )}

                      <button
                        onClick={handleLogoutConfirm}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-4 pb-3 border-t border-white/20">
                  <div className="flex items-center px-5">
                    <Link to="/login">
                      <button
                        className="bg-[#1A3B47] text-white hover:bg-white/10 px-4 py-2 rounded-full 
                    transition-colors duration-200 text-sm font-medium border-2 border-white/30"
                      >
                        Logout
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              {role !== undefined && role !== "guest" && (
                <>
                  <button className="text-white hover:bg-white/10 p-2 rounded-full transition-colors duration-200 mr-2">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                  </button>
                  {role === "tourist" && (
                    <>
                      <NavLinkIcon to="/account/cart">
                        <button className="text-white hover:bg-white/10 p-2 rounded-full transition-colors duration-200 mr-2">
                          <ShoppingCart className="h-5 w-5" />
                          <span className="sr-only">Cart</span>
                        </button>
                      </NavLinkIcon>
                      <NavLinkIcon to="/account/wishlist">
                        <button className="text-white hover:bg-white/10 p-2 rounded-full transition-colors duration-200 mr-2">
                          <Heart className="h-5 w-5" />
                          <span className="sr-only">Wishlist</span>
                        </button>
                      </NavLinkIcon>
                    </>
                  )}
                </>
              )}
              <button
                onClick={() => toggleDropdown("mobileMenu")}
                className="inline-flex items-center justify-center p-2 rounded-full text-white hover:bg-white/10 focus:outline-none transition-colors duration-200"
              >
                <span className="sr-only">Open main menu</span>
                {openDropdown === "mobileMenu" ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Navigation */}
        {openDropdown === "mobileMenu" && (
          <div className="md:hidden bg-black/90 mt-2 mx-4 rounded-2xl border border-white/20">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {role === "tour-guide" && (
                <>
                  {/* Itineraries Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown("mobileItineraries")}
                      className="text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium flex items-center"
                    >
                      Itineraries
                      {openDropdown === "mobileItineraries" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </button>
                    {openDropdown === "mobileItineraries" && (
                      <div className="mt-2 w-40 bg-black/90 rounded-lg shadow-lg py-1 border border-white/20 z-50">
                        <NavLink
                          to="/all-itineraries"
                          className="block px-4 py-2"
                          onClick={closeDropdown}
                        >
                          All Itineraries
                        </NavLink>
                        <NavLink
                          to="/my-itineraries"
                          className="block px-4 py-2"
                          onClick={closeDropdown}
                        >
                          My Itineraries
                        </NavLink>
                        <NavLink
                          to="/create-itinerary"
                          className="block px-4 py-2"
                          onClick={closeDropdown}
                        >
                          Create Itinerary
                        </NavLink>
                      </div>
                    )}
                  </div>
                </>
              )}
              {role === "seller" && (
                <>
                  <NavLink to="/seller-profile">Profile</NavLink>
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown("mobileProducts")}
                      className="text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium flex items-center"
                    >
                      Products
                      {openDropdown === "mobileProducts" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </button>
                    {openDropdown === "mobileProducts" && (
                      <div className="mt-2 w-40 bg-black/90 rounded-lg shadow-lg py-1 border border-white/20 z-50">
                        <NavLink
                          to="/all-products"
                          className="block px-4 py-2"
                          onClick={closeDropdown}
                        >
                          All Products
                        </NavLink>
                        <NavLink
                          to="/my-products"
                          className="block px-4 py-2"
                          onClick={closeDropdown}
                        >
                          My Products
                        </NavLink>
                        <NavLink
                          to="/create-product"
                          className="block px-4 py-2"
                          onClick={closeDropdown}
                        >
                          Create Product
                        </NavLink>
                        <NavLink
                          to="/products-archive"
                          className="block px-4 py-2 flex items-center"
                          onClick={closeDropdown}
                        >
                          <ArchiveIcon className="mr-2 h-5 w-5 text-gray-500" />
                          Archived Products
                        </NavLink>
                      </div>
                    )}
                  </div>
                </>
              )}
              {role === "tourist" && (
                <>
                  <NavLink to="/activity" onClick={closeDropdown}>
                    Activities
                  </NavLink>
                  <NavLink to="/all-itineraries" onClick={closeDropdown}>
                    Itineraries
                  </NavLink>
                  <NavLink to="/all-historical-places" onClick={closeDropdown}>
                    Historical Places
                  </NavLink>
                  <NavLink to="/all-products" onClick={closeDropdown}>
                    Products
                  </NavLink>
                </>
              )}
              {role === "advertiser" && (
                <>
                  <NavLink to="/activity" onClick={closeDropdown}>
                    Activities
                  </NavLink>
                </>
              )}
              {role === "tourism-governor" && (
                <>
                  <NavLink to="/all-historical-places" onClick={closeDropdown}>
                    Historical Places
                  </NavLink>
                  <NavLink to="/create-historical-tag" onClick={closeDropdown}>
                    Historical tag
                  </NavLink>
                </>
              )}
              {(role === "guest" || role === undefined) && (
                <>
                  <NavLink
                    to="/activity"
                    onClick={closeDropdown}
                    className="navbar-activities"
                  >
                    Activities
                  </NavLink>
                  <NavLink
                    to="/all-itineraries"
                    onClick={closeDropdown}
                    className="navbar-itineraries"
                  >
                    Itineraries
                  </NavLink>
                  <NavLink
                    to="/all-historical-places"
                    onClick={closeDropdown}
                    className="navbar-historical-places"
                  >
                    Historical Places
                  </NavLink>
                  <NavLink
                    to="/all-products"
                    onClick={closeDropdown}
                    className="navbar-products"
                  >
                    Products
                  </NavLink>
                </>
              )}
              {role !== "guest" && role !== undefined && (
                <>
                  <Link
                    to={
                      role === "tourism-governor"
                        ? "/account/faqs"
                        : "/account/info"
                    }
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                    onClick={closeDropdown}
                  >
                    <User className="mr-2 h-4 w-4" />
                    My Account
                  </Link>
                  {role === "tourist" && (
                    <>
                      <Link
                        to="/account/history"
                        className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                        onClick={closeDropdown}
                      >
                        <HistoryIcon className="mr-2 h-4 w-4" />
                        Give Feedback
                      </Link>
                      <Link
                        to="/account/upcoming"
                        className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                        onClick={closeDropdown}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        to="/account/my-complaints"
                        className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                        onClick={closeDropdown}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Help & Support
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogoutConfirm}
                    type="button"
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </button>
                </>
              )}
            </div>

            {/* Login, Sign Up in Mobile View */}
            {role === undefined && (
              <div className="pt-4 pb-3 border-t border-white/20">
                <div className="flex items-center px-5">
                  <Link to="/login">
                    <button className="text-white hover:bg-white/10 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200">
                      Login
                    </button>
                  </Link>
                  <Link to="/sign-up">
                    <button className="ml-3 bg-white text-black hover:bg-white/90 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200">
                      Sign up
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
      {showLogoutModal && (
        <LogoutPopup onConfirm={handleLogout} onCancel={handleLogoutCancel} />
      )}
    </div>
  );
}
