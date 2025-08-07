import express from 'express'
import { acceptOrderController, getAllCityOrders, getDeliveryBoyDashboardOverviewController, getDeliveryBoyDataController, getDeliveryBoyEarningController, getDeliveryBoyOrdersController, loginDeliveryBoyController, orderDeliveredController, registerDeliveryBoy, returnOrderController, updateProfileInfoController } from '../controllers/deliveryBoyController.js'
import upload from '../middlewares/multer.js'
import { requireSignInMiddleware } from '../middlewares/deliveryBoyMiddleware.js'

const router = express.Router()

router.post('/register', upload.single("picture"), registerDeliveryBoy)

router.post("/login", loginDeliveryBoyController)

router.get("/get-delivery-boy-data/:deliveryBoyId", getDeliveryBoyDataController)

router.put("/update-profile-info/:deliveryBoyId", upload.single("picture"), updateProfileInfoController)

router.get("/get-orders/:city", requireSignInMiddleware, getAllCityOrders)

router.put("/accept-order/:orderId", requireSignInMiddleware, acceptOrderController)

router.put("/order-delivered/:orderId", requireSignInMiddleware, orderDeliveredController)

router.put("/return-order/:orderId", requireSignInMiddleware, returnOrderController)

router.get("/get-delivery-boy-dashboard-overview/:deliveryBoyId", requireSignInMiddleware, getDeliveryBoyDashboardOverviewController)

router.get("/get-delivery-boy-earnings/:deliveryBoyId", requireSignInMiddleware, getDeliveryBoyEarningController)

router.get("/get-all-orders/:deliveryBoyId", requireSignInMiddleware, getDeliveryBoyOrdersController)

router.get("/check-delivery-boy", requireSignInMiddleware, (req, res) => {
    res.status(200).send({
        ok: true,
        message: "Delivery boy is signed in",
        deliveryBoy: req.deliveryBoy
    })
})

export default router