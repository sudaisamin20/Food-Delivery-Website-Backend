import express from 'express';
import { createReview, getReviewsForRestaurant, getReviewsForFoodItem } from '../controllers/reviewController.js';
import { requireSignInMiddleware } from '../middlewares/userMiddleware.js';

const router = express.Router();

router.post('/create-review', requireSignInMiddleware, createReview);
router.get('/get-restaurant-reviews/:restaurantId', getReviewsForRestaurant);
router.get('/get-item-rating/:foodItemId', getReviewsForFoodItem);

export default router;
