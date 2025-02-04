import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { format, set } from "date-fns";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, CheckCircle, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
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
import TermsAndConditions from "@/components/TermsAndConditions";
import { ImageCropper } from "@/components/ImageCropper";

import { Card, CardContent } from "@/components/ui/card";
import {
  PlusCircle,
  MinusCircle,
  Check,
  ChevronLeft,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import signUpPicture from "../assets/images/signUpPicture.jpeg";

const phoneValidator = (value) => {
  const phoneNumber = parsePhoneNumberFromString("+" + value);
  if (!phoneNumber || !phoneNumber.isValid()) {
    return false;
  }
  return true;
};

const requiredDocuments = {
  "tour-guide": ["ID", "Certificates"],
  advertiser: ["ID", "Taxation Registry Card"],
  seller: ["ID", "Taxation Registry Card"],
};

// const formSchema = stage1Schema.merge(stage2Schema).merge(stage3Schema);

const getPasswordStrength = (password) => {
  const strength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  };

  const fulfilled = Object.values(strength).filter(Boolean).length;
  return { ...strength, fulfilled };
};

export function SignupForm() {
  const [stage, setStage] = useState(1);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [nationalities, setNationalities] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const alertRef = useRef(null);
  const navigate = useNavigate();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [canAcceptTerms, setCanAcceptTerms] = useState(false); // Track if user can accept terms
  const termsRef = useRef(null); // Reference to the terms div
  const [showScrollMessage, setShowScrollMessage] = useState(false);
  const divRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);

  const formSchema = z
    .object({
      username: z
        .string()
        .min(3, {
          message: "Username must be at least 3 characters.",
        })
        .trim(),
      fname: z.string().optional(),
      lname: z.string().optional(),
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
    })
    .superRefine((data, ctx) => {
      if (
        data.userType === "tourist" ||
        data.userType === "tour-guide" ||
        data.userType === "seller"
      ) {
        if (!phoneValidator(data.mobile)) {
          scrollToError();
          ctx.addIssue({
            path: ["mobile"],
            message:
              "Please enter a valid phone number with a valid country code.",
          });
        }
      }
      if (data.userType === "tourist" || data.userType === "tour-guide") {
        if (!data.nationality) {
          scrollToError();
          ctx.addIssue({
            path: ["nationality"],
            message: "Nationality is required.",
          });
        }
      }
      if (data.userType === "tourist") {
        if (!data.dateOfBirth) {
          scrollToError();
          ctx.addIssue({
            path: ["dateOfBirth"],
            message: "Date of birth is required.",
          });
        }
        if (
          data.dateOfBirth > new Date() ||
          data.dateOfBirth >
            new Date().setFullYear(new Date().getFullYear() - 18)
        ) {
          scrollToError();
          ctx.addIssue({
            path: ["dateOfBirth"],
            message: "You must be at least 18 years old.",
          });
        }
        if (!data.jobOrStudent) {
          scrollToError();
          ctx.addIssue({
            path: ["jobOrStudent"],
            message: "Occupation is required.",
          });
        }
      }
      if (data.userType === "tour-guide") {
        if (data.yearsOfExperience < 0 || data.yearsOfExperience > 50) {
          scrollToError();
          ctx.addIssue({
            path: ["yearsOfExperience"],
            message: "Experience must be between 0 and 50 years.",
          });
        }
        if (!Number.isInteger(data.yearsOfExperience)) {
          scrollToError();
          ctx.addIssue({
            path: ["yearsOfExperience"],
            message: "Experience must be an integer value.",
          });
        }
        if (data.previousWorks && data.previousWorks.length > 0) {
          data.previousWorks.forEach((work, index) => {
            if (work.title === "") {
              scrollToError();
              ctx.addIssue({
                path: ["previousWorks", index, "title"],
                message: "Please enter the title for your previous work.",
              });
            }
            if (work.company === "") {
              scrollToError();
              ctx.addIssue({
                path: ["previousWorks", index, "company"],
                message: "Please enter the company for your previous work.",
              });
            }
            if (work.duration === "") {
              scrollToError();
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
          scrollToError();
          ctx.addIssue({
            path: ["name"],
            message: "Name is required.",
          });
        }
      }
      if (data.userType === "advertiser") {
        if (!data.hotline) {
          scrollToError();
          ctx.addIssue({
            path: ["hotline"],
            message: "Hotline is required.",
          });
        }

        if (data.hotline && !data.hotline.match(/^\d+$/)) {
          scrollToError();
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
          scrollToError();
          ctx.addIssue({
            path: ["website"],
            message: "Website must be a valid URL.",
          });
        }
      }
    });

  const getProgressBarColor = (password) => {
    const strength = getPasswordStrength(password);
    if (strength.fulfilled === 2) return "bg-[#F88C33]";
    if (strength.fulfilled === 3) return "bg-[#5D9297]";
    return "bg-red-500";
  };

  const getStrengthLabel = (password) => {
    const strength = getPasswordStrength(password);
    if (strength.fulfilled === 2) return "Could Be Stronger";
    if (strength.fulfilled === 3) return "Strong Password";
    return "Too Weak";
  };

  const formRefs = {
    username: useRef(null),
    fname: useRef(null),
    lname: useRef(null),
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
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      fname: "",
      lname: "",
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
    },
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "previousWorks",
  });

  const userType = watch("userType");
  const totalStages = userType === "tourist" || userType === undefined ? 3 : 4;
  const progress = (stage / totalStages) * 100;

  const handleTermsScroll = () => {
    const termsDiv = termsRef.current;
    const scrollBottom =
      termsDiv.scrollTop + termsDiv.clientHeight >= termsDiv.scrollHeight - 1;
    if (scrollBottom) {
      setCanAcceptTerms(true); // Enable checkbox when scrolled to bottom
      setShowScrollMessage(false); // Hide scroll message when scrolled to bottom
    }
  };

  const clearForm = () => {
    for (const key in errors) {
      setError(key, { type: "manual", message: "" });
    }
    form.clearErrors(); // Reset context issues
    //clear the form
    form.reset();
  };

  // Add scroll event listener to terms container
  useEffect(() => {
    const termsDiv = termsRef.current;
    if (termsDiv) {
      termsDiv.addEventListener("scroll", handleTermsScroll);
    }
    // Cleanup the event listener on unmount
    return () => {
      if (termsDiv) {
        termsDiv.removeEventListener("scroll", handleTermsScroll);
      }
    };
  }, [termsRef.current]);

  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/api/nationalities"
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

  const scrollToError = () => {
    console.log("Errors:", errors);
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      console.log("First error field:", firstErrorField);
      if (formRefs[firstErrorField] && formRefs[firstErrorField].current) {
        console.log("Scrolling to:", firstErrorField);
        formRefs[firstErrorField].current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  const scrollToHeight = (height) => {
    window.scrollTo({ top: height, behavior: "smooth" });
  };

  const handleBack = () => {
    setStage(stage - 1);
  };

  // const handleDocumentsUpload = (e) => {
  //   const files = e.target.files;
  //   console.log("Files:", files);
  //   if (files) {
  //     setValidationError(null);
  //     const readers = [];
  //     const newDocumentsArray = [];

  //     Array.from(files).forEach((file) => {
  //       const reader = new FileReader();
  //       readers.push(
  //         new Promise((resolve) => {
  //           reader.onloadend = () => {
  //             newDocumentsArray.push({
  //               name: file.name, // Store the file name
  //               data: reader.result, // Store the Base64 data
  //               type: file.type, // Store the file type
  //             });
  //             resolve();
  //           };
  //           reader.readAsDataURL(file);
  //         })
  //       );
  //     });

  //     console.log("New documents array:", newDocumentsArray);

  //     Promise.all(readers).then(() => {
  //       // setUploadedDocuments([...uploadedDocuments, ...newDocumentsArray]);
  //       setUploadedDocuments(e.target.files);
  //     });

  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = ""; // Clear the input value
  //     }
  //   }
  // };

  const handleFileChange = (e, docType) => {
    if (e.target.files) {
      if (docType === "Certificates" && userType === "tour-guide") {
        setUploadedDocuments((prev) => ({
          ...prev,
          [docType]: [...e.target.files],
        }));
      } else {
        setUploadedDocuments((prev) => ({
          ...prev,
          [docType]: e.target.files[0],
        }));
      }
    }
  };

  const onSubmit = async (values) => {
    console.log("test");
    if (stage === 1) {
      const { username, email } = values;
      try {
        await axios.get(
          `https://trip-genie-apis.vercel.app/auth/check-unique?username=${username}&email=${email}`
        );
      } catch (error) {
        const response = error.response;
        if (response.data.existingUsername) {
          setError("username", {
            type: "manual",
            message: "Username already exists",
          });
          divRef.current.scrollTo({
            top: 0, // specify the height in pixels
            behavior: "smooth", // for smooth scrolling
          });
          return;
        }
        if (response.data.existingEmail) {
          setError("email", {
            type: "manual",
            message: "Email already exists",
          });
          divRef.current.scrollTo({
            top: 0, // specify the height in pixels
            behavior: "smooth", // for smooth scrolling
          });
          return;
        }
      }
    }
    if (
      stage === 2 &&
      ["tour-guide", "advertiser", "seller"].includes(userType)
    ) {
      for (const docType of requiredDocuments[userType]) {
        if (!uploadedDocuments[docType]) {
          setValidationError(
            "Please upload all required documents before proceeding."
          );
          return;
        }
      }
    }

    if (stage < totalStages) {
      setFormData(values);
      setStage(stage + 1);
      setApiError(null);
      return;
    }

    if (!termsAccepted) {
      setShowError(true);
      return;
    } else {
      setShowError(false);
    }

    setIsLoading(true);
    setApiError(null);
    values.mobile = "+" + values.mobile;

    try {
      const finalData = new FormData();
      for (const key in values) {
        if (key === "previousWorks") {
          finalData.append(key, JSON.stringify(values[key]));
        } else {
          finalData.append(key, values[key]);
        }
      }

      if (userType === "tour-guide" || userType === "tourist") {
        finalData.append("profilePicture", profilePicture);
      } else {
        finalData.append("logo", profilePicture);
      }

      Object.entries(uploadedDocuments).forEach(([docType, fileOrFiles]) => {
        if (Array.isArray(fileOrFiles)) {
          fileOrFiles.forEach((file, index) => {
            finalData.append(`${docType}`, file, `${docType}_${index + 1}`);
          });
        } else if (fileOrFiles) {
          finalData.append(docType, fileOrFiles, fileOrFiles.name);
        }
      });

      await axios.post(
        `https://trip-genie-apis.vercel.app/auth/sign-up/${userType}`,
        finalData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
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

  // const handlePictureUpload = (e) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setProfilePicture(reader.result);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const handleImageCropped = (croppedImage) => {
    setProfilePicture(croppedImage);
  };

  useEffect(() => {
    if (
      stage === 2 &&
      ["tour-guide", "advertiser", "seller"].includes(userType)
    ) {
      let flag = true;
      for (const docType of requiredDocuments[userType]) {
        if (!uploadedDocuments[docType]) {
          flag = false;
          break;
        }
      }
      if (flag) {
        setValidationError(null);
      }
    }
  }, [uploadedDocuments, stage, userType]);

  const renderStepIndicator = () => {
    if (!userType) return null;

    return (
      <div className="flex flex-col gap-8">
        {Array.from({ length: totalStages }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="relative">
              {index < totalStages - 1 && (
                <div
                  className={cn(
                    "absolute top-[calc(100%+4px)] left-1/2 w-0.5 h-12 -translate-x-1/2",
                    index < stage - 1 ? "bg-[#1A3B47]" : "bg-[#5D9297]"
                  )}
                />
              )}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                  stage > index + 1 || stage === index + 1
                    ? "bg-[#1A3B47] text-white"
                    : "bg-[#5D9297] text-white"
                )}
              >
                {stage > index + 1 ? <Check className="w-5 h-5" /> : index + 1}
              </div>
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                stage > index + 1 || stage === index + 1
                  ? "text-[#1A3B47]"
                  : "text-[#5D9297]"
              )}
            >
              {index === 0 && "Personal Details"}
              {index === 1 &&
                (["tour-guide", "advertiser", "seller"].includes(userType)
                  ? "Documents"
                  : "Profile Picture")}
              {index === 2 &&
                (["tour-guide", "advertiser", "seller"].includes(userType)
                  ? "Profile Picture"
                  : "Terms")}
              {index === 3 && "Terms and Conditions"}
            </span>
          </div>
        ))}
      </div>
    );
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
              useRef={formRefs.username}
            />

            {userType === "tourist" && (
              <>
                <div className="flex space-x-4">
                  <FormField
                    control={control}
                    name="fname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="First Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                    useRef={formRefs.fname}
                  />

                  <FormField
                    control={control}
                    name="lname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Last Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                    useRef={formRefs.lname}
                  />
                </div>
              </>
            )}

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
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        {...field}
                      />
                      {field.value.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 focus:outline-none"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOffIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="flex items-center mt-2 space-x-2 w-full">
                    <div className="relative flex-grow h-2 bg-gray-200 rounded-full">
                      <div
                        className={`absolute h-2 rounded-full transition-all duration-300 ${
                          watch("password").length === 0
                            ? "bg-gray-300"
                            : getProgressBarColor(watch("password"))
                        }`}
                        style={{
                          width: `${
                            watch("password").length === 0
                              ? 0
                              : Math.max(
                                  getPasswordStrength(watch("password"))
                                    .fulfilled / 3,
                                  1 / 3
                                ) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    {watch("password").length > 0 && (
                      <p className="text-sm font-medium text-gray-700 ml-2">
                        {getStrengthLabel(watch("password"))}
                      </p>
                    )}
                  </div>
                  <ul className="text-sm mt-4 space-y-1">
                    <li
                      className={`flex items-center ${
                        getPasswordStrength(watch("password")).length
                          ? "text-[#388A94]"
                          : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`mr-2 w-4 h-4 flex items-center justify-center rounded-full border ${
                          getPasswordStrength(watch("password")).length
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
                        getPasswordStrength(watch("password")).uppercase
                          ? "text-[#388A94]"
                          : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`mr-2 w-4 h-4 flex items-center justify-center rounded-full border ${
                          getPasswordStrength(watch("password")).uppercase
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
                        getPasswordStrength(watch("password")).number
                          ? "text-[#388A94]"
                          : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`mr-2 w-4 h-4 flex items-center justify-center rounded-full border ${
                          getPasswordStrength(watch("password")).number
                            ? "bg-[#388A94] text-white"
                            : "border-gray-500"
                        }`}
                      >
                        ✓
                      </span>
                      At least one number
                    </li>
                  </ul>
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
                          {...field}
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
              <Card className="w-full max-w-2xl mx-auto">
                <CardContent className="space-y-6 p-6">
                  <FormField
                    control={control}
                    name="yearsOfExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Years of experience*
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter years of experience"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? 0 : +e.target.value
                              )
                            }
                            ref={formRefs.yearsOfExperience}
                            className="w-full p-2 border rounded-md"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">
                      Previous works
                    </Label>
                    {fields.map((item, index) => (
                      <Card key={item.id} className="p-4 space-y-4 bg-gray-50">
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Job title"
                              {...register(`previousWorks.${index}.title`)}
                              defaultValue={item.title}
                              className="w-full p-2 border rounded-md"
                            />
                          </FormControl>
                          {errors?.previousWorks?.[index]?.title && (
                            <FormMessage>
                              {errors.previousWorks[index].title.message}
                            </FormMessage>
                          )}
                        </FormItem>

                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Company name"
                              {...register(`previousWorks.${index}.company`)}
                              defaultValue={item.company}
                              className="w-full p-2 border rounded-md"
                            />
                          </FormControl>
                          {errors?.previousWorks?.[index]?.company && (
                            <FormMessage>
                              {errors.previousWorks[index].company.message}
                            </FormMessage>
                          )}
                        </FormItem>

                        <FormItem>
                          <FormLabel>Duration (years)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Duration in years"
                              min="0"
                              {...register(`previousWorks.${index}.duration`)}
                              defaultValue={item.duration}
                              className="w-full p-2 border rounded-md"
                            />
                          </FormControl>
                          {errors?.previousWorks?.[index]?.duration && (
                            <FormMessage>
                              {errors.previousWorks[index].duration.message}
                            </FormMessage>
                          )}
                        </FormItem>

                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Job description"
                              {...register(
                                `previousWorks.${index}.description`
                              )}
                              defaultValue={item.description}
                              className="w-full p-2 border rounded-md"
                            />
                          </FormControl>
                        </FormItem>

                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          variant="destructive"
                          size="sm"
                          className="mt-2"
                        >
                          <MinusCircle className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </Card>
                    ))}

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
                      variant="outline"
                      className="w-full mt-4 bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Previous Work
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                qualifications.
              </h2>
              <Label htmlFor="documents">Upload Required Documents*</Label>
              {requiredDocuments[userType].map((docType) => (
                <div key={docType}>
                  <label
                    htmlFor={docType}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {docType}
                    {docType === "Certificates" && " (Max 5 files)"}
                  </label>
                  <label
                    htmlFor={docType}
                    className="inline-block cursor-pointer bg-gray-100 px-4 py-2 rounded-lg text-violet-700"
                  >
                    <div className="text-sm  text-[#1A3B47] ">
                      {uploadedDocuments[docType]?.name || "Select a file..."}
                    </div>
                    <Input
                      id={docType}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        const limitedFiles = files.slice(0, 5); // Select only the first 5 files
                        handleFileChange(
                          {
                            ...e,
                            target: { ...e.target, files: limitedFiles },
                          },
                          docType
                        );
                      }}
                      multiple={docType === "Certificates"}
                      className="hidden"
                    />
                  </label>
                  {/* <Input
                    id={docType}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, docType)}
                    defaultValue={uploadedDocuments[docType]?.filename}
                    multiple={docType === "Certificates"}
                    className="file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  /> */}
                  {docType === "Certificates" && uploadedDocuments[docType] && (
                    <div className="mt-2 text-sm text-gray-500">
                      {uploadedDocuments[docType].length} certificate(s)
                      selected
                    </div>
                  )}
                </div>
              ))}
              {validationError && (
                <p className="text-red-500">{validationError}</p>
              )}
            </>
          );
        } else {
          return (
            <>
              <h2 className="text-2xl font-semibold text-gray-900">
                Continue your profile setup by uploading a profile picture.
                (Optional)
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture
                </label>
                {/* <label className="inline-block cursor-pointer bg-gray-100 px-4 py-2 rounded-lg text-violet-700">
                  <div className="text-sm">
                    {profilePicture
                      ? "Profile picture selected"
                      : "Select a file..."}
                  </div>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handlePictureUpload}
                    className="hidden"
                  />
                </label> */}
                <ImageCropper
                  onImageCropped={handleImageCropped}
                  currentImage={profilePicture}
                />
              </div>
              <Button
                type="button"
                className="w-full bg-gray-300 hover:bg-gray-400"
                onClick={() => {
                  setProfilePicture(null);
                  setStage(stage + 1);
                }}
                disabled={isLoading}
              >
                Skip for now
              </Button>
            </>
          );
        }
      case 3:
        if (userType === "tourist") {
          return (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-gray-900">
                  Terms and Conditions
                </h3>
                <div
                  className="border rounded-md p-4 h-48 overflow-y-auto bg-gray-50"
                  ref={termsRef}
                >
                  <pre className="whitespace-pre-wrap text-sm">
                    <TermsAndConditions />
                  </pre>
                </div>
              </div>

              <div className="flex flex-row items-start space-x-3 space-y-0.5">
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Checkbox
                    checked={termsAccepted}
                    onCheckedChange={() => setTermsAccepted(!termsAccepted)}
                    disabled={!canAcceptTerms}
                    aria-describedby="terms-description"
                  />
                  {!canAcceptTerms && (
                    <div
                      onClick={() => {
                        setShowScrollMessage(true);
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "transparent",
                      }}
                    />
                  )}
                </div>
                <div className="space-y-1 leading-none">
                  <label>I accept and agree to the terms and conditions</label>
                  {showError && (
                    <div
                      className="mt-3"
                      style={{ color: "red", fontSize: "16px" }}
                    >
                      Please accept the terms and conditions.
                    </div>
                  )}
                  {showScrollMessage && (
                    <div
                      className="mt-3"
                      style={{ color: "red", fontSize: "16px" }}
                    >
                      Please read the terms and conditions before accepting.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <>
              <h2 className="text-2xl font-semibold text-gray-900">
                Continue your profile setup by uploading a
                {userType === "tour-guide" ? " profile picture. " : " logo. "}
                (Optional)
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {userType === "tour-guide" ? "Profile Picture" : "Logo"}
                </label>
                <ImageCropper
                  onImageCropped={handleImageCropped}
                  currentImage={profilePicture}
                />
              </div>
              <Button
                type="button"
                className="w-full bg-gray-300 hover:bg-gray-400"
                onClick={() => {
                  setProfilePicture(null);
                  setStage(stage + 1);
                }}
                disabled={isLoading}
              >
                Skip for now
              </Button>
            </>
          );
        }
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-gray-900">
                Terms and Conditions
              </h3>
              <div
                className="border rounded-md p-4 h-48 overflow-y-auto bg-gray-50"
                ref={termsRef}
              >
                <pre className="whitespace-pre-wrap text-sm">
                  <TermsAndConditions />
                </pre>
              </div>
            </div>

            <div className="flex flex-row items-start space-x-3 space-y-0.5">
              <div style={{ position: "relative", display: "inline-block" }}>
                <Checkbox
                  checked={termsAccepted}
                  onCheckedChange={() => setTermsAccepted(!termsAccepted)}
                  disabled={!canAcceptTerms}
                  aria-describedby="terms-description"
                />
                {!canAcceptTerms && (
                  <div
                    onClick={() => {
                      setShowScrollMessage(true);
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "transparent",
                    }}
                  />
                )}
              </div>
              <div className="space-y-1 leading-none">
                <label>I accept and agree to the terms and conditions</label>
                {showError && (
                  <div
                    className="mt-3"
                    style={{ color: "red", fontSize: "16px" }}
                  >
                    Please accept the terms and conditions.
                  </div>
                )}
                {showScrollMessage && (
                  <div
                    className="mt-3"
                    style={{ color: "red", fontSize: "16px" }}
                  >
                    Please read the terms and conditions before accepting.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderFormFields = () => {
    const content = renderStage();
    if (!content) return null;

    const fields = Array.isArray(content) ? content : [content];

    // Always use a single column layout
    return <div className="space-y-6">{fields}</div>;
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{
        backgroundImage: `url(${signUpPicture})`,
      }}
    >
      <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row">
        <div className="w-full md:w-2/5 bg-[#B5D3D1] p-6">
          <h2 className="text-4xl font-bold text-[#1A3B47] mb-2 sticky top-0 bg-[#B5D3D1]">
            Create Your <br /> Account Now!
          </h2>
          <p className="text-s mb-6 text-[#1A3B47]">
            Join us today! It only takes a few steps to set <br />
            up your account and start exploring.
          </p>
          {renderStepIndicator()}
          <div className="mt-4 text-center text-s">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-[#5D9297] hover:text-[#1A3B47]"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
        <div
          className="w-full md:w-3/5 p-6 max-h-[90vh] overflow-y-auto"
          ref={divRef}
        >
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {!userType ? (
                <div className="space-y-3 h-full flex flex-col justify-center">
                  <h2 className="text-xl font-bold text-[#1A3B47] mb-4">
                    I am a
                  </h2>
                  {["tourist", "tour-guide", "advertiser", "seller"].map(
                    (role) => (
                      <Button
                        key={role}
                        type="button"
                        className={cn(
                          "w-full text-left justify-start capitalize transition-colors duration-200",
                          userType === role
                            ? "bg-[#1A3B47] text-white"
                            : "bg-white text-[#1A3B47] border border-[#5D9297] hover:bg-[#5D9297] hover:text-[#B5D3D1]"
                        )}
                        onClick={() => {
                          form.setValue("userType", role);
                          setError("userType", { type: "manual", message: "" });
                        }}
                      >
                        {role.replace("-", " ")}
                      </Button>
                    )
                  )}
                </div>
              ) : (
                <>
                  {apiError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{apiError}</AlertDescription>
                    </Alert>
                  )}
                  {renderFormFields()}
                  <div className="flex justify-between mt-4">
                    {stage > 1 ? (
                      <Button
                        type="button"
                        className="bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                        variant="outline"
                        onClick={() => setStage(stage - 1)}
                      >
                        Back
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                        variant="outline"
                        onClick={() => {
                          form.setValue("userType", undefined);
                          clearForm();
                          setStage(1);
                        }}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Change Role
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className="bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                    >
                      {stage < totalStages ? (
                        "Next"
                      ) : isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Please wait
                        </>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </Form>
        </div>
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
              <Check className="w-6 h-6 text-green-500 inline-block mr-2" />
              Successful Signup
            </DialogTitle>
            <DialogDescription>
              Your account has been created successfully! Please log in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center items-center w-full">
            <div className="flex justify-center w-full">
              <Button
                className="bg-[#1A3B47] text-white hover:bg-[#3E5963] px-4 py-2 rounded-lg"
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
