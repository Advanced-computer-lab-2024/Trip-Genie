import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
// import {role} from './login.jsx';

const HistoricalPlaceList = () => {
  const [jsonData, setPlaces] = useState([]);
  const [error, setError] = useState(null);
  // console.log(role);
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = Cookies.get("jwt"); // Replace with your actual token
        const response = await axios.get(
          "https://trip-genie-apis.vercel.app/tourism-governor/my-historical-places",
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setActivities(response.data);
      } catch (error) {
        console.error("Error fetching historical places:", error);
      }
    };

    fetchActivities();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Historical Places</h1>

      {jsonData.map((item, index) => (
        <div
          key={item._id}
          style={{
            border: "1px solid #ddd",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "5px",
          }}
        >
          <p>
            <strong>Description:</strong> {item.description}
          </p>
          <p>
            <strong>Location</strong>
          </p>
          <ul style={{ listStyleType: "none", paddingLeft: "0" }}>
            <li>
              <strong>Address:</strong> {item.location.address}
            </li>
            <li>
              <strong>City:</strong> {item.location.city}
            </li>
            <li>
              <strong>Country:</strong> {item.location.country}
            </li>
          </ul>
          <p>
            <strong>Historical Tags:</strong>
          </p>
          <ul style={{ listStyleType: "none", paddingLeft: "0" }}>
            {item.historicalTag.length > 0 ? (
              item.historicalTag.map((tag, idx) => (
                <li key={idx}>
                  {typeof tag === "string" ? (
                    <span>{tag}</span>
                  ) : (
                    <div>
                      <p>
                        <strong>Type:</strong> {tag.type}
                      </p>
                    </div>
                  )}
                </li>
              ))
            ) : (
              <li>None</li>
            )}
          </ul>
          <p>
            <strong>Pictures:</strong> {item.pictures.length > 0 ? "Yes" : "No"}
          </p>
        </div>
      ))}
    </div>
  );
};

export default HistoricalPlaceList;
