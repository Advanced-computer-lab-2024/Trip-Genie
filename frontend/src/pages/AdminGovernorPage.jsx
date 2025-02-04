"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Cookies from "js-cookie";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";
import { CheckCircle, XCircle, UserPlus } from "lucide-react";

const formSchema = z.object({
  type: z.enum(["admin", "governor"], {
    required_error: "You need to select a user type.",
  }),
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 8 characters.",
  }),
});

const getPasswordStrength = (password) => {
  const strength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  };

  const fulfilled = Object.values(strength).filter(Boolean).length;
  return { ...strength, fulfilled };
};

const AdminGovernorPage = () => {
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const { username, email, password } = values;
      let response = undefined;
      const token = Cookies.get("jwt");

      if (values.type === "admin") {
        response = await fetch(
          "https://trip-genie-apis.vercel.app/admin/admins",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password }),
          }
        );
      } else {
        response = await fetch(
          "https://trip-genie-apis.vercel.app/admin/governors",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password }),
          }
        );
      }

      if (!response.ok) {
        const reply = await response.json();
        throw new Error(reply.message);
      }

      setToastMessage("User added successfully!");
      setToastType("success");
      form.reset();
    } catch (error) {
      console.error("Error:", error.message);
      setToastMessage(error.message);
      setToastType("error");
    } finally {
      setIsToastOpen(true);
      setTimeout(() => setIsToastOpen(false), 3000); // Close toast after 3 seconds
      setIsSubmitting(false);
    }
  };

  const strength = getPasswordStrength(password);

  const getProgressBarColor = () => {
    if (strength.fulfilled === 2) return "bg-[#F88C33]";
    if (strength.fulfilled === 3) return "bg-[#5D9297]";
    return "bg-red-500";
  };

  const getStrengthLabel = () => {
    if (strength.fulfilled === 2) return "Could Be Stronger";
    if (strength.fulfilled === 3) return "Strong Password";
    return "Too Weak";
  };

  return (
    <ToastProvider>
      <div className="mb-8 relative">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#003f66]">Type *</FormLabel>
                  <div className="flex space-x-4 mb-6">
                    <Button
                      type="button"
                      variant={field.value === "admin" ? "solid" : "outline"}
                      onClick={() => field.onChange("admin")}
                      className={`w-full ${
                        field.value === "admin"
                          ? "bg-[#5D9297] text-white"
                          : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                      }`}
                    >
                      Admin
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === "governor" ? "solid" : "outline"}
                      onClick={() => field.onChange("governor")}
                      className={`w-full ${
                        field.value === "governor"
                          ? "bg-[#5D9297] text-white"
                          : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                      }`}
                    >
                      Governor
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#003f66]">
                        Username *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter username"
                          {...field}
                          className="border-[#808080]"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a unique username (min 3 characters).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#003f66]">Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email"
                          {...field}
                          className="border-[#808080]"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a valid email address.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#003f66]">
                        Password *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter password"
                          {...field}
                          className="border-[#808080]"
                          onChange={(e) => {
                            field.onChange(e);
                            setPassword(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      <div className="flex items-center mt-2 space-x-2 w-full">
                        <div className="relative flex-grow h-2 bg-gray-200 rounded-full">
                          <div
                            className={`absolute h-2 rounded-full transition-all duration-300 ${
                              password.length === 0
                                ? "bg-gray-300"
                                : getProgressBarColor()
                            }`}
                            style={{
                              width: `${
                                password.length === 0
                                  ? 0
                                  : Math.max(strength.fulfilled / 3, 1 / 3) *
                                    100
                              }%`,
                            }}
                          ></div>
                        </div>
                        {password.length > 0 && (
                          <p className="text-sm font-medium text-gray-700 ml-2">
                            {getStrengthLabel()}
                          </p>
                        )}
                      </div>
                    </FormItem>
                  )}
                />
                <ul className="text-sm mt-4 space-y-1">
                  <li
                    className={`flex items-center ${
                      strength.length ? "text-[#388A94]" : "text-gray-500"
                    }`}
                  >
                    <span
                      className={`mr-2 w-4 h-4 flex items-center justify-center rounded-full border ${
                        strength.length
                          ? "bg-[#388A94] text-white"
                          : "border-gray-500"
                      }`}
                    >
                      ✓
                    </span>
                    At least 8 characters
                  </li>
                  <li
                    className={`flex items-center ${
                      strength.uppercase ? "text-[#388A94]" : "text-gray-500"
                    }`}
                  >
                    <span
                      className={`mr-2 w-4 h-4 flex items-center justify-center rounded-full border ${
                        strength.uppercase
                          ? "bg-[#388A94] text-white"
                          : "border-gray-500"
                      }`}
                    >
                      ✓
                    </span>
                    At least one uppercase letter
                  </li>
                  <li
                    className={`flex items-center ${
                      strength.number ? "text-[#388A94]" : "text-gray-500"
                    }`}
                  >
                    <span
                      className={`mr-2 w-4 h-4 flex items-center justify-center rounded-full border ${
                        strength.number
                          ? "bg-[#388A94] text-white"
                          : "border-gray-500"
                      }`}
                    >
                      ✓
                    </span>
                    At least one number
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end mb-6 mr-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1A3B47] hover:bg-[#1A3B47]/90 text-white px-12 py-4 text-xl"
              >
                <UserPlus className="mr-2 h-6 w-6" />
                {isSubmitting ? "Adding..." : "Add User"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      <ToastViewport />
      {isToastOpen && (
        <Toast
          onOpenChange={setIsToastOpen}
          open={isToastOpen}
          duration={3000}
          className={toastType === "success" ? "bg-green-100" : "bg-red-100"}
        >
          <div className="flex items-center">
            {toastType === "success" ? (
              <CheckCircle className="text-green-500 mr-2" />
            ) : (
              <XCircle className="text-red-500 mr-2" />
            )}
            <div>
              <ToastTitle>
                {toastType === "success" ? "Success" : "Error"}
              </ToastTitle>
              <ToastDescription>{toastMessage}</ToastDescription>
            </div>
          </div>
          <ToastClose />
        </Toast>
      )}
    </ToastProvider>
  );
};

export default AdminGovernorPage;
