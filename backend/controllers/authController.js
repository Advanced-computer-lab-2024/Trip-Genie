const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const TourismGovernor = require("../models/tourismGovernor");
const Tourist = require("../models/tourist");
const Seller = require("../models/seller");
const Advertiser = require("../models/advertiser");
const TourGuide = require("../models/tourGuide");
const OTP = require("../models/otp");
const multer = require("multer");
const cloudinary = require("../utils/cloudinary");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.SECRET, {
    expiresIn: process.env.EXPIRES_IN,
  });
};

const touristSignup = async (req, res) => {
  try {
    const {
      password,
      nationality,
      mobile,
      dateOfBirth,
      jobOrStudent,
      fname,
      lname,
    } = req.body;

    let { email, username } = req.body;
    email = email.toLowerCase();
    username = username.toLowerCase();

    if (await emailExists(email)) {
      throw new Error("Email already exists");
    }
    if (await usernameExists(username)) {
      throw new Error("Username already exists");
    }
    let { profilePicture } = req.body;
    if (profilePicture === "null") {
      profilePicture = null;
    } else {
      const result = await cloudinary.uploader.upload(profilePicture, {
        folder: "tourist-profile-pictures",
      });
      profilePicture = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    const tourist = new Tourist({
      email,
      username,
      password,
      nationality,
      mobile,
      dateOfBirth,
      jobOrStudent,
      profilePicture,
      fname,
      lname,
    });

    tourist
      .save()
      .then((result) => {
        res.status(201).json({ tourist: result });
      })
      .catch((err) => {
        res.status(400).json({ message: err.message });
        console.log(err);
      });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const login = async (req, res) => {
  let { username, password } = req.body;
  username = username.toLowerCase();

  try {
    let role = "";
    let user = null;
    if (
      (await Tourist.findOne({ email: username })) ||
      (await Tourist.findOne({ username }))
    ) {
      role = "tourist";
      user = await Tourist.login(username, password);
    } else if (
      (await TourGuide.findOne({ email: username })) ||
      (await TourGuide.findOne({ username }))
    ) {
      role = "tour-guide";
      user = await TourGuide.login(username, password);
    } else if (
      (await Advertiser.findOne({ email: username })) ||
      (await Advertiser.findOne({ username }))
    ) {
      role = "advertiser";
      user = await Advertiser.login(username, password);
    } else if (
      (await Seller.findOne({ email: username })) ||
      (await Seller.findOne({ username }))
    ) {
      role = "seller";
      user = await Seller.login(username, password);
    } else if (
      (await Admin.findOne({ email: username })) ||
      (await Admin.findOne({ username }))
    ) {
      role = "admin";
      user = await Admin.login(username, password);
    } else if (
      (await TourismGovernor.findOne({ email: username })) ||
      (await TourismGovernor.findOne({ username }))
    ) {
      role = "tourism-governor";
      user = await TourismGovernor.login(username, password);
    } else {
      res.cookie("jwt", "", { maxAge: 1 });
      res.cookie("role", "", { maxAge: 1 });
      throw new Error("Email not found");
    }

    const token = createToken(user._id, role);
    res.cookie("jwt", token, {
      httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === "production", // Use `secure` only in production (HTTPS)
      // sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Allow cross-origin cookies in production
      sameSite: "Strict",
      maxAge: process.env.MAX_AGE * 1000, // Ensure `maxAge` is set in milliseconds
    });

    res.cookie("role", role, {
      httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === "production", // Use `secure` only in production (HTTPS)
      // sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Allow cross-origin cookies in production
      sameSite: "Strict",
      maxAge: process.env.MAX_AGE * 1000, // Ensure `maxAge` is set in milliseconds
    });
    res.setHeader("Authorization", `Bearer ${token}`);
    res.status(200).json({ message: "Login succesful", role });
  } catch (error) {
    res.cookie("jwt", "", { maxAge: 1 });
    res.cookie("role", "", { maxAge: 1 });
    res.status(400).json({ message: error.message });
  }
};

const advertiserSignup = async (req, res) => {
  try {
    const { password, name, description, website, hotline } = req.body;
    let { email, username } = req.body;
    email = email.toLowerCase();
    username = username.toLowerCase();

    if (await emailExists(email)) {
      throw new Error("Email already exists");
    }
    if (await usernameExists(username)) {
      throw new Error("Username already exists");
    }
    const IDFilename = req.files.ID[0].filename;
    const taxationRegistryCardFilename =
      req.files["Taxation Registry Card"][0].filename;
    let { logo } = req.body;
    if (logo === "null") {
      logo = null;
    } else {
      const result = await cloudinary.uploader.upload(logo, {
        folder: "logos",
      });
      logo = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }
    const advertiser = new Advertiser({
      email,
      username,
      password,
      name,
      description,
      website,
      hotline,
      logo,
      files: { IDFilename, taxationRegistryCardFilename },
    });
    advertiser
      .save()
      .then((result) => {
        res.status(201).json({ advertiser: result });
      })
      .catch((err) => {
        res.status(400).json({ message: err.message });
        console.log(err);
      });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const tourGuideSignup = async (req, res) => {
  try {
    const {
      password,
      name,
      nationality,
      mobile,
      yearsOfExperience,
      previousWorks,
    } = req.body;

    let { email, username } = req.body;
    email = email.toLowerCase();
    username = username.toLowerCase();

    if (await emailExists(email)) {
      throw new Error("Email already exists");
    }
    if (await usernameExists(username)) {
      throw new Error("Username already exists");
    }

    let { profilePicture } = req.body;
    if (profilePicture === "null") {
      profilePicture = null;
    } else {
      const result = await cloudinary.uploader.upload(profilePicture, {
        folder: "tour-guide-profile-pictures",
      });
      profilePicture = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }
    const IDFilename = req.files.ID[0].filename;
    const certificatesFilenames = req.files.Certificates.map(
      (file) => file.filename
    );

    const tourGuide = new TourGuide({
      email,
      username,
      password,
      name,
      nationality,
      mobile,
      yearsOfExperience,
      previousWorks: JSON.parse(previousWorks),
      files: { IDFilename, certificatesFilenames },
      profilePicture,
    });

    tourGuide
      .save()
      .then((result) => {
        res.status(201).json({ tourGuide: result });
      })
      .catch((err) => {
        res.status(400).json({ message: err.message });
        console.log(err);
      });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const sellerSignup = async (req, res) => {
  try {
    const { password, name, description, mobile } = req.body;
    let { email, username } = req.body;
    email = email.toLowerCase();
    username = username.toLowerCase();

    if (await emailExists(email)) {
      throw new Error("Email already exists");
    }
    if (await usernameExists(username)) {
      throw new Error("Username already exists");
    }
    let { logo } = req.body;
    if (logo === "null") {
      logo = null;
    } else {
      const result = await cloudinary.uploader.upload(logo, {
        folder: "logos",
      });
      logo = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }
    const IDFilename = req.files.ID[0].filename;
    const taxationRegistryCardFilename =
      req.files["Taxation Registry Card"][0].filename;
    const seller = new Seller({
      email,
      username,
      password,
      name,
      description,
      mobile,
      logo,
      files: { IDFilename, taxationRegistryCardFilename },
    });

    seller
      .save()
      .then((result) => {
        res.status(201).json({ Seller: result });
      })
      .catch((err) => {
        res.status(400).json({ message: err.message });
        console.log(err);
      });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const logout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.cookie("role", "", { maxAge: 1 });
  res.json({ message: "Logout successful" });
};

const emailExists = async (email) => {
  if (
    (await Tourist.findOne({ email })) ||
    (await TourGuide.findOne({ email })) ||
    (await Advertiser.findOne({ email })) ||
    (await Seller.findOne({ email })) ||
    (await Admin.findOne({ email })) ||
    (await TourismGovernor.findOne({ email }))
  ) {
    console.log("email does not exist");
    return true;
  } else {
    console.log("email does not exist");
    return false;
  }
};

const usernameExists = async (username) => {
  if (
    (await Tourist.findOne({ username })) ||
    (await TourGuide.findOne({ username })) ||
    (await Advertiser.findOne({ username })) ||
    (await Seller.findOne({ username })) ||
    (await Admin.findOne({ username })) ||
    (await TourismGovernor.findOne({ username }))
  ) {
    console.log("username exists");
    return true;
  } else {
    console.log("username does not exist");
    return false;
  }
};

const checkUnique = async (req, res) => {
  let { email, username } = req.query;
  email = email.toLowerCase();
  username = username.toLowerCase();
  const existingEmail = await emailExists(email);
  const existingUsername = await usernameExists(username);
  try {
    if (existingEmail) {
      throw new Error("Email already exists");
    }
    if (existingUsername) {
      throw new Error("Username already exists");
    }
    res.status(200).json({ message: "Unique" });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message, existingEmail, existingUsername });
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log(email);
  try {
    const user =
      (await Tourist.findOne({ email })) ||
      (await TourGuide.findOne({ email })) ||
      (await Advertiser.findOne({ email })) ||
      (await Seller.findOne({ email })) ||
      (await Admin.findOne({ email })) ||
      (await TourismGovernor.findOne({ email }));

    if (!user) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    const otp = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit OTP
    const expiry = new Date(Date.now() + 300000); // 5 minutes from now
    const newOTP = new OTP({ email, otp, expiry });
    await newOTP.save();

    await transporter.sendMail({
      to: email,
      subject: "Password Reset",
      text: `Your OTP is ${otp}`,
    });

    res.status(200).json({ message: "OTP sent to your mail" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user =
      (await Tourist.findOne({ email })) ||
      (await TourGuide.findOne({ email })) ||
      (await Advertiser.findOne({ email })) ||
      (await Seller.findOne({ email })) ||
      (await Admin.findOne({ email })) ||
      (await TourismGovernor.findOne({ email }));

    if (!user) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    const existingOTP = await OTP.findOne({ email, otp });
    if (!existingOTP) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    if (existingOTP.expiry < Date.now()) {
      return res
        .status(400)
        .json({ message: "OTP expired. Please try again." });
    }

    await OTP.deleteOne({ email, otp });

    res.status(200).json({ message: "OTP verified" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user =
      (await Tourist.findOne({ email })) ||
      (await TourGuide.findOne({ email })) ||
      (await Advertiser.findOne({ email })) ||
      (await Seller.findOne({ email })) ||
      (await Admin.findOne({ email })) ||
      (await TourismGovernor.findOne({ email }));

    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    user.password = password;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  touristSignup,
  advertiserSignup,
  tourGuideSignup,
  sellerSignup,
  login,
  logout,
  checkUnique,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
