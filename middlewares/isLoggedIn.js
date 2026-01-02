const jwt = require('jsonwebtoken');   
const userModel = require('../models/user-model'); 

module.exports = async function isLoggedIn(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let user = await userModel.findOne({email: decoded.email})
        .select('-password'); // Exclude password field
        if(!user){
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        req.user = user; // Attach user info to request object
        next();
    }   catch (err) {   
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};
