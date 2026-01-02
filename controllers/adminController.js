const ownerModel = require('../models/owner-model');
const productModel = require('../models/product-model');
const joi = require('joi');
const fs = require('fs').promises;
const path = require('path');

// Validation schema for creating product (image is optional when using multer)
const productValidationSchema = joi.object({
    name: joi.string().min(3).max(100).required(),
    price: joi.number().positive().required(),
    discount: joi.number().min(0).max(100).default(0),
    bgcolor: joi.string().required(),
    panelcolour: joi.string().required(),
    textcolour: joi.string().required(),
    category: joi.string().default('Uncategorized'),
    stock: joi.number().min(0).default(0)
});

// Validation schema for updating product (all fields optional)
const productUpdateSchema = joi.object({
    name: joi.string().min(3).max(100),
    price: joi.number().positive(),
    discount: joi.number().min(0).max(100),
    bgcolor: joi.string(),
    panelcolour: joi.string(),
    textcolour: joi.string(),
    category: joi.string(),
    stock: joi.number().min(0)
}).min(1); // At least one field required

// Create product with image upload
module.exports.createProduct = async(req, res) => {
    try{
        // Check if image was uploaded
        if(!req.file){
            return res.status(400).json({ error: 'Product image is required' });
        }

        // Validate request body
        const { error, value } = productValidationSchema.validate(req.body);
        if(error){
            return res.status(400).json({ error: error.details[0].message });
        }

        // Get owner (assuming only one owner exists)
        const owner = await ownerModel.findOne();
        if(!owner){
            return res.status(404).json({ error: 'Owner not found' });
        }

        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + path.extname(req.file.originalname);
        const filepath = path.join(__dirname, '../public/images', filename);

        // Write file from memory to disk
        await fs.writeFile(filepath, req.file.buffer);

        // Create product with saved image filename
        const product = await productModel.create({
            ...value,
            image: filename
        });

        // Add product to owner's products array
        owner.products.push(product._id);
        await owner.save();

        res.status(201).json({
            message: 'Product created successfully',
            product: product
        });

    } catch(error){
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all products
module.exports.getAllProducts = async(req, res) => {
    try{
        const products = await productModel.find();
        res.status(200).json({
            message: 'Products fetched successfully',
            products: products
        });
    } catch(error){
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get product by ID
module.exports.getProductById = async(req, res) => {
    try{
        const { productId } = req.params;
        const product = await productModel.findById(productId);

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

// Update product with optional image upload
module.exports.updateProduct = async(req, res) => {
    try{
        const { productId } = req.params;

        // Validate request body with update schema (allows partial updates)
        const { error, value } = productUpdateSchema.validate(req.body);
        if(error){
            return res.status(400).json({ error: error.details[0].message });
        }

        // If new image uploaded, save it to disk
        const updateData = { ...value };
        if(req.file){
            // Create unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = uniqueSuffix + path.extname(req.file.originalname);
            const filepath = path.join(__dirname, '../public/images', filename);

            // Write file from memory to disk
            await fs.writeFile(filepath, req.file.buffer);
            
            updateData.image = filename;
        }

        // Find and update product
        const product = await productModel.findByIdAndUpdate(
            productId,
            updateData,
            { new: true, runValidators: true }
        );

        if(!product){
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({
            message: 'Product updated successfully',
            product: product
        });

    } catch(error){
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete product
module.exports.deleteProduct = async(req, res) => {
    try{
        const { productId } = req.params;

        // Find and delete product
        const product = await productModel.findByIdAndDelete(productId);

        if(!product){
            return res.status(404).json({ error: 'Product not found' });
        }

        // Remove product from owner's products array
        const owner = await ownerModel.findOne();
        if(owner){
            owner.products = owner.products.filter(id => id.toString() !== productId);
            await owner.save();
        }

        res.status(200).json({
            message: 'Product deleted successfully',
            product: product
        });

    } catch(error){
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
