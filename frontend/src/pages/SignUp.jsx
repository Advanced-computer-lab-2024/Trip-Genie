import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  Form,
  FormControl,
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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const phoneValidator = (value) => {
  const phoneNumber = parsePhoneNumberFromString("+" + value);
  if (!phoneNumber || !phoneNumber.isValid()) {
    return false;
  }
  return true;
};

// const formSchema = stage1Schema.merge(stage2Schema).merge(stage3Schema);

export function SignupForm() {
  const [stage, setStage] = useState(1);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [nationalities, setNationalities] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const alertRef = useRef(null);
  const navigate = useNavigate();

  const formSchema = z
    .object({
      username: z
        .string()
        .min(3, {
          message: "Username must be at least 3 characters.",
        })
        .trim(),
      email: z
        .string()
        .email({
          message: "Please enter a valid email address.",
        })
        .trim()
        .toLowerCase(),
      password: z
        .string()
        .min(8, {
          message: "Password must be at least 8 characters.",
        })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, and one number.\nOnly these characters are allowed: @$!%*?&",
        })
        .trim(),
      userType: z.enum(["tourist", "tour-guide", "advertiser", "seller"], {
        required_error: "Please select a user type.",
      }),
      mobile: z.string().trim().optional(),
      nationality: z.string().optional(),
      dateOfBirth: z.date().optional(),
      jobOrStudent: z.string().trim().optional(),
      yearsOfExperience: z.number().int().optional(),
      previousWorks: z
        .array(
          z.object({
            title: z.string().trim().optional(),
            company: z.string().trim().optional(),
            duration: z.string().trim().optional(),
            description: z.string().trim().optional(),
          })
        )
        .optional(),
      name: z.string().trim().optional(),
      description: z.string().trim().optional(),
      website: z.string().trim().optional(),
      hotline: z.string().trim().optional(),
      documents: z.array(z.any()).optional(),
      profilePicture: z.any().optional(),
      termsAccepted: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.userType === "tourist" ||
        data.userType === "tour-guide" ||
        data.userType === "seller"
      ) {
        if (!phoneValidator(data.mobile)) {
          ctx.addIssue({
            path: ["mobile"],
            message:
              "Please enter a valid phone number with a valid country code.",
          });
        }
      }
      if (data.userType === "tourist" || data.userType === "tour-guide") {
        if (!data.nationality) {
          ctx.addIssue({
            path: ["nationality"],
            message: "Nationality is required.",
          });
        }
      }
      if (data.userType === "tourist") {
        if (
          data.dateOfBirth > new Date() ||
          data.dateOfBirth >
            new Date().setFullYear(new Date().getFullYear() - 18)
        ) {
          ctx.addIssue({
            path: ["dateOfBirth"],
            message: "You must be at least 18 years old.",
          });
        }
        if (!data.jobOrStudent) {
          ctx.addIssue({
            path: ["jobOrStudent"],
            message: "Occupation is required.",
          });
        }
      }
      if (data.userType === "tour-guide") {
        if (data.yearsOfExperience < 0 || data.yearsOfExperience > 50) {
          ctx.addIssue({
            path: ["yearsOfExperience"],
            message: "Experience must be between 0 and 50 years.",
          });
        }
        if (!Number.isInteger(data.yearsOfExperience)) {
          ctx.addIssue({
            path: ["yearsOfExperience"],
            message: "Experience must be an integer value.",
          });
        }
        if (data.previousWorks && data.previousWorks.length > 0) {
          data.previousWorks.forEach((work, index) => {
            if (work.title === "") {
              ctx.addIssue({
                path: ["previousWorks", index, "title"],
                message: "Please enter the title for your previous work.",
              });
            }
            if (work.company === "") {
              ctx.addIssue({
                path: ["previousWorks", index, "company"],
                message: "Please enter the company for your previous work.",
              });
            }
            if (work.duration === "") {
              ctx.addIssue({
                path: ["previousWorks", index, "duration"],
                message: "Please enter the duration for your previous work.",
              });
            }
          });
        }
      }
      if (
        data.userType === "advertiser" ||
        data.userType === "seller" ||
        data.userType === "tour-guide"
      ) {
        if (!data.name) {
          ctx.addIssue({
            path: ["name"],
            message: "Name is required.",
          });
        }
        if (stage === 2 && (!data.documents || data.documents.length === 0)) {
          ctx.addIssue({
            path: ["documents"],
            message: "Please upload the required documents.",
          });
        }
      }
      if (data.userType === "advertiser") {
        if (!data.hotline) {
          ctx.addIssue({
            path: ["hotline"],
            message: "Hotline is required.",
          });
        }

        if (data.hotline && !data.hotline.match(/^\d+$/)) {
          ctx.addIssue({
            path: ["hotline"],
            message: "Hotline must be a number.",
          });
        }

        if (
          data.website &&
          !data.website.match(
            /^(https?:\/\/|ftp:\/\/|www\.)[^\s/$.?#].[^\s]*$/i
          )
        ) {
          ctx.addIssue({
            path: ["website"],
            message: "Website must be a valid URL.",
          });
        }
      }

      if (stage === totalStages && !data.termsAccepted) {
        ctx.addIssue({
          path: ["termsAccepted"],
          message: "Please accept the terms and conditions.",
        });
      }
    });

  const formRefs = {
    username: useRef(null),
    email: useRef(null),
    password: useRef(null),
    userType: useRef(null),
    mobile: useRef(null),
    nationality: useRef(null),
    dateOfBirth: useRef(null),
    jobOrStudent: useRef(null),
    yearsOfExperience: useRef(null),
    name: useRef(null),
    description: useRef(null),
    website: useRef(null),
    hotline: useRef(null),
    documents: useRef(null),
    profilePicture: useRef(null),
    termsAccepted: useRef(null),
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      userType: undefined,
      mobile: "",
      nationality: "",
      dateOfBirth: undefined,
      jobOrStudent: "",
      yearsOfExperience: 0,
      previousWorks: [],
      name: "",
      description: "",
      website: "",
      hotline: "",
      documents: [],
      profilePicture: null,
      termsAccepted: false,
    },
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "previousWorks",
  });

  const userType = watch("userType");

  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/nationalities"
        );
        setNationalities(response.data);
      } catch (error) {
        console.error("Error fetching nationalities:", error);
      }
    };
    fetchNationalities();
  }, []);

  useEffect(() => {
    if (apiError && alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [apiError]);

  const scrollToError = (errors) => {
    for (const field in errors) {
      if (formRefs[field] && formRefs[field].current) {
        formRefs[field].current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        break;
      }
    }
  };

  const handleBack = () => {
    setStage(stage - 1);
  };

  const totalStages = userType === "tourist" || userType === undefined ? 3 : 4;
  const progress = (stage / totalStages) * 100;

  const onSubmit = async (values) => {
    if (stage === 1) {
      const { username, email } = values;
      try {
        await axios.get(
          `http://localhost:4000/auth/check-unique?username=${username}&email=${email}`
        );
      } catch (error) {
        const response = error.response;
        if (response.data.existingUsername) {
          console.log("Username already exists");
          setApiError("Username already exists");
          return;
        }
        if (response.data.existingEmail) {
          setApiError("Email already exists");
          return;
        }
      }
    }
    if (stage < totalStages) {
      setFormData({ ...formData, ...values });
      console.log("Form data:", formData);
      setStage(stage + 1);
      return;
    }

    console.log("Final form data:", { ...formData, ...values });

    setIsLoading(true);
    setApiError(null);
    values.mobile = "+" + values.mobile;

    try {
      const finalData = { ...formData, ...values };
      for (const key in values) {
        if (key === "documents") {
          values[key].forEach((doc) => {
            finalData.append(`documents`, doc);
          });
        } else if (key === "profilePicture") {
          if (userType === "advertiser" || userType === "seller") {
            finalData.append("logo", values[key]);
          } else {
            finalData.append("profilePicture", values[key]);
          }
        } else {
          finalData.append(key, values[key]);
        }
      }

      await axios.post(`http://localhost:4000/auth/sign-up/`, finalData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setShowSignupSuccess(true);
    } catch (error) {
      if (error.response) {
        setApiError(
          error.response.data.message || "An error occurred during signup"
        );
      } else if (error.request) {
        setApiError("No response received from server. Please try again.");
      } else {
        setApiError("An error occurred during signup. Please try again.");
      }
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStage = () => {
    switch (stage) {
      case 1:
        return (
          <>
            <FormField
              control={control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username*</FormLabel>
                  <FormControl>
                    <Input placeholder="Username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email*</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="mail@example.com"
                      {...field}
                      ref={formRefs.email}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password*</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Password"
                      {...field}
                      ref={formRefs.password}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(userType === "tourist" ||
              userType === "tour-guide" ||
              userType === "seller") && (
              <>
                <FormField
                  control={control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile*</FormLabel>
                      <FormControl>
                        <PhoneInput
                          country={"eg"}
                          value={field.value}
                          onChange={(value) => field.onChange(value)}
                          excludeCountries={["il"]}
                          inputProps={{
                            name: "mobile",
                            required: true,
                            autoFocus: true,
                            placeholder: "+1234567890",
                            ref: formRefs.mobile,
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {(userType === "tourist" || userType === "tour-guide") && (
              <>
                <FormField
                  control={control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger ref={formRefs.nationality}>
                            <SelectValue placeholder="Please choose your nationality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {nationalities.map((nat) => (
                            <SelectItem key={nat._id} value={nat._id}>
                              {nat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {userType === "tourist" && (
              <>
                <FormField
                  control={control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of birth*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              ref={formRefs.dateOfBirth}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DatePicker
                            selected={field.value}
                            onChange={field.onChange}
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                            minDate={new Date("1900-01-01")}
                            maxDate={new Date()}
                            dateFormat="dd/MM/yyyy"
                            inline
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="jobOrStudent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation/Student*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your occupation"
                          {...field}
                          ref={formRefs.jobOrStudent}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {(userType === "seller" ||
              userType === "advertiser" ||
              userType === "tour-guide") && (
              <>
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Name"
                          {...field}
                          ref={formRefs.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {userType === "tour-guide" && (
              <>
                <FormField
                  control={control}
                  name="yearsOfExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of experience*</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Years of experience"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? 0 : +e.target.value
                            )
                          }
                          ref={formRefs.yearsOfExperience}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem className="space-y-4">
                  <FormLabel className="text-lg font-semibold">
                    Previous works
                  </FormLabel>
                  {fields.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col space-y-2 mb-4 border p-4 rounded-md shadow-sm"
                    >
                      <FormControl>
                        <>
                          <Input
                            placeholder="Title"
                            {...register(`previousWorks.${index}.title`)}
                            defaultValue={item.title}
                            className="border rounded-md p-2"
                          />
                          {errors?.previousWorks?.[index]?.title && (
                            <p className="text-red-500 text-sm">
                              {errors.previousWorks[index].title.message}
                            </p>
                          )}
                        </>
                      </FormControl>
                      <FormControl>
                        <>
                          <Input
                            placeholder="Company"
                            {...register(`previousWorks.${index}.company`)}
                            defaultValue={item.company}
                            className="border rounded-md p-2"
                          />
                          {errors?.previousWorks?.[index]?.company && (
                            <p className="text-red-500 text-sm">
                              {errors.previousWorks[index].company.message}
                            </p>
                          )}
                        </>
                      </FormControl>
                      <FormControl>
                        <>
                          <Input
                            type="number"
                            placeholder="Duration in years"
                            min="0"
                            {...register(`previousWorks.${index}.duration`)}
                            defaultValue={item.duration}
                            className="border rounded-md p-2"
                          />
                          {errors?.previousWorks?.[index]?.duration && (
                            <p className="text-red-500 text-sm">
                              {errors.previousWorks[index].duration.message}
                            </p>
                          )}
                        </>
                      </FormControl>
                      <FormControl>
                        <Input
                          placeholder="Description"
                          {...register(`previousWorks.${index}.description`)}
                          defaultValue={item.description}
                          className="border rounded-md p-2"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        onClick={() => remove(index)}
                        className="self-end bg-orange-500 text-white p-2 rounded-md"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <div>
                    <Button
                      type="button"
                      onClick={() =>
                        append({
                          title: "",
                          company: "",
                          duration: "",
                          description: "",
                        })
                      }
                      className="bg-purple-900 text-white p-2 rounded-md"
                    >
                      Add Previous Work
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              </>
            )}
            {(userType === "seller" || userType === "advertiser") && (
              <>
                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Description"
                          {...field}
                          ref={formRefs.description}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {userType === "advertiser" && (
              <>
                <FormField
                  control={control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Website"
                          {...field}
                          ref={formRefs.website}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="hotline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hotline*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Hotline"
                          {...field}
                          ref={formRefs.hotline}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </>
        );
      case 2:
        if (["tour-guide", "advertiser", "seller"].includes(userType)) {
          return (
            <>
              <h2 className="text-2xl font-semibold text-gray-900">
                Please upload documents that prove your identity and
                qualifications. For example : ID card, Passport, Certificates,
                etc.
              </h2>
              <FormField
                control={control}
                name="documents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Required Documents*</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        multiple
                        onChange={(e) => {
                          field.onChange(Array.from(e.target.files));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          );
        } else {
          return (
            <>
              <h2 className="text-2xl font-semibold text-gray-900">
                Continue your profile setup by uploading a profile picture.
              </h2>
              <FormField
                control={control}
                name="profilePicture"
                render={({ field }) => (
                  <>
                    <FormItem>
                      <FormLabel>Upload {} (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            field.onChange(e.target.files[0]);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    <Button
                      type="button"
                      className="w-full bg-gray-300 hover:bg-gray-400"
                      onClick={() => setStage(stage + 1)}
                      disabled={isLoading}
                    >
                      Skip
                    </Button>
                  </>
                )}
              />
            </>
          );
        }
      case 3:
        if (userType === "tourist") {
          return (
            <>
              <FormField
                control={control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I accept the terms and conditions</FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </>
          );
        } else {
          return (
            <>
              <h2 className="text-2xl font-semibold text-gray-900">
                Continue your profile setup by uploading a{" "}
                {["advertiser", "seller"].includes(userType)
                  ? "logo"
                  : "profile picture"}
                .
              </h2>
              <FormField
                control={control}
                name="profilePicture"
                render={({ field }) => (
                  <>
                    <FormItem>
                      <FormLabel>Upload {} (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            field.onChange(e.target.files[0]);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    <Button
                      type="button"
                      className="w-full bg-gray-300 hover:bg-gray-400"
                      onClick={() => setStage(stage + 1)}
                      disabled={isLoading}
                    >
                      Skip for now
                    </Button>
                  </>
                )}
              />
            </>
          );
        }
      case 4:
        return (
          <FormField
            control={control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>I accept the terms and conditions</FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg mt-20 mb-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Create an account
          </h2>
        </div>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={control}
              name="userType"
              render={({ field }) => (
                <FormItem className={stage !== 1 ? "hidden" : ""}>
                  <FormLabel>I am a*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger ref={formRefs.userType}>
                        <SelectValue placeholder="Please choose your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tourist">Tourist</SelectItem>
                      <SelectItem value="tour-guide">Tour Guide</SelectItem>
                      <SelectItem value="advertiser">Advertiser</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {userType && (
              <>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">
                    Step {stage} of {totalStages}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-orange-500 h-2.5 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                {apiError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                )}
                {renderStage()}
                <div className="flex justify-between">
                  {stage > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  <Button type="submit">
                    {stage < totalStages ? `Next` : `Submit`}
                  </Button>
                  {/* {stage < totalStages ? (
                <Button type="submit">Next</Button>
              ) : (
                <Button type="submit">Sign up</Button>
              )} */}
                </div>
              </>
            )}
          </form>
        </Form>
        {stage === 1 && (
          <div className="mt-4 text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-orange-500 hover:text-orange-600"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>

      <Dialog
        open={showSignupSuccess}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            navigate("/");
          }
          setShowSignupSuccess(isOpen);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <CheckCircle className="w-6 h-6 text-green-500 inline-block mr-2" />
              Successful Signup
            </DialogTitle>
            <DialogDescription>
              Your account has been created successfully! Please log in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center items-center w-full">
            <div className="flex justify-center w-full">
              <Button
                className="bg-orange-500 mr-4"
                variant="default"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
