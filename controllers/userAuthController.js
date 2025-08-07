import jwt from "jsonwebtoken"
import userModel from "../models/userModel.js"
import bcrypt from "bcryptjs"
import orderModel from "../models/orderModel.js"

export const registerController = async (req, res) => {
    try {
        const { fullname, email, phoneno, password } = req.body
        if (!fullname) {
            return res.send({ success: false, message: "Full Name is required" })
        }
        if (!email) {
            return res.send({ success: false, message: "Email is required" })
        }
        if (!phoneno) {
            return res.send({ success: false, message: "Phone No is required" })
        }
        if (!password) {
            return res.send({ success: false, message: "Password is required" })
        }

        const existingUserEmail = await userModel.findOne({ email })
        if (existingUserEmail) {
            return res.status(400).send({ success: false, message: "User with this email already exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = new userModel({
            fullname,
            email,
            phoneno,
            password: hashedPassword
        })
        const payload = {
            user: {
                _id: user._id
            }
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY)
        await user.save()
        res.status(201).send({
            token, success: true, message: "User Registered Successfully",
            user: { id: user._id, fullname, email, phoneno, role: user.role }
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "server internal issues!", success: false, error })
    }
}

export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email) {
            return res.send({ success: false, error: "Email is required" })
        }
        if (!password) {
            return res.send({ success: false, error: "Password is required" })
        }
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(404).send({ success: false, message: "Invalid Email or Password! Please login with correct credentials." })
        }
        const isMatched = await bcrypt.compare(password, user.password)
        if (!isMatched) {
            return res.status(404).send({ success: false, message: "Invalid Email or Password! Please login with correct credentials." })
        }
        const payload = {
            user: {
                id: user._id
            }
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY)
        return res.status(200).send({
            success: true, message: "User has been logged in", token, user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                phoneno: user.phoneno,
                role: user.role
            }
        })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const getUserProfileController = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId).select("-password")
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" })
        }
        res.status(200).send({ success: true, user })
    } catch (error) {
        console.log(error); res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const updateUserProfileController = async (req, res) => {
    const { fullname, email, phoneno, currentPassword, newPassword } = req.body;
    try {
        const user = await userModel.findById(req.userId);
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" });
        }

        if (fullname) {
            user.fullname = fullname;
        }

        if (email) {
            const existingUserEmail = await userModel.findOne({ email });
            if (existingUserEmail && existingUserEmail._id.toString() !== user._id.toString()) {
                return res.status(400).send({ success: false, message: "User with this email already exists" });
            }
            user.email = email;
        }

        if (phoneno) {
            user.phoneno = phoneno
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).send({ success: false, message: "Current password is required to set a new password" });
            }

            const isMatched = await bcrypt.compare(currentPassword, user.password);
            if (!isMatched) {
                return res.status(401).send({ success: false, message: "Invalid current password" });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }
        await user.save();
        return res.status(200).send({ success: true, message: "Profile updated", user });

    } catch (error) {
        console.log(error);
        return res.status(500).send({ success: false, message: "Internal server error", error });
    }
}


export const uploadUserProfileImageController = async (req, res) => {
    const profileImage = req.file.filename
    try {
        const user = await userModel.findById(req.userId)
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" })
        }
        user.profileImage = profileImage
        await user.save()
        return res.status(200).send({ success: true, message: "Profile image uploaded", user })
    } catch (error) {
        console.log(error); res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const getUsersController = async (req, res) => {
    try {
        const users = await userModel.find().select("-password")
        res.status(200).send({ success: true, users })
    } catch (error) {
        console.log(error); res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const deleteUserController = async (req, res) => {
    try {
        const user = await userModel.findById(req.params.id)
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" })
        }
        await user.remove()
        res.status(200).send({ success: true, message: "User Deleted Successfully" })
    } catch (error) {
        console.log(error); res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const addToFavoriteRestaurantController = async (req, res) => {
    try {
        const { userId, restaurantId, link } = req.body
        const user = await userModel.findById(userId).select("-password")
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" })
        }
        if (user.favoriteRestaurants.includes(restaurantId)) {
            return res.status(400).send({ success: false, message: "Restaurant already in favorites" })
        }
        user.favoriteRestaurants.push({ restaurant: restaurantId, addedAt: new Date(), link })
        await user.save()
        res.status(200).send({
            success: true,
            message: "Restaurant added to favorites",
            favoriteRestaurants: user.favoriteRestaurants.map(res => res.restaurant)
        })
    } catch (error) {
        console.log(error); res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const removeFromFavoriteRestaurantController = async (req, res) => {
    try {
        const { restaurantId } = req.params
        const user = await userModel.findByIdAndUpdate(
            req.userId,
            { $pull: { favoriteRestaurants: { restaurant: restaurantId } } },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" });
        }
        res.status(200).send({ success: true, message: "Restaurant removed from favorites", favoriteRestaurants: user.favoriteRestaurants.map(res => res.restaurant) })
    } catch (error) {
        console.log(error); res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const getFavoriteRestaurantsController = async (req, res) => {
    try {
        const restaurant = await userModel.findById(req.userId).populate({ path: "favoriteRestaurants.restaurant" });
        if (!restaurant) {
            return res.status(404).send({ success: false, message: "restaurant not found" })
        }
        const sortedFavorites = restaurant.favoriteRestaurants.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        res.status(200).send({
            success: true,
            favoriteRestaurants: restaurant.favoriteRestaurants.map(res => res.restaurant._id),
            favoriteRestaurantsData: restaurant.favoriteRestaurants.map(res => res.restaurant),
            link: restaurant.favoriteRestaurants.map(link => link.link)
        })
    } catch (error) {
        console.log(error); res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const addToFavoriteItemController = async (req, res) => {
    try {

        const user = await userModel.findById(req.userId)
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" })
        }
        const { itemId, link } = req.body
        if (user.favoriteItems.includes(itemId)) {
            return res.status(400).send({ success: false, message: "Item already in favorites" })
        }
        user.favoriteItems.push({ item: itemId, addedAt: new Date(), link })
        await user.save()
        res.status(200).send({ success: true, message: "Item added to favorites", favoriteItems: user.favoriteItems.map(item => item.item) })
    } catch (error) {
        console.log(error); res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const removeFromFavoriteItemController = async (req, res) => {
    try {
        const { itemId } = req.params
        const user = await userModel.findByIdAndUpdate(
            req.userId,
            { $pull: { favoriteItems: { item: itemId } } },
            { new: true }
        ).select("-password");
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" })
        }
        res.status(200).send({ success: true, message: "Item removed from favorites", favoriteItems: user.favoriteItems.map(item => item.item) })
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const getFavoriteItemsController = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId).populate({
            path: "favoriteItems.item",
            populate: [
                { path: "category" },
                { path: "restaurantId" }
            ],
        });
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" })
        }
        const sortedFavorites = user.favoriteItems.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

        res.status(200).send({
            success: true,
            favoriteItems: user.favoriteItems.map(item => item.item._id),
            favoriteItemsData: user.favoriteItems.map(item => item.item),
            link: user.favoriteItems.map(item => item?.link)
        })
    }
    catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const checkUserController = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId)
        if (user.role === "superadmin" || user.role === "owner") {
            return res.status(401).send({ message: "Please login as user account!", success: false })
        }
        res.status(200).send({ ok: true })
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const checkOrderController = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId)
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" })
        }
        const userOrder = await orderModel.find({ userId: req.userId, _id: req.params.orderId })
        if (!userOrder) {
            return res.status(404).send({ success: false, message: "Order not found" })
        }
        res.status(200).send({ success: true, userOrder })
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}
