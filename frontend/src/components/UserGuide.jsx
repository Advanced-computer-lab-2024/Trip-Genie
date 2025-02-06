import React, { useState, useEffect } from "react";
import Joyride, { STATUS } from "react-joyride";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import Cookies from "js-cookie";
import axios from "axios";
import { forceVisible } from "react-lazyload";
import firstGenie from "@/assets/images/first-genie.png";
import secondGenie from "@/assets/images/second-genie.png";

export const UserGuide = ({ steps, onStepChange, pageName }) => {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Check if the page is visited
  useEffect(() => {
    const checkAndTriggerTour = async () => {
      let visitedPages = [];
      const token = Cookies.get("jwt");

      if (token) {
        // Fetch visited pages from the backend
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/tourist/visited-pages",
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        visitedPages = response.data.visitedPages;
      } else {
        // For guests, retrieve from local storage
        const storedPages = localStorage.getItem("visitedPages");
        visitedPages = storedPages ? JSON.parse(storedPages) : [];
      }

      if (!visitedPages.includes(pageName)) {
        setRunTour(true); // Start the Joyride
        visitedPages.push(pageName);

        // Update visited pages
        if (token) {
          await axios.post(
            `https://trip-genie-apis.vercel.app/tourist/visited-pages`,
            {
              visitedPages,
            },
            {
              credentials: "include",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } else {
          localStorage.setItem("visitedPages", JSON.stringify(visitedPages));
        }
      }
    };

    checkAndTriggerTour();
  }, [pageName]);

  const handleJoyrideCallback = (data) => {
    const { status, index, type, action } = data;

    if (type === "step:before") {
      if (onStepChange) {
        onStepChange(index + 1);
      }
    }

    if (type === "step:after") {
      if (action === "prev") {
        setStepIndex(index - 1);
      } else {
        setStepIndex(index + 1);
      }
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      setStepIndex(0); // Reset to the first step
    }
  };

  const startTour = () => {
    setRunTour(false); // Reset the tour state
    setTimeout(() => setRunTour(true), 100); // Restart the tour
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-10">
        <Button
          onClick={startTour}
          className="w-10 h-10 rounded-full bg-[#388A94] text-white hover:bg-[#1A3B47] p-0"
          aria-label="Take a Tour"
        >
          <HelpCircle className="w-6 h-6" />
        </Button>
      </div>
      <Joyride
        steps={steps}
        run={runTour}
        continuous={true}
        disableOverlayClose={true}
        showSkipButton={true}
        showProgress={true}
        stepIndex={stepIndex}
        scrollToFirstStep={true}
        scrollOffset={100}
        callback={handleJoyrideCallback}
        tooltipComponent={(props) => {
          const {
            backProps,
            primaryProps,
            skipProps,
            step,
            index,
            isLastStep,
          } = props;

          const totalSteps = steps.length;

          const isEvenStep = index % 2 === 0;
          const isPlacedLeft = step.placement === "left";
          const isPlacedRight = step.placement === "right";
          let genieOnLeft = isPlacedLeft || isEvenStep;
          if (isPlacedRight) {
            genieOnLeft = false;
          }

          if (step.genieOrientation === "right") {
            genieOnLeft = false;
          } else if (step.genieOrientation === "left") {
            genieOnLeft = true;
          }

          return (
            <div
              style={{
                position: "relative",
                zIndex: 10000,
              }}
            >
              {/* Tooltip Box */}
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  // boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                  padding: "20px",
                  color: "#1A3B47",
                  maxWidth: "400px",
                  position: "relative",
                  marginLeft: genieOnLeft ? "120px" : "0", // Adjust position to leave space for the character
                  marginRight: genieOnLeft ? "0" : "120px", // Adjust position to leave space for the character
                }}
              >
                {/* Step Number */}
                <p
                  style={{
                    fontSize: "14px",
                    color: "#777",
                    margin: "0 0 8px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Step {index + 1} of {totalSteps}
                </p>

                {/* Tooltip Title */}
                <h4
                  style={{
                    margin: "0 0 12px",
                    fontSize: "18px",
                    color: "#1A3B47",
                    fontWeight: "bold",
                  }}
                >
                  {step.title}
                </h4>
                {/* Tooltip Content */}
                <p
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    color: "#555",
                    lineHeight: "1.5",
                  }}
                >
                  {step.content}
                </p>
                {/* Button Layout */}
                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* Skip Button */}
                  <button
                    {...skipProps}
                    style={{
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: "4px",
                      backgroundColor: "#388A94",
                      color: "#fff",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease-in-out",
                      fontWeight: "bold",
                      marginRight: "auto", // Move Skip to the left
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#2e6b77")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#388A94")
                    }
                  >
                    Got it!
                  </button>
                  {/* Back Button */}
                  {index > 0 && (
                    <button
                      {...backProps}
                      style={{
                        padding: "8px 0px",
                        border: "none",
                        borderRadius: "4px",
                        // backgroundColor: "#f5f5f5",
                        fontWeight: "bold",
                        color: "#666",
                        // boxShadow: "inset 0 0 0 2px #ddd",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.target.style.color = "#444")}
                      onMouseLeave={(e) => (e.target.style.color = "#666")}
                    >
                      Prev
                    </button>
                  )}
                  {/* Next/Finish Button */}
                  <button
                    {...primaryProps}
                    style={{
                      padding: "8px 8px",
                      border: "none",
                      // borderRadius: "4px",
                      backgroundColor: "#fff", // New background color
                      color: "#388A94", // New foreground color
                      // boxShadow: "inset 0 0 0 2px #388A94",
                      fontWeight: "bold",
                      cursor: "pointer",
                      marginLeft: "12px",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#2e6b77")}
                    onMouseLeave={(e) => (e.target.style.color = "#388A94")}
                  >
                    {isLastStep ? "Finish" : "Next"}
                  </button>
                </div>
              </div>

              {/* Character Image */}
              <div
                style={{
                  position: "absolute",
                  left: genieOnLeft ? "-50px" : "auto", // Position the image outside the tooltip
                  right: genieOnLeft ? "auto" : "-50px", // Position the image outside the tooltip
                  top: "0%",
                  transform: "translateY(-50%)", // Center the image vertically with the tooltip
                }}
                className="animate-float"
              >
                <img
                  src={genieOnLeft ? firstGenie : secondGenie}
                  alt="Character"
                  style={{
                    width: "160px",
                    height: "160px",
                  }}
                />
              </div>
            </div>
          );
        }}
      />
    </>
  );
};
