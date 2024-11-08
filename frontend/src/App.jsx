import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/login.jsx";
import ItineraryDetail from "./components/ItineraryDetail.jsx";
import UpdateItinerary from "./components/UpdateItinerary.jsx";
import UpdateProduct from "./components/UpdateProduts.jsx";
import UpdatehistoricalPlace from "./components/UpdateHP.jsx";
import ProductDetail from "./components/ProductDetail.jsx";

import ShoppingCart from "./components/touristCart.jsx";
import WishlistPage from "./components/touristWishlist.jsx";
// import TouristPurchases from "./components/touristPurchases.jsx";

import CreateItineraryPage from "./pages/CreateItineraryPage.jsx";
import CreateProduct from "./components/CreateProduct.jsx";
import { NavbarComponent } from "./components/navbar.jsx";
import { FooterComponent } from "./components/footer.jsx";
import { AllHistoricalPlacesComponent } from "./pages/viewAllHistoricalPlaces.jsx";
import { AllItinerariesComponent } from "./components/all-trip-plans.jsx";
import { MyItinerariesComponent } from "./components/myItineraries.jsx";
import { MyProducts } from "./components/myProducts.jsx";
import HistoricalPlaceDetail from "./components/HistoricalPlaceDetail.jsx";
import ViewComplaints from "./components/ViewComplaints.jsx";
import { ViewComplaintDetails } from "./components/ViewComplaintDetails.jsx";

import { AllProducts } from "./components/all-products.jsx";
import { SignupForm } from "./pages/SignUp.jsx";
import { Dashboard } from "./pages/AdminDashProMax.jsx";
import CreateHpPage from "./pages/CreateHpPage.jsx";
import Checkout from "./pages/checkout.jsx";
import CheckoutPage from "./pages/checkout2.jsx";
import { AllActivitiesComponent } from "./pages/AllActivities.jsx";
import { MyActivitiesComponent } from "./pages/myActivities.jsx";
import ActivityDetail from "./pages/SingleActivity.jsx";
import FileComplaint from "./pages/FileComplaint.jsx";
// import {Cart} from "./pages/AccountTourist.jsx";
// import {RedeemPoints} from "./pages/AccountTourist.jsx";
// import {AccountInfo} from "./pages/AccountTourist.jsx";
import AccountTourist from "./pages/AccountTourist.jsx";

