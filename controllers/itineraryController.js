const Itinerary = require('../models/itinerary');

// GET all itineraries
const getAllItineraries = async (req, res) => {
    try {
        const itineraries = await Itinerary.find();
        res.status(200).json(itineraries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET a single itinerary
const getItineraryById = async (req, res) => {
    try {
        const itinerary = await Itinerary.findById(req.params.id);
        if (!itinerary) {
            return res.status(404).json({ message: 'Itinerary not found' });
        }
        res.status(200).json(itinerary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST a new itinerary
const createItinerary = async (req, res) => {
    const {title, description, activities, language, price, availableDates, accessibility, pickUpLocation, dropOffLocation} = req.body;
    const itinerary = new Itinerary({title, description, activities, language, price, availableDates, accessibility, pickUpLocation, dropOffLocation, tourGuide:res.locals.user_id});

    try {
        await itinerary.save();
        res.status(201).json(itinerary);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE a single itinerary
const deleteItinerary = async (req, res) => {
    try {
        const itinerary = await Itinerary.findByIdAndDelete(req.params.id);
        if (!itinerary) {
            return res.status(404).json({ message: 'Itinerary not found' });
        }
        res.status(204).json();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a single itinerary
const updateItinerary = async (req, res) => {
    try {
        const itinerary = await Itinerary.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!itinerary) {
            return res.status(404).json({ message: 'Itinerary not found' });
        }
        res.status(200).json(itinerary);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
const filterItineraries = async (req, res) => {
    try {
        const { price , date, preferences, language } = req.body;

        // Build the query object
        let query = {};

        if (price) {
            query.price = { $lte: price }; // Less than or equal to the specified budget
        }

        if (date) {
            query.availableDates = { 
                $elemMatch: { date: new Date(date) }
            };
        }

        // Filter by preferences (assumed to be an array of activity types)
        if (preferences) {
            const preferenceArray = preferences.split(','); // Example: preferences=beach,shopping
            query.activities = { $in: preferenceArray }; // Match any of the provided preferences
        }

        if (language) {
            query.language = language;
        }

        // Execute the query
        const itineraries = await Itinerary.find(query).populate('activities').populate('tourGuide');
       
        if (!itineraries) {
            return res.status(404).json({ message: 'Itinerary not found' });
        }

        
        res.json(itineraries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllItineraries,
    getItineraryById,
    createItinerary,
    deleteItinerary,
    updateItinerary,
    filterItineraries,
};
