const Itinerary = require("../models/itinerary");
const Tourist = require("../models/tourist");
const TourGuide = require("../models/tourGuide");

const ItineraryBooking = require("../models/itineraryBooking");
const cloudinary = require("../utils/cloudinary");
const emailService = require("../services/emailService");

// import { ItineraryBooking } from './models/itineraryBooking';

// GET all itineraries

const getAllItineraries = async (req, res) => {
  try {
    const {
      maxPrice,
      minPrice,
      upperDate,
      lowerDate,
      types,
      languages,
      searchBy,
      sort,
      asc,
      myItineraries,
      isBooked,
    } = req.query;

    const userRole = res.locals.user_role; // Assuming user role is stored in res.locals
    const userId = res.locals.user_id;

    const filterResult = await Itinerary.filter(
      maxPrice,
      minPrice,
      upperDate,
      lowerDate,
      types,
      languages,
      isBooked
    );

    const searchResult = await Itinerary.findByFields(searchBy);

    const searchResultIds = searchResult.map((itinerary) => itinerary._id);
    const filterResultIds = filterResult.map((itinerary) => itinerary._id);

    let query = [];
    if (searchResultIds.length > 0) {
      query.push({ _id: { $in: searchResultIds } });
    }
    if (filterResultIds.length > 0) {
      query.push({ _id: { $in: filterResultIds } });
    }

    // print the itineraries that match these search results and filter results

    // query.push({ appropriate: true });

    if (!myItineraries) {
      query.push({
        availableDates: {
          $elemMatch: {
            date: { $gte: new Date() },
          },
        },
      });
    }

    query.push({ isDeleted: false });

    // Handle different user roles
    if (userRole === "tourist") {
      const bookedItineraries = await ItineraryBooking.find({
        user: userId,
      }).distinct("itinerary");
      query.push({
        $or: [{ isActivated: true }, { _id: { $in: bookedItineraries } }],
      });
    } else if (userRole === "tour-guide") {
      query.push({
        $or: [{ isActivated: true }, { tourGuide: userId }],
      });
    } else {
      query.push({ isActivated: true });
    }

    // If role is 'tour-guide', skip the 'appropriate' check for their own itineraries
    if (userRole !== "tour-guide") {
      query.push({ appropriate: true });
    } else {
      query.push({
        $or: [
          { tourGuide: userId }, // Tour guide's own itineraries
          { appropriate: true }, // Appropriate itineraries for others
        ],
      });
    }

    if (myItineraries) {
      query.push({ tourGuide: userId });
    }

    let itinerariesQuery = Itinerary.find({ $and: query })
      .populate("tourGuide")
      .populate({ path: "activities", populate: { path: "tags category" } });

    if (sort) {
      const sortBy = {};
      sortBy[sort] = parseInt(asc);
      itinerariesQuery = itinerariesQuery.sort(sortBy);
    } else {
      itinerariesQuery = itinerariesQuery.sort({ createdAt: -1 });
    }

    const itineraries = await itinerariesQuery.exec();

    if (!itineraries || itineraries.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(itineraries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMaxPrice = async (req, res) => {
  const today = new Date(); // Current date

  try {
    const maxPriceItinerary = await Itinerary.findOne({
      isDeleted: false,
      isActivated: true,
      appropriate: true,
      availableDates: {
        $elemMatch: {
          date: { $gte: today },
        },
      },
    }).sort({ price: -1 });

    const maxPrice = maxPriceItinerary ? maxPriceItinerary.price : 1;
    console.log(maxPrice);
    res.status(200).json(maxPrice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMaxPriceMy = async (req, res) => {
  const userId = res.locals.user_id;

  try {
    const maxPriceItinerary = await Itinerary.findOne({
      tourGuide: userId,
      isDeleted: false,
      isActivated: true,
      appropriate: true,
    }).sort({ price: -1 });

    const maxPrice = maxPriceItinerary ? maxPriceItinerary.price : 0;
    res.status(200).json(maxPrice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getItinerariesByPreference = async (req, res) => {
  try {
    // Fetch tourist preferences
    const tourist = await Tourist.findById(res.locals.user_id);

    if (!tourist) {
      return res.status(404).json({ message: "Tourist not found" });
    }

    const { budget, price, tourType, tourLanguages } = tourist.preference;

    // Apply filters based on preferences and query params

    const filterResult = await Itinerary.filter(
      budget, //max
      price, //min
      undefined,
      undefined,
      tourType,
      tourLanguages
    );

    const filterResultIds = filterResult.map((itinerary) => itinerary._id);

    const query = [];
    query.push({ _id: { $in: filterResultIds } });

    // Only show future itineraries if 'myItineraries' is not specified
    query.push({
      availableDates: {
        $elemMatch: {
          date: { $gte: new Date() },
        },
      },
    });
    query.push({ isDeleted: false });

    const userRole = res.locals.user_role;
    const userId = res.locals.user_id;
    if (userRole === "tourist") {
      const bookedItineraries = await ItineraryBooking.find({
        user: userId,
      }).distinct("itinerary");
      query.push({
        $or: [{ isActivated: true }, { _id: { $in: bookedItineraries } }],
      });
    } else {
      query.push({ isActivated: true });
    }

    // appropriate must be true and isActivated must be true

    query.push({ appropriate: true });

    let itinerariesQuery = Itinerary.find({
      $and: query,
    })
      .populate("tourGuide")
      .populate({ path: "activities", populate: { path: "tags category" } });

    const itineraries = await itinerariesQuery;

    res.status(200).json(itineraries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const theHolyAntiFilter = async (req, res) => {
  try {
    // First, call getAllItineraries to get all itineraries
    const allItineraries = await new Promise((resolve, reject) => {
      getAllItineraries(req, {
        status: () => ({
          json: resolve,
        }),
        locals: res.locals,
      });
    });

    // Then, call getItinerariesByPreference to get itineraries based on user preferences
    const preferredItineraries = await new Promise((resolve, reject) => {
      getItinerariesByPreference(req, {
        status: () => ({
          json: resolve,
        }),
        locals: res.locals,
      });
    });

    // Map itinerary IDs for comparison
    const allItineraryIds = new Set(
      allItineraries.map((itinerary) => itinerary._id.toString())
    );
    const preferredItineraryIds = new Set(
      preferredItineraries.map((itinerary) => itinerary._id.toString())
    );

    // Find the set difference (itineraries in allItineraries but not in preferredItineraries)
    const differenceIds = [...allItineraryIds].filter(
      (id) => !preferredItineraryIds.has(id)
    );

    // Filter out the itineraries that match the differenceIds from allItineraries
    const itinerariesDifference = allItineraries.filter((itinerary) =>
      differenceIds.includes(itinerary._id.toString())
    );

    // Return the set difference
    res.status(200).json(itinerariesDifference);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllItinerariesAdmin = async (req, res) => {
  try {
    const {
      maxPrice,
      minPrice,
      upperDate,
      lowerDate,
      types,
      languages,
      searchBy,
      sort,
      asc,
      myItineraries,
      isBooked,
    } = req.query;

    const filterResult = await Itinerary.filter(
      maxPrice,
      minPrice,
      upperDate,
      lowerDate,
      types,
      languages,
      isBooked
    );

    const searchResult = await Itinerary.findByFields(searchBy);

    const searchResultIds = searchResult.map((itinerary) => itinerary._id);
    const filterResultIds = filterResult.map((itinerary) => itinerary._id);

    let query = [];
    query.push({ _id: { $in: searchResultIds } });
    query.push({ _id: { $in: filterResultIds } });
    if (!myItineraries) {
      query.push({
        availableDates: {
          $elemMatch: {
            date: { $gte: new Date() }, // Match any date that is upcoming
          },
        },
      });
    }
    if (myItineraries) {
      query.push({ tourGuide: res.locals.user_id });
    }
    query.push({ isDeleted: false });
    let itinerariesQuery = await Itinerary.find({
      $and: query,
    })
      .populate("tourGuide")
      .populate({ path: "activities", populate: { path: "tags category" } })
      .exec();

    if (sort) {
      const sortBy = {};
      sortBy[sort] = parseInt(asc); // Sort ascending (1) or descending (-1) based on your needs
      itinerariesQuery = await Itinerary.find({
        $and: query,
      })
        .populate("tourGuide")
        .populate({ path: "activities", populate: { path: "tags category" } })
        .sort(sortBy);
    } else {
      itinerariesQuery = await Itinerary.find({
        $and: query,
      })
        .populate("tourGuide")
        .populate({ path: "activities", populate: { path: "tags category" } })
        .sort({ createdAt: -1 });
    }

    const itineraries = await itinerariesQuery;

    if (!itineraries || itineraries.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(itineraries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET a single itinerary
const getItineraryById = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id)
      .populate("tourGuide")
      .populate({ path: "activities", populate: { path: "tags category" } })
      .exec();
    if (!itinerary) {
      return res.status(400).json({ message: "Itinerary not found" });
    }
    if (itinerary.isDeleted) {
      return res.status(400).json({ message: "Itinerary no longer exis" });
    }
    console.log(itinerary);
    res.status(200).json(itinerary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST a new itinerary
const createItinerary = async (req, res) => {
  const {
    title,
    language,
    price,
    // isRepeated,
    accessibility,
    pickUpLocation,
    dropOffLocation,
  } = req.body;
  const activities = JSON.parse(req.body.activities);
  const availableDates = JSON.parse(req.body.availableDates);

  if (availableDates.length === 0) {
    return res
      .status(400)
      .json({ message: "Itinerary must have at least one date" });
  }
  // if (!isRepeated) {
  // if (availableDates.length > 1) {
  //   return res.status(400).json({
  //     message: "Itinerary must have only one date if it is not repeated",
  //   });
  // }
  // activities.forEach((activity) => {
  //   if (activity.timing < availableDates[0].date) {
  //     return res.status(400).json({
  //       message: "Activities date must be after the itinerary date",
  //     });
  //   }
  // });

  await (async () => {
    for (const file of req.files) {
      const [activityIndex, imageIndex] = file.fieldname
        .match(/\d+/g)
        .map(Number);

      //convert the file to base64
      const base64 = `data:image/jpeg;base64,${file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(base64, {
        folder: "Itineraries",
      });
      console.log(activities[activityIndex].pictures);

      activities[activityIndex].pictures[imageIndex] = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }
  })();

  const itinerary = new Itinerary({
    title,
    activities,
    language,
    price,
    currency: "67140446ee157ee4f239d523",
    availableDates,
    accessibility,
    pickUpLocation,
    dropOffLocation,
    tourGuide: res.locals.user_id,
    // isRepeated,
  });

  try {
    await itinerary.save();
    res.status(201).json(itinerary);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

// // DELETE a single itinerary
// const deleteItinerary = async (req, res) => {
//     try {
//         const itinerary = await Itinerary.findByIdAndDelete(req.params.id);
//         if (!itinerary) {
//             return res.status(404).json({ message: 'Itinerary not found' });
//         }
//         res.status(204).json();
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// Update a single itinerary

const updateItinerary = async (req, res) => {
  try {
    const tourGuideId = res.locals.user_id; // Get the current tour guide's ID
    // console.log(req.files);
    // console.log(req.body);
    // Find the itinerary by ID
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(400).json({ message: "Itinerary not found" });
    }

    if (itinerary.isDeleted) {
      return res.status(400).json({ message: "Itinerary no longer exists" });
    }

    // Check if the itinerary belongs to the current tour guide
    if (itinerary.tourGuide.toString() !== tourGuideId) {
      return res.status(403).json({
        message: "Unauthorized: You can only update your own itineraries",
      });
    }

    // Check if the itinerary is booked
    if (itinerary.isBooked) {
      return res.status(400).json({
        message: "Itinerary cannot be updated as it is already booked",
      });
    }

    // If all checks pass, delete the itinerary
    const {
      title,
      price,
      language,
      accessibility,
      pickUpLocation,
      dropOffLocation,
      appropriate,
      isBookingOpen,
      // isRepeated,
    } = req.body;

    const activities = JSON.parse(req.body.activities);
    const availableDates = JSON.parse(req.body.availableDates);

    if (availableDates.length === 0) {
      return res
        .status(400)
        .json({ message: "Itinerary must have at least one date" });
    }

    await (async () => {
      for (const file of req.files) {
        const [activityIndex, imageIndex] = file.fieldname
          .match(/\d+/g)
          .map(Number);

        //convert the file to base64
        const base64 = `data:image/jpeg;base64,${file.buffer.toString(
          "base64"
        )}`;
        const result = await cloudinary.uploader.upload(base64, {
          folder: "Itineraries",
        });

        activities[activityIndex].pictures[imageIndex] = {
          url: result.secure_url,
          public_id: result.public_id,
        };
      }
    })();

    const oldActivitiesPictures = itinerary.activities
      .map((activity) => activity.pictures.map((picture) => picture.public_id))
      .flat();
    const newActivitiesPictures = activities
      .map((activity) => activity.pictures.map((picture) => picture.public_id))
      .flat();

    oldActivitiesPictures.forEach(async (public_id) => {
      if (!newActivitiesPictures.includes(public_id)) {
        await cloudinary.uploader.destroy(public_id);
      }
    });

    const newItinerary = await Itinerary.findByIdAndUpdate(
      req.params.id,
      {
        title,
        availableDates,
        price,
        language,
        activities,
        accessibility,
        pickUpLocation,
        dropOffLocation,
        appropriate,
        isBookingOpen,
        // isRepeated,
      },
      { new: true, runValidators: true }
    );

    if (newItinerary.isBookingOpen && !itinerary.isBookingOpen) {
      //Notify all tourists who saved this itinerary that it is now open for booking
      const tourists = await Tourist.find({
        "savedItinerary.itinerary": req.params.id,
      });
      for (let i = 0; i < tourists.length; i++) {
        await Tourist.findByIdAndUpdate(tourists[i]._id, {
          $push: {
            notifications: {
              tags: ["informational", "itinerary", "available"],
              title: "Itinerary Now Available for Booking",
              priority: "medium",
              type: "informational",
              body: `The itinerary <b>${newItinerary.title}</b> is now available for booking.`,
              link: `/itinerary/${newItinerary._id}`,
            },
          },
          $set: {
            hasUnseenNotifications: true, // Set the hasUnseen flag to true
          },
        });
      }
    }

    res.status(200).json({ message: "Itinerary updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
const flagItinerary = async (req, res) => {
  try {
    // Find the itinerary by ID
    const itinerary = await Itinerary.findById(req.params.id).populate(
      "tourGuide"
    );

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    if (itinerary.isDeleted) {
      return res.status(400).json({ message: "Itinerary no longer exists" });
    }

    // Check if the itinerary is booked

    // If all checks pass, delete the itinerary
    const { appropriate } = req.body;

    await Itinerary.findByIdAndUpdate(req.params.id, {
      appropriate,
    });

    if (!appropriate) {
      await emailService.sendItineraryFlaggedEmail(itinerary);

      // Add a notification to the advertiser's notifications array
      const notification = {
        tags: ["alert", "itinerary", "inappropriate"],
        title: "Itinerary Flagged as Inappropriate",
        priority: "high",
        type: "alert",
        body: `Your itinerary <b>${itinerary.title}</b> has been flagged as inappropriate by the admin.`,
        link: `/itinerary/${req.params.id}`,
        date: new Date(),
        seen: false,
      };

      await TourGuide.findByIdAndUpdate(itinerary.tourGuide._id, {
        $push: { notifications: notification },
        $set: {
          hasUnseenNotifications: true, // Set the hasUnseen flag to true
        },
      });
    }

    res.status(200).json({ message: "Itinerary updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteItinerary = async (req, res) => {
  try {
    const tourGuideId = res.locals.user_id; // Get the current tour guide's ID

    // Find the itinerary by ID
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    // Check if the itinerary belongs to the current tour guide
    if (itinerary.tourGuide.toString() !== tourGuideId) {
      return res.status(403).json({
        message: "Unauthorized: You can only delete your own itineraries",
      });
    }

    // Check if the itinerary is booked
    if (itinerary.isBooked) {
      return res.status(400).json({
        message: "Itinerary cannot be deleted as it is already booked",
      });
    }

    // Remove itinerary from saved itinerary list for each tourist

    const tourists = await Tourist.find({
      "savedItinerary.itinerary": req.params.id,
    });
    for (let i = 0; i < tourists.length; i++) {
      const index = tourists[i].savedItinerary.findIndex(
        (item) =>
          item && item.itinerary && item.itinerary.toString() === req.params.id
      );
      if (index !== -1) {
        tourists[i].savedItinerary.splice(index, 1);
        await Tourist.findByIdAndUpdate(tourists[i]._id, {
          savedItinerary: tourists[i].savedItinerary,
        });
      }
    }
    // If all checks pass, delete the itinerary
    await Itinerary.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Itinerary deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Function to get all itineraries for a specific tour guide

const getAllLanguages = async (req, res) => {
  try {
    const languages = await Itinerary.find({
      isActivated: true,
      isDeleted: false,
    }).distinct("language");
    res.status(200).json(languages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const addCommentToItinerary = async (req, res) => {
  try {
    const { username, rating, content } = req.body;
    console.log(username);

    if (rating === undefined) {
      rating = 0; // Default rating
    }

    if (rating < 0 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be a number between 0 and 5" });
    }

    const tourist = await Tourist.findById(res.locals.user_id);
    if (!tourist) {
      return res.status(400).json({ message: "Tourist not found" });
    }

    // Determine the username to use
    let finalUsername;

    if (username && username === "Anonymous") {
      finalUsername = "Anonymous"; // Use 'anonymous' as the username
    } else if (tourist.username) {
      finalUsername = tourist.username;
      // Use the authenticated user's username
    } else {
      return res.status(400).json({ message: "Valid username is required" });
    }

    // Find the activity by ID
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(400).json({ message: "Itinerary not found" });
    }
    if (itinerary.isDeleted) {
      return res.status(400).json({ message: "Itinerary no longer exists" });
    }

    // Create the new comment object
    const newComment = {
      username: finalUsername,
      rating,
      content,
      date: new Date(),
      tourist: tourist._id, // Set the current date
    };

    // Add the comment to the activity's comments array
    itinerary.comments.push(newComment);

    // If the comment includes a rating, call the rateActivity method logic
    let newAverageRating;
    if (rating !== undefined) {
      newAverageRating = await itinerary.addRating(rating);
    }

    // Save the updated activity
    await itinerary.save();

    // Return the updated comments and new average rating (if applicable)
    res.status(200).json({
      message: "Comment added successfully",
      comments: itinerary.comments,
      ...(newAverageRating && { newAverageRating }), // Only include the new rating if it was updated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while adding the comment",
      error: error.message,
    });
  }
};

const updateCommentOnItinerary = async (req, res) => {
  try {
    const { rating, content, username } = req.body;
    const touristId = res.locals.user_id; // Get the authenticated user's ID
    console.log(
      "11111111111111111111111111111111111111111111111111111111111111111"
    );
    console.log(username);
    // Validate the rating if it's provided
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      return res.status(400).json({
        message: "Rating must be a number between 0 and 5",
      });
    }

    const tourist = await Tourist.findById(res.locals.user_id);
    if (!tourist) {
      return res.status(400).json({ message: "Tourist not found" });
    }

    // Find the itinerary by ID
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(400).json({ message: "Itinerary not found" });
    }
    if (itinerary.isDeleted) {
      return res.status(400).json({ message: "Itinerary no longer exists" });
    }

    // Find the comment by the tourist ID
    const comment = itinerary.comments.find(
      (comment) => comment.tourist.toString() === touristId
    );
    if (!comment) {
      return res
        .status(400)
        .json({ message: "Comment not found for this user" });
    }

    // Update fields if provided
    let finalUsername;

    if (username && username === "Anonymous") {
      finalUsername = "Anonymous"; // Use 'anonymous' as the username
    } else {
      finalUsername = tourist.username;
    }
    comment.username = finalUsername;
    if (rating !== undefined) comment.rating = rating;
    if (content) comment.content = content;

    // Recalculate the average rating if the rating was updated
    let newAverageRating;
    if (rating !== undefined) {
      const totalRatings = itinerary.comments.length;
      const sumOfRatings = itinerary.comments.reduce(
        (sum, comment) => sum + comment.rating,
        0
      );
      newAverageRating = sumOfRatings / totalRatings;
      itinerary.rating = newAverageRating; // Update the itinerary's average rating
    }

    // Save the updated itinerary
    await itinerary.save();

    // Respond with success and the updated comment
    res.status(200).json({
      message: "Comment updated successfully",
      comment,
      ...(newAverageRating && { newAverageRating }), // Include new average if rating was updated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while updating the comment",
      error: error.message,
    });
  }
};

const rateItinerary = async (req, res) => {
  try {
    const { rating } = req.body; // Get rating from the request body

    // Find the activity by ID
    const itinerary = await Itinerary.findById(req.params.id);
    // .populate("advertiser")
    // .populate("category")
    // .populate("tags")
    // .populate("comments")
    //.exec();

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }
    if (itinerary.isDeleted) {
      return res.status(400).json({ message: "Itinerary no longer exists" });
    }

    // Add the rating and calculate the new average
    const newAverageRating = await itinerary.addRating(rating);
    // Return the new average rating
    res.status(200).json({ message: "Rating added", newAverageRating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleActivationStatus = async (req, res) => {
  try {
    const { id } = req.params; // Extract itinerary ID from the request parameters

    // Find the itinerary by its ID and toggle the isActivated field using update
    const itinerary = await Itinerary.findById(id);

    // If itinerary not found, return a 404 error
    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }
    if (itinerary.isDeleted) {
      return res.status(400).json({ message: "Itinerary no longer exists" });
    }

    // Use findByIdAndUpdate to toggle the activation status
    const updatedItinerary = await Itinerary.findByIdAndUpdate(
      id,
      { isActivated: !itinerary.isActivated }, // Toggle the isActivated field
      { new: true } // Return the updated document
    );

    // Return the updated itinerary details
    return res.status(200).json({
      message: `Itinerary ${
        updatedItinerary.isActivated ? "activated" : "deactivated"
      } successfully`,
      itinerary: updatedItinerary,
    });
  } catch (error) {
    // Handle any errors
    return res.status(500).json({ error: error.message });
  }
};

// Add an activity to an itinerary
const addActivityToItinerary = async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const activityData = req.body; // Activity data sent in the request body

    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary)
      return res.status(404).json({ error: "Itinerary not found" });

    itinerary.activities.push(activityData); // Add new activity
    await itinerary.save();

    res.status(200).json(itinerary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Edit an activity in an itinerary
const editActivityInItinerary = async (req, res) => {
  try {
    const { itineraryId, activityId } = req.params;
    const updatedData = req.body; // Updated data for the activity

    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary)
      return res.status(404).json({ error: "Itinerary not found" });

    const activity = itinerary.activities.id(activityId);
    if (!activity) return res.status(404).json({ error: "Activity not found" });

    Object.assign(activity, updatedData); // Merge new data into the existing activity
    await itinerary.save();

    res.status(200).json(itinerary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Remove an activity from an itinerary
const removeActivityFromItinerary = async (req, res) => {
  try {
    const { itineraryId, activityId } = req.params;

    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary)
      return res.status(404).json({ error: "Itinerary not found" });

    const activity = itinerary.activities.id(activityId);
    if (!activity) return res.status(404).json({ error: "Activity not found" });

    activity.remove(); // Remove the activity using Mongoose's subdocument method
    await itinerary.save();

    res.status(200).json(itinerary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllItineraries,
  getAllItinerariesAdmin,
  getItineraryById,
  createItinerary,
  deleteItinerary,
  updateItinerary,
  getAllLanguages,
  addCommentToItinerary,
  rateItinerary,
  flagItinerary,
  toggleActivationStatus,
  getItinerariesByPreference,
  theHolyAntiFilter,
  updateCommentOnItinerary,
  removeActivityFromItinerary,
  editActivityInItinerary,
  addActivityToItinerary,
  getMaxPrice,
  getMaxPriceMy,
};
