import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/foodDelivery";

const ConnDB = async () => {
    try {
        const mongoDbConn = await mongoose.connect(MONGODB_URI)
        console.log(`MongoDB Connected Successfully`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

export default ConnDB;