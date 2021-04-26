const express = require("express");
const mongoose = require("mongoose");
const ticketSaleRoutes = require("./routes/ticketSaleRoutes");
require("dotenv/config");
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const compression = require('compression');

const options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "MeLi Shows API",
			version: "1.0.0",
			description: "La nueva y flamante API de MeLi Shows",
		},
		servers: [
			{
				url: `http://localhost:${process.env.PORT || 5000}`,
			},
      {
				url: `http://54.189.16.116:${process.env.PORT || 5000}`,
			},
		],
	},
	apis: ["./controllers/*.js"],
};

const app = express();
app.use(compression());
const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
app.use(express.json());

mongoose
  .connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async (result) => {
    app.listen(process.env.PORT || 5000);
    console.log("Connected to DB");
  })
  .catch((err) => console.log(err));

app.use("/ticketSales", ticketSaleRoutes);

