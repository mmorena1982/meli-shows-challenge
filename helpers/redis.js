const redis = require('redis');
require("dotenv/config");

module.exports = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_AUTH
});