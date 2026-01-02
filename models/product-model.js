const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    image: String,
    name: String,
    price: Number,
    discount: {
        type: Number,
        default: 0
    },
    bgcolor: String,
    panelcolour: String,
    textcolour: String,
    category: {
        type: String,
        default: 'Uncategorized'
    },
    stock: {
        type: Number,
        default: 0
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('products', productSchema);
