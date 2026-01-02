const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owner-model');
const adminController = require('../controllers/adminController');
const ownerController = require('../controllers/ownerController');
const upload = require('../config/multer-config');
const isLoggedIn = require('../middlewares/isLoggedIn');
const joi = require('joi');

// Validation schema for owner creation
const ownerValidationSchema = joi.object({
    fullname: joi.string().min(3).max(30).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required()
});

router.get('/', (req, res) => {
    res.json({ message: 'Owners Router - Available endpoints: POST /create, /login, /dashboard, /admin/*' });
});

// ========== Owner Authentication ==========
// Owner login
router.post('/login', ownerController.loginOwner);

// Owner logout
router.post('/logout', ownerController.logoutOwner);

// Owner creation route (development only)
router.post('/create', async (req, res) => {  
    try {
        // Validate request body with Joi
        const { error, value } = ownerValidationSchema.validate(req.body);
        if(error){
            return res.status(400).json({ error: error.details[0].message });
        }

        const owners = await ownerModel.find();
        if(owners.length > 0){
            return res.status(409).json({ error: "Owner already exists" });
        }
        
        const { fullname, email, password } = value;
        const createdOwner = await ownerModel.create({
            fullname,
            email,
            password
        });
        
        res.status(201).json({
            message: 'Owner created successfully',
            owner: createdOwner
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== Dashboard & Order Management ==========
// Get dashboard stats
router.get('/dashboard', isLoggedIn, ownerController.getDashboard);

// Get all orders (admin)
router.get('/orders', isLoggedIn, ownerController.getAllOrders);

// Update order status
router.put('/orders/:orderId/status', isLoggedIn, ownerController.updateOrderStatus);

// ========== Product Management ==========
// Create product (with image upload)
router.post('/admin/products', isLoggedIn, upload.single('image'), adminController.createProduct);

// Get all products (public)
router.get('/admin/products', adminController.getAllProducts);

// Get product by ID (public)
router.get('/admin/products/:productId', adminController.getProductById);

// Update product (with optional image upload) - protected
router.put('/admin/products/:productId', isLoggedIn, upload.single('image'), adminController.updateProduct);

// Delete product - protected
router.delete('/admin/products/:productId', isLoggedIn, adminController.deleteProduct);

module.exports = router; 