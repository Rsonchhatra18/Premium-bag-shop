const userModel = require('../models/user-model');
const joi = require('joi');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');

// Validation schema for user registration
const userValidationSchema = joi.object({
    fullname: joi.string().min(3).max(30).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required()
});

// Validation schema for user login
const loginValidationSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required()
});

module.exports.registerUser = async(req, res) => {
    try{
        // Validate request body with Joi
        const { error, value } = userValidationSchema.validate(req.body);
        if(error){
            return res.status(400).json({ error: error.details[0].message });
        }

        const { fullname, email, password } = value;

        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if(existingUser){
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password using bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = await userModel.create({
            fullname,
            email,
            password: hashedPassword
        });

        let token = generateToken(user);
        res.cookie("token", token, { httpOnly: true });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email
            }
        });

    } catch(error){
        console.error('Error during user registration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports.loginUser = async(req, res) => {
    try{
        // Validate request body with Joi
        const { error, value } = loginValidationSchema.validate(req.body);
        if(error){
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password } = value;

        // Check if user exists
        const user = await userModel.findOne({ email });
        if(!user){
            return res.status(404).json({ error: 'Email or password not found' });
        }

        // Compare passwords using async bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        let token = generateToken(user);
        res.cookie("token", token, { httpOnly: true });

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email
            }
        });

    } catch(error){
        console.error('Error during user login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports.logoutUser = (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: 'Logout successful' });
}
