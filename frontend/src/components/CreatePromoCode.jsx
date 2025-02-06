import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Plus, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";
import Cookies from "js-cookie";

const formSchema = z.object({
  code: z
    .string()
    .min(3, {
      message: "Code must be at least 3 characters long",
    })
    .max(20, {
      message: "Code must not exceed 20 characters",
    }),
  status: z.enum(["active", "inactive"]),
  percentOff: z.number(),
  usage_limit: z.number().min(1),
  dateRange: z
    .object({
      start: z
        .date()
        .nullable()
        .refine((date) => date !== null, {
          message: "Please select a start date.",
        }),
      end: z
        .date()
        .nullable()
        .refine((date) => date !== null, {
          message: "Please select an end date.",
        }),
    })
    .refine((data) => data.end > data.start, {
      message: "End date must be after the start date.",
      path: ["end"],
    }),
});

export function CreatePromoCode() {
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      status: "active",
      percentOff: 10,
      usage_limit: 5,
      dateRange: {
        start: null,
        end: null,
      },
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      const token = Cookies.get("jwt");
      const formattedValues = {
        ...values,
        dateRange: {
          start: values.dateRange.start.toISOString(),
          end: values.dateRange.end.toISOString(),
        },
      };
      const response = await fetch(
        "https://trip-genie-apis.vercel.app/admin/promo-code",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formattedValues),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create promo code");
      }

      const data = await response.json();
      console.log(data);
      form.reset();
      setToastMessage("Promo code created successfully!");
      setToastType("success");
      setIsToastOpen(true);
    } catch (error) {
      console.error(error);
      setToastMessage(error.message);
      setToastType("error");
      setIsToastOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ToastProvider>
      <>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#003f66]">Promo Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="HADWA20"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a unique promo code (min 3 characters).
                    </FormDescription>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#003f66]">Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="percentOff"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-[#003f66]">
                      Percent Off
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="10"
                        {...field}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          field.onChange(value);
                          if (value < 1) {
                            form.setError("percentOff", {
                              type: "manual",
                              message: "Percent off must be at least 1",
                            });
                          } else if (value > 100) {
                            form.setError("percentOff", {
                              type: "manual",
                              message: "Percent off must be at most 100",
                            });
                          } else {
                            form.clearErrors("percentOff");
                          }
                        }}
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a discount percentage (0-100).
                    </FormDescription>
                    {fieldState.error && (
                      <FormMessage className="text-red-500">
                        {fieldState.error.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="usage_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#003f66]">
                      Usage Limit
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the maximum number of times this code can be used.
                    </FormDescription>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field, fieldState }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[#003f66]">Date Range</FormLabel>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full sm:w-[272px] pl-3 text-left font-normal", // Adjust width here
                              !field.value.start && "text-muted-foreground"
                            )}
                          >
                            {field.value.start
                              ? format(field.value.start, "PPP")
                              : "Pick a start date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value.start}
                          onSelect={(date) =>
                            field.onChange({ ...field.value, start: date })
                          }
                          initialFocus
                          disabled={(date) =>
                            date < new Date().setHours(0, 0, 0, 0) ||
                            (field.value.end && date > field.value.end)
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-center">to</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full sm:w-[272px] pl-3 text-left font-normal", // Adjust width here
                              !field.value.end && "text-muted-foreground"
                            )}
                          >
                            {field.value.end
                              ? format(field.value.end, "PPP")
                              : "Pick an end date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value.end}
                          onSelect={(date) =>
                            field.onChange({ ...field.value, end: date })
                          }
                          initialFocus
                          disabled={(date) =>
                            date < new Date().setHours(0, 0, 0, 0) ||
                            (field.value.start && date <= field.value.start)
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormDescription>
                    Select the start and end dates for the promo code validity.
                  </FormDescription>
                  {fieldState.error && (
                    <p className="text-red-500 text-sm font-medium text-destructive">
                      {"Start and end dates must be selected"}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className="flex justify-end mb-6 mr-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1A3B47] hover:bg-[#1A3B47]/90 text-white px-8 py-4 text-xl -mt-28" // Reduce or remove `mt`
              >
                <Plus className="mr-2 h-6 w-6" />
                {isSubmitting ? "Creating..." : "Create Promo Code"}
              </Button>
            </div>
          </form>
        </Form>
      </>

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
}
