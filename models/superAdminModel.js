import mongoose from "mongoose";

const superAdminSchema = new mongoose.Schema({
    city: {
        type: String,
    },
    image: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

const superAdminModel = mongoose.model("SuperAdmin", superAdminSchema)
export default superAdminModel