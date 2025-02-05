import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Lock, Bell, Shield, Plane } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Cookies from "js-cookie";
import TravelPreferences from "@/components/TouristPreferences";

const validatePassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
};

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [changeStatus, setChangeStatus] = useState({ type: "", message: "" });

  const handleNewPasswordChange = (e) => {
    const newPass = e.target.value;
    setNewPassword(newPass);
    if (!validatePassword(newPass)) {
      setNewPasswordError(
        "Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, and one number."
      );
    } else if (confirmPassword !== newPass) {
      setConfirmPasswordError("New passwords do not match.");
    } else {
      setNewPasswordError("");
      setConfirmPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const confirmPass = e.target.value;
    setConfirmPassword(confirmPass);
    if (newPassword !== confirmPass) {
      setConfirmPasswordError("New passwords do not match.");
    } else if (!validatePassword(newPassword)) {
      setConfirmPasswordError(
        "Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, and one number."
      );
    } else {
      setConfirmPasswordError("");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setChangeStatus({ type: "", message: "" });
    const token = Cookies.get("jwt");
    const role = Cookies.get("role") || "guest";

    try {
      const response = await axios.post(
        `http://localhost:4000/${role}/password`,
        {
          oldPassword,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        setChangeStatus({
          type: "success",
          message:
            "Your password has been successfully updated. Please use your new password for future logins.",
        });
        // Reset form fields
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      setChangeStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "An error occurred. Please try again.",
        errors: error.response?.data?.errors || [],
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Card className="w-full max-w-4xl mx-auto mt-20">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-2xl">Your Genie Settings</CardTitle>
          </div>
          <CardDescription className="text-orange-100">
            Customize your travel experience
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger
                value="general"
                className="flex items-center justify-center"
              >
                <Globe className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center justify-center"
              >
                <Lock className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center justify-center"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="flex items-center justify-center"
              >
                <Shield className="h-4 w-4 mr-2" />
                Privacy
              </TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <h3 className="text-xl font-semibold mb-4">General Settings</h3>
              <p className="text-gray-600 mb-6">
                Manage your account preferences and general settings here.
              </p>
              <TravelPreferences />
            </TabsContent>
            <TabsContent value="security">
              <h3 className="text-xl font-semibold mb-4">Security Settings</h3>
              {changeStatus.type && (
                <Alert
                  className={`mb-4 ${
                    changeStatus.type === "success"
                      ? "bg-green-100 border-green-400 text-green-700"
                      : "bg-red-100 border-red-400 text-red-700"
                  }`}
                >
                  <AlertTitle className="font-semibold">
                    {changeStatus.type === "success" ? "Success" : "Failed"}
                  </AlertTitle>
                  <AlertDescription>{changeStatus.message}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="current-password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Current Password
                  </label>
                  <Input
                    id="current-password"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                  {changeStatus.message === "Incorrect old password" && (
                    <p className="text-red-500 text-sm mt-1">
                      Incorrect old password
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="new-password"
                    className="text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    required
                  />
                </div>
                {newPasswordError && (
                  <p className="text-red-500 text-sm">{newPasswordError}</p>
                )}
                <div className="space-y-2">
                  <label
                    htmlFor="confirm-password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Confirm New Password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                  />
                </div>
                {confirmPasswordError && (
                  <p className="text-red-500 text-sm">{confirmPasswordError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Change Password
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="notifications">
              <h3 className="text-xl font-semibold mb-4">
                Notification Preferences
              </h3>
              <p className="text-gray-600">
                Customize how you receive updates and alerts about your trips.
              </p>
              {/* Add notification settings fields here */}
            </TabsContent>
            <TabsContent value="privacy">
              <h3 className="text-xl font-semibold mb-4">Privacy Controls</h3>
              <p className="text-gray-600">
                Manage your data sharing and privacy settings.
              </p>
              {/* Add privacy control fields here */}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-gray-50 text-sm text-gray-500">
          Need help? Contact our support team for assistance.
        </CardFooter>
      </Card>
    </div>
  );
}
