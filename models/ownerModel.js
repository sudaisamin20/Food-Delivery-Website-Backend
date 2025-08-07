import mongoose, { Schema } from "mongoose";

const ownerSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    cnicno: {
        type: String,
        required: true
    },
    profileImg: {
        type: String,
    },
    phoneno: {
        type: String,
        required: true
    },
    businessemail: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "owner"
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "restaurant"
    },
    createAt: {
        type: Date,
        default: Date.now()
    }
})

const Owner = mongoose.model("owners", ownerSchema)

export default Owner