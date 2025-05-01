import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#B5D3D1]">
      <button
        className="w-full py-4 px-6 flex justify-between items-center hover:bg-[#E6DCCF]/10 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-[#1A3B47] text-left font-medium">{question}</span>
        <span className="text-[#388A94] text-2xl" aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen && (
        <div
          className="px-6 pb-4 text-[#1A3B47]/80"
          style={{ lineHeight: "1.6" }}
        >
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const location = useLocation(); // Get the current location
  const isAccountFAQsPage = location.pathname === "/account/faqs";

  const faqs = [
    {
      question: "How can I contact customer support?",
      answer:
        "You can reach our customer support team by emailing us at tripgenieservice@gmail.com. We're here to help you with any questions or concerns.",
    },
    {
      question: "What is your cancellation policy for bookings?",
      answer:
        "Our cancellation policy depends on the activity or itinerary booked. You can find the specific cancellation terms on each product page. If you have questions, please contact us directly.",
    },
    {
      question: "Will I get a refund if I cancel my booking?",
      answer:
        "Refunds vary based on the type of booking and the timing of your cancellation. Refer to our cancellation policy for detailed information, or contact our support team for assistance.",
    },
    {
      question: "I want to change my account information",
      answer:
        "You can update your account information by logging into your account and navigating to the 'Account Settings' section.",
    },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [fadeOut, setFadeOut] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("Your question has been submitted. We'll get back to you soon!");
    setSearchQuery("");
    setFadeOut(false);

    setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setMessage("");
      }, 400);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Conditionally render the blue top section */}
      {!isAccountFAQsPage && (
        <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto px-4 py-12">
        {/* Left Column - FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-[#1A3B47] mb-4">
            Frequently Asked Questions
          </h2>
          <div className="bg-white rounded-xl overflow-hidden">
            <div>
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Help Center Header */}
        <div className="flex flex-col justify-center text-center">
          <span className="text-[#F88C33] font-medium mb-2">Help center</span>
          <h1 className="text-4xl font-bold text-[#1A3B47] mb-4">
            How can We help You
          </h1>
          <p className="text-[#1A3B47]/70 mb-8">
            Have a question? Just ask below, and our team will get back to you
            by email with all the details you need!
          </p>
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-lg mx-auto"
          >
            <input
              type="text"
              placeholder="What can we help you with?"
              className="w-full px-4 py-3 rounded-lg border border-[#B5D3D1] focus:outline-none focus:ring-2 focus:ring-[#388A94] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#388A94] hover:bg-[#E6F1F2] p-2 rounded-full transition-colors"
              aria-label="Submit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2 12l19-9-9 19-2-8-8-2z"
                />
              </svg>
            </button>
          </form>
          {message && (
            <p
              className={`mt-2 text-blue-500 text-md ${
                fadeOut ? "animate-fade-exit" : "animate-fade"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>

      {/* CSS styles for fade animations */}
      <style jsx>{`
        .animate-fade {
          opacity: 1;
          transition: opacity 0.9s ease-in-out;
        }

        .animate-fade-exit {
          opacity: 0;
          transition: opacity 0.9s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default FAQ;
