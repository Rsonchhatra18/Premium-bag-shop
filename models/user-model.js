const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    fullname: String,   
    email: String,
    password: String,
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products'
        },
        quantity: {
            type: Number,
            default: 1
        }
    }],
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orders'
    }],
    contact: Number,
    picture: String,
}, { timestamps: true });

module.exports = mongoose.model('users', userSchema);
