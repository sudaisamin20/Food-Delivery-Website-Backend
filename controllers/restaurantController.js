import restaurantModel from "../models/restaurantModel.js";
import ownerModel from "../models/ownerModel.js";
import orderModel from "../models/orderModel.js";
import itemModel from "../models/itemModel.js";
import reviewModel from "../models/reviewModel.js";
import categoryModel from "../models/categoryModel.js";
import mongoose from "mongoose";

export const createRestaurantController = async (req, res) => {
    try {
        const { name, description, openingTime, closingTime, cuisines, address, restaurantOwner, phoneno, city } = req.body;
        const image = req.file.filename
        if (!name) {
            return res.send({ success: false, message: "Restaurant Name is required" })
        }
        if (!req.file) {
            return res.send({ success: false, message: "Restaurant image is required" })
        }
        if (!description) {
            return res.send({ success: false, message: "Description is required" })
        }
        if (!openingTime) {
            return res.send({ success: false, message: "Opening Time is required" })
        }
        if (!closingTime) {
            return res.send({ success: false, message: "Closing Time is required" })
        }
        if (!cuisines) {
            return res.send({ success: false, message: "Cuisines are required" })
        }
        if (!address) {
            return res.send({ success: false, message: "Address is required" })
        }
        if (!phoneno) {
            return res.send({ success: false, message: "Phone No is required" })
        }
        if (!city) {
            return res.send({ success: false, message: "City is required" })
        }

        const owner = await ownerModel.findById(restaurantOwner);
        if (!owner) {
            return res.status(404).json({ message: "Owner not found", success: false });
        }

        const restaurant = new restaurantModel({
            name,
            description,
            openingTime,
            closingTime,
            image,
            phoneno,
            cuisines,
            address,
            city,
            restaurantOwner
        });

        await restaurant.save();

        owner.restaurantId = restaurant._id;
        await owner.save();

        res.status(201).json({ message: "Restaurant Created Successfully", success: true, restaurant });
    } catch (error) {
        console.error("Error creating restaurant:", error);
        res.status(500).json({ message: "Something went wrong", success: false, error });
    }
};

export const fetchRestaurantController = async (req, res) => {
    const { id } = req.params
    try {
        const restaurant = await restaurantModel.findById(id)
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found", success: false });
        }
        return res.status(201).send({
            success: true,
            message: "Restaurant Founded",
            restaurant
        })
    } catch (error) {
        console.error("Error creating restaurant:", error);
        res.status(500).json({ message: "Something went wrong", success: false, error });
    }
}

export const manageRestaurantController = async (req, res) => {
    const { id } = req.params
    const { name, description, openingTime, closingTime, cuisines, address, city } = req.body
    try {
        let updateData = { name, description, openingTime, closingTime, cuisines, address, city }
        if (req.file) {
            updateData.image = req.file.filename;
        }
        const restaurant = await restaurantModel.findByIdAndUpdate(id, updateData, { new: true })
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" })
        }
        return res.status(201).send({
            success: true,
            message: "Restaurant Info updated successfully",
            restaurant: restaurant
        })
    } catch (error) {
        console.error("Error creating restaurant:", error);
        res.status(500).json({ message: "Something went wrong", success: false, error });
    }
}

export const getCityAllRestaurantsController = async (req, res) => {
    const { city } = req.params;

    try {
        const restaurants = await restaurantModel.find({ city })

        if (!restaurants || restaurants.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No restaurants found in this city"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Found Restaurants",
            restaurants,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error,
        });
    }
};


export const getSearchRestaurantController = async (req, res) => {
    const { city, searchRestaurant } = req.params
    try {
        const restaurants = await restaurantModel.find({ city, name: { $regex: searchRestaurant, $options: "i" } })
        if (!restaurants) {
            return res.status(404).json({ success: false, message: "No restaurant founded in this city" })
        }
        return res.status(201).send({ success: true, message: "Founded Restaurants", restaurants })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong", success: false, error });
    }
}

