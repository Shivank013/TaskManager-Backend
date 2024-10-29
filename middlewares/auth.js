const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

// Authentication Middleware
exports.auth = async (req, res, next) => {
    try {
        // Extract token from cookies, body, or Authorization header
        const token = req.cookies.token || req.body.token || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ success: false, message: 'Token is missing' });
        }

        // Verify token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Token is invalid' });
        }

        // Retrieve user from DB and attach to req
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Something went wrong while validating the token' });
    }
};