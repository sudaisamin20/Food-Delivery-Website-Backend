import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        lowercase: true,
        unique: false
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "restaurants",
        required: true
    }
}, { timestamps: true });

categorySchema.index({ name: 1, restaurantId: 1 }, { unique: true });

const category = mongoose.model("categories", categorySchema);
export default category;