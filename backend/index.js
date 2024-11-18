require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const guestRoutes = require("./routes/guestRoutes");
const touristRoutes = require("./routes/touristRoutes");
const adminRoutes = require("./routes/adminRoutes");
const tourismGovernorRoutes = require("./routes/tourismGovernorRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const tourGuideRoutes = require("./routes/tourGuideRoutes");
const advertiserRoutes = require("./routes/advertiserRoutes");
const apiRoutes = require("./routes/apiRoutes");
const JobStatus = require("./models/JobStatus");
const purchaseController = require("./controllers/purchaseController");
const emailService = require("./services/emailService");

const Tourist = require("./models/tourist");

//const productRoutes = require("./routes/productRoutes");
const cookieParser = require("cookie-parser");
const { requireAuth } = require("./middlewares/authMiddleware");
const { getAllLanguages } = require("./controllers/itineraryController");
const cron = require("node-cron");
const currencyRateController = require("./controllers/currencyRateController");
const Grid = require("gridfs-stream");
const ItineraryBooking = require("./models/itineraryBooking");
const ActivityBooking = require("./models/activityBooking");

const PORT = process.env.PORT;

const app = express();

app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

mongoose
  .connect(process.env.URI)
  .then((connection) => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    const db = connection.connection.db; // access the raw MongoDB driver from the connection
    const gfs = new mongoose.mongo.GridFSBucket(db, { bucketName: "uploads" });
    app.locals.gfs = gfs;
  })
  .catch((err) => console.log(err));

// Schedule the task to run once every day at midnight (server time)
cron.schedule("0 0 * * *", async () => {
  console.log(
    "Running daily job to update currency rates and send birthday cards..."
  );
  await currencyRateController.updateRatesAgainstUSD();
  await sendBirthdayCards();
  await purchaseController.updatePurchaseStatus();
  checkUpcomingEvents();
  JobStatus.findOneAndUpdate(
    { jobName: "BirthdayJob" },
    { lastRun: new Date() },
    { upsert: true }
  );
});

app.get("/", (req, res) => res.send("Currency API is running!"));

app.use("/auth", authRoutes);
app.use("/guest", guestRoutes);
app.use("/api", apiRoutes);
app.use("/admin", requireAuth("admin"), adminRoutes);
app.use(
  "/tourism-governor",
  requireAuth("tourism-governor"),
  tourismGovernorRoutes
);
app.use("/tourist", requireAuth("tourist"), touristRoutes);
app.use("/seller", requireAuth("seller"), sellerRoutes);
app.use("/tour-guide", requireAuth("tour-guide"), tourGuideRoutes);
app.use("/advertiser", requireAuth("advertiser"), advertiserRoutes);

// get currency rates from the database currencyrates model with id 6726a0e0206edfcc2ef30c16
app.get("/rates", currencyRateController.getExchangeRate);

//stripe payment
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, currency, deliveryInfo } = req.body;

    // Calculate the total price of items
    const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Get the delivery price based on the delivery type
    const deliveryPrice = deliveryInfo.deliveryPrice;

    // Calculate the total price including delivery
    const totalAmount = itemsTotal + deliveryPrice;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        ...items.map((item) => ({
          price_data: {
            currency: currency,
            product_data: {
              name: item.product.name,
            },
            unit_amount: Math.round(item.totalPrice * 100),
          },
          quantity: item.quantity,
        })),
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `${deliveryInfo.type} Delivery`,
            },
            unit_amount: Math.round(deliveryInfo.deliveryPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${
        req.headers.origin
      }/checkout2?success=true&session_id={CHECKOUT_SESSION_ID}&deliveryType=${encodeURIComponent(
        deliveryInfo.type
      )}&deliveryTime=${encodeURIComponent(deliveryInfo.time)}`,
      cancel_url: `http://localhost:3000/checkout2`,
      metadata: {
        deliveryType: deliveryInfo.type,
        deliveryTime: deliveryInfo.time,
        deliveryPrice: deliveryInfo.deliveryPrice,
      },
    });

    console.log("Checkout session created:", session.id);
    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/check-payment-status", async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    res.json({ status: session.payment_status });
  } catch (error) {
    console.error("Error retrieving payment status:", error);
    res.status(500).json({ error: "Error retrieving payment status" });
  }
});

// Check and update the exchange rates when the server starts
const checkAndUpdateRatesOnStart = async () => {
  try {
    console.log("Checking exchange rates on server start...");
    await currencyRateController.updateRatesAgainstUSD();
  } catch (error) {
    console.error("Error updating rates on server start:", error);
  }
};

const checkAndUpdateStatusOnStart = async () => {
  try {
    await purchaseController.updatePurchaseStatus();
  } catch (error) {
    console.error("Error updating purchase status on server start:", error);
  }
};

const checkBirthdays = async () => {
  try {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    let lastRunDate = new Date();
    console.log("Checking birthdays on server start...");

    // Fetch the last run date from JobStatus
    let jobStatus = await JobStatus.findOne({ jobName: "BirthdayJob" });
    if (jobStatus) {
      lastRunDate = jobStatus.lastRun || new Date(today - 86400000); // Default to 1 day before
      // If the last run date is not today, check for birthdays
      if (
        lastRunDate.getDate() !== todayDay ||
        lastRunDate.getMonth() !== todayMonth
      ) {
        console.log("Checking for birthdays...");
        await sendBirthdayCards();
        jobStatus.lastRun = today;
        await jobStatus.save();
      }
    } else {
      jobStatus = new JobStatus({ jobName: "BirthdayJob" });
      await jobStatus.save();
    }
  } catch (error) {
    console.error("Error checking birthdays:", error);
  }
};

checkUpcomingEvents = async () => {
  try {
    const today = new Date();
    const twoDays = new Date();
    twoDays.setDate(twoDays.getDate() + 2);

    // Find itinerary bookings that are starting in 2 days from now
    const itineraries = await ItineraryBooking.find({
      date: {
        $gte: today,
        $lte: new Date(twoDays),
      },
      isReminderSent: false,
    }).populate("itinerary user");

    let activities = await ActivityBooking.find({
      isReminderSent: false,
    }).populate("activity user");

    activities = activities.filter((activity) => {
      const activityDate = new Date(activity.activity.timing);
      return activityDate >= today && activityDate <= new Date(twoDays);
    });

    // Send reminder emails to the tourists
    itineraries.forEach((itinerary) => {
      emailService.sendItineraryReminder(itinerary);
    });

    activities.forEach((activity) => {
      emailService.sendActivityReminder(activity);
    });
  } catch (error) {
    console.error("Error sending reminder emails:", error);
  }
};

const sendBirthdayCards = async () => {
  const today = new Date(); // Get today's date
  const todayMonth = today.getMonth(); // Get the month (0-11)
  const todayDay = today.getDate(); // Get the day (1-31)

  try {
    // Fetch all tourists from the database
    const tourists = await Tourist.find();

    // Filter tourists whose DOB matches today's month and day
    const birthdayTourists = tourists.filter((tourist) => {
      const dob = new Date(tourist.dateOfBirth); // Convert DOB to Date object
      return dob.getMonth() === todayMonth && dob.getDate() === todayDay;
    });

    // Send birthday emails to the filtered tourists
    birthdayTourists.forEach((tourist) => {
      emailService.sendBirthdayEmail(tourist);
    });
  } catch (error) {
    console.error("Error sending birthday cards:", error);
  }
};

// Run this function on server startup
checkAndUpdateRatesOnStart();
checkAndUpdateStatusOnStart();
checkBirthdays();
checkUpcomingEvents();
