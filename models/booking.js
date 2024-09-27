const mongoose = require('mongoose');
const Activity = require('./activity');
const HistoricalPlaces = require('./historicalPlaces');
const Itinerary = require('./itinerary');
const Tourist = require('./tourist');

const bookingSchema = new Schema({
    bookingType: {
        type: String,
        enum: ['Activity', 'Itinerary', 'HistoricalPlaceTicket'],
        required: true
    },
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity', 
        required: function() { return this.bookingType === 'Activity'; }
    },
    itinerary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Itinerary', 
        required: function() { return this.bookingType === 'Itinerary'; }
    },
    historicalPlace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HistoricalPlace', 
        required: function() { return this.bookingType === 'HistoricalPlaceTicket'; }
    },
    paymentType: {
        type: String,
        enum: ['CreditCard', 'DebitCard', 'PayPal', 'BankTransfer', 'Cash'],
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        required: true
    }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
