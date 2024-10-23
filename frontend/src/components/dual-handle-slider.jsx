import React from "react";
import { Range, getTrackBackground } from "react-range";

function DualHandleSliderComponent({
  min,
  max,
  step,
  values,
  onChange,
  currency = "$",
  middleColor = "#f97516",
  colorRing = "orange",
}) {
  return (
    <div className="w-full px-4 py-8">
      <Range
        values={values}
        step={step}
        min={min}
        max={max}
        onChange={onChange}
        renderTrack={({ props, children }) => {
          const { key, ...restProps } = props; // Exclude the 'key' from props
          return (
            <div
              {...restProps} // Spread remaining props without 'key'
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
              {React.Children.map(
                children,
                (child, index) =>
                  React.cloneElement(child, { key: `thumb-${index}` }) // Add a unique key to each child
              )}
            </div>
          );
        }}
        renderThumb={({ props, isDragged }) => {
          const { key, ...restProps } = props; // Exclude the 'key' from props
          return (
            <div
              {...restProps} // Spread remaining props without 'key'
              className={`w-5 h-5 transform translate-x-10 bg-white rounded-full shadow flex items-center justify-center ${
                isDragged ? `ring-2 ring-${colorRing}-500` : ""
              }`}
            >
              <div className={`w-2 h-2 bg-${colorRing}-500 rounded-full`} />
            </div>
          );
        }}
      />
      <div className="flex justify-between mt-2">
        <span className="text-sm font-medium text-gray-700">
          Min: {currency}
          {values[0]}
        </span>
        <span className="text-sm font-medium text-gray-700">
          Max: {currency}
          {values[1]}
        </span>
      </div>
    </div>
  );
}

export default DualHandleSliderComponent;