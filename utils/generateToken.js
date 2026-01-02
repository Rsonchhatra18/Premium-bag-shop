const jwt = require('jsonwebtoken');

function generateToken(user) {
    if (
        !user ||
        typeof user !== 'object' ||
        user.email == null ||
        user._id == null
    ) {
        throw new TypeError('Invalid user object provided to generateToken');
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (typeof JWT_SECRET !== 'string' || JWT_SECRET.trim().length < 32) {
        throw new Error('JWT_SECRET environment variable must be set and at least 32 characters long.');
    }

    return jwt.sign(
        { email: user.email, id: user._id },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

module.exports = generateToken;
