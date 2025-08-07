import express from 'express'
import { getReportsController, submitReportController } from '../controllers/reportController.js'
import { requireSignInMiddleware } from '../middlewares/userMiddleware.js'
import { requireSignInMiddleware as requireSignInMiddlewareOwner } from '../middlewares/ownerMiddleware.js'

const router = express.Router()

router.post("/report-item", requireSignInMiddleware, submitReportController)
router.get("/get-all-items-reports/:restaurantId", requireSignInMiddlewareOwner, getReportsController)

export default router