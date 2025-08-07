import express from "express";
import { addToCartController, getCartController, removeAllItemsFromCartController, removeFromCartController } from "../controllers/cartController.js";
import { requireSignInMiddleware } from "../middlewares/userMiddleware.js";

const router = express.Router();

router.post("/add-to-cart", requireSignInMiddleware, addToCartController);

router.get("/get-user-cart/:userId/:restaurantId", requireSignInMiddleware, getCartController);

router.delete("/remove-from-cart/:userId/:itemId/:restaurantId", requireSignInMiddleware, removeFromCartController);

router.delete("/remove-all-items-from-cart/:userId/:itemId/:restaurantId", requireSignInMiddleware, removeAllItemsFromCartController);

export default router;