import UpdateActivity from "./components/UpdateActivity.jsx";
import CreateActivity from "./pages/CreateActivity.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import CreateHtpage from "./pages/CreateHtpage.jsx";
import NotFound from "./components/NotFound.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import TouristActivities from "./pages/TouristActivities.jsx";
import { ProductArchive } from "./components/product-archive.jsx";
import BookingPage from "./pages/FlightBooking.jsx";
import FileViewer from "./components/FileViewer.jsx";
import HotelBookingPage from "./pages/HotelBooking.jsx";
import UserApproval from "./components/userApproval.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import FAQs from "./pages/FAQs.jsx";
import TermsandCondition from "./pages/TermsandCondition.jsx";
import { DeleteAccount } from "@/components/DeleteAccPopout.jsx";
import AdminGovernorPage from "./pages/AdminGovernorPage";
import TagsPage from "./pages/TagsPage";
import CategoriesPage from "./pages/CategoriesPage";
import TransportationPage from "./pages/TransportationPage.jsx";
import MyHistoricalPlacesComponent from "./pages/myHP.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppContent() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/sign-up";
  return (
    <div className="App">
      <ScrollToTop />
      {!isAuthPage && <NavbarComponent />}

      <div className="pages">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "tourist",
                  "seller",
                  "tour-guide",
                  "advertiser",
                  "tourism-governor",
                  "guest",
                ]}
              >
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={["tourist"]}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout2"
            element={
              <ProtectedRoute allowedRoles={["tourist"]}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          {/* <Route path='/tour-guide-home' element={<Tghome />} /> */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/create-historicalPlace"
            element={
              <ProtectedRoute allowedRoles={["tourism-governor"]}>
                <CreateHpPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/touristActivity"
            element={
              <ProtectedRoute allowedRoles={["tourist"]}>
                <TouristActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-product"
            element={
              <ProtectedRoute allowedRoles={["seller", "admin"]}>
                <CreateProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-itinerary"
            element={
              <ProtectedRoute allowedRoles={["tour-guide"]}>
                <CreateItineraryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/file-complaint"
            element={
              <ProtectedRoute allowedRoles={["tourist"]}>
                <FileComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/*"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "tourist",
                  "advertiser",
                  "seller",
                  "tour-guide",
                  "admin",
                  "tourism-governor",
                ]}
              >
                <AccountTourist />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-activity"
            element={
              <ProtectedRoute allowedRoles={["advertiser"]}>
                <CreateActivity />
              </ProtectedRoute>
            }
          />

          <Route
            path="/activity"
            element={
              <ProtectedRoute
                allowedRoles={["advertiser", "tour-guide", "tourist", "guest"]}
              >
                <AllActivitiesComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historical-place/:id"
            element={
              <ProtectedRoute
                allowedRoles={["tourism-governor", "guest", "tourist", "admin"]}
              >
                <HistoricalPlaceDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-historical-place/:id"
            element={
              <ProtectedRoute allowedRoles={["tourism-governor"]}>
                <UpdatehistoricalPlace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/all-itineraries"
            element={
              <ProtectedRoute
                allowedRoles={["tour-guide", "guest", "tourist", "admin"]}
              >
                <AllItinerariesComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-itineraries"
            element={
              <ProtectedRoute allowedRoles={["tour-guide"]}>
                <MyItinerariesComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-activities"
            element={
              <ProtectedRoute allowedRoles={["advertiser"]}>
                <MyActivitiesComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-historical-places"
            element={
              <ProtectedRoute allowedRoles={["tourism-governor"]}>
                <MyHistoricalPlacesComponent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-products"
            element={
              <ProtectedRoute allowedRoles={["seller", "admin"]}>
                <MyProducts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/all-historical-places"
            element={
              <ProtectedRoute
                allowedRoles={["tourism-governor", "guest", "tourist", "admin"]}
              >
                <AllHistoricalPlacesComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/sign-up" element={<SignupForm />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/complaints"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ViewComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-accounts"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DeleteAccount />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaint/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ViewComplaintDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itinerary/:id"
            element={
              <ProtectedRoute
                allowedRoles={["tour-guide", "guest", "tourist", "admin"]}
              >
                <ItineraryDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/all-products"
            element={
              <ProtectedRoute
                allowedRoles={["seller", "admin", "guest", "tourist"]}
              >
                <AllProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product/:id"
            element={
              <ProtectedRoute
                allowedRoles={["seller", "admin", "guest", "tourist"]}
              >
                <ProductDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-product/:id"
            element={
              <ProtectedRoute allowedRoles={["seller", "admin"]}>
                <UpdateProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/touristCart"
            element={
              <ProtectedRoute allowedRoles={["tourist"]}>
                <ShoppingCart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/privacy"
            element={
              <ProtectedRoute
                allowedRoles={["advertiser", "tour-guide", "tourist", "guest"]}
              >
                <PrivacyPolicy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faqs"
            element={
              <ProtectedRoute
                allowedRoles={["advertiser", "tour-guide", "tourist", "guest"]}
              >
                <FAQs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/terms"
            element={
              <ProtectedRoute
                allowedRoles={["advertiser", "tour-guide", "tourist", "guest"]}
              >
                <TermsandCondition />
              </ProtectedRoute>
            }
          />
          <Route
            path="/touristWishlist"
            element={
              <ProtectedRoute allowedRoles={["tourist"]}>
                <WishlistPage />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/touristPurchases"
            element={
              <ProtectedRoute allowedRoles={["tourist"]}>
                <TouristPurchases />
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="/update-itinerary/:id"
            element={
              <ProtectedRoute allowedRoles={["tour-guide"]}>
                <UpdateItinerary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-activity/:id"
            element={
              <ProtectedRoute allowedRoles={["advertiser"]}>
                <UpdateActivity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity/:id"
            element={
              <ProtectedRoute
                allowedRoles={["advertiser", "tour-guide", "tourist", "guest"]}
              >
                <ActivityDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-historical-tag"
            element={
              <ProtectedRoute allowedRoles={["tourism-governor"]}>
                <CreateHtpage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "tourist",
                  "seller",
                  "tour-guide",
                  "advertiser",
                  "tourism-governor",
                  "admin",
                ]}
              >
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/flights"
            element={
              <ProtectedRoute allowedRoles={["tourist"]}>
                <BookingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hotels"
            element={
              <ProtectedRoute allowedRoles={["tourist"]}>
                <HotelBookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product-archive"
            element={
              <ProtectedRoute allowedRoles={["admin", "seller"]}>
                <ProductArchive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-approval"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UserApproval />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />

          {/* <Route path = '/museums' element = {<HistoricalPlaceList/>}/> */}
          <Route
            path="/add-admin-governor"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminGovernorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-tags"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <TagsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-categories"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transportation"
            element={
              <ProtectedRoute allowedRoles={["tourist", "advertiser"]}>
                <TransportationPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      {!isAuthPage && <FooterComponent />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
