const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const isLoggedIn = require('../middlewares/isLoggedIn');

// ========== Authentication Routes ==========
// Register route
router.post('/register', authController.registerUser);

// Login route
router.post('/login', authController.loginUser);

// Logout route
router.post('/logout', isLoggedIn, userController.logout);

// ========== Cart Routes ==========
// Add to cart
router.post('/cart/add', isLoggedIn, userController.addToCart);

// View cart
router.get('/cart', isLoggedIn, userController.viewCart);

// Update cart item
router.put('/cart/:productId', isLoggedIn, userController.updateCartItem);

// Remove from cart
router.delete('/cart/:productId', isLoggedIn, userController.removeFromCart);

// Clear cart
router.delete('/cart', isLoggedIn, userController.clearCart);

// ========== Order Routes ==========
// Place order
router.post('/orders', isLoggedIn, userController.placeOrder);

// Get all orders
router.get('/orders', isLoggedIn, userController.getOrders);

// Get single order
router.get('/orders/:orderId', isLoggedIn, userController.getOrderById);

// Cancel order
router.put('/orders/:orderId/cancel', isLoggedIn, userController.cancelOrder);

// ========== Profile Routes ==========
// Get profile
router.get('/profile', isLoggedIn, userController.getProfile);

// Update profile
router.put('/profile', isLoggedIn, userController.updateProfile);

// Change password
router.put('/profile/password', isLoggedIn, userController.changePassword);

module.exports = router;