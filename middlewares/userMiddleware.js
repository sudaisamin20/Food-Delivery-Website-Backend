import jwt from 'jsonwebtoken'

export const requireSignInMiddleware = async (req, res, next) => {
    try {
        const token = req.header('auth-token')
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized User" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.userId = decoded.user._id || decoded.user.id;
        next();
    } catch (error) {
        console.log("JWT Error:", error);
        res.status(401).json({ success: false, message: "Internal Server Error" });
    }
}