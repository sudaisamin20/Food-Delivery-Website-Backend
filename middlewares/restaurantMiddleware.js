import ownerModel from "../models/ownerModel.js";
import restaurantModel from "../models/restaurantModel.js";

export const checkOwnerAndRestaurantMiddleware = async (req, res, next) => {
    try {
        const ownerId = req.ownerId;
        const owner = await ownerModel.findById(ownerId);

        if (!owner) {
            return res.status(401).json({ success: false, message: "Unauthorized Access" });
        }

        if (!owner.restaurantId) {
            console.log("No Restaurant Linked to Owner");
            return res.status(401).json({ success: false, message: "No Restaurant Linked to Owner" });
        }

        const restaurant = await restaurantModel.findById(owner.restaurantId);
        req.restaurant = restaurant;
        if (!restaurant) {
            return res.status(401).json({ success: false, message: "No Restaurant Found" });
        }
        if (restaurant.restaurantOwner.toString() !== ownerId) {
            return res.status(401).json({ success: false, message: "Unauthorized Access" });
        }
        // if (restaurant.status !== "Approved") {
        //     return res.status(401).json({ success: false, message: "Restaurant not approved" });
        // }
        next();
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};