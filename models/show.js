const mongoose = require('mongoose');
const Performance = require('./performance');
const Schema = mongoose.Schema;

const showSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    theaterId: {
        type: mongoose.Types.ObjectId,
        ref: 'Theater',
    },
    performances: {
        type: [Schema.Types.ObjectId],
        ref: 'Performance'
    }
}, { timestamps: true });

const Show = mongoose.model('Show', showSchema);
module.exports = Show;