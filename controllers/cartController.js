import cartModel from "../models/cartModel.js";

export const getCartController = async (req, res) => {
    try {
        const { userId, restaurantId } = req.params;
        const cart = await cartModel.findOne({ userId, restaurantId }).populate("restaurantId").populate("userId");
        if (!cart) {
            return res.json({ success: true, cart: { items: [], totalAmount: 0 } });
        }
        res.json({ success: true, cart });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error,
            success: false,
            message: "Error while fetching cart"
        });
    }
};

export const addToCartController = async (req, res) => {
    try {
        const { userId, itemId, name, price, image, quantity, restaurantId } = req.body;

        let cart = await cartModel.findOne({ userId, restaurantId });

        if (!cart) {
            cart = new cartModel({ userId, items: [], totalAmount: 0 });
        }

        const existingItem = cart.items.find((cartItem) => cartItem.itemId.toString() === itemId);

        if (existingItem) {
            existingItem.quantity += quantity;
            if (existingItem.quantity <= 0) {
                cart.items = cart.items.filter((cartItem) => cartItem.itemId.toString() !== itemId);
            }
        } else {
            cart.items.push({ itemId, name, price, image, quantity });
        }

        cart.totalAmount = cart.items.reduce((sum, cartItem) => sum + cartItem.price * cartItem.quantity, 0);
        cart.restaurantId = restaurantId;
        cart.updatedAt = Date.now();
        cart.lastUpdated = Date.now();
        await cart.save();

        res.json({ success: true, message: "Item added to cart", cart });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error,
            success: false,
            message: "Error while updating cart"
        });
    }
};

export const removeFromCartController = async (req, res) => {
    try {
        const { userId, itemId, restaurantId } = req.params;
        let cart = await cartModel.findOne({ userId, restaurantId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const existingItem = cart.items.find((cartItem) => cartItem.itemId.toString() === itemId);

        if (existingItem) {
            existingItem.quantity -= 1;
            if (existingItem.quantity <= 0) {
                cart.items = cart.items.filter((cartItem) => cartItem.itemId.toString() !== itemId);
            }
        }

        cart.totalAmount = cart.items.reduce((sum, cartItem) => sum + cartItem.price * cartItem.quantity, 0);
        cart.updatedAt = Date.now();
        cart.lastUpdated = Date.now();
        await cart.save();

        res.json({ success: true, message: "Item removed from cart", cart });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error,
            success: false,
            message: "Error while removing item from cart"
        });
    }
};

export const removeAllItemsFromCartController = async (req, res) => {
    try {
        const { userId, itemId, restaurantId } = req.params;
        let cart = await cartModel.findOne({ userId, restaurantId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const itemExists = cart.items.some((cartItem) => cartItem.itemId.toString() === itemId);
        if (!itemExists) {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }

        cart.items = cart.items.filter((cartItem) => cartItem.itemId.toString() !== itemId);
        
        cart.totalAmount = cart.items.reduce((sum, cartItem) => sum + cartItem.price * cartItem.quantity, 0);
        cart.updatedAt = Date.now();
        cart.lastUpdated = Date.now();

        await cart.save();

        res.json({ success: true, message: "Item completely removed from cart", cart });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error,
            success: false,
            message: "Error while removing item from cart"
        });
    }
};
