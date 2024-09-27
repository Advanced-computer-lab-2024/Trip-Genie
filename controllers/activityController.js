const Activity = require('../models/activity');


const getAllActivities = async (req, res) => {
    try {
        const activities = await Activity.find().populate('category').populate('tags').populate("advertiser").exec();
        res.status(200).json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getActivityById = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }
        res.status(200).json(activity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// const createActivity = async (req, res) => {
//     const activity = new Activity(req.body);
//     try {
//         await activity.save();
//         res.status(201).json(activity);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// };

const createActivity = async (req, res) => {
    const {name, location, duration, timeline, price, category, tags, specialDiscount, rating, isBookingOpen} = req.body;
    const activity = new Activity({name, location, duration, timeline, price, category, tags, specialDiscount, rating, isBookingOpen, advertiser:res.locals.user_id});

    try {
        await activity.save();
        res.status(201).json(activity);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


const deleteActivity = async (req, res) => {
    try {
        const activity = await Activity.findByIdAndDelete(req.params.id);
        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }
        res.status(204).json();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateActivity = async (req, res) => {
    try {
        const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }
        res.status(200).json(activity);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getActivitiesByAdvertiser = async (req, res) => {
    try {
        const  advertiserID  = res.locals.user_id; 
        const activities = await Activity.findByAdvertiser(advertiserID);
        if (!activities || activities.length === 0) {
            return res.status(404).json({ message: 'No activities found for this advertiser.' });
        }
        res.status(200).json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const filterActivities = async (req, res) => {
    try {
        const { price, startDate, endDate, category, minRating } = req.body;

        // Build the query object
        let query = {};

        if (price) {
            query.price = { $lte: price }; // Less than or equal to the specified budget
        }


        if (startDate) {
            const start = new Date(startDate);
            if (!isNaN(start.getTime())) {
                query['timeline.start'] = { ...query['timeline.start'], $gte: start };
            }
        }

        if (endDate) {
            const end = new Date(endDate);
            if (!isNaN(end.getTime())) {
                query['timeline.end'] = { ...query['timeline.end'], $lte: end };
            }
        }

        if (category) {
            const categoryIds = Array.isArray(category) ? 
                category.map(id => mongoose.Types.ObjectId(id)) : 
                [mongoose.Types.ObjectId(category)];
            query.category = { $in: categoryIds };
        }

        if (minRating) {
            query.rating = { $gte: minRating }; // Filter by minimum rating
        }


        console.log('Query Object:', query); // Log the query object

        const activities = await Activity.find(query).populate('category tags');

        res.status(200).json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const searchActivities = async (req, res) => {
    try {
        const { searchBy } = req.body;
        const activities = await Activity.findByFields(searchBy);
        if (!activities || activities.length === 0) {
            return res.status(404).json({ message: 'No activities places found.' });
        }
        res.status(200).json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    getAllActivities,
    getActivityById,
    createActivity,
    deleteActivity,
    updateActivity,
    filterActivities,
    getActivitiesByAdvertiser,
    searchActivities
};