const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itineraryBookingSchema = new Schema({
    itinerary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Itinerary', 
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

module.exports = mongoose.model('Itinerary Booking', itineraryBookingSchema);
