import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneno: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    favoriteRestaurants: [
        {
            restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "restaurant" },
            addedAt: { type: Date, default: Date.now },
            link: { type: String }
        }
    ],
    favoriteItems: [
        {
            item: { type: mongoose.Schema.Types.ObjectId, ref: "item" },
            addedAt: { type: Date, default: Date.now },
            link: { type: String }
        }
    ],
    profileImage: {
        type: String
    },
    role: {
        type: String,
        default: "user"
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

const User = mongoose.model("users", userSchema)

export default User 