export const getCityFilteredRestaurantsController = async (req, res) => {
    const { city, sortBy } = req.params
    try {
        let restaurants = await restaurantModel.find({ city })
        if (sortBy === "rating") {
            restaurants.sort((a, b) => b.averageRestaurantRating - a.averageRestaurantRating)
            return res.status(200).send({ success: true, message: "All filtered restaurants by rating", restaurants })
        } else if (sortBy === "reviews") {
            restaurants.sort((a, b) => b.reviews?.length - a.reviews?.length)
            return res.status(200).send({ success: true, message: "All filtered restaurants by reviews", restaurants })
        } else {
            return res.status(200).json({
                success: true,
                message: "All filtered restaurants without sorting",
                restaurants
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong", success: false, error });
    }
}

export const checkRestaurantCreationStatusController = async (req, res) => {
    try {
        const restaurant = await restaurantModel.findById(req.params.restaurantId)
        if (!restaurant) {
            return res.status(404).send({ success: false, message: "Restaurant not founded" })
        }
        return res.status(200).send({ success: true, status: restaurant.status, restaurant })
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", success: false, error });
    }
}

export const getPopularRestaurantsController = async (req, res) => {
    try {
        const { city } = req.params;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 40);

        const popularRestaurants = await orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $lookup: {
                    from: "restaurants",
                    localField: "restaurantId",
                    foreignField: "_id",
                    as: "restaurantDetails"
                }
            },
            { $unwind: "$restaurantDetails" },
            {
                $match: {
                    "restaurantDetails.city": {
                        $regex: new RegExp(`^${city}$`, "i")
                    }
                }
            },
            {
                $group: {
                    _id: "$restaurantId",
                    totalOrders: { $sum: 1 },
                    restaurantDetails: { $first: "$restaurantDetails" }
                }
            },
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "restaurant",
                    as: "reviews"
                }
            },
            {
                $addFields: {
                    totalReviews: { $size: "$reviews" },
                    averageRating: {
                        $cond: [
                            { $gt: [{ $size: "$reviews" }, 0] },
                            { $avg: "$reviews.restaurantRating" },
                            0
                        ]
                    },
                    score: {
                        $multiply: [
                            "$totalOrders",
                            {
                                $cond: [
                                    { $gt: [{ $size: "$reviews" }, 0] },
                                    { $avg: "$reviews.restaurantRating" },
                                    1
                                ]
                            }
                        ]
                    }
                }
            },
            { $sort: { score: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 0,
                    restaurantId: "$_id",
                    name: "$restaurantDetails.name",
                    image: "$restaurantDetails.image",
                    address: "$restaurantDetails.address",
                    cuisines: "$restaurantDetails.cuisines",
                    city: "$restaurantDetails.city",
                    totalOrders: 1,
                    averageRating: 1,
                    totalReviews: 1,
                    score: 1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            message: "Popular Restaurants",
            popularRestaurants
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something went wrong",
            success: false,
            error
        });
    }
};

