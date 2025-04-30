const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

const register = async (req, res) => {
    try {
        const { name, email, password, mobile, role } = req.body;

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ error: 'User already exists' });

        const existingMobile = await User.findOne({ mobile });
        if (existingMobile) return res.status(400).json({ error: 'Phone number already registered' });

        const user = new User({ name, email, password, mobile, role });
        await user.save();

        res.status(201).json({
            message: 'Registration successful',
            token: generateToken(user),
            user: { id: user._id, name: user.name, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        res.json({
            message: "Login successful",
            token: generateToken(user),
            user: { id: user._id, name: user.name, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { register, login };