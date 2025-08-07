import mongoose from "mongoose";

const deliveryBoySchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
    },
    cnicno: {
        type: String,
        required: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    phoneno: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    numberPlate: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
    },
    vehicleType: {
        type: String,
        required: true,
    },
    licenseNo: {
        type: String,
        required: true,
    },
    licenseExpiry: {
        type: Date,
        required: true,
    },
    picture: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "deliveryboy",
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

const DeliveryBoy = mongoose.model("deliveryboys", deliveryBoySchema)

export default DeliveryBoy
