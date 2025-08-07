import express from "express";
import { checkOwnerMiddleware, requireSignInMiddleware } from "../middlewares/ownerMiddleware.js";
import { checkOwnerAndRestaurantMiddleware } from "../middlewares/restaurantMiddleware.js";
import { createCategoryController, deleteSingleCategoryController, getAllCategoriesController, updateCategoryController } from "../controllers/categoryController.js";

const router = express.Router();

router.post("/create-category", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, createCategoryController);

router.put("/update-category/:id", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, updateCategoryController);

router.get("/getallcategories", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, getAllCategoriesController);

router.delete("/delete-category/:id", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, deleteSingleCategoryController);

export default router;