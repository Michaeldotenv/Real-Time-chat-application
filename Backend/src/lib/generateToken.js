import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
    const token = jwt.sign(
        { userId }, 
        process.env.JWT_SECRET || "fallback-secret-key",
        { expiresIn: "7d" }
    );
    
    // Set the cookie for API auth
    res.cookie("token", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure: true, // Always use secure in production
        path: "/",
    });

    return token; // Return token so it can be included in response JSON
}