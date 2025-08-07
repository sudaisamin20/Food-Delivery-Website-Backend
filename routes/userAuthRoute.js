import express from "express"
import { addToFavoriteItemController, addToFavoriteRestaurantController, checkOrderController, checkUserController, getFavoriteItemsController, getFavoriteRestaurantsController, getUserProfileController, loginController, registerController, removeFromFavoriteItemController, removeFromFavoriteRestaurantController, updateUserProfileController, uploadUserProfileImageController } from "../controllers/userAuthController.js"
import { requireSignInMiddleware } from "../middlewares/userMiddleware.js"
import upload from "../middlewares/multer.js"

const router = express.Router()

router.post("/login", loginController)

router.post("/register", registerController)

router.get("/get-favorite-restaurants", requireSignInMiddleware, getFavoriteRestaurantsController)

router.put("/add-to-favorite-restaurant", requireSignInMiddleware, addToFavoriteRestaurantController)

router.delete("/removed-from-favorite-restaurant/:restaurantId", requireSignInMiddleware, removeFromFavoriteRestaurantController)

router.get("/get-favorite-items", requireSignInMiddleware, getFavoriteItemsController)

router.put("/add-to-favorite-item", requireSignInMiddleware, addToFavoriteItemController)

router.delete("/removed-from-favorite-item/:itemId", requireSignInMiddleware, removeFromFavoriteItemController)

router.get("/fetch-user-data", requireSignInMiddleware, getUserProfileController)

router.put("/manage-profile", requireSignInMiddleware, updateUserProfileController)

router.post("/upload-profile-image", requireSignInMiddleware, upload.single("profileImage"), uploadUserProfileImageController)

router.get("/checkuser", requireSignInMiddleware, checkUserController)

router.get("/check-order/:orderId", requireSignInMiddleware, checkOrderController)

export default router