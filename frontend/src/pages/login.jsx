import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Cookies from "js-cookie";
import logInPicture from "../assets/images/logInPicture.jpg";
import { EyeIcon, EyeOffIcon, ArrowLeftIcon } from "@heroicons/react/outline";

let role = null;

const getPasswordStrength = (password) => {
  const strength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  };

  const fulfilled = Object.values(strength).filter(Boolean).length;
  return { ...strength, fulfilled };
};

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  // Separate error messages for each step
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [forgotPasswordErrorMessage, setForgotPasswordErrorMessage] =
    useState("");
  const [otpErrorMessage, setOtpErrorMessage] = useState("");
  const [resetPasswordErrorMessage, setResetPasswordErrorMessage] =
    useState("");

  // New state variables for forgot password flow
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const strength = getPasswordStrength(newPassword);

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

  const logOut = async () => {
    console.log("Logging out...");
    try {
      const response = await fetch("http://localhost:4000/auth/logout");

      if (response.ok) {
        Cookies.set("jwt", "");
        Cookies.set("role", "");
        Cookies.remove("jwt");
        Cookies.remove("role");
        console.log("Logged out successfully");
        window.location.reload();
      } else {
        console.error("Logout failed.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const isValidEmail = (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  const validateIdentifier = (input) => {
    if (isValidEmail(input) || input.length > 2) {
      setLoginErrorMessage("");
      setIsValid(true);
    } else {
      setLoginErrorMessage(
        "Please enter a valid email or username (min 3 characters)."
      );
      setIsValid(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isValid) {
      setLoginErrorMessage("Please fix the errors before submitting.");
      return;
    }

    const requestBody = {
      username: identifier,
      password,
    };

    try {
      const response = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        role = data.role;

        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
        console.log("Login successful!");
        window.location.reload();
      } else {
        const errorData = await response.json();

        if (errorData.message === "Your account is not accepted yet") {
          setLoginErrorMessage(
            "Login failed. Your account is not accepted yet."
          );
        } else {
          setLoginErrorMessage("Login failed. Please check your credentials.");
        }
      }
    } catch (error) {
      setLoginErrorMessage("An error occurred during login. Please try again.");
    }
  };

  const handleForgotPassword = async () => {
    setForgotPasswordErrorMessage(""); // Clear any previous error messages
    if (!isValidEmail(email)) {
      setForgotPasswordErrorMessage("Please enter a valid email address.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:4000/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (response.ok) {
        setForgotPasswordStep(2);
        setForgotPasswordErrorMessage("");
      } else {
        const errorData = await response.json();
        setForgotPasswordErrorMessage(errorData.message);
      }
    } catch (error) {
      setForgotPasswordErrorMessage("An error occurred. Please try again.");
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setOtpErrorMessage("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      if (response.ok) {
        setForgotPasswordStep(3);
        setOtpErrorMessage("");
      } else {
        const errorData = await response.json();
        setOtpErrorMessage(errorData.message);
        setOtp(Array(6).fill(""));
      }
    } catch (error) {
      setOtpErrorMessage("An error occurred. Please try again.");
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setResetPasswordErrorMessage(
        "Password must be at least 8 characters long."
      );
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:4000/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: newPassword }),
        }
      );

      if (response.ok) {
        setForgotPasswordStep(0);
        setLoginErrorMessage(
          "Password reset successfully. Please log in with your new password."
        );
      } else {
        setResetPasswordErrorMessage(
          "Failed to reset password. Please try again."
        );
      }
    } catch (error) {
      setResetPasswordErrorMessage("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    if (otp.every((digit) => digit !== "")) {
      handleVerifyOTP();
    }
  }, [otp]);

  const renderForgotPasswordStep = () => {
    switch (forgotPasswordStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">
              Reset Password
            </h3>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="Enter your email"
                required
              />
              {forgotPasswordErrorMessage && (
                <p className="text-sm text-red-600 mt-1">
                  {forgotPasswordErrorMessage}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Enter the email associated with your account to receive a password
              reset code.
            </p>
            <button
              onClick={handleForgotPassword}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5D9297] hover:bg-[#1A3B47] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Recover Password
            </button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Get Your Code</h3>
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700"
              >
                Enter OTP
              </label>
              <div className="flex justify-between mt-1">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(
                        /[^0-9]/g,
                        ""
                      );
                      const newOtp = [...otp];
                      newOtp[index] = numericValue;
                      setOtp(newOtp);
                      if (numericValue && index < 5) {
                        document.getElementById(`otp-${index + 1}`).focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[index] && index > 0) {
                        const newOtp = [...otp];
                        newOtp[index - 1] = "";
                        setOtp(newOtp);
                        document.getElementById(`otp-${index - 1}`).focus();
                      }
                    }}
                    className="w-10 h-10 text-center border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    id={`otp-${index}`}
                  />
                ))}
              </div>
              {otpErrorMessage && (
                <p className="text-sm text-red-600 mt-1">{otpErrorMessage}</p>
              )}
            </div>
            <p className="text-sm text-gray-600">
              We've sent a 6-digit code to your email. Please enter it above to
              verify your account.
            </p>
            {/* <button
              onClick={handleVerifyOTP}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5D9297] hover:bg-[#1A3B47] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Verify OTP
            </button> */}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Enter New Password
            </h3>
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="Enter new password"
                required
              />
              <div className="flex items-center mt-2 space-x-2 w-full">
                {/* Progress Bar */}
                <div className="relative flex-grow h-2 bg-gray-200 rounded-full">
                  <div
                    className={`absolute h-2 rounded-full transition-all duration-300 ${
                      newPassword.length === 0
                        ? "bg-gray-300"
                        : getProgressBarColor()
                    }`}
                    style={{
                      width: `${
                        newPassword.length === 0
                          ? 0
                          : Math.max(strength.fulfilled / 3, 1 / 3) * 100
                      }%`,
                    }}
                  ></div>
                </div>

                {/* Strength Label */}
                {newPassword.length > 0 && (
                  <p className="text-sm font-medium text-gray-700 ml-2">
                    {getStrengthLabel()}
                  </p>
                )}
              </div>
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
              {resetPasswordErrorMessage && (
                <p className="text-sm text-red-600 mt-1">
                  {resetPasswordErrorMessage}
                </p>
              )}
            </div>
            <button
              onClick={handleResetPassword}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5D9297] hover:bg-[#1A3B47] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Reset Password
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{
        backgroundImage: `url(${logInPicture})`,
      }}
    >
      <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-2xl flex flex-col md:flex-row">
        <div className="w-full md:w-2/5 bg-[#B5D3D1] p-6">
          <h2 className="text-4xl font-bold text-[#1A3B47] mb-2 sticky top-0 bg-[#B5D3D1]">
            Welcome Back!
          </h2>
          <p className="text-s mb-6 text-[#1A3B47]">
            We're thrilled to see you again. Explore new updates, pick up right
            where you left off, and let us help make your experience even
            better!
          </p>
        </div>
        <div className="w-full md:w-3/5 p-6 max-h-[70vh] overflow-y-auto">
          {forgotPasswordStep === 0 ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email/Username
                </label>
                <div className="mt-1">
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="identifier"
                    placeholder="Email/Username"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      validateIdentifier(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {password.length > 0 && (
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
                <div className="mt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordStep(1)}
                    className="text-sm font-medium text-[#5D9297] hover:text-[#B5D3D1]"
                  >
                    Forgot password?
                  </button>
                </div>
                {loginErrorMessage && (
                  <p
                    className={`text-sm mt-1 ${
                      loginErrorMessage ===
                      "Password reset successfully. Please log in with your new password."
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {loginErrorMessage}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-center justify-between">
                <button
                  type="submit"
                  className={`w-full flex justify-center mb-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5D9297] text-white hover:bg-[#1A3B47] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                    !isValid ? "cursor-not-allowed hover:bg-[#5D9297]" : ""
                  }`}
                  disabled={!isValid}
                >
                  Log in
                </button>
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    to="/sign-up"
                    className="font-medium text-[#5D9297] hover:text-[#B5D3D1]"
                  >
                    Sign up now!
                  </Link>
                </p>
                <button
                  className="w-full flex justify-center px-4 rounded-md font-medium text-[#5D9297] hover:text-[#B5D3D1]"
                  onClick={() => {
                    console.log("Logging out...");
                    logOut();
                    navigate("/");
                  }}
                >
                  Continue as guest
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {renderForgotPasswordStep()}
              <button
                onClick={() => setForgotPasswordStep(forgotPasswordStep - 1)}
                className="flex items-center text-sm font-medium text-[#5D9297] hover:text-[#B5D3D1] hover:underline focus:outline-none"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { Login as default, role };
