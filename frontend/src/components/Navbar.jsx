import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/text-logo.png";
import searchGlass from "../assets/images/searchGlass.svg";

import "./Navbar.css";

const Navbar = () => {
  return (
    <div className="frame13">
      <div className="frame14">
        <Link to={"/"}>
          <img src={logo} alt="logo" className="logo" />
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
        {/* <p className="text">
          <Link to="/iteneraries">Iteneraries</Link>
        </p>

        <p className="text">
          <Link to="/museums">Museum/Historical Places</Link>
        </p> */}
      </div>

      <div className="frame12">
        <img src={searchGlass} alt="search" className="search" />
        <div className="frame11">
          <p className="text">Sign Up  kjkjk</p>
          <div className="frame1">
            <Link to = "/login">
            <p className="text login-button">Log In</p></Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
