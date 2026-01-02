const ownerModel = require('../models/owner-model');
const productModel = require('../models/product-model');
const userModel = require('../models/user-model');
const orderModel = require('../models/order-model');
const joi = require('joi');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');

// Validation schema for owner login
const ownerLoginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required()
});

// Owner login
module.exports.loginOwner = async(req, res) => {
    try{
        // Validate request
        const { error, value } = ownerLoginSchema.validate(req.body);
        if(error){
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password } = value;

        // Check if owner exists
        const owner = await ownerModel.findOne({ email });
        if(!owner){
            return res.status(404).json({ error: 'Invalid email or password' });
        }

        // Compare passwords (assuming owner password is stored as plain text for now)
        // In production, this should also be hashed
        if(owner.password !== password){
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        let token = generateToken(owner);
        res.cookie("ownerToken", token, { httpOnly: true });

        res.status(200).json({
            message: 'Owner logged in successfully',
            owner: {
                id: owner._id,
                fullname: owner.fullname,
                email: owner.email
            }
        });

    } catch(error){
        console.error('Error during owner login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Owner logout
module.exports.logoutOwner = async(req, res) => {
    try{
        res.clearCookie('ownerToken');

        res.status(200).json({
            message: 'Owner logged out successfully'
        });

    } catch(error){
        console.error('Error logging out owner:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Dashboard statistics
module.exports.getDashboard = async(req, res) => {
    try{
        // Get total products
        const totalProducts = await productModel.countDocuments();

        // Get total users
        const totalUsers = await userModel.countDocuments();

        // Get total orders
        const totalOrders = await orderModel.countDocuments();

        // Get total revenue
        const orders = await orderModel.find({ status: { $ne: 'cancelled' } });
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        // Get orders by status
        const pendingOrders = await orderModel.countDocuments({ status: 'pending' });
        const processingOrders = await orderModel.countDocuments({ status: 'processing' });
        const shippedOrders = await orderModel.countDocuments({ status: 'shipped' });
        const deliveredOrders = await orderModel.countDocuments({ status: 'delivered' });
        const cancelledOrders = await orderModel.countDocuments({ status: 'cancelled' });

        // Get recent orders
        const recentOrders = await orderModel.find()
            .populate('user', 'fullname email')
            .populate('products.product', 'name price')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get low stock products
        const lowStockProducts = await productModel.find({ stock: { $lt: 10 } })
            .select('name stock')
            .limit(10);

        res.status(200).json({
            message: 'Dashboard data fetched successfully',
            stats: {
                totalProducts,
                totalUsers,
                totalOrders,
                totalRevenue,
                ordersByStatus: {
                    pending: pendingOrders,
                    processing: processingOrders,
                    shipped: shippedOrders,
                    delivered: deliveredOrders,
                    cancelled: cancelledOrders
                }
            },
            recentOrders,
            lowStockProducts
        });

    } catch(error){
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all orders (admin view)
module.exports.getAllOrders = async(req, res) => {
    try{
        const orders = await orderModel.find()
            .populate('user', 'fullname email contact')
            .populate('products.product', 'name price image')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Orders fetched successfully',
            orders: orders
        });

    } catch(error){
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update order status
module.exports.updateOrderStatus = async(req, res) => {
    try{
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if(!validStatuses.includes(status)){
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = await orderModel.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        ).populate('products.product', 'name');

        if(!order){
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json({
            message: 'Order status updated successfully',
            order: order
        });

    } catch(error){
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
