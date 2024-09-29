const Itinerary = require('../models/touristItinerary'); 

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
    const itinerary = new Itinerary(req.body);
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

module.exports = {
    getAllItineraries,
    getItineraryById,
    createItinerary,
    deleteItinerary,
    updateItinerary,
};