const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({error: "Access denied, no token provided"});
    try{
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        req.user = {
            _id: decoded.id,
            id: decoded.id,
            role: decoded.role
        }
        next();
    }catch(err){
        res.status(401).json({error: "Invalid token"});
    }
}

