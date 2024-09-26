import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <div className="frame13">
      <div className="frame14">
        <Link to={"/"}>
          <img src="text-logo.png" alt="logo" className="logo" />
        </Link>
      </div>

      <div className="frame10">
      <p className="text">
          <Link to="/activity">Activity</Link>
        </p>
        {/* when adding link do something like this <p className='text'><Link to="/destination">Destination</Link></p> */}
        <p className="text">
          <Link to="/seller">Seller</Link>
        </p>
        <p className="text">Reviews</p>
      </div>

      <div className="frame12">
        <image src="searchGlass.svg" alt="search" className="search" />
        <div className="frame11">
          <p className="text">Sign Up</p>
          <div className="frame1">
            <p className="text login-button">Log In</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
