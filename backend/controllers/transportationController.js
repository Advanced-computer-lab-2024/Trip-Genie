const Transportation = require("../models/transportation");

// Get all transportations
const getAllTransportations = async (req, res) => {
  try {
    const transportations = await Transportation.find();
    res.status(200).json(transportations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get transportation by ID
const getTransportationById = async (req, res) => {
  try {
    const transportation = await Transportation.findById(req.params.id);
    if (!transportation) {
      return res.status(404).json({ message: "Transportation not found" });
    }
    res.status(200).json(transportation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new transportation
const createTransportation = async (req, res) => {
  const { from, to, vehicleType, ticketCost, timeDeparture, estimatedDuration, remainingSeats } = req.body;
  
  const newTransportation = new Transportation({
    from,
    to,
    vehicleType,
    ticketCost,
    timeDeparture,
    estimatedDuration,
    remainingSeats
  });

  try {
    const savedTransportation = await newTransportation.save();
    res.status(201).json(savedTransportation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update transportation
const updateTransportation = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedTransportation = await Transportation.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updatedTransportation) {
      return res.status(404).json({ message: "Transportation not found" });
    }
    res.status(200).json(updatedTransportation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete transportation
const deleteTransportation = async (req, res) => {
  try {
    const deletedTransportation = await Transportation.findByIdAndDelete(req.params.id);
    if (!deletedTransportation) {
      return res.status(404).json({ message: "Transportation not found" });
    }
    res.status(200).json({ message: "Transportation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
    getAllTransportations,
    getTransportationById,
    createTransportation,
    updateTransportation,
    deleteTransportation
};