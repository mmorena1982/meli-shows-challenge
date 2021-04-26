const mongoose = require('mongoose');
const Show = require('./show');
const Schema = mongoose.Schema;

const theaterSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    shows: {
        //type: [Show.schema]
        type: [Schema.Types.ObjectId],
        ref: 'Show'
    }
}, { timestamps: true });

const Theater = mongoose.model('Theater', theaterSchema);
module.exports = Theater;