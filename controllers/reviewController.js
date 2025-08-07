import reviewModel from '../models/reviewModel.js';
import itemModel from '../models/itemModel.js';
import restaurantModel from '../models/restaurantModel.js';
import orderModel from '../models/orderModel.js';

export const createReview = async (req, res) => {
    try {
        const {
            order,
            restaurant,
            itemReviews,
            restaurantRating,
            restaurantReviewText,
            statusOrderId
        } = req.body;
        if (!restaurantReviewText) {
            return res.status(400).send({ success: false, message: "Restaurant review text is required" });
        }
        const review = new reviewModel({
            user: req.userId,
            order,
            restaurant,
            itemReviews,
            restaurantRating,
            restaurantReviewText
        });

        await review.save();

        for (const item of itemReviews) {
            const foodItemId = item.foodItem;

            const reviews = await reviewModel.find({ "itemReviews.foodItem": foodItemId });

            let itemRatings = [];
            reviews.forEach(r => {
                r.itemReviews.forEach(ir => {
                    if (ir.foodItem?.toString() === foodItemId.toString()) {
                        itemRatings.push(ir.itemRating);
                    }
                });
            });

            const total = itemRatings.reduce((sum, rating) => sum + rating, 0);
            const averageRating = itemRatings.length > 0
                ? parseFloat((total / itemRatings.length).toFixed(1))
                : 0;

            await itemModel.findByIdAndUpdate(foodItemId, {
                averageRating
            });
        }

        if (restaurantRating) {
            const restaurantReviews = await reviewModel.find({ restaurant });

            let restaurantRatings = [];
            restaurantReviews.forEach(r => {
                if (r.restaurantRating) {
                    restaurantRatings.push(r.restaurantRating);
                }
            });

            const totalRestaurantRating = restaurantRatings.reduce((sum, rating) => sum + rating, 0);
            const averageRestaurantRating = restaurantRatings.length > 0
                ? parseFloat((totalRestaurantRating / restaurantRatings.length).toFixed(1))
                : 0;
            await restaurantModel.findByIdAndUpdate(restaurant, {
                averageRestaurantRating: averageRestaurantRating,
                $push: { reviews: review._id }
            });
        }
        if (statusOrderId) {
            const order = await orderModel.findById(statusOrderId)
            if (!order) {
                return res.status(404).send({ success: true, message: "Order not found" })
            }
            order.reviewedOrder = true
            order.reviewPromptDismissed = true
            await order.save()
        }
        res.status(201).json({ success: true, message: "Review submitted successfully", review });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to submit review" });
    }
};

export const getReviewsForRestaurant = async (req, res) => {
    try {
        const reviews = await reviewModel.find({ restaurant: req.params.restaurantId }).populate("user").populate({
            path: "itemReviews.foodItem"
        });
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        res.status(200).send({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ message: "Failed to get restaurant reviews" });
    }
};

export const getReviewsForFoodItem = async (req, res) => {
    try {
        const foodItemId = req.params.foodItemId;

        const reviews = await reviewModel.find({ "itemReviews.foodItem": foodItemId });

        const itemRatings = [];

        reviews.forEach(review => {
            review.itemReviews.forEach(item => {
                if (item.foodItem?.toString() === foodItemId) {
                    itemRatings.push({
                        rating: item.itemRating,
                        _id: item._id,
                        reviewId: review._id,
                        itemId: item.foodItem,
                        user: review.user,
                        restaurant: review.restaurant,
                        createdAt: review.createdAt,
                    });
                }
            });
        });

        const total = itemRatings.reduce((sum, item) => sum + item.rating, 0);
        const averageRating = itemRatings.length > 0 ? parseFloat((total / itemRatings.length).toFixed(1)) : null;

        res.status(200).json({
            success: true,
            ratingData: itemRatings,
            averageRating
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get food item reviews" });
    }
};
