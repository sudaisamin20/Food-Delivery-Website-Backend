import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import restaurantModel from "../models/restaurantModel.js";

export const createCategoryController = async (req, res) => {
    try {
        const { name } = req.body;
        const restaurantId = req.restaurant._id;
        if (!name) {
            return res.status(400).send({ message: "Name is required" });
        }

        const category = new categoryModel({
            name,
            slug: slugify(name),
            restaurantId
        });
        await category.save()

        const restaurant = await restaurantModel.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).send({ message: "Restaurant not found" });
        }

        restaurant.categories.push(category._id);
        await restaurant.save();
        return res.status(201).send({
            success: true,
            message: "New Category Created Successfully",
            category
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).send({
                success: false,
                message: "Category already exists"
            });
        }
        console.error("Error in createCategoryController:", error);
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
};

export const updateCategoryController = async (req, res) => {
    try {
        const { name } = req.body
        const { id } = req.params
        const restaurantId = req.restaurantId
        const category = await categoryModel.findByIdAndUpdate(id, { name, slug: slugify(name), restaurantId }, { new: true })
        return res.status(201).send({
            success: true,
            message: "Category has been updated successfully",
            category
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            error,
            success: false,
            message: "Error while updating category"
        })
    }
}

export const getAllCategoriesController = async (req, res) => {
    try {
        const restaurantId = req.restaurant._id
        const categories = await categoryModel.find({ restaurantId })
        categories.sort((a, b) => b.createdAt - a.createdAt)
        return res.status(200).send({
            success: true,
            message: "All Categories Fetched!",
            categories
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            error,
            success: false,
            message: "Error while updating category"
        })
    }
}

export const deleteSingleCategoryController = async (req, res) => {
    try {
        const { id } = req.params
        const category = await categoryModel.findByIdAndDelete(id)
        if (!category) {
            return res.status(404).send({
                success: false,
                message: "Category not founded to delete"
            })
        }
        return res.status(200).send({
            success: true,
            message: "Category Deleted Successfully!"
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            error,
            message: "Server Internal Issues!"
        })
    }
}