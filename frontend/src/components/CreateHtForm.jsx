"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import signUpPicture from "../assets/images/signUpPicture.jpeg";
import backgroundPicture from "../assets/images/backgroundPattern.png";

// Form validation schema using zod
const formSchema = z.object({
  type: z.string().min(1, "Please enter a type"),
  // period: z.string().min(1, 'Please enter a period'),
});

export default function CreateHtForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      // period: '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    const token = Cookies.get("jwt");

    try {
      const response = await fetch(
        `https://trip-genie-apis.vercel.app/tourism-governor/historical-tag`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        setShowDialog(true);
      } else {
        const body = await response.json();
        if (body.message === "Historical tag already exists") {
          setError("Historical Tag already exists");
        } else {
          setError("Failed to create historical tag. Please try again.");
        }
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setShowDialog(false);
    navigate("/");
  };

  const handleCreateNew = () => {
    setShowDialog(false);
    window.location.reload();
  };

  return (
    <div>
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>
      <div
        className="flex min-h-screen  items-center justify-center bg-cover bg-center bg-no-repeat p-2"
        style={{
          backgroundImage: `url(${backgroundPicture})`,
        }}
      >
        <div className="bg-white rounded-xl shadow-xl overflow-hidden w-1/2 max-w-7xl flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 bg-[#B5D3D1] p-6">
            <h2 className="text-3xl font-bold text-[#1A3B47] mb-2">
              Create Historical Tag
            </h2>
            <p className="text-sm mb-6 text-[#1A3B47]">
              Add a new historical tag to categorize historical places and
              events.
            </p>
          </div>
          <div className="w-full md:w-2/3 p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Input
                  {...register("type")}
                  id="type"
                  placeholder="Enter historical tag type"
                />
                {errors.type && (
                  <p className="text-red-500 text-xs">{errors.type.message}</p>
                )}
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="period">Period *</Label>
                <Input
                  {...register('period')}
                  id="period"
                  placeholder="Example: 2000-2008"
                />
                {errors.period && <p className="text-red-500 text-xs">{errors.period.message}</p>}
              </div> */}

              <Button
                type="submit"
                className="w-full bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Historical Tag"}
              </Button>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Success!</DialogTitle>
            <DialogDescription>
              The historical tag was created successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={handleGoBack}
              className="bg-[#5D9297] text-white hover:bg-[#1A3B47]"
            >
              Go to Home Page
            </Button>
            <Button variant="outline" onClick={handleCreateNew}>
              Create Another
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
