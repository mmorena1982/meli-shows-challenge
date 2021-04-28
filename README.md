# meli-shows-challenge

# MeLi Shows API

Booking Backend Application using Express.js and MongoDB

## System requirements

 1. NodeJS
 2. MongoDB
 3. Redis Cache Server

## Running the server

 0. Install dependencies `npm install`
 1. Set environment variables in `.env` file:
```
PORT=
DB_CONNECTION=
REDIS_HOST=
REDIS_PORT
REDIS_AUTH
``` 
 2. Clear DB and generate data  for development and testing `npm run populate`
 3. Run in dev mode `npm run dev`

## Testing

The project is using `swagger-jsdoc` and `swagger-ui-express`. 
Please send Header `Accept-Encoding: gzip` to enable gzip compression.
You can see the availbale API operations at the following URL: `http://localhost:{PORT}/api-docs`.
Replace `localhost` with your current domain or IP in case it is necessary.
There is a custom header in the response called `Cache-Status`. It informs if the response comes from the DB(miss value) or from the cache(hit value)

## Dependencies

| Package Name       | License      | Description                                                                          |
|:------------------:|:------------:|:------------------------------------------------------------------------------------:|
| compression        | MIT          | Node.js compression middleware                                                       |
| dotenv             | BSD-2-Clause | Environment variables management                                                     |
| express            | MIT          | Node JS REST Server framework                                                        |
| faker              | MIT          | Fake data generator                                                                  |
| moment             | MIT          | A JavaScript date library for parsing, validating, manipulating and formatting dates |
| mongoose           | MIT          | ODM interfacing MongoDB                                                              |
| nodemon            | MIT          | Tool for automatic restart express server on changes                                 |
| redis              | MIT          | Redis Cache client                                                                   |
| swagger-jsdoc      | MIT          | Tool that reads JSDoc annotations and generates Swagger specification                |
| swagger-ui-express | MIT          | Tool to serve auto-generated Swagger UI based on swagger.json                        |

## Solution Architecture

[![image](https://www.linkpicture.com/q/Meli-shows-API.png)](https://www.linkpicture.com/view.php?img=LPic6087645d8ffaf1566794418)
