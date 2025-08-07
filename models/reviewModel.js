import mongoose from 'mongoose';

const itemReviewSchema = new mongoose.Schema({
    foodItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'item',
        required: true
    },
    itemRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    }
});

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'restaurant',
        required: true
    },
    itemReviews: [itemReviewSchema],
    restaurantRating: {
        type: Number,
        min: 1,
        max: 5
    },
    restaurantReviewText: {
        type: String,
        maxlength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Review', reviewSchema);
