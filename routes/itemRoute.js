import express from "express"
import { checkOwnerMiddleware, requireSignInMiddleware } from "../middlewares/ownerMiddleware.js"
import { checkOwnerAndRestaurantMiddleware } from "../middlewares/restaurantMiddleware.js"
import { checkItemToDeleteCategory, createItemController, deleteItemController, filterItemByCategoryController, getAllItemsController, getPopularItemsController, getRestaurantItems, getRestaurantItemsByRating, getSearchItems, updateItemController } from "../controllers/itemController.js"
import upload from "../middlewares/multer.js"

const router = express.Router()

router.post("/create-item", requireSignInMiddleware, checkOwnerMiddleware, upload.single("image"), checkOwnerAndRestaurantMiddleware, createItemController)

router.get("/get-all-items/:restaurantId", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, getAllItemsController)

router.put("/update-item/:itemId", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, upload.single("image"), updateItemController)

router.delete("/delete-item/:id", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, deleteItemController)

router.get("/filter-items/:categoryId", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, filterItemByCategoryController)

router.get("/check-item/:restaurantId/:categoryId", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, checkItemToDeleteCategory)

router.get("/get-restaurant-items/:restaurantId", getRestaurantItems)

router.get("/get-search-item/:restaurantId/:searchItem", getSearchItems)

router.get("/get-restaurant-items-by-rating/:restaurantId", getRestaurantItemsByRating)

router.get("/get-restaurants/:city/:action", getRestaurantItemsByRating)

router.get("/get-popular-items", getPopularItemsController)

export default router