import express from "express"
import { addCityController, checkSuperAdminController, completePayoutNowController, getAllCitiesController, getAllDeliveryPartnersController, getAllRestaurantAdminsController, getAllRestaurantsController, getAllRestaurantsCreationRequestsController, getAllUsersController, getDashboardOverviewController, getTotalCommissionController, getTotalPayoutController, getTotalRevenueController, updateRestaurantStatusController } from "../controllers/superAdminController.js"
import { isSuperAdmin } from "../middlewares/superAdminMiddleware.js"
import { requireSignInMiddleware } from "../middlewares/userMiddleware.js"
import upload from "../middlewares/multer.js"

const router = express.Router()

router.get("/restaurant-creation-requests", requireSignInMiddleware, isSuperAdmin, getAllRestaurantsCreationRequestsController)

router.put("/update-restaurant-status/:restaurantId", requireSignInMiddleware, isSuperAdmin, updateRestaurantStatusController)

router.get("/get-all-restaurants", requireSignInMiddleware, isSuperAdmin, getAllRestaurantsController)

router.get("/get-all-users", requireSignInMiddleware, isSuperAdmin, getAllUsersController)

router.get("/get-all-restaurant-admins", requireSignInMiddleware, isSuperAdmin, getAllRestaurantAdminsController)

router.get("/get-all-delivery-partners", requireSignInMiddleware, isSuperAdmin, getAllDeliveryPartnersController)

router.get("/dashboard-overview", requireSignInMiddleware, getDashboardOverviewController)
// requireSignInMiddleware, isSuperAdmin,
router.get("/get-revenue-overview", getTotalRevenueController)

router.get("/get-payouts-overview", getTotalPayoutController)

router.get("/get-commission-overview/:city/:dateRange", requireSignInMiddleware, isSuperAdmin, getTotalCommissionController)

router.post("/add-city", requireSignInMiddleware, isSuperAdmin, upload.single("cityImage"), addCityController)

router.get("/get-all-cities", getAllCitiesController)

router.get("/check-super-admin", requireSignInMiddleware, checkSuperAdminController)

router.put("/complete-payout-now", completePayoutNowController)

export default router