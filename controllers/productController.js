const productModel = require('../models/product-model');
const joi = require('joi');

// ==================== SEARCH & FILTER ====================

// Get all products with search and filters
module.exports.getProducts = async(req, res) => {
    try{
        const { 
            search, 
            category, 
            minPrice, 
            maxPrice, 
            sortBy = 'createdAt', 
            order = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        let query = {};

        // Search by name
        if(search){
            query.name = { $regex: search, $options: 'i' };
        }

        // Filter by category
        if(category && category !== 'all'){
            query.category = category;
        }

        // Filter by price range
        if(minPrice || maxPrice){
            query.price = {};
            if(minPrice) query.price.$gte = Number(minPrice);
            if(maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        // Pagination
        const skip = (page - 1) * limit;

        // Execute query
        const products = await productModel.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit));

        const totalProducts = await productModel.countDocuments(query);

        res.status(200).json({
            message: 'Products fetched successfully',
            products: products,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalProducts / limit),
                totalProducts: totalProducts,
                limit: Number(limit)
            }
        });

    } catch(error){
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single product with reviews
module.exports.getProductById = async(req, res) => {
    try{
        const { productId } = req.params;

        const product = await productModel.findById(productId)
            .populate('reviews.user', 'fullname picture');

        if(!product){
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({
            message: 'Product fetched successfully',
            product: product
        });

    } catch(error){
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all categories
module.exports.getCategories = async(req, res) => {
    try{
        const categories = await productModel.distinct('category');

        res.status(200).json({
            message: 'Categories fetched successfully',
            categories: categories
        });

    } catch(error){
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get products by category
module.exports.getProductsByCategory = async(req, res) => {
    try{
        const { category } = req.params;

        const products = await productModel.find({ category: category });

        res.status(200).json({
            message: 'Products fetched successfully',
            products: products
        });

    } catch(error){
        console.error('Error fetching products by category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== REVIEWS & RATINGS ====================

// Add review
const reviewValidationSchema = joi.object({
    rating: joi.number().min(1).max(5).required(),
    comment: joi.string().max(500)
});

module.exports.addReview = async(req, res) => {
    try{
        const { productId } = req.params;
        const userId = req.user._id;

        // Validate request
        const { error, value } = reviewValidationSchema.validate(req.body);
        if(error){
            return res.status(400).json({ error: error.details[0].message });
        }

        const product = await productModel.findById(productId);
        if(!product){
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if user already reviewed
        const existingReview = product.reviews.find(
            review => review.user.toString() === userId.toString()
        );

        if(existingReview){
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }

        // Add review
        product.reviews.push({
            user: userId,
            rating: value.rating,
            comment: value.comment
        });

        // Update average rating and total reviews
        product.totalReviews = product.reviews.length;
        const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
        product.averageRating = totalRating / product.totalReviews;

        await product.save();

        res.status(201).json({
            message: 'Review added successfully',
            product: product
        });

    } catch(error){
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update review
module.exports.updateReview = async(req, res) => {
    try{
        const { productId, reviewId } = req.params;
        const userId = req.user._id;

        // Validate request
        const { error, value } = reviewValidationSchema.validate(req.body);
        if(error){
            return res.status(400).json({ error: error.details[0].message });
        }

        const product = await productModel.findById(productId);
        if(!product){
            return res.status(404).json({ error: 'Product not found' });
        }

        const review = product.reviews.id(reviewId);
        if(!review){
            return res.status(404).json({ error: 'Review not found' });
        }

        // Check if user owns the review
        if(review.user.toString() !== userId.toString()){
            return res.status(403).json({ error: 'You can only update your own review' });
        }

        // Update review
        review.rating = value.rating;
        review.comment = value.comment;

        // Recalculate average rating
        const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
        product.averageRating = totalRating / product.totalReviews;

        await product.save();

        res.status(200).json({
            message: 'Review updated successfully',
            product: product
        });

    } catch(error){
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete review
module.exports.deleteReview = async(req, res) => {
    try{
        const { productId, reviewId } = req.params;
        const userId = req.user._id;

        const product = await productModel.findById(productId);
        if(!product){
            return res.status(404).json({ error: 'Product not found' });
        }

        const review = product.reviews.id(reviewId);
        if(!review){
            return res.status(404).json({ error: 'Review not found' });
        }

        // Check if user owns the review
        if(review.user.toString() !== userId.toString()){
            return res.status(403).json({ error: 'You can only delete your own review' });
        }

        // Remove review
        review.deleteOne();

        // Recalculate average rating and total reviews
        product.totalReviews = product.reviews.length;
        if(product.totalReviews > 0){
            const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
            product.averageRating = totalRating / product.totalReviews;
        } else {
            product.averageRating = 0;
        }

        await product.save();

        res.status(200).json({
            message: 'Review deleted successfully',
            product: product
        });

    } catch(error){
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
