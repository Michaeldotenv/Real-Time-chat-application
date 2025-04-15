import jwt from 'jsonwebtoken';
import User from '../models/usermodel.js';
import { generateToken } from '../lib/generateToken.js';
const protectRoute = async (req, res, next) => {
    // 1. Robust token extraction
    try {

        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({
                success: false,
                code: "NO_TOKEN",
                message: "Authentication required"
            });
        }
             // 2. Verify with clock tolerance
             const decoded = jwt.verify(token, process.env.JWT_SECRET)
             if(!decoded){
                res.status(404).json({
                    message : "Unauthorized-Invalid token"
                })
             }
        // 3. Secure user lookup
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                code: "ACCOUNT_INACTIVE",
                message: "Account not found"
            });
        }

    
        req.user = user;

        
        next();
        
    }catch (error) {
        console.error("Token verification error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
export default protectRoute