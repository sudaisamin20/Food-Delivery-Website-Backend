import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "item", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true },
});

const CartSchema = new mongoose.Schema({
    items: [CartItemSchema],
    totalAmount: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "restaurant", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
});

const cart = mongoose.model("cart", CartSchema);

export default cart;