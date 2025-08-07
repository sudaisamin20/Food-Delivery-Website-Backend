import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema({
    reason: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "item"
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "restaurant"
    },
    reportedAt: {
        type: Date,
        default: Date
    }
})

const report = mongoose.model("Report", reportSchema)

export default report