const Performance = require("../models/performance");
const Show = require("../models/show");
const mongoose = require("mongoose");
const client = require("../helpers/redis.js");
const Booking = require("../models/booking");
const moment = require("moment");
const validators = require("../helpers/validators");
var url = require("url");

//#region get_all_shows() Swagger definition
/**
 * @swagger
 * /ticketsales/shows:
 *   get:
 *     summary: Retrieves all shows information with respective performances and seats.
 *     description: Retrieves all shows information with respective performances and seats.
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *         description: The start date to search for performances. **Format yyyy-MM-dd**.
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *         description: The end date to search for performances. **Format yyyy-MM-dd**.
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: The min price of a seat to search for performances
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: The max price of a seat to search for performances
 *       - in: query
 *         name: order_by
 *         schema:
 *           type: string
 *         description: The field and order direction to order the results. Must respect hierarchy of data (e.g. **theater.name.desc** orders the result by theater name descendently). Default sorting **asc**
 *     responses:
 *       200:
 *         description: A list of shows
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: The show ID
 *                     example: 6080484d6ad7434518ba3470
 *                   name:
 *                     type: string
 *                     description: The name of the show
 *                     example: The phantom of the Opera
 *                   description:
 *                     type: string
 *                     description: The description of the show
 *                     example: A musical with music by Andrew Lloyd Webber, lyrics by Charles Hart, and a libretto by Lloyd Webber and Richard Stilgoe.
 *                   theater:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: The theater ID
 *                         example: 608048636ad7434518ba48b7
 *                       name:
 *                         type: string
 *                         description: The name of the theater
 *                         example: Apollo Theater
 *                   performances:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: The performance ID
 *                           example: 608048586ad7434518ba3cdc
 *                         startDate:
 *                           type: string
 *                           description: The start date and time of the performance
 *                           example: 2021-06-12T15:00:00.000Z
 *                         endDate:
 *                           type: string
 *                           description: The end date and time of the performance
 *                           example: 2021-06-12T17:00:00.000Z
 *                         room:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               description: The ID of the theater room
 *                               example: 608048456ad7434518ba31a5
 *                             name:
 *                               type: string
 *                               description: The theater room name
 *                               example: The big room
 *                         seats:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: The ID of the seat
 *                                 example: 608048586ad7434518ba3c68
 *                               seatNumber:
 *                                 type: string,
 *                                 description: The seat number
 *                                 example: 11
 *                               section:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                     description: The ID of the section
 *                                     example: 608048456ad7434518ba31a1
 *                                   name:
 *                                     type: string
 *                                     description: The common name for the section
 *                                     example: Gold
 *                                   price:
 *                                     type: number
 *                                     description: The price of the section
 *                                     example: 5000
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Unexpected error
 *         
 */
