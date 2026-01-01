const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/Premium-bag-shop")
.then(() => {
    console.log("Connected to MongoDB successfully");
}).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
});

module.exports = mongoose.connection;