export const getRestaurantDashboardOverviewController = async (req, res) => {
    try {
        const restaurantId = req.params.restaurantId;
        const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);

        const [
            totalMenuItems,
            totalOrders,
            restaurant,
            totalReviews,
            totalCategories,
            pendingOrders,
            preparingOrders,
            outForDeliveryOrders,
            deliveredOrders,
            cancelledOrders,
            returnedOrders
        ] = await Promise.all([
            itemModel.countDocuments({ restaurantId }),
            orderModel.countDocuments({ restaurantId }),
            restaurantModel.findById(restaurantId),
            reviewModel.countDocuments({ restaurant: restaurantId }),
            categoryModel.countDocuments({ restaurantId }),
            orderModel.countDocuments({ restaurantId, status: "Pending" }),
            orderModel.countDocuments({ restaurantId, status: "Preparing" }),
            orderModel.countDocuments({ restaurantId, status: "Out for delivery" }),
            orderModel.countDocuments({ restaurantId, status: "Delivered" }),
            orderModel.countDocuments({ restaurantId, status: "Cancelled" }),
            orderModel.countDocuments({ restaurantId, status: "Returned" }),
        ]);
        const totalEarnings = await orderModel.aggregate([
            { $match: { restaurantId: restaurantObjectId, status: "Delivered" } },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$totalAmount" }
                }
            }
        ]);

        const totalUsers = await orderModel.aggregate([
            { $match: { restaurantId: restaurantObjectId } },
            {
                $group: {
                    _id: "$userId",
                    totalCustomers: { $sum: 1 }
                }
            }
        ]);
        const now = new Date();
        const daily = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekly = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthly = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [dailyOrders, weeklyOrders, monthlyOrders] = await Promise.all([
            orderModel.aggregate([
                { $match: { restaurantId: restaurantObjectId, createdAt: { $gte: daily }, status: "Delivered" } },
                { $group: { _id: null, totalOrders: { $sum: 1 } } }
            ]),
            orderModel.aggregate([
                { $match: { restaurantId: restaurantObjectId, createdAt: { $gte: weekly }, status: "Delivered" } },
                { $group: { _id: null, totalOrders: { $sum: 1 } } }
            ]),
            orderModel.aggregate([
                { $match: { restaurantId: restaurantObjectId, createdAt: { $gte: monthly }, status: "Delivered" } },
                { $group: { _id: null, totalOrders: { $sum: 1 } } }
            ]),
        ]);

        const deliveryCharges = 200;
        const serviceCharges = 20;
        const commission = 0.1;

        const totalDeliveryCharges = deliveredOrders * deliveryCharges;
        const totalServiceCharges = deliveredOrders * serviceCharges;
        const totalGrossEarnings = totalEarnings[0]?.totalEarnings || 0;

        const commissionBase = totalGrossEarnings - totalDeliveryCharges - totalServiceCharges;
        const commissionCharges = commissionBase * commission;
        const totalEarningsWithoutFees = commissionBase - commissionCharges;

        const result = await orderModel.aggregate([
            {
                $match: {
                    restaurantId: restaurantObjectId,
                    status: "Delivered",
                    payoutStatus: "Completed"
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalAmount" },
                    payoutDeliveredOrders: { $sum: 1 }
                }
            },
        ]);
        const { totalAmount, payoutDeliveredOrders } = result[0] || { totalAmount: 0, payoutDeliveredOrders: 0 };

        const totalPayoutPaid = result.length > 0 ? (serviceCharges * payoutDeliveredOrders) +
            ((totalAmount - (deliveryCharges * payoutDeliveredOrders + serviceCharges * payoutDeliveredOrders)) * commission) : 0;

        const totalPayoutRemaining = await orderModel.aggregate([
            {
                $match: {
                    restaurantId: restaurantObjectId,
                    status: "Delivered",
                    payoutStatus: "Pending"
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmountPending: { $sum: "$totalAmount" },
                    pendingPayoutDeliveredOrders: { $sum: 1 }
                }
            },
        ]);
        const { totalAmountPending, pendingPayoutDeliveredOrders } = totalPayoutRemaining[0] || { totalAmountPending: 0, pendingPayoutDeliveredOrders: 0 };


        const totalPayoutRemainingAmount = result.length > 0 ? (serviceCharges * pendingPayoutDeliveredOrders) +
            ((totalAmountPending - (deliveryCharges * pendingPayoutDeliveredOrders + serviceCharges * pendingPayoutDeliveredOrders)) * commission) : 0
        // {
        //     $project: {
        //         _id: 0,
        //         totalPayout: {
        //             $subtract: [
        //                 "$totalAmount",
        //                 {
        //                     $add: [
        //                         deliveryCharges * deliveredOrders,
        //                         serviceCharges * deliveredOrders,
        //                         {
        //                             $multiply: [
        //                                 { $subtract: ["$totalAmount", deliveryCharges * deliveredOrders + serviceCharges * deliveredOrders] },
        //                                 commission
        //                             ]
        //                         }
        //                     ]
        //                 }
        //             ]
        //         }
        //     }
        // }
        // {
        //     $group: {
        //         _id: null,
        //         totalPayout: {
        //             $sum: {
        //                 $subtract: [
        //                     "$totalAmount",
        //                     {
        //                         $add: [
        //                             deliveryCharges,
        //                             serviceCharges,
        //                             {
        //                                 $multiply: [
        //                                     { $subtract: ["$totalAmount", deliveryCharges + serviceCharges] },
        //                                     commission
        //                                 ]
        //                             }
        //                         ]
        //                     }
        //                 ]
        //             }
        //         }
        //     }
        // }

        const commissionAggregationLogic = {
            $sum: {
                $subtract: [
                    "$totalAmount",
                    {
                        $add: [
                            220,
                            {
                                $multiply: [
                                    { $subtract: ["$totalAmount", 220] },
                                    0.10
                                ]
                            }
                        ]
                    }
                ]
            }
        };

        const weeklyRevenue = await orderModel.aggregate([
            {
                $match: {
                    restaurantId: restaurantObjectId,
                    createdAt: { $gte: restaurant?.createdAt },
                    status: "Delivered"
                }
            },
            {
                $addFields: {
                    dayOfMonth: { $dayOfMonth: "$createdAt" },
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" },
                    dayOfWeek: { $isoDayOfWeek: "$createdAt" }
                }
            },
            {
                $addFields: {
                    weekOfMonth: {
                        $ceil: { $divide: ["$dayOfMonth", 7] }
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: "$year",
                        month: "$month",
                        weekOfMonth: "$weekOfMonth",
                        dayOfWeek: "$dayOfWeek"
                    },
                    totalRevenue: commissionAggregationLogic
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1,
                    "_id.weekOfMonth": 1,
                    "_id.dayOfWeek": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    day: {
                        $concat: [
                            {
                                $arrayElemAt: [
                                    ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                                    "$_id.dayOfWeek"
                                ]
                            },
                            " - Week ",
                            { $toString: "$_id.weekOfMonth" },
                            " of ",
                            {
                                $arrayElemAt: [
                                    ["", "January", "February", "March", "April", "May", "June",
                                        "July", "August", "September", "October", "November", "December"],
                                    "$_id.month"
                                ]
                            },
                            " ",
                            { $toString: "$_id.year" }
                        ]
                    },
                    totalRevenue: 1
                }
            }
        ]);

        const monthlyRevenue = await orderModel.aggregate([
            {
                $match: {
                    restaurantId: restaurantObjectId,
                    createdAt: { $gte: restaurant.createdAt },
                    status: "Delivered"
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        weekOfMonth: {
                            $ceil: { $divide: [{ $dayOfMonth: "$createdAt" }, 7] }
                        }
                    },
                    totalRevenue: commissionAggregationLogic
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.weekOfMonth": 1 } },
            {
                $project: {
                    _id: 0,
                    week: {
                        $concat: [
                            "Week ",
                            { $toString: "$_id.weekOfMonth" },
                            " of ",
                            {
                                $arrayElemAt: [
                                    ["", "January", "February", "March", "April", "May", "June",
                                        "July", "August", "September", "October", "November", "December"],
                                    "$_id.month"
                                ]
                            },
                            " ",
                            { $toString: "$_id.year" }
                        ]
                    },
                    totalRevenue: 1
                }
            }
        ]);

        const yearlyRevenue = await orderModel.aggregate([
            {
                $match: {
                    restaurantId: restaurantObjectId,
                    createdAt: {
                        $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
                    },
                    status: "Delivered"
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalRevenue: commissionAggregationLogic
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            {
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            {
                                $arrayElemAt: [
                                    ["", "January", "February", "March", "April", "May", "June",
                                        "July", "August", "September", "October", "November", "December"],
                                    "$_id.month"
                                ]
                            },
                            " ",
                            { $toString: "$_id.year" }
                        ]
                    },
                    totalRevenue: 1
                }
            }
        ]);

        return res.status(200).send({
            success: true,
            data: {
                totalMenuItems,
                totalOrders,
                averageRestaurantRating: restaurant.averageRestaurantRating,
                totalReviews,
                totalCategories,
                totalRevenue: totalGrossEarnings,
                totalUsers: totalUsers.length,
                dailyOrders: dailyOrders[0]?.totalOrders || 0,
                weeklyOrders: weeklyOrders[0]?.totalOrders || 0,
                monthlyOrders: monthlyOrders[0]?.totalOrders || 0,
                pendingOrders,
                preparingOrders,
                outForDeliveryOrders,
                deliveredOrders,
                cancelledOrders,
                returnedOrders,
                totalDeliveryCharges,
                totalServiceCharges,
                commissionCharges,
                totalEarningsWithoutFees,
                weeklyRevenue,
                monthlyRevenue,
                yearlyRevenue,
                totalPayoutPaid,
                totalPayoutRemainingAmount
            },
            message: "Restaurant overview fetched successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong", success: false, error });
    }
}
