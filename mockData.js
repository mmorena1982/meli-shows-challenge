const Theater = require("./models/theater");
const Show = require("./models/show");
const Performance = require("./models/performance");
const Room = require("./models/room");
const Seat = require("./models/seat");
const Section = require("./models/section");
const faker = require("faker/locale/ar");
const mongoose = require('mongoose');
require("dotenv/config");


mongoose
  .connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async (result) => {
    console.log("Connected to DB");
    const db = mongoose.connection.db;
    const collections = await db
      .listCollections()
      .toArray();

    collections
      .map((collection) => collection.name)
      .forEach(async (collectionName) => {
        db.dropCollection(collectionName);
      });
    await createMockData();
    console.log("mock data created");
  })
  .catch((err) => console.log(err));

const createMockData = async () => {
  const roomSections = [
    new Section({
      name: "Gold",
      price: 5000,
    }),
    new Section({
      name: "Silver",
      price: 3000,
    }),
    new Section({
      name: "Bronze",
      price: 1500,
    }),
  ];

  let seats = [];
  let performances = [];
  let rooms = [];
  let shows = [];
  let theaters = [];

  const theatersCount = faker.datatype.number({ min: 3, max: 4 });

  for (let i = 0; i < theatersCount; i++) {
    let sectionsCount = faker.datatype.number({ min: 1, max: 5 });
    let seatsCount = faker.datatype.number({ min: 50, max: 100 });
    let performancesCount = faker.datatype.number({ min: 1, max: 5 });
    let roomsCount = faker.datatype.number({ min: 1, max: 3 });
    let showsCount = faker.datatype.number({ min: 2, max: 4 });

    /*for (let i = 0; i < sectionsCount; i++) {
      roomSections.push(
        new Section({
          name: faker.lorem.word(),
          description: faker.lorem.sentence(),
          price: faker.commerce.price(),
        })
      );
    }*/

    for (let i = 0; i < roomsCount; i++) {
      rooms.push(
        new Room({
          name: faker.lorem.word(),
        })
      );
    }

    for (let i = 0; i < showsCount; i++) {
      performancesCount = faker.datatype.number({ min: 1, max: 5 });
      for (let i = 0; i < performancesCount; i++) {
        seatsCount = faker.datatype.number({ min: 50, max: 100 });
        for (let i = 1; i <= seatsCount; i++) {
          seat = new Seat({
            section: roomSections[faker.datatype.number({ min: 0, max: 2 })],
            seatNumber: i.toString()
          });

          seats.push(seat);
        }

        let startDateFaker = faker.date.future();
        let endDateFaker = startDateFaker;
        const epochEndDate = endDateFaker.setHours(endDateFaker.getHours() + faker.datatype.number({ min: 2, max:3 }));
        endDateFaker = new Date(epochEndDate);
        let testDate = new Date();

        let perf = new Performance({
          startDate: startDateFaker,
          endDate: endDateFaker, //startDateFaker.setHours(startDateFaker.getHours + 2),
          room: rooms[faker.datatype.number({ min: 0, max: rooms.length-1 })],
          seats: seats,
          availableSeats: seats.length
        });

        performances.push(perf);

        await perf
          .save()
          .then((result) => console.log(result))
          .catch((err) => console.log(err));

        seats = [];
      }

      let show = new Show({
        name: faker.lorem.words(2),
        description: faker.lorem.sentence(),
        performances: performances,
      });

      shows.push(show);

      let showDoc = await show
        .save()
        .then((result) => result)
        .catch((err) => console.log(err));

      for (const p of performances) {
        await Performance.findByIdAndUpdate(p._id, { showId: showDoc._id })
          .then((result) => {
            console.log(result);
          })
          .catch((err) => {
            console.log(err);
          });
      }
      performances = [];
    }

    const theater = new Theater({
      name: faker.lorem.words(2),
      shows: shows,
    });

    

    let theaterDoc = await theater
        .save()
        .then((result) => result)
        .catch((err) => console.log(err));

      for (const s of shows) {
        await Show.findByIdAndUpdate(s._id, { theaterId: theaterDoc._id })
          .then((result) => {
            console.log(result);
          })
          .catch((err) => {
            console.log(err);
          });
      }

      shows = [];

    await theater
      .save()
      .then((result) => console.log(result))
      .catch((err) => console.log(err));
  }
};

module.exports = {
  createMockData,
};
