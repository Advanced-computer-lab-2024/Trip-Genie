const Booking = require('../models/booking'); 
const Tourist = require('../models/tourist'); 

// Controller methods
const bookingController = {

    // Method to get the logged-in user's bookings
    getUserBookings: async (req, res) => {
        try {
            const userId = res.locals.user_id;

            // Find the tourist and populate their bookings
            const tourist = await Tourist.findById(userId).populate('bookings');
            
            if (!tourist) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({ bookings: tourist.bookings });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Method to delete a booking by ID
    deleteBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;

            // Find and delete the booking
            const booking = await Booking.findByIdAndDelete(bookingId);
            
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }

            // Remove booking from the user's bookings array
            await Tourist.updateOne(
                { _id: req.user._id }, 
                { $pull: { bookings: bookingId } }
            );

            res.status(200).json({ message: 'Booking deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Method to create a new booking
    createBooking: async (req, res) => {
        try {
            const userId = res.locals.user_id; 
            const { bookingType, activity, itinerary, historicalPlace, paymentType } = req.body;

            // Create a new booking
            const newBooking = new Booking({
                bookingType,
                activity,
                itinerary,
                historicalPlace,
                paymentType,
                user: userId // Link the booking to the logged-in user
            });

            // Save the booking
            await newBooking.save();

            // Add the booking to the user's bookings array
            const user = await Tourist.findById(userId);
            user.bookings.push(newBooking._id);
            await user.save();

            res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

};

module.exports = bookingController;
