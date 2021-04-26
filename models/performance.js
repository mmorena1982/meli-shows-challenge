const mongoose = require('mongoose');
const Room = require('./room');
const Seat = require('./seat');
const Schema = mongoose.Schema;

const performanceSchema = new Schema({
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    room: {
        type: Room.schema
    },
    seats: {
        type: [Seat.schema]
    },
    showId: {
        type: mongoose.Types.ObjectId,
        ref: 'Show',
    }
}, { timestamps: true });

const Performance = mongoose.model('Performance', performanceSchema);
module.exports = Performance;