// import React, { useState, useEffect } from "react";
// import {
//   BrowserRouter as Router,
//   Route,
//   Routes,
//   useLocation,
// } from "react-router-dom";
// import axios from "axios";
// import Cookies from "js-cookie";

// const useVisitedPages = () => {
//   const location = useLocation();
//   const [visitedPages, setVisitedPages] = useState([]);

//   useEffect(() => {
//     const fetchVisitedPages = async () => {
//       const token = Cookies.get("jwt");
//       if (token) {
//         // Fetch visited pages from backend for logged-in users
//         const response = await axios.get(
//           "https://trip-genie-apis.vercel.app/tourist/visited-pages",
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
//         const visitedPages = await response.json();
//         setVisitedPages(visitedPages);
//       } else {
//         // Initialize from local storage for guests
//         const storedPages = localStorage.getItem("visitedPages");
//         setVisitedPages(storedPages ? JSON.parse(storedPages) : []);
//       }
//     };

//     fetchVisitedPages();
//   }, []);

//   useEffect(() => {
//     const currentPage = location.pathname.replace("/", "") || "home";

//     setVisitedPages((prevPages) => {
//       if (!prevPages.includes(currentPage)) {
//         const updatedPages = [...prevPages, currentPage];
//         const token = Cookies.get("jwt");

//         if (token) {
//           // Update visited pages in backend for logged-in users
//           axios
//             .post(`https://trip-genie-apis.vercel.app/tourist/visited-pages`, {
//               visitedPages: updatedPages,
//             })
//             .catch((error) =>
//               console.error("Error updating visited pages:", error)
//             );
//         } else {
//           // Update local storage for guests
//           localStorage.setItem("visitedPages", JSON.stringify(updatedPages));
//         }

//         return updatedPages;
//       }
//       return prevPages;
//     });
//   }, [location]);

//   return visitedPages;
// };

// const VisitedPagesTracker = ({ children }) => {
//   const visitedPages = useVisitedPages();

//   return (
//     <>
//       {children}
//       <footer>
//         <h4>Visited Pages:</h4>
//         <ul>
//           {visitedPages.map((page, index) => (
//             <li key={index}>{page}</li>
//           ))}
//         </ul>
//       </footer>
//     </>
//   );
// };

// export default VisitedPagesTracker;
