const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const isLoggedIn = require('../middlewares/isLoggedIn');

router.get('/', (req, res) => {
    res.json({ message: 'Products Router - Available endpoints: GET /all, /categories, /:id, POST /review' });
});

// ========== Product Routes ==========
// Get all products with search and filters
router.get('/all', productController.getProducts);

// Get all categories
router.get('/categories', productController.getCategories);

// Get products by category
router.get('/category/:category', productController.getProductsByCategory);

// Get single product (with reviews)
router.get('/:productId', productController.getProductById);

// ========== Review Routes ==========
// Add review (protected)
router.post('/:productId/review', isLoggedIn, productController.addReview);

// Update review (protected)
router.put('/:productId/review/:reviewId', isLoggedIn, productController.updateReview);

// Delete review (protected)
router.delete('/:productId/review/:reviewId', isLoggedIn, productController.deleteReview);

module.exports = router;