import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // load .env variables

const MONGODB_URI = process.env.MONGODB_URI;

const ConnDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default ConnDB;
