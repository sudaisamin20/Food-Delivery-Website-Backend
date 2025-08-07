import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema({
    itemName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    averageRating: {
        type: Number,
        default: 0.0
    },
    available: {
        type: Boolean,
        default: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories"
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "restaurant"
    }
}, { timestamps: true })

const item = mongoose.model("item", itemSchema)

export default item