const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activityBookingSchema = new Schema({
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity', 
        required: true
    },
    paymentType: {
        type: String,
        enum: ['CreditCard', 'DebitCard', 'Wallet'],
        required: true
    },
    paymentAmount: {
        type: Number,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        required: true
    },
    numberOfTickets: {
        type: Number,
        required: true
    }
}, { timestamps: true });

activityBookingSchema.statics.getBookingsForTourist = async function(touristId) {
    try {
        const bookings = await this.find({ user: touristId }).populate('activity');
        return bookings;
    } catch (err) {
        throw new Error('Error fetching bookings for tourist: ' + err.message);
    }
};

module.exports = mongoose.model('ActivityBooking', activityBookingSchema);