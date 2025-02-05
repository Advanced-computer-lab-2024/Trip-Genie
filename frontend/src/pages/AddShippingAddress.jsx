import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Briefcase,
  Building,
  Users,
  Package,
  Building2,
  MapPin,
  Palmtree,
  GraduationCap,
  Map,
} from "lucide-react";
import DeleteConfirmation from "@/components/ui/deletionConfirmation";

export default function ShippingAddresses({
  fetch,
  showToast, // Add showToast prop
}) {
  const [addresses, setAddresses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentAddressId, setCurrentAddressId] = useState(null);
  const [addressDetails, setAddressDetails] = useState({
    streetName: "",
    streetNumber: "",
    floorUnit: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    landmark: "",
    locationType: "home",
    default: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "http://localhost:4000/tourist/shippingAdds",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAddresses(response.data.shippingAddresses || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const handleOpenModal = (address = null) => {
    if (address) {
      setAddressDetails(address);
      setCurrentAddressId(address._id);
    } else {
      resetAddressDetails();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetAddressDetails();
  };

  const resetAddressDetails = () => {
    setAddressDetails({
      streetName: "",
      streetNumber: "",
      floorUnit: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      landmark: "",
      locationType: "home",
      default: false,
    });
    setCurrentAddressId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const token = Cookies.get("jwt");
      console.log(addressDetails);
      if (currentAddressId) {
        // Update address
        await axios.put(
          `http://localhost:4000/tourist/update-shippingAdd/${currentAddressId}`,
          addressDetails,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast("Address updated successfully!", "success"); // Show success toast
      } else {
        // Add new address
        await axios.put(
          "http://localhost:4000/tourist/add-shippingAdd",
          addressDetails,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast("Address added successfully!", "success"); // Show success toast
      }
      fetchAddresses();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving address:", error);
      showToast("Error saving address.", "error"); // Show error toast
    } finally {
      setIsLoading(false);
      fetch();
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const token = Cookies.get("jwt");
      await axios.put(
        `http://localhost:4000/tourist/add-default-shippingAdds/${addressId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAddresses();
      fetch();
      showToast("Address set as default successfully!", "success"); // Show success toast
    } catch (error) {
      console.error("Error setting default address:", error);
      showToast("Error setting default address.", "error"); // Show error toast
    }
  };

  const openDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  const closeDelete = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleDelete = async () => {
    try {
      const token = Cookies.get("jwt");
      await axios.delete(
        `http://localhost:4000/tourist/shippingAdds/${addressToDelete}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAddresses();
      setIsDeleteConfirmOpen(false);
      fetch();
      showToast("Address deleted successfully!", "success"); // Show success toast
    } catch (error) {
      console.error("Error deleting address:", error);
      showToast("Error deleting address.", "error"); // Show error toast
    }
  };

  const getLocationIcon = (locationType) => {
    switch (locationType) {
      case "home":
        return <Home className="w-5 h-5" />;
      case "work":
        return <Briefcase className="w-5 h-5" />;
      case "apartment":
        return <Building className="w-5 h-5" />;
      case "friend_family":
        return <Users className="w-5 h-5" />;
      case "po_box":
        return <Package className="w-5 h-5" />;
      case "office":
        return <Building2 className="w-5 h-5" />;
      case "pickup_point":
        return <MapPin className="w-5 h-5" />;
      case "vacation":
        return <Palmtree className="w-5 h-5" />;
      case "school":
        return <GraduationCap className="w-5 h-5" />;
      default:
        return <Map className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white border rounded-lg shadow-sm p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Shipping Addresses</h2>
        <Button
          onClick={() => handleOpenModal()}
          variant="outline"
          size="sm"
          className="bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Add More
        </Button>
      </div>

      <div className="border rounded-md bg-gray-50 p-2 h-[200px] overflow-y-auto">
        {addresses.length > 0 ? (
          addresses.map((address) => (
            <div
              key={address._id}
              className="bg-white rounded-lg mb-3 p-4 shadow-sm hover:shadow-md transition-shadow relative"
            >
              {address.default && (
                <Badge
                  variant="secondary"
                  className="absolute top-4 right-4 bg-blue-100 hover:bg-blue-100 text-[#388A94]"
                >
                  Default
                </Badge>
              )}

              <div className="mb-3">
                <div className="flex items-center mb-2">
                  {getLocationIcon(address.locationType)}
                  <h3 className="font-semibold text-[#1A3B47] ml-2">
                    {address.locationType.toUpperCase()}
                  </h3>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    {address.streetName} {address.streetNumber}
                    {address.floorUnit && `, ${address.floorUnit}`}
                  </p>
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  {address.landmark && (
                    <p className="text-gray-500">Near: {address.landmark}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-gray-100">
                <Button
                  onClick={() => handleOpenModal(address)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-[#1A3B47]"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    setAddressToDelete(address._id);
                    openDelete();
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-red-600"
                >
                  Delete
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#388A94] hover:text-[#1A3B47]"
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader className="bg-[#388A94] text-white p-4 rounded-t-lg">
                      <DialogTitle className="text-xl font-semibold">
                        Address Details
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 p-4 bg-[#F4F4F4] rounded-b-lg">
                      <p>
                        <strong className="text-[#1A3B47]">Street:</strong>{" "}
                        {address.streetName} {address.streetNumber}
                      </p>
                      {address.floorUnit && (
                        <p>
                          <strong className="text-[#1A3B47]">
                            Floor/Unit:
                          </strong>{" "}
                          {address.floorUnit}
                        </p>
                      )}
                      <p>
                        <strong className="text-[#1A3B47]">City:</strong>{" "}
                        {address.city}
                      </p>
                      <p>
                        <strong className="text-[#1A3B47]">State:</strong>{" "}
                        {address.state}
                      </p>
                      <p>
                        <strong className="text-[#1A3B47]">Country:</strong>{" "}
                        {address.country}
                      </p>
                      <p>
                        <strong className="text-[#1A3B47]">Postal Code:</strong>{" "}
                        {address.postalCode}
                      </p>
                      {address.landmark && (
                        <p>
                          <strong className="text-[#1A3B47]">Landmark:</strong>{" "}
                          {address.landmark}
                        </p>
                      )}
                      <p>
                        <strong className="text-[#1A3B47]">
                          Location Type:
                        </strong>{" "}
                        {address.locationType}
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={() => handleSetDefault(address._id)}
                  variant="ghost"
                  size="sm"
                  className={`text-gray-600 hover:text-[#1A3B47] ${
                    address.default ? "cursor-not-allowed opacity-50" : ""
                  }`}
                  disabled={address.default}
                >
                  Set as Default
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">
            No addresses available. Add one to get started.
          </p>
        )}
      </div>

      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {currentAddressId ? "Edit Address" : "Add Address"}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[500px] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4 p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Street Name
                  </label>
                  <input
                    type="text"
                    name="streetName"
                    value={addressDetails.streetName}
                    onChange={(e) =>
                      setAddressDetails((prev) => ({
                        ...prev,
                        streetName: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Street Number
                  </label>
                  <input
                    type="text"
                    name="streetNumber"
                    value={addressDetails.streetNumber}
                    onChange={(e) =>
                      setAddressDetails((prev) => ({
                        ...prev,
                        streetNumber: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Floor/Unit
                  </label>
                  <input
                    type="text"
                    name="floorUnit"
                    value={addressDetails.floorUnit}
                    onChange={(e) =>
                      setAddressDetails((prev) => ({
                        ...prev,
                        floorUnit: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={addressDetails.city}
                    onChange={(e) =>
                      setAddressDetails((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={addressDetails.state}
                    onChange={(e) =>
                      setAddressDetails((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={addressDetails.country}
                    onChange={(e) =>
                      setAddressDetails((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={addressDetails.postalCode}
                    onChange={(e) =>
                      setAddressDetails((prev) => ({
                        ...prev,
                        postalCode: e.target.value,
                      }))
                    }
                    className="mt-1 block
w-full border rounded-md p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Landmark
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={addressDetails.landmark}
                    onChange={(e) =>
                      setAddressDetails((prev) => ({
                        ...prev,
                        landmark: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location Type
                  </label>
                  <select
                    name="locationType"
                    value={addressDetails.locationType}
                    onChange={(e) =>
                      setAddressDetails((prev) => ({
                        ...prev,
                        locationType: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border rounded-md p-2"
                    required
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="apartment">Apartment</option>
                    <option value="friend_family">Friend/Family</option>
                    <option value="po_box">PO Box</option>
                    <option value="office">Office</option>
                    <option value="pickup_point">Pickup Point</option>
                    <option value="vacation">Vacation</option>
                    <option value="school">School</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {/* <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="default"
                    checked={addressDetails.default}
                    onChange={(e) =>
                      setAddressDetails((prev) => ({
                        ...prev,
                        default: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Set as default
                  </label>
                </div> */}
                <div className="mt-6 flex justify-end space-x-4">
                  <Button
                    type="button"
                    onClick={handleCloseModal}
                    variant="outline"
                    className="bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#1A3B47]"
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
      <DeleteConfirmation
        isOpen={isDeleteConfirmOpen}
        onClose={closeDelete}
        itemType="address"
        onConfirm={handleDelete}
      />
    </div>
  );
}
