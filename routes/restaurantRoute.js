import express from 'express'
import { checkRestaurantCreationStatusController, createRestaurantController, fetchRestaurantController, getCityAllRestaurantsController, getCityFilteredRestaurantsController, getPopularRestaurantsController, getRestaurantDashboardOverviewController, getSearchRestaurantController, manageRestaurantController } from '../controllers/restaurantController.js'
import { checkOwnerAndRestaurantMiddleware } from "../middlewares/restaurantMiddleware.js"
import { requireSignInMiddleware, checkOwnerMiddleware, } from "../middlewares/ownerMiddleware.js"
import upload from '../middlewares/multer.js'

const router = express.Router()

router.post("/create", requireSignInMiddleware, checkOwnerMiddleware, upload.single("image"), createRestaurantController)

router.get("/fetch-restaurant/:id", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, fetchRestaurantController)

router.put("/manage-restaurant/:id", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, upload.single("image"), manageRestaurantController)

router.get("/get-all-restaurants/:city", getCityAllRestaurantsController)

router.get("/get-search-restaurants/:city/:searchRestaurant", getSearchRestaurantController)

router.get("/get-filtered-restaurants/:city/:sortBy", getCityFilteredRestaurantsController)

router.get("/check-restaurant-creation-status/:restaurantId", checkRestaurantCreationStatusController)

router.get("/get-popular-restaurants/:city", getPopularRestaurantsController)

router.get("/get-restaurant-dashboard-overview/:restaurantId", getRestaurantDashboardOverviewController)

export default router