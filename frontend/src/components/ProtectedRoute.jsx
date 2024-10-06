import React from "react";
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

export const ProtectedRoute = ({ allowedRoles, children }) => {
  let userRole = Cookies.get("role");
  if (!userRole) userRole = "guest";

  if (!userRole || !allowedRoles.includes(userRole)) {
    // Redirect to login or unauthorized page
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
