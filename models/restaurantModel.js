import mongoose, { Schema } from "mongoose";

const restaurantSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    openingTime: {
        type: String,
        required: true
    },
    closingTime: {
        type: String,
        required: true
    },
    cuisines: {
        type: [String],
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phoneno: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "Pending"
    },
    items: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "item"
        }
    ],
    categories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "categories",
        }
    ],
    restaurantOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "owners"
    },
    averageRestaurantRating: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const restaurant = mongoose.model("restaurant", restaurantSchema)

export default restaurant