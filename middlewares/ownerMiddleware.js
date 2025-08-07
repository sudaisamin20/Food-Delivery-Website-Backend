import jwt from "jsonwebtoken";
import ownerModel from "../models/ownerModel.js"

export const requireSignInMiddleware = async (req, res, next) => {
    try {
        const token = req.header("auth-token");

        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized Owner" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        req.ownerId = decoded.owner.id;

        next();
    } catch (error) {
        console.log("JWT Error:", error);
        res.status(401).json({ success: false, message: "Internal Server Error" });
    }
};

export const checkOwnerMiddleware = async (req, res, next) => {
    try {
        const ownerId = req.ownerId
        const owner = await ownerModel.findById(ownerId)
        if (!owner) {
            return res.status(401).json({ success: false, message: "No Owner Founded" });
        }
        if (owner.role !== "owner") {
            return res.status(401).json({ success: false, message: "Unauthorized Owner Access" });
        }
        next()
    } catch (error) {
        console.log("Error:", error);
        res.status(401).json({ success: false, message: "Internal Server Error" });
    }
}
