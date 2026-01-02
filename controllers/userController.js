const userModel = require('../models/user-model');
const productModel = require('../models/product-model');
const orderModel = require('../models/order-model');
const bcrypt = require('bcrypt');
const joi = require('joi');

// ==================== CART MANAGEMENT ====================

// Add to cart
module.exports.addToCart = async(req, res) => {
    try{
        const { productId, quantity } = req.body;
        const userId = req.user._id;

        // Validate product exists
        const product = await productModel.findById(productId);
        if(!product){
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check stock
        if(product.stock < quantity){
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        const user = await userModel.findById(userId);

        // Check if product already in cart
        const cartItemIndex = user.cart.findIndex(item => 
            item.product.toString() === productId
        );

        if(cartItemIndex > -1){
            // Update quantity
            user.cart[cartItemIndex].quantity += quantity || 1;
        } else {
            // Add new item
            user.cart.push({
                product: productId,
                quantity: quantity || 1
            });
        }

        await user.save();

        res.status(200).json({
            message: 'Product added to cart',
            cart: user.cart
        });

    } catch(error){
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// View cart
module.exports.viewCart = async(req, res) => {
    try{
        const userId = req.user._id;

        const user = await userModel.findById(userId)
            .populate('cart.product');

        let totalAmount = 0;
        const cartItems = user.cart.map(item => {
            const discountedPrice = item.product.price - (item.product.price * item.product.discount / 100);
            const itemTotal = discountedPrice * item.quantity;
            totalAmount += itemTotal;

            return {
                product: item.product,
                quantity: item.quantity,
                itemTotal: itemTotal
            };
        });

        res.status(200).json({
            message: 'Cart fetched successfully',
            cart: cartItems,
            totalAmount: totalAmount
        });

    } catch(error){
        console.error('Error viewing cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update cart item quantity
module.exports.updateCartItem = async(req, res) => {
    try{
        const { productId } = req.params;
        const { quantity } = req.body;
        const userId = req.user._id;

        if(quantity < 1){
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        const user = await userModel.findById(userId);
        const cartItemIndex = user.cart.findIndex(item => 
            item.product.toString() === productId
        );

        if(cartItemIndex === -1){
            return res.status(404).json({ error: 'Product not in cart' });
        }

        // Check stock
        const product = await productModel.findById(productId);
        if(product.stock < quantity){
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        user.cart[cartItemIndex].quantity = quantity;
        await user.save();

        res.status(200).json({
            message: 'Cart updated successfully',
            cart: user.cart
        });

    } catch(error){
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Remove from cart
module.exports.removeFromCart = async(req, res) => {
    try{
        const { productId } = req.params;
        const userId = req.user._id;

        const user = await userModel.findById(userId);
        user.cart = user.cart.filter(item => 
            item.product.toString() !== productId
        );

        await user.save();

        res.status(200).json({
            message: 'Product removed from cart',
            cart: user.cart
        });

    } catch(error){
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Clear cart
module.exports.clearCart = async(req, res) => {
    try{
        const userId = req.user._id;

        await userModel.findByIdAndUpdate(userId, { cart: [] });

        res.status(200).json({
            message: 'Cart cleared successfully'
        });

    } catch(error){
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== ORDER MANAGEMENT ====================

// Place order (checkout)
const orderValidationSchema = joi.object({
    shippingAddress: joi.object({
        address: joi.string().required(),
        city: joi.string().required(),
        state: joi.string().required(),
        pincode: joi.string().required(),
        phone: joi.string().required()
    }).required(),
    paymentMethod: joi.string().valid('cod', 'online').default('cod')
});

module.exports.placeOrder = async(req, res) => {
    try{
        const userId = req.user._id;

        // Validate request
        const { error, value } = orderValidationSchema.validate(req.body);
        if(error){
            return res.status(400).json({ error: error.details[0].message });
        }

        const user = await userModel.findById(userId).populate('cart.product');

        if(user.cart.length === 0){
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Calculate total and prepare order products
        let totalAmount = 0;
        const orderProducts = [];

        for(let item of user.cart){
            const product = item.product;

            // Check stock
            if(product.stock < item.quantity){
                return res.status(400).json({ 
                    error: `Insufficient stock for ${product.name}` 
                });
            }

            const discountedPrice = product.price - (product.price * product.discount / 100);
            const itemTotal = discountedPrice * item.quantity;
            totalAmount += itemTotal;

            orderProducts.push({
                product: product._id,
                quantity: item.quantity,
                price: discountedPrice
            });

            // Update product stock
            product.stock -= item.quantity;
            await product.save();
        }

        // Create order
        const order = await orderModel.create({
            user: userId,
            products: orderProducts,
            totalAmount: totalAmount,
            shippingAddress: value.shippingAddress,
            paymentMethod: value.paymentMethod,
            paymentStatus: value.paymentMethod === 'cod' ? 'pending' : 'pending'
        });

        // Add order to user's orders
        user.orders.push(order._id);
        user.cart = []; // Clear cart
        await user.save();

        res.status(201).json({
            message: 'Order placed successfully',
            order: order
        });

    } catch(error){
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// View order history
module.exports.getOrders = async(req, res) => {
    try{
        const userId = req.user._id;

        const orders = await orderModel.find({ user: userId })
            .populate('products.product')
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

// Get single order
module.exports.getOrderById = async(req, res) => {
    try{
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await orderModel.findOne({ _id: orderId, user: userId })
            .populate('products.product');

        if(!order){
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json({
            message: 'Order fetched successfully',
            order: order
        });

    } catch(error){
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Cancel order
module.exports.cancelOrder = async(req, res) => {
    try{
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await orderModel.findOne({ _id: orderId, user: userId });

        if(!order){
            return res.status(404).json({ error: 'Order not found' });
        }

        if(order.status === 'delivered'){
            return res.status(400).json({ error: 'Cannot cancel delivered order' });
        }

        if(order.status === 'cancelled'){
            return res.status(400).json({ error: 'Order already cancelled' });
        }

        // Restore stock
        for(let item of order.products){
            await productModel.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.status(200).json({
            message: 'Order cancelled successfully',
            order: order
        });

    } catch(error){
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== PROFILE MANAGEMENT ====================

// View profile
module.exports.getProfile = async(req, res) => {
    try{
        const userId = req.user._id;

        const user = await userModel.findById(userId).select('-password');

        res.status(200).json({
            message: 'Profile fetched successfully',
            user: user
        });

    } catch(error){
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update profile
const updateProfileSchema = joi.object({
    fullname: joi.string().min(3).max(30),
    contact: joi.number(),
    picture: joi.string()
}).min(1);

module.exports.updateProfile = async(req, res) => {
    try{
        const userId = req.user._id;

        // Validate request
        const { error, value } = updateProfileSchema.validate(req.body);
        if(error){
            return res.status(400).json({ error: error.details[0].message });
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            value,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            message: 'Profile updated successfully',
            user: user
        });

    } catch(error){
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Change password
const changePasswordSchema = joi.object({
    currentPassword: joi.string().min(6).required(),
    newPassword: joi.string().min(6).required()
});

module.exports.changePassword = async(req, res) => {
    try{
        const userId = req.user._id;

        // Validate request
        const { error, value } = changePasswordSchema.validate(req.body);
        if(error){
            return res.status(400).json({ error: error.details[0].message });
        }

        const user = await userModel.findById(userId);

        // Verify current password
        const isPasswordValid = await bcrypt.compare(value.currentPassword, user.password);
        if(!isPasswordValid){
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(value.newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            message: 'Password changed successfully'
        });

    } catch(error){
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Logout
module.exports.logout = async(req, res) => {
    try{
        res.clearCookie('token');

        res.status(200).json({
            message: 'Logged out successfully'
        });

    } catch(error){
        console.error('Error logging out:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
