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

// Configure email service to ignore self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const promoCode = require("./models/promoCode");

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
const VisitCount = require("./models/visitCount");
const PORT = process.env.PORT;

const app = express();

app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(
  cors({ origin: "https://trip-genie-acl.vercel.app", credentials: true })
);
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

// =====================
//  STRIPE PAYMENT
// =====================
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, currency, deliveryInfo, discountPercentage, promoCode } =
      req.body;

    console.log("Delivery Info:", deliveryInfo);

    // Calculate the total price of items
    const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Get the delivery price based on the delivery type
    const deliveryPrice = deliveryInfo.deliveryPrice;

    // Calculate the total price including delivery
    const totalAmount = itemsTotal + deliveryPrice;

    if (!items || !deliveryInfo || !currency) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        ...items.map((item) => ({
          price_data: {
            currency: currency,
            product_data: {
              name:
                discountPercentage > 0
                  ? item.product.name + `(-${discountPercentage}%)`
                  : item.product.name,
            },
            unit_amount:
              discountPercentage > 0
                ? Math.round(
                    item.totalPrice * (1 - discountPercentage / 100) * 100
                  )
                : Math.round(item.totalPrice * 100),
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
      }/checkout2?success=true&session_id={CHECKOUT_SESSION_ID}&promoCode=${promoCode}&deliveryType=${encodeURIComponent(
        deliveryInfo.type
      )}&deliveryTime=${encodeURIComponent(
        deliveryInfo.time
      )}&shippingId=${encodeURIComponent(deliveryInfo.shippingId)}`,
      cancel_url: `https://trip-genie-acl.vercel.app/checkout2`,
      metadata: {
        shippingId: deliveryInfo.shippingId,
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

app.post("/create-booking-session", async (req, res) => {
  try {
    const {
      items,
      currency,
      quantity,
      returnLocation,
      selectedDate,
      selectedTransportID,
      discountPercentage,
      promoCode,
      loyaltyPoints,
    } = req.body;

    // Calculate the total price of items
    const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    console.log("itemsTotal", items);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price_data: {
          currency: currency,
          product_data: {
            name:
              discountPercentage > 0
                ? item.product.name + `(-${discountPercentage}%)`
                : item.product.name,
          },
          unit_amount:
            discountPercentage > 0
              ? Math.round(
                  item.totalPrice * (1 - discountPercentage / 100) * 100
                )
              : Math.round(item.totalPrice * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${returnLocation}/?success=true&session_id={CHECKOUT_SESSION_ID}&quantity=${quantity}&selectedDate=${selectedDate}&promoCode=${promoCode}&selectedTransportID=${selectedTransportID}&discountPercentage=${discountPercentage}&loyaltyPoints=${loyaltyPoints}`,
      cancel_url: `${returnLocation}`,
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

// create a flight checkout session

app.post("/create-flight-checkout-session", async (req, res) => {
  try {
    const {
      items,
      currency,
      returnLocation,
      discountPercentage,
      metadata: {
        flightID,
        from,
        to,
        departureDate,
        arrivalDate,
        price,
        numberOfTickets,
        type,
        returnDepartureDate,
        returnArrivalDate,
        seatType,
        flightType,
        flightTypeReturn,
      },
    } = req.body;

    // Calculate the total price of items
    const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    let successURL = ``;
    if (flightType === "Round Trip") {
      successURL =
        `${returnLocation}/?success=true&session_id={CHECKOUT_SESSION_ID}` +
        `&flightID=${encodeURIComponent(flightID)}` +
        `&from=${encodeURIComponent(from)}` +
        `&to=${encodeURIComponent(to)}` +
        `&departureDate=${encodeURIComponent(departureDate)}` +
        `&arrivalDate=${encodeURIComponent(arrivalDate)}` +
        `&price=${encodeURIComponent(price)}` +
        `&numberOfTickets=${encodeURIComponent(numberOfTickets)}` +
        `&type=${encodeURIComponent(type)}` +
        `&returnDepartureDate=${encodeURIComponent(returnDepartureDate)}` +
        `&returnArrivalDate=${encodeURIComponent(returnArrivalDate)}` +
        `&seatType=${encodeURIComponent(seatType)}` +
        `&flightType=${encodeURIComponent(flightType)}` +
        `&flightTypeReturn=${encodeURIComponent(flightTypeReturn)}` +
        `&discountPercentage=${encodeURIComponent(discountPercentage)}`;
    } else {
      successURL =
        `${returnLocation}/?success=true&session_id={CHECKOUT_SESSION_ID}` +
        `&flightID=${encodeURIComponent(flightID)}` +
        `&from=${encodeURIComponent(from)}` +
        `&to=${encodeURIComponent(to)}` +
        `&departureDate=${encodeURIComponent(departureDate)}` +
        `&arrivalDate=${encodeURIComponent(arrivalDate)}` +
        `&price=${encodeURIComponent(price)}` +
        `&numberOfTickets=${encodeURIComponent(numberOfTickets)}` +
        `&type=${encodeURIComponent(type)}` +
        `&seatType=${encodeURIComponent(seatType)}` +
        `&flightType=${encodeURIComponent(flightType)}` +
        `&discountPercentage=${encodeURIComponent(discountPercentage)}`;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price_data: {
          currency: currency,
          product_data: {
            name:
              discountPercentage > 0
                ? item.product.name + `(-${discountPercentage}%)`
                : item.product.name,
          },
          unit_amount:
            discountPercentage > 0
              ? Math.round(
                  item.totalPrice * (1 - discountPercentage / 100) * 100
                )
              : Math.round(item.totalPrice * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: successURL,
      cancel_url: `${returnLocation}`,
    });

    console.log("Flight checkout session created:", session.id);
    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating flight checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

// =====================
// =====================

app.post("/create-hotel-booking-session", async (req, res) => {
  try {
    const {
      hotelID,
      hotelName,
      checkinDate,
      checkoutDate,
      numberOfRooms,
      roomName,
      price, // Total price already calculated (in the correct currency amount)
      numberOfAdults,
      paymentType,
      currency,
      returnLocation,
      discountPercentage,
      promoCode, // Can be used later for payment method-specific logic
    } = req.body;

    // Ensure price is in cents (Stripe requires the price in the smallest currency unit, e.g., cents)
    const totalPrice = Math.round(price * 100); // Convert the total price to cents if it's in dollars

    // Create a Stripe session for the hotel booking
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency, // Adjust to dynamic currency if needed
            product_data: {
              name:
                discountPercentage > 0
                  ? `(-${discountPercentage}%) ${hotelName} - ${roomName}`
                  : `${hotelName} - ${roomName}`, // Display hotel and room name in the checkout
              description: `Booking for ${numberOfRooms} rooms, ${numberOfAdults} adults`,
            },
            unit_amount: totalPrice,
          },
          quantity: 1, // Only one booking (it already includes the full price)
        },
      ],
      mode: "payment",
      success_url: `${
        req.body.returnLocation
      }&success=true&session_id={CHECKOUT_SESSION_ID}&hotelID=${hotelID}&roomName=${encodeURIComponent(
        roomName
      )}&checkinDate=${encodeURIComponent(
        checkinDate
      )}&checkoutDate=${encodeURIComponent(
        checkoutDate
      )}&numberOfRooms=${numberOfRooms}&numberOfAdults=${numberOfAdults}&paymentType=${encodeURIComponent(
        paymentType
      )}&price=${encodeURIComponent(
        price
      )}&promoCode=${promoCode}&discountPercentage=${discountPercentage}`,
      cancel_url: `${req.body.returnLocation}&cancel=true`,
    });

    console.log("Hotel booking checkout session created:", session.id);
    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating hotel booking checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

// get visit count
app.get("/visit-count", async (req, res) => {
  try {
    // find one
    const visitCount = await VisitCount.findOne();
    res.json({ visitCount });
  } catch (error) {
    console.error("Error fetching visit count:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/increment-visit-count", async (req, res) => {
  try {
    const count = await VisitCount.incrementCount();
    res.json(count);
  } catch (error) {
    console.error("Error incrementing visit count:", error);
    res.status(500).json({ error: error.message });
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

const checkUpcomingEvents = async () => {
  try {
    console.log("Starting check for upcoming events...");
    const today = new Date();
    const twoDays = new Date();
    twoDays.setDate(twoDays.getDate() + 2);

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

    console.log(
      `Found ${itineraries.length} itineraries and ${activities.length} activities starting in 2 days.`
    );

    for (itinerary of itineraries) {
      console.log(
        `Sending reminder for itinerary: ${itinerary.itinerary.title}`
      );
      await Tourist.findByIdAndUpdate(itinerary.user._id.toString(), {
        $push: {
          notifications: {
            tags: ["reminder", "itinerary_change"], // Multiple tags for better classification
            title: "Upcoming Itinerary Reminder",
            priority: "high",
            type: "reminder",
            body: `Your booked itinerary <b>${itinerary.itinerary.title}</b> is starting in 2 days.`,
            link: `/itinerary/${itinerary.itinerary._id}`,
          },
        },
        $set: {
          hasUnseenNotifications: true, // Set the hasUnseen flag to true
        },
      });
      emailService.sendItineraryReminder(itinerary);
    }

    for (activity of activities) {
      console.log(`Sending reminder for activity: ${activity.activity.name}`);
      await Tourist.findByIdAndUpdate(activity.user._id.toString(), {
        $push: {
          notifications: {
            tags: ["reminder", "activity"], // Multiple tags to classify this notification
            title: "Upcoming Activity Reminder",
            priority: "high", // High priority since it is time-sensitive
            type: "reminder", // Indicates this is a reminder notification
            body: `Your booked activity <b>${activity.activity.name}</b> is starting in 2 days.`,
            link: `/activity/${activity.activity._id}`, // Directs the user to the activity details page
          },
        },
        $set: {
          hasUnseenNotifications: true, // Set the hasUnseen flag to true
        },
      });
      emailService.sendActivityReminder(activity);
    }

    console.log("Finished checking upcoming events.");
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
    for (const tourist of birthdayTourists) {
      let code = "";
      //get the current year
      const currentDate = new Date();
      if (tourist.fname) {
        code = `${tourist.fname.toUpperCase()}${currentDate.getFullYear()}`;
      } else {
        code = `${tourist.username.toUpperCase()}${currentDate.getFullYear()}`;
      }
      await Tourist.findByIdAndUpdate(tourist._id.toString(), {
        $push: {
          notifications: {
            tags: ["personal", "birthday", "promotional"], // Multiple tags to classify this as personal, birthday-related, and promotional
            title: "🎉 Happy Birthday! 🎂", // A short and celebratory title
            priority: "medium", // Medium priority for a birthday notification
            type: "birthday", // Specifies the type of notification
            body: `<h1>Happy Birthday, ${
              tourist.fname ? tourist.fname : tourist.username
            }! 🎉🎂🎈</h1>
            <p>Wishing you a magical day filled with happiness and a year filled with joy.</p>
            <p>As a special gift, here is your magical promo code which you can use on any booking or product:</p>
            <h3>Code: <strong>${code}</strong></h3>
            <h3>Discount: <strong>50%</strong></h3>
            <h3>Usage Limit: <strong>1</strong></h3>
            <h3>Valid Until: <strong>${new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            ).toDateString()}</strong></h3>`,
            link: `/promo/${code}`, // Directs to a page with promo details (optional customization)
          },
        },
        $set: {
          hasUnseenNotifications: true, // Set the hasUnseen flag to true
        },
      });
      emailService.sendBirthdayEmail(tourist, code);

      const promo = new promoCode({
        code: code,
        percentOff: 50,
        usage_limit: 1,
        type: "birthday",
        dateRange: {
          start: new Date(),
          end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        },
      });

      await promo.save();
    }
  } catch (error) {
    console.error("Error sending birthday cards:", error);
  }
};

// Run this function on server startup
checkAndUpdateRatesOnStart();
checkAndUpdateStatusOnStart();
checkBirthdays();
checkUpcomingEvents();