//#endregion
const get_all_shows = async (req, res) => {
  //Today Date
  const today = new Date().toISOString();

  //Order data from param
  const orderArray = req.query.order_by ? req.query.order_by.split(".") : "";
  const orderProperty = orderArray
    ? [].concat.apply([], orderArray.slice(0, orderArray.length - 1)).join(".")
    : "_id";
  const orderDirection = orderArray ? orderArray[orderArray.length - 1] : "";

  //Param validations
  if (req.query.start_date && !validators.isValidDate(req.query.start_date))
    return res
      .status(400)
      .json({ message: "Bad Request: Invalid start_date value" });
  if (req.query.end_date && !validators.isValidDate(req.query.end_date))
    return res
      .status(400)
      .json({ message: "Bad Request: Invalid end_date value" });
  if (req.query.min_price && !validators.isValidNumber(req.query.min_price))
    return res
      .status(400)
      .json({ message: "Bad request: Invalid min_price value" });
  if (req.query.max_price && !validators.isValidNumber(req.query.max_price))
    return res
      .status(400)
      .json({ message: "Bad request: Invalid max_price value" });
  if (orderDirection && !validators.isValidSortingDirection(orderDirection))
    return res
      .status(400)
      .json({
        message: "Bad request: Invalid order_by direction. Must be asc or desc",
      });

  //Prepare data for filtering and sorting over MongoDB
  let sortDirection = orderDirection === "desc" ? -1 : 1;
  let sort = {};
  sort[orderProperty] = sortDirection;
  const startDate = moment(req.query.start_date).toISOString() || today; // req.query.startDate ? req.query.startDate : null;
  const endDate = req.query.end_date
    ? moment(req.query.end_date).toISOString()
    : new Date(8640000000000000).toISOString(); //req.query.endDate ? req.query.endDate : null;
  const minPrice = req.query.min_price || 0;
  const maxPrice = req.query.max_price || Number.MAX_VALUE;

  //Cache Flush All
  /*client.flushall((r) => {
    console.log(r);
  });*/

  const cacheKey = req.url;

  try {
    client.get(cacheKey, async (err, result) => {
      //Try to get data from cache
      if (err) throw err;

      if (result) {
        res.set("Cache-Status", "hit");
        res.status(200).json(JSON.parse(result));
      } else {
        //Cache miss - Getting data from MongoDB
        const shows = await Show.aggregate([
          {
            $unwind: {
              path: "$performances",
            },
          },
          {
            $lookup: {
              from: "performances",
              localField: "performances",
              foreignField: "_id",
              as: "performances",
            },
          },
          {
            $match: {
              $and: [
                {
                  "performances.startDate": {
                    $gte: new Date(startDate),
                  },
                },
                {
                  "performances.endDate": {
                    $lte: new Date(endDate),
                  },
                },
                {
                  "performances.seats.section.price": {
                    $gte: parseFloat(minPrice),
                  },
                },
                {
                  "performances.seats.section.price": {
                    $lte: parseFloat(maxPrice),
                  },
                },
              ],
            },
          },
          {
            $group: {
              _id: {
                $first: "$performances.showId",
              },
              theaterId: {
                $first: "$theaterId",
              },
              name: {
                $first: "$name",
              },
              performances: {
                $push: "$performances",
              },
            },
          },
          {
            $unwind: {
              path: "$theaterId",
            },
          },
          {
            $lookup: {
              from: "theaters",
              localField: "theaterId",
              foreignField: "_id",
              as: "theaterId",
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              performances: {
                $reduce: {
                  input: "$performances",
                  initialValue: [],
                  in: {
                    $concatArrays: ["$$value", "$$this"],
                  },
                },
              },
              theater: {
                _id: {
                  $arrayElemAt: ["$theaterId._id", 0],
                },
                name: {
                  $arrayElemAt: ["$theaterId.name", 0],
                },
              },
            },
          },
          {
            $sort: sort,
          },
        ]);

        //Saving response in cache
        client.setex(cacheKey, 600, JSON.stringify(shows));
        res.set("Cache-Status", "miss");
        res.status(200).json(shows);
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//#region get_performance_by_id() Swagger definition
/**
 * @swagger
 * /ticketsales/performances/{id}:
 *   get:
 *     summary: Retrieves an specific performance with all available seats for booking
 *     description: Retrieves an specific performance with all available seats for booking
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the performance to retrieve
 *         schema:
 *           type: string
 *           minimum: 24
 *           maximum: 24
 *     responses:
 *       200:
 *         description: A single performance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the performance
 *                   example: 608048456ad7434518ba320e
 *                 startDate:
 *                   type: string
 *                   description: The start date and time of the performance
 *                   example: 2021-06-12T15:00:00.000Z
 *                 endDate:
 *                   type: string
 *                   description: The end date and time of the performance
 *                   example: 2021-06-12T17:00:00.000Z
 *                 room:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The ID of the room
 *                       example: 608048456ad7434518ba31a5
 *                     name:
 *                       type: string
 *                       description: The theater room name
 *                       example: The small room
 *                 seats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: The ID of the seat
 *                         example: 608048586ad7434518ba3c68
 *                       seatNumber:
 *                         type: string,
 *                         description: The seat number
 *                         example: 11
 *                       section:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: The ID of the section
 *                             example: 608048456ad7434518ba31a1
 *                           name:
 *                             type: string
 *                             description: The common name for the section
 *                             example: Gold
 *                           price:
 *                             type: number
 *                             description: The price of the section
 *                             example: 5000
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Unexpected error
 *
 */
//#endregion
const get_performance_by_id = async (req, res) => {
  const perfId = req.params.id;

  //Cache Flush All
  /*client.flushall((r) => {
    console.log(r);
  });*/

  const cacheKey = req.url;

  try {
    client.get(cacheKey, async (err, result) => {
      //Try to get data from cache
      if (err) throw err;

      if (result) {
        res.set("Cache-Status", "hit");
        res.status(200).json(JSON.parse(result));
      } else {
        //Cache miss - Getting data from MongoDB
        const performance = await Performance.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(perfId),
            },
          },
          {
            $unwind: {
              path: "$seats",
            },
          },
          {
            $match: {
              "seats.bookingData": {
                $exists: false,
              },
            },
          },
          {
            $group: {
              _id: "$_id",
              startDate: {
                $first: "$startDate",
              },
              endDate: {
                $first: "$endDate",
              },
              room: {
                $first: "$room",
              },
              seats: {
                $push: "$seats",
              },
            },
          },
          {
            $project: {
              _id: 1,
              startDate: 1,
              endDate: 1,
              room: 1,
              seats: 1,
            },
          },
        ]);
        //Saving response in cache
        client.setex(cacheKey, 600, JSON.stringify(performance));
        res.set("Cache-Status", "miss");
        res.status(200).json(performance);
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//#region book() Swagger definition
/**
 * @swagger
 * /ticketsales/book:
 *   post:
 *     summary: Retrieves an specific performance with all available seats for booking
 *     description: Retrieves an specific performance with all available seats for booking
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         description: User data and seats required for booking
 *         schema:
 *           type: object
 *           required:
 *             - showId
 *             - perfId
 *             - selectedSeats
 *             - dni
 *             - fullName
 *           properties:
 *             showId:
 *               type: string
 *               description: The ID of the show for the booking.
 *               example: 607f33550f5f4c04a0e9eb5a
 *             perfId:
 *               type: string
 *               description: The ID of the performance for the booking
 *               example: 607f33530f5f4c04a0e9e893
 *             selectedSeats:
 *               type: array
 *               items:
 *                 type: string
 *               description: Array of selected seats ID's
 *               example: ["607f33530f5f4c04a0e9e883", "607f33530f5f4c04a0e9e885"]
 *             dni:
 *               type: string
 *               description: DNI of the customer placing the booking.
 *               example: 33333333
 *             fullName:
 *               type: string
 *               description: Full name of the customer placing the booking.
 *               example: John Doe
 *   responses:
 *     200:
 *       description: OK
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 description: The booking ID.
 *                 example: 608631878099c17c10ee7342
 *               bookingDate:
 *                 type: string
 *                 description: The booking date.
 *                 example: 2021-04-26T03:20:38.351+00:00
 *               showName:
 *                 type: string
 *                 description: The show name
 *                 example: The phantom of the Opera.
 *               theaterName:
 *                 type: string
 *                 description: The name of the theater.
 *                 example: Apollo Theater
 *               roomName:
 *                 type: string
 *                 description: The room name.
 *                 example: The medium room.
 *               startDate:
 *                 type: string
 *                 description: The start date and time of the performance.
 *                 example: 2021-09-14T13:00:0.000+00:00
 *               endDate:
 *                 type: string
 *                 description: The end date and time of the performance.
 *                 example: 2021-09-14T15:00:00.000+00:00
 *               bookedSeats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The selected seat ID
 *                       example: 608631878099c17c10ee7343
 *                     number:
 *                       type: string
 *                       description: The number of the selected seat
 *                       example: 4
 *                     sectionName:
 *                       type: string
 *                       description: The section's name.
 *                       example: Bronze
 *                     price:
 *                       type: number
 *                       description: The price of the seat
 *                       example: 1500
 *                 totalPrice:
 *                   type: number
 *                   description: The total price for all the seats booked.
 *                   example: 6500
 *                 customer:
 *                   type: object
 *                   properties:
 *                     dni:
 *                       type: string
 *                       description: The DNI of the customer.
 *                       example: 33333333
 *                     fullName:
 *                       type: string
 *                       description: Full name of the customer
 *                       example: John Doe
 *                   
 *                 
 */      
//#endregion
const book = async (req, res) => {
  const showId = req.body.showId;
  const perfId = req.body.perfId;
  const selectedSeats = req.body.selectedSeats;
  const fullName = req.body.fullName;
  const dni = req.body.dni;
  const bookingDate = new Date();

  //Get show data from MongoDB
  const show = await Show.findById(mongoose.Types.ObjectId(showId)).populate(
    "theaterId"
  );

  const theater = show.theaterId;

  //Get performance data from MongoDB
  const performance = await Performance.findById(
    mongoose.Types.ObjectId(perfId)
  );

  const room = performance.room;

  const seats = performance.seats.filter((s) =>
    selectedSeats.some(
      (ss) => ss === s._id.toString() && !s.bookingData.bookingDate
    )
  );


  const bookedSeats = seats.map((s) => {
    return {
      number: s.seatNumber,
      sectionName: s.section.name,
      price: s.section.price,
    };
  });

  const bookingData = new Booking({
    bookingDate: bookingDate,
    showName: show.name,
    theaterName: theater.name,
    roomName: room.name,
    startDate: performance.startDate,
    endDate: performance.endDate,
    bookedSeats: bookedSeats,
    totalPrice: bookedSeats.reduce((total, seat) => {
      return total + seat.price;
    }, 0),
    customer: {
      dni: dni,
      fullName: fullName,
    },
  });

  try {
    if (seats.length === selectedSeats.length) {
      for (const s of seats) {
        performance.seats.id(s._id).bookingData = {
          dni: bookingData.customer.dni,
          fullName: bookingData.customer.fullName,
          bookingDate: bookingData.bookingDate,
        };
      }
      const bookingResult = await bookingData.save();
      await performance.save();
      res.json(bookingResult);
    } else {
      res.json({
        error:
          selectedSeats.length - seats.length + " tickets are not available",
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  get_all_shows,
  get_performance_by_id,
  book,
};
