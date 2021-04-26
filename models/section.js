const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sectionSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const Section = mongoose.model('Section', sectionSchema);
module.exports = Section;