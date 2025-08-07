import categoryModel from "../models/categoryModel.js";
import itemModel from "../models/itemModel.js"
import orderModel from "../models/orderModel.js"
import restaurantModel from "../models/restaurantModel.js";
import reviewModel from "../models/reviewModel.js";

export const createItemController = async (req, res) => {
    try {
        const { category, itemName, description, price, restaurantId } = req.body
        const image = req.file.filename;
        if (!image) {
            return res.send({ success: false, message: "Item image is required" })
        }
        if (!itemName) {
            return res.send({ success: false, message: "Item name is required" })
        }
        if (!description) {
            return res.send({ success: false, message: "Item description is required" })
        }
        if (!price) {
            return res.send({ success: false, message: "Price is required" })
        }
        const item = new itemModel({
            image,
            itemName,
            description,
            price,
            category,
            restaurantId
        })

        await item.save()
        await restaurantModel.findByIdAndUpdate(
            restaurantId,
            {
                $push: {
                    items: item._id,
                },
            },

            { new: true }
        )
        return res.status(201).send({
            success: true,
            message: "New Item Added Successfully",
            item
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
};

export const getAllItemsController = async (req, res) => {
    try {
        const { restaurantId } = req.params
        const items = await itemModel.find({ restaurantId }).populate("category")
        if (!items) {
            return res.status(404).send({ success: false, message: "No items Founded" })
        }
        return res.status(201).send({
            success: true,
            message: "Fetch all items successfully",
            items
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
}

export const updateItemController = async (req, res) => {
    const { itemName, description, price, category, restaurantId, available } = req.body;
    const itemId = req.params.itemId;
    try {
        let updateData = { itemName, description, price, category, restaurantId, available }
        if (req.file) {
            updateData.image = req.file.filename;
        }
        const existingItem = await itemModel.findOneAndUpdate({ _id: itemId, restaurantId }, updateData, { new: true });
        if (!existingItem) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }
        res.json({ success: true, message: "Item updated successfully", item: existingItem });
    } catch (error) {
        console.log(error);

        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

export const deleteItemController = async (req, res) => {
    try {
        const { id } = req.params
        const item = await itemModel.findByIdAndDelete(id)
        if (!item) {
            return res.status(404).send({ success: false, message: "No item founded to delete" })
        }
        return res.status(200).send({ success: true, message: "Item deleted" })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
}

export const filterItemByCategoryController = async (req, res) => {
    try {
        const { categoryId } = req.params
        const items = await itemModel.find({ category: categoryId }).populate("category")
        if (!items) {
            return res.status(404).send({ success: false, message: "No item in this category" })
        }
        return res.status(200).send({ success: true, message: "Category Filtered", items })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
}

export const checkItemToDeleteCategory = async (req, res) => {
    try {
        const { restaurantId, categoryId } = req.params
        const item = await itemModel.findOne({ restaurantId, category: categoryId })
        if (item) {
            return res.status(401).send({ success: false, message: "Can't delete this category because it has items." })
        }
        return res.status(201).send({ success: true })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
}

export const getRestaurantItems = async (req, res) => {
    const { restaurantId } = req.params
    try {
        const restaurant = await restaurantModel.findById(restaurantId)
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }
        const restaurantItems = await itemModel.find({ restaurantId })
        const categories = await categoryModel.find({ restaurantId })
        return res.status(200).send({ success: true, message: "Founded Restaurants", restaurantItems, restaurant, categories })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong", success: false, error });
    }
}

export const getSearchItems = async (req, res) => {
    const { restaurantId, searchItem } = req.params
    try {
        const restaurant = await restaurantModel.findById(restaurantId)
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }
        const restaurantItems = await itemModel.find({ restaurantId, itemName: { $regex: searchItem, $options: "i" } })
        if (!restaurantItems) {
            return res.status(404).json({ success: false, message: "No items founded" })
        }
        const categories = await categoryModel.find({ restaurantId })
        if (!categories) {
            return res.status(404).json({ success: false, message: "No categories founded" })
        }
        return res.status(200).send({ success: true, message: "Founded Restaurants", restaurantItems, restaurant, categories })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong", success: false, error });
    }
}

export const getRestaurantItemsByRating = async (req, res) => {
    const { restaurantId } = req.params
    try {
        const restaurant = await restaurantModel.findById(restaurantId).populate("reviews")
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }
        const restaurantItems = await itemModel.find({ restaurantId })
        if (restaurantItems.length === 0) {
            return res.status(404).json({ success: false, message: "No items founded" })
        }
        const categories = await categoryModel.find({ restaurantId })
        if (!categories.length === 0) {
            return res.status(404).json({ success: false, message: "No categories founded" })
        }
        restaurantItems.sort((itemA, itemB) => itemB.averageRating - itemA.averageRating)
        return res.status(200).send({ success: true, message: "Founded Restaurants", restaurantItems, restaurant, categories })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong", success: false, error });
    }
}

export const getPopularItemsController = async (req, res) => {
    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 30);
        const popularItems = await orderModel.aggregate([
            { $match: { createdAt: { $gte: oneWeekAgo } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.item",
                    count: { $sum: "$items.quantity" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "items",
                    localField: "_id",
                    foreignField: "_id",
                    as: "itemDetails"
                }
            },

            { $unwind: "$itemDetails" }
        ]);
        return res.status(200).send({ success: true, popularItems })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server issue!'
        });
    }
}

