const mongoose = require('mongoose');
const Section = require('./section');
const Schema = mongoose.Schema;

const seatSchema = new Schema({
    section: {
        type: Section.schema
    },
    seatNumber: {
        type: String,
        required: true
    },
    bookingData: {
        dni: {
            type: String
        },
        fullName: {
            type: String
        },
        bookingDate: {
            type: Date
        }
    }
}, { optimisticConcurrency: true });

const Seat = mongoose.model('Seat', seatSchema);
module.exports = Seat;