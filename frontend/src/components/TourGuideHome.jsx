import React, { useState } from "react";
import "../styles/TourGuideHome.css"; // Optional: for styling
import axios from "axios";
import Cookies from "js-cookie";

const TourGuideHome = () => {
  const [profile, setProfile] = useState(null); // To store the fetched profile
  const [error, setError] = useState(null); // To handle errors

  const viewProfile = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await fetch("http://localhost:4000/tour-guide", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }); // Adjust URL based on your server

      if (response.ok) {
        const data = await response.json();
        setProfile(data); // Assume the response contains { name, email, password }
      } else {
        setError("Failed to fetch profile data");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    try {
      const token = Cookies.get("jwt");
      if (response.role === "tourGuide") {
        const response = await fetch(
          "http://localhost:4000/tour-guide/itinerary",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage("Profile updated successfully!");
        setError("");
        setProfile(data); // Optionally update the state with the new profile data
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update profile");
      }
    } catch (error) {
      setError("An error occurred while updating profile data");
    }
  };
  return (
    <div className="tourguide-home-container">
      <header className="header">
        <h1>Welcome to Amazing Tours</h1>
        <p>Your adventure starts here!</p>
      </header>

      <div className="tourguide-buttons">
        <button className="tour-button" onClick={viewProfile}>
          View Profile
        </button>
        <button className="tour-button" onClick={updateProfile}>
          update Profile
        </button>
      </div>

      <div className="profile-form-container">
        <h3>Update Profile</h3>
        <form onSubmit={updateProfile}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={profile.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="tour-button">
            Update Profile
          </button>
        </form>
      </div>

      {profile && (
        <div className="profile-box">
          <h3>Tour Guide Profile</h3>
          <p>
            <strong>Name:</strong> {profile.name}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Password:</strong> {profile.password}
          </p>
        </div>
      )}

      {/* Display Error if something went wrong */}
      {error && <div className="error-message">{error}</div>}

      <section className="intro-section">
        <h2>Explore the world with the best guides</h2>
        <p>
          Discover hidden gems, learn about history, and make lasting memories
          with our experienced and friendly tour guides.
        </p>
      </section>

      <footer className="footer">
        <p>© 2024 Amazing Tours. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default TourGuideHome;
