const mongoose = require("mongoose");
const Room = require("./room");
const Seat = require("./seat");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    bookingDate: {
      type: Date,
      required: true,
    },
    showName: {
      type: String,
      required: true,
    },
    theaterName: {
      type: String,
      required: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    bookedSeats: [
      {
        number: {
          type: String,
          required: true,
        },
        sectionName: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    customer: {
      dni: {
        type: String,
        required: true,
      },
      fullName: {
        type: String,
        required: true,
      }
    },
  },
  { optimisticConcurrency: true }
);

const Booking = mongoose.model("booking", bookingSchema);
module.exports = Booking;
