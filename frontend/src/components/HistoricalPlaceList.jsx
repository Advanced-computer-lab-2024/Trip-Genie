import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { CoolButton } from "./cool-button";

const HistoricalPlaceList = () => {
  const [jsonData, setPlaces] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistoricalPlaces = async () => {
      try {
        const token = Cookies.get("jwt");
        let role = Cookies.get("role");
        if (role === undefined) role = "guest";
        const api = `https://trip-genie-apis.vercel.app/'${role}/historical-places`;
        console.log(api);
        const response = await axios.get(api, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPlaces(response.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchHistoricalPlaces();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    //   <div style={{ padding: "20px" }}>
    //   <h1>Historical Places</h1>
    //   {jsonData.map((item, index) => (
    //     <div
    //       key={item._id}
    //       style={{
    //         border: "1px solid #ddd",
    //         padding: "10px",
    //         marginBottom: "10px",
    //         borderRadius: "5px"
    //       }}
    //     >

    //       <p><strong>Description:</strong> {item.description}</p>
    //       <p><strong>Location</strong></p>
    //       <ul style={{ listStyleType: "none", paddingLeft: "0" }}>
    //         <li><strong>Address:</strong> {item.location.address}</li>
    //         <li><strong>City:</strong> {item.location.city}</li>
    //         <li><strong>Country:</strong> {item.location.country}</li>
    //       </ul>
    //       <p><strong>Historical Tags:</strong></p>
    //       <ul style={{ listStyleType: "none", paddingLeft: "0" }}>
    //         {item.historicalTag.length > 0 ? (
    //           item.historicalTag.map((tag, idx) => (
    //             <li key={idx}>
    //               {typeof tag === 'string' ? (
    //                 <span>{tag}</span>
    //               ) : (
    //                 <div>
    //                   <p><strong>Type:</strong> {tag.type}</p>
    //                   <p><strong>Period:</strong> {tag.period}</p>
    //                 </div>
    //               )}
    //             </li>
    //           ))
    //         ) : (
    //           <li>None</li>
    //         )}
    //       </ul>
    //       <p><strong>Pictures:</strong> {item.pictures.length > 0 ? "Yes" : "No"}</p>
    //     </div>
    //   ))}
    // </div>
    <>
      <div className="grid grid-cols-3 gap-8">
        {jsonData.map((item, index) => (
          <Card key={item._id} className="flex flex-col justify-between">
            <CardHeader className="flex-row gap-4 items-center">
              <CardTitle>{item.description}</CardTitle>
              <CardDescription>SamZoom</CardDescription>
            </CardHeader>
            <CardContent>
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
                <strong>Pictures:</strong>{" "}
                {item.pictures.length > 0 ? "Yes" : "No"}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <CoolButton>View More</CoolButton>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
};

export default HistoricalPlaceList;
