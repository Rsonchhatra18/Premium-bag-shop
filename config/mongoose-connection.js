const dotenv = require('dotenv');
dotenv.config();

// Set DEBUG before requiring debug module
if (!process.env.DEBUG) {
    process.env.DEBUG = 'development:*';
}

const mongoose = require('mongoose');
const debugLogger = require('debug')("development:mongoose-connection");

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/premium-bag-shop';

mongoose.connect(mongoURI)
.then(() => {
    debugLogger("Connected to MongoDB successfully");
}).catch((err) => {
    debugLogger("Error connecting to MongoDB:", err.message);
});

module.exports = mongoose.connection;