const Activity = require("../models/activity");
const Category = require("../models/category");
const Itinerary = require("../models/itinerary");
const Tourist = require("../models/tourist");

const getAllActivities = async (req, res) => {

  try {
    const {
      price,
      minPrice,
      startDate,
      endDate,
      category,
      minRating,
      searchBy,
      sort,
      asc,
      myActivities,
    } = req.query;

    const filterResult = await Activity.filter(
      price,
      minPrice,
      startDate,
      endDate,
      category,
      minRating
    );
    console.log(1);
    const searchResult = await Activity.findByFields(searchBy);

    const searchResultIds = searchResult.map((activity) => activity._id);
    const filterResultIds = filterResult.map((activity) => activity._id);

    const query = [];
    query.push({ _id: { $in: searchResultIds } });
    query.push({ _id: { $in: filterResultIds } });
    if (!myActivities) {
      query.push({ timing: { $gte: new Date() } });
    }

    if (myActivities) {
      query.push({ advertiser: res.locals.user_id });
    }
    let activitiesQuery = Activity.find({
      $and: query,
    })
      .populate("tags")
      .populate("category")
      // .populate("comments")
      ;

    if (sort) {
      const sortBy = {};
      sortBy[sort] = parseInt(asc); // Sort ascending (1) or descending (-1) based on your needs
      activitiesQuery = activitiesQuery.sort(sortBy);
    } else {
      activitiesQuery = activitiesQuery.sort({ createdAt: -1 });
    }

    const activities = await activitiesQuery;

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getActivitiesByPreferences = async (req, res) => {
  try {
    // Fetch tourist preferences
    const tourist = await Tourist.findById(res.locals.user_id);

    if (!tourist) {
      return res.status(404).json({ message: "Tourist not found" });
    }

    const {
      budget,
      categories,
      historicalPlacePeriod,
      historicalPlaceType,
      price,
      tourLanguages,
      tourType,
    } = tourist.preference;

    // Apply filters based on preferences and query params
    const {
      startDate,
      endDate,
      minRating,
      searchBy,
      sort,
      asc,
      myActivities,
    } = req.query;

    const filterResult = await Activity.filter(
      budget,
      price,
      startDate,
      endDate,
      categories,
      minRating
    );

    const searchResult = await Activity.findByFields(searchBy);

    const searchResultIds = searchResult.map((activity) => activity._id);
    const filterResultIds = filterResult.map((activity) => activity._id);

    const query = [];
    query.push({ _id: { $in: searchResultIds } });
    query.push({ _id: { $in: filterResultIds } });

    // Filter based on tour languages and tour type preferences
    if (tourLanguages.length > 0) {
      query.push({ languages: { $in: tourLanguages } });
    }
    if (tourType.length > 0) {
      query.push({ type: { $in: tourType } });
    }

    // Only show future activities if 'myActivities' is not specified
    if (!myActivities) {
      query.push({ timing: { $gte: new Date() } });
    }

    // Filter by user activities if 'myActivities' is specified
    if (myActivities) {
      query.push({ advertiser: res.locals.user_id });
    }

    let activitiesQuery = Activity.find({
      $and: query,
    })
      .populate("tags")
      .populate("category")

    // Apply sorting
    if (sort) {
      const sortBy = {};
      sortBy[sort] = parseInt(asc); // Ascending (1) or Descending (-1)
      activitiesQuery = activitiesQuery.sort(sortBy);
    } else {
      activitiesQuery = activitiesQuery.sort({ createdAt: -1 });
    }

    const activities = await activitiesQuery;

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const theHolyAntiFilter = async (req, res) => {
  try {
    // First, call getAllActivities to get all activities
    const allActivities = await new Promise((resolve, reject) => {
      getAllActivities(req, {
        status: () => ({
          json: resolve,
        }),
        locals: res.locals,
      });
    });

    // Then, call getActivitiesByPreferences to get activities based on user preferences
    const preferredActivities = await new Promise((resolve, reject) => {
      getActivitiesByPreferences(req, {
        status: () => ({
          json: resolve,
        }),
        locals: res.locals,
      });
    });

    // Map activity IDs for comparison
    const allActivityIds = new Set(allActivities.map((activity) => activity._id.toString()));
    const preferredActivityIds = new Set(preferredActivities.map((activity) => activity._id.toString()));

    // Find the set difference (activities in allActivities but not in preferredActivities)
    const differenceIds = [...allActivityIds].filter(id => !preferredActivityIds.has(id));

    // Filter out the activities that match the differenceIds from allActivities
    const activitiesDifference = allActivities.filter((activity) =>
      differenceIds.includes(activity._id.toString())
    );

    // Return the set difference
    res.status(200).json(activitiesDifference);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



const getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate("advertiser")
      .populate("category")
      .populate("tags")
      ;

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.status(200).json(activity);
  } catch (error) {
    console.error("Error fetching activity:", error);  // Log the error
    res.status(500).json({ error: error.message });
  }
};

const createActivity = async (req, res) => {
  const {
    name,
    location,
    duration,
    description,
    timing,
    price,
    currency,
    category,
    tags,
    specialDiscount,
    rating,
    isBookingOpen,
  } = req.body;
  const activity = new Activity({
    name,
    location,
    duration,
    timing,
    description,
    price,
    currency,
    category,
    tags,
    specialDiscount,
    rating,
    isBookingOpen,
    advertiser: res.locals.user_id,
  });

  try {
    await activity.save();
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    const advertiser = res.locals.user_id;
    if (activity.advertiser.toString() !== advertiser) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this activity" });
    }

    await Activity.findByIdAndDelete(req.params.id);

    // Remove the deleted activity from the 'activities' array in the Itinerary model
    await Itinerary.updateMany(
      { activities: req.params.id }, // Find itineraries with this activity
      { $pull: { activities: req.params.id } } // Remove the activity from the array
    );

    res.status(204).json();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    const advertiser = res.locals.user_id;
    if (activity.advertiser.toString() !== advertiser) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this activity" });
    }
    const {
      name,
      location,
      duration,
      description,
      timing,
      price,
      currency,
      range,
      category,
      tags,
      specialDiscount,
      isBookingOpen,
      pictures,
    } = req.body;
    await Activity.findByIdAndUpdate(
      req.params.id,
      {
        name,
        location,
        duration,
        description,
        timing,
        price,
        currency,
        range,
        category,
        tags,
        specialDiscount,
        isBookingOpen,
        pictures,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const rateActivity = async (req, res) => {
  try {
    
    const { rating } = req.body; // Get rating from the request body
    const activity = await Activity.findById(req.params.id)
    .populate("advertiser")
    .populate("category")
    .populate("tags")
    .exec();

    // Add the rating and calculate the new average
    const newAverageRating = await activity.addRating(rating);

    // Return the new average rating
    res.status(200).json({ message: "Rating added", newAverageRating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCommentToActivity = async (req, res) => {
  try {
    
    const { username, rating, content } = req.body; // Get comment details from the request body

    if (rating === undefined) {
      rating = 0; // Default rating
    }
    
    if ( rating < 0 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 0 and 5" });
    }

    const tourist = await Tourist.findById(res.locals.user_id);
    if (!tourist) {
      return res.status(404).json({ message: "Tourist not found" });
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
    const activity = await Activity.findById(req.params.id)
      .populate("advertiser")
      .populate("category")
      .populate("tags")
      .exec();

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    console.log(tourist.username);

    // Create the new comment object
    const newComment = {
      username: finalUsername,
      rating,
      content,
      date: new Date(), // Set the current date
    };


    // Add the comment to the activity's comments array
    activity.comments.push(newComment);

    // If the comment includes a rating, call the rateActivity method logic
    let newAverageRating;
    if (rating !== undefined) {
      newAverageRating = await activity.addRating(rating);
    }

    // Save the updated activity
    await activity.save();

    // Return the updated comments and new average rating (if applicable)
    res.status(200).json({
      message: "Comment added successfully",
      comments: activity.comments,
      ...(newAverageRating && { newAverageRating }), // Only include the new rating if it was updated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while adding the comment", error: error.message });
  }
};







module.exports = {
  getAllActivities,
  getActivityById,
  createActivity,
  deleteActivity,
  updateActivity,
  addCommentToActivity,
  rateActivity,
  getActivitiesByPreferences,
  theHolyAntiFilter, 
};

