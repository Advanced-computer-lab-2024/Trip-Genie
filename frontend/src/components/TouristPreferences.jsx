import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import Select from "react-select";
import Cookies from "js-cookie";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Range, getTrackBackground } from "react-range";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast";

import { CheckCircle, XCircle } from "lucide-react";

const schema = z.object({
  budget: z.number().min(0, "Budget must be a positive number").nullable(),
  price: z.number().min(0, "Price must be a positive number").nullable(),
  categories: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .nullable(),
  tourLanguages: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .nullable(),
  tourType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .nullable(),
  historicalPlaceType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .nullable(),
});

function DualHandleSliderComponent({
  min,
  max,
  symbol,
  step,
  values,
  exchangeRate,
  onChange,
  middleColor = "#B5D3D1",
  colorRing = "#5D9297",
}) {
  return (
    <div className="w-4/5 mx-auto px-4 py-3">
      <Range
        values={values}
        step={step}
        min={min}
        max={max}
        onChange={onChange}
        renderTrack={({ props, children }) => {
          const { key, ...restProps } = props;
          return (
            <div
              {...restProps}
              className="w-full h-3 pr-2 my-4 bg-gray-200 rounded-md"
              style={{
                background: getTrackBackground({
                  values,
                  colors: ["#ccc", middleColor, "#ccc"],
                  min,
                  max,
                }),
              }}
            >
              {React.Children.map(children, (child, index) =>
                React.cloneElement(child, { key: `thumb-${index}` })
              )}
            </div>
          );
        }}
        renderThumb={({ props, isDragged }) => {
          const { key, ...restProps } = props;
          return (
            <div
              {...restProps}
              className={`w-5 h-5 transform translate-x-10 bg-white rounded-full shadow flex items-center justify-center ${
                isDragged ? `ring-2 ring-[${colorRing}]` : ""
              }`}
            >
              <div className={`w-2 h-2 bg-[${colorRing}] rounded-full`} />
            </div>
          );
        }}
      />
      <div className="flex justify-between mt-2">
        <span className="text-sm font-medium text-gray-700">
          Min: {symbol}
          {Math.ceil(values[0] * exchangeRate)}
        </span>
        <span className="text-sm font-medium text-gray-700">
          Max: {symbol}
          {Math.ceil(values[1] * exchangeRate)}
        </span>
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="">
      <h1 className="text-3xl font-bold mb-2">Travel Preferences</h1>
      <p className="text-sm text-gray-500 mb-6">
        Settings and Privacy / Preferences
      </p>
      <div className="container mx-auto px-4 animate-pulse">
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="h-5 bg-gray-300 rounded mb-2 w-1/4"></div>
              <div className="h-3 bg-gray-300 rounded mb-4 w-full"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="h-5 bg-gray-300 rounded mb-2 w-1/4"></div>
                <div className="h-10 bg-gray-300 rounded mb-4 w-full"></div>
              </div>
              <div>
                <div className="h-5 bg-gray-300 rounded mb-2 w-1/4"></div>
                <div className="h-10 bg-gray-300 rounded mb-4 w-full"></div>
              </div>
              <div>
                <div className="h-5 bg-gray-300 rounded mb-2 w-1/4"></div>
                <div className="h-10 bg-gray-300 rounded mb-4 w-full"></div>
              </div>
              <div>
                <div className="h-5 bg-gray-300 rounded mb-2 w-1/4"></div>
                <div className="h-10 bg-gray-300 rounded mb-4 w-full"></div>
              </div>
            </div>
          </div>
          <div className="h-10 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}

export default function TravelPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [options, setOptions] = useState({
    languages: [],
    categories: [],
    tourTypes: [],
    historicalTypes: [],
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [sliderValues, setSliderValues] = useState([0, 1000]);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      budget: null,
      price: null,
      categories: null,
      tourLanguages: null,
      tourType: null,
      historicalPlaceType: null,
    },
  });

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/rates"
      );
      return response.data.rates;
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      return {};
    }
  }, []);

  const fetchUserInfo = useCallback(async () => {
    const token = Cookies.get("jwt");
    try {
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/tourist/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const currencyId = response.data.preferredCurrency;

      const currencyResponse = await axios.get(
        `https://trip-genie-apis.vercel.app/tourist/getCurrency/${currencyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return {
        preferredCurrency: currencyResponse.data,
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("jwt");
        const headers = { Authorization: `Bearer ${token}` };

        const [
          prefsRes,
          langsRes,
          catsRes,
          typesRes,
          histTypesRes,
          exchangeRates,
          userInfo,
        ] = await Promise.all([
          axios.get("https://trip-genie-apis.vercel.app/tourist/preferences", {
            headers,
          }),
          axios.get("https://trip-genie-apis.vercel.app/api/getAllLanguages"),
          axios.get("https://trip-genie-apis.vercel.app/api/getAllCategories"),
          axios.get("https://trip-genie-apis.vercel.app/api/getAllTypes"),
          axios.get(
            "https://trip-genie-apis.vercel.app/api/getAllHistoricalTypes"
          ),

          fetchExchangeRates(),
          fetchUserInfo(),
        ]);

        setPreferences(prefsRes.data);

        const optionsData = {
          languages: langsRes.data.map((lang) => ({
            value: lang,
            label: lang,
          })),
          categories: catsRes.data.map((cat) => ({
            value: cat.name,
            label: cat.name,
          })),
          tourTypes: typesRes.data.map((type) => ({
            value: type,
            label: type,
          })),
          historicalTypes: histTypesRes.data.map((type) => ({
            value: type,
            label: type,
          })),
        };

        setOptions(optionsData);

        const formattedPrefs = {
          ...prefsRes.data,
          categories:
            prefsRes.data.categories?.map((cat) =>
              optionsData.categories.find((o) => o.value === cat)
            ) || null,
          tourLanguages:
            prefsRes.data.tourLanguages?.map((lang) =>
              optionsData.languages.find((o) => o.value === lang)
            ) || null,
          tourType:
            prefsRes.data.tourType?.map((type) =>
              optionsData.tourTypes.find((o) => o.value === type)
            ) || null,
          historicalPlaceType:
            prefsRes.data.historicalPlaceType?.map((type) =>
              optionsData.historicalTypes.find((o) => o.value === type)
            ) || null,
        };

        reset(formattedPrefs);

        if (userInfo && userInfo.preferredCurrency) {
          const baseRate = exchangeRates["USD"] || 1;
          const targetRate =
            exchangeRates[userInfo.preferredCurrency.code] || 1;
          setExchangeRate(targetRate / baseRate);
          setCurrencySymbol(userInfo.preferredCurrency.symbol);
        }

        setSliderValues([
          formattedPrefs.price ? formattedPrefs.price / exchangeRate : 0,
          formattedPrefs.budget ? formattedPrefs.budget / exchangeRate : 1000,
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [reset, fetchExchangeRates, fetchUserInfo]);

  const onSubmit = async (data) => {
    try {
      const token = Cookies.get("jwt");
      const headers = { Authorization: `Bearer ${token}` };

      const updatedData = {
        budget: data.budget === null ? Infinity : data.budget,
        price: data.price === null ? Infinity : data.price,
        categories: data.categories?.map((item) => item.value) || [],
        tourLanguages: data.tourLanguages?.map((item) => item.value) || [],
        tourType: data.tourType?.map((item) => item.value) || [],
        historicalPlaceType:
          data.historicalPlaceType?.map((item) => item.value) || [],
      };

      await axios.put(
        "https://trip-genie-apis.vercel.app/tourist/preferences",
        updatedData,
        { headers }
      );
      showToast("Preferences updated successfully", "success");
    } catch (error) {
      console.error("Error updating preferences:", error);
      showToast("Failed to update preferences. Please try again.", "error");
    }
  };

  const handleSliderChange = (values) => {
    setSliderValues(values);
    setValue("price", values[0]);
    setValue("budget", values[1]);
  };

  if (Cookies.get("role") !== "tourist") {
    return null;
  }

  if (!preferences) return <SkeletonLoader />;

  return (
    <ToastProvider>
      <div>
        <h1 className="text-3xl font-bold mb-2">Travel Preferences</h1>
        <p className="text-sm text-gray-500 mb-6">
          Settings and Privacy / Preferences
        </p>
        <div className="container mx-auto px-4">
          {" "}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4 ">
              <div>
                <Label className="text-lg font-semibold text-[#1A3B47] mb-1">
                  Price and Budget Range
                </Label>
                <DualHandleSliderComponent
                  min={0}
                  max={10000}
                  step={50}
                  values={sliderValues}
                  exchangeRate={exchangeRate}
                  symbol={currencySymbol}
                  onChange={handleSliderChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="categories"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Label
                        htmlFor="categories"
                        className="text-lg font-semibold text-[#1A3B47] mb-1"
                      >
                        Categories
                      </Label>
                      <Select
                        {...field}
                        isMulti
                        options={options.categories}
                        value={field.value || []}
                        onChange={(newValue) => field.onChange(newValue)}
                        className="mt-1"
                      />
                    </div>
                  )}
                />
                <Controller
                  name="tourLanguages"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Label
                        htmlFor="tourLanguages"
                        className="text-lg font-semibold text-[#1A3B47] mb-1"
                      >
                        Tour Languages
                      </Label>
                      <Select
                        {...field}
                        isMulti
                        options={options.languages}
                        value={field.value || []}
                        onChange={(newValue) => field.onChange(newValue)}
                        className="mt-1"
                      />
                    </div>
                  )}
                />
                <Controller
                  name="tourType"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Label
                        htmlFor="tourType"
                        className="text-lg font-semibold text-[#1A3B47] mb-1"
                      >
                        Tour Type
                      </Label>
                      <Select
                        {...field}
                        isMulti
                        options={options.tourTypes}
                        value={field.value || []}
                        onChange={(newValue) => field.onChange(newValue)}
                        className="mt-1"
                      />
                    </div>
                  )}
                />
                <Controller
                  name="historicalPlaceType"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Label
                        htmlFor="historicalPlaceType"
                        className="text-lg font-semibold text-[#1A3B47] mb-1"
                      >
                        Historical Place Type
                      </Label>
                      <Select
                        {...field}
                        isMulti
                        options={options.historicalTypes}
                        value={field.value || []}
                        onChange={(newValue) => field.onChange(newValue)}
                        className="mt-1"
                      />
                    </div>
                  )}
                />
              </div>
            </div>
            <Button
              type="submit"
              className=" bg-[#388A94] hover:bg-[#2e6b77] text-white"
            >
              Update Preferences
            </Button>
          </form>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Success</DialogTitle>
              </DialogHeader>
              <p>{dialogMessage}</p>
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            </DialogContent>
          </Dialog>
        </div>
        {isToastOpen && (
          <Toast
            onOpenChange={setIsToastOpen}
            open={isToastOpen}
            duration={1500}
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
              <ToastClose />
            </div>
          </Toast>
        )}
        <ToastViewport className="fixed top-0 right-0 p-4" />
      </div>
    </ToastProvider>
  );
}
