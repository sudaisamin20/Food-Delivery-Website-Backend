import express from "express"
import { fetchOwnerController, fetchOwnerDataController, loginOwnerController, manageProfileController, registerOwnerController } from "../controllers/ownerController.js"
import { checkOwnerMiddleware, requireSignInMiddleware } from "../middlewares/ownerMiddleware.js"
import { checkOwnerAndRestaurantMiddleware } from "../middlewares/restaurantMiddleware.js"

const router = express.Router()

router.post("/register", registerOwnerController)

router.post("/login", loginOwnerController)

router.get("/check-owner", requireSignInMiddleware, checkOwnerMiddleware, (req, res) => {
    res.status(200).send({ ok: true })
})

router.get("/checkownerandrestaurant", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, (req, res) => {
    res.status(200).send({ ok: true, restaurant: req.restaurant })
})

router.put("/manage-profile/:id", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, manageProfileController)

router.get("/fetch-owner/:id", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, fetchOwnerController)

router.get("/fetch-owner-data/:id", requireSignInMiddleware, checkOwnerMiddleware, checkOwnerAndRestaurantMiddleware, fetchOwnerDataController)



export default router