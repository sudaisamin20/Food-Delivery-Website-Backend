import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/foodDelivery";

const removeIndex = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const collections = await mongoose.connection.db.listCollections().toArray();
        const categoryCollection = collections.find(col => col.name === "categories");

        if (!categoryCollection) {
            console.log("No 'categories' collection found.");
            return;
        }

        await mongoose.connection.collection("categories").dropIndex("name_1");
        console.log("Index on 'name' removed successfully");

    } catch (error) {
        console.error("Error removing index:", error);
    } finally {
        mongoose.disconnect();
    }
};

removeIndex();