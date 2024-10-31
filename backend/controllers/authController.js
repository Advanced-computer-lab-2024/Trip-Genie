const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const TourismGovernor = require("../models/tourismGovernor");
const Tourist = require("../models/tourist");
const Seller = require("../models/seller");
const Advertiser = require("../models/advertiser");
const TourGuide = require("../models/tourGuide");
const multer = require("multer");

const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.SECRET, {
    expiresIn: process.env.EXPIRES_IN,
  });
};

// // File upload route
// app.post("/api/upload-documents", (req, res) => {
//   const uploadFields = [
//     { name: "ID", maxCount: 1 },
//     { name: "Taxation Registry Card", maxCount: 1 },
//   ];

//   if (req.body.userRole === "tourGuide") {
//     uploadFields.push({ name: "Certificates", maxCount: 5 }); // Allow up to 5 certificates
//   }

//   upload.fields(uploadFields)(req, res, (err) => {
//     if (err) {
//       return res
//         .status(400)
//         .json({ message: "Error uploading files", error: err.message });
//     }
//     res.status(200).json({ message: "Documents uploaded successfully" });
//   });
// });

// app.get('/api/files/:filename', (req, res) => {
//   gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
//     if (!file || file.length === 0) {
//       return res.status(404).json({
//         err: 'No file exists'
//       });
//     }
//     const readstream = gfs.createReadStream(file.filename);
//     readstream.pipe(res);
//   });
// });

const touristSignup = async (req, res) => {
  try {
    if (await emailExists(req.body.email)) {
      throw new Error("Email already exists");
    }
    if (await usernameExists(req.body.username)) {
      throw new Error("Username already exists");
    }
    const {
      email,
      username,
      password,
      nationality,
      mobile,
      dateOfBirth,
      jobOrStudent,
      profilePicture,
    } = req.body;
    const tourist = new Tourist({
      email,
      username,
      password,
      nationality,
      mobile,
      dateOfBirth,
      jobOrStudent,
      profilePicture,
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
  const { username, password } = req.body;

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
      httpOnly: false,
      maxAge: process.env.MAX_AGE * 1000,
    });
    res.cookie("role", role, {
      httpOnly: false,
      maxAge: process.env.MAX_AGE * 1000,
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
    if (await emailExists(req.body.email)) {
      throw new Error("Email already exists");
    }
    if (await usernameExists(req.body.username)) {
      throw new Error("Username already exists");
    }

    const {
      email,
      username,
      password,
      name,
      description,
      website,
      hotline,
      logo,
    } = req.body;
    const IDFilename = req.files.ID[0].filename;
    const taxationRegistryCardFilename =
      req.files["Taxation Registry Card"][0].filename;
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
    if (await emailExists(req.body.email)) {
      throw new Error("Email already exists");
    }
    if (await usernameExists(req.body.username)) {
      throw new Error("Username already exists");
    }

    const {
      email,
      username,
      password,
      name,
      nationality,
      mobile,
      yearsOfExperience,
      previousWorks,
      profilePicture,
    } = req.body;

    const IDFilename = req.files.ID[0].filename;
    const certificatesFilename = req.files["Certificates"][0].filename;

    const tourGuide = new TourGuide({
      email,
      username,
      password,
      name,
      nationality,
      mobile,
      yearsOfExperience,
      previousWorks,
      files: { IDFilename, certificatesFilename },
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
    if (await emailExists(req.body.email)) {
      throw new Error("Email already exists");
    }
    if (await usernameExists(req.body.username)) {
      throw new Error("Username already exists");
    }

    const { email, username, password, name, description, mobile, logo } =
      req.body;
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
  if (await Tourist.findOne({ email })) {
    return true;
  } else if (await TourGuide.findOne({ email })) {
    return true;
  } else if (await Advertiser.findOne({ email })) {
    return true;
  } else if (await Seller.findOne({ email })) {
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
  const { email, username } = req.query;
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

module.exports = {
  touristSignup,
  advertiserSignup,
  tourGuideSignup,
  sellerSignup,
  login,
  logout,
  checkUnique,
};
