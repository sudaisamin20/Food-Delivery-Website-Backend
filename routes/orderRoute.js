import express from 'express'
import { requireSignInMiddleware } from '../middlewares/userMiddleware.js'
import { checkOwnerMiddleware, requireSignInMiddleware as requireSignInMiddlewareOwner } from '../middlewares/ownerMiddleware.js'
import { checkOwnerAndRestaurantMiddleware } from '../middlewares/restaurantMiddleware.js'
import { createOrderController, getFilterOrdersByStatusController, getOrderDetailsController, getRestaurantOrders, getUserOrdersController, updateOrderStatusController, getUserOrderStatusController, deleteUserOrderController, dismissReviewPromptController, cancelOrderController } from '../controllers/orderController.js'

const router = express.Router()

router.post("/create-order", requireSignInMiddleware, createOrderController)

router.get("/get-order-details/:orderId", requireSignInMiddleware, getOrderDetailsController)

router.get("/get-user-orders", requireSignInMiddleware, getUserOrdersController)

router.get("/get-user-order-status/:statusOrderId", requireSignInMiddleware, getUserOrderStatusController)

router.delete("/delete-user-order/:orderId", requireSignInMiddleware, deleteUserOrderController)

router.put("/review-prompt-dismissed", requireSignInMiddleware, dismissReviewPromptController)

router.get("/get-restaurant-orders/:restaurantId", requireSignInMiddlewareOwner, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, getRestaurantOrders)

router.put("/update-order-status/:orderId", requireSignInMiddlewareOwner, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, updateOrderStatusController)

router.get("/get-filter-status-orders/:status/:restaurantId", requireSignInMiddlewareOwner, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, getFilterOrdersByStatusController)

router.put("/cancel-order/:orderId", requireSignInMiddleware, cancelOrderController)

export default router