import userModel from "../models/userModel.js";

export const isSuperAdmin = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId)
        if (user.role !== "superadmin") {
            return res.status(403).json({ success: false, message: "Access denied. Super admin only." });
        }
        next();
    } catch (error) {
        console.error("Error in super admin middleware:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}