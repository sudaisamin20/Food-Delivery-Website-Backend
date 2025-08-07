import restaurantModel from "../models/restaurantModel.js";
import userModel from "../models/userModel.js";
import ownerModel from "../models/ownerModel.js";
import orderModel from "../models/orderModel.js";
import superAdminModel from "../models/superAdminModel.js";
import deliveryModel from "../models/deliveryBoyModel.js";

export const getAllRestaurantsCreationRequestsController = async (req, res) => {
    try {
        const restaurantRequests = await restaurantModel.find({ status: "Pending" }).populate("restaurantOwner")
        return res.status(200).send({ success: true, restaurantRequests })
    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
}

export const updateRestaurantStatusController = async (req, res) => {
    try {
        const { status } = req.body;
        const restaurantId = req.params.restaurantId;

        if (!restaurantId || !status) {
            return res.status(400).send({ success: false, message: "Invalid data!" });
        }

        const restaurant = await restaurantModel.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).send({ success: false, message: "Restaurant not found!" });
        }

        if (status === "Approved") {
            restaurant.status = "Approved";
            await restaurant.save();
        } else if (status === "Rejected") {
            const ownerId = restaurant.restaurantOwner;
            await restaurantModel.findByIdAndDelete(restaurantId);
            await ownerModel.findByIdAndDelete(ownerId);
        }

        return res.status(200).send({
            success: true,
            message: `Restaurant status updated to ${status} successfully!`,
        });
    } catch (error) {
        console.error("Error updating restaurant status:", error);
        res.status(500).send({
            success: false,
            message: "Internal server issue!",
        });
    }
};


export const getAllUsersController = async (req, res) => {
    try {
        const users = await userModel.find({ role: "user" }).select("-password").sort({ createdAt: -1 })
        return res.status(200).send({ success: true, users })
    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
}

export const getAllRestaurantAdminsController = async (req, res) => {
    try {
        const restaurantAdmins = await ownerModel.find({ role: "owner" }).select("-password").sort({ createdAt: -1 })
        return res.status(200).send({ success: true, restaurantAdmins })
    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
}

export const getAllDeliveryPartnersController = async (req, res) => {
    try {
        const deliveryPartners = await deliveryModel.find().select("-password").sort({ createdAt: -1 })
        return res.status(200).json({ success: true, deliveryPartners })
    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
}

export const getAllRestaurantsController = async (req, res) => {
    try {
        const restaurants = await restaurantModel.find()
            .populate({
                path: "restaurantOwner",
                select: "-password"
            })
            .sort({ createdAt: -1 })
            .populate("items").populate("categories").populate("reviews").populate({
                path: "reviews",
                populate: {
                    path: "user",
                    model: "users",
                    select: "-password",
                },
            });
        if (!restaurants) {
            return res.status(404).json({ success: false, message: "No restaurant founded in this city" })
        }
        return res.status(201).send({ success: true, message: "Founded Restaurants", restaurants })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong", success: false, error });
    }
}

export const getDashboardOverviewController = async (req, res) => {
    try {
        const totalUsers = await userModel.countDocuments({ role: "user" })
        const totalRestaurantAdmins = await ownerModel.countDocuments({ role: "owner" })
        const totalRestaurants = await restaurantModel.countDocuments()
        const pendingRestaurantsApprovals = await restaurantModel.countDocuments({ status: "Pending" })
        const totalApprovedRestaurants = await restaurantModel.countDocuments({ status: "Approved" })
        const totalPendingOrders = await orderModel.countDocuments({ status: "Pending" })
        const totalPreparingOrders = await orderModel.countDocuments({ status: "Preparing" })
        const totalOutForDeliveryOrders = await orderModel.countDocuments({ status: "Out for delivery" })
        const totalDeliveredOrders = await orderModel.countDocuments({ status: "Delivered" })
        const totalCancelledOrders = await orderModel.countDocuments({ status: "Cancelled" })
        const totalReturnedOrders = await orderModel.countDocuments({ status: "Returned" })
        const totalReadyForPickupOrders = await orderModel.countDocuments({ status: "Ready for pickup" })
        const totalOrders = await orderModel.countDocuments()
        const totalRevenue = await orderModel.aggregate([
            {
                $match: { status: "Delivered" }
            },
            {
                $project: {
                    netAmount: {
                        $max: [
                            { $subtract: ["$totalAmount", 220] },
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: { $multiply: ["$netAmount", 0.10] } }
                }
            }
        ]);
        // const totalOrdersCount = await orderModel.find({ status: "Delivered" }).select("totalAmount")
        // const totalEarnings = totalRevenue[0] ? totalRevenue[0].totalEarnings : 0
        // const totalEarningsWithoutFees = (totalEarnings * 0.1) - (totalDeliveredOrders * 200) - (totalDeliveredOrders * 20)
        return res.status(200).send({
            success: true,
            message: "Dashboard overview fetched successfully!",
            data: {
                totalUsers,
                totalRestaurantAdmins,
                totalRevenue: totalRevenue[0] ? totalRevenue[0].totalEarnings : 0,
                totalRestaurants,
                pendingRestaurantsApprovals,
                totalApprovedRestaurants,
                totalPendingOrders,
                totalPreparingOrders,
                totalOutForDeliveryOrders,
                totalDeliveredOrders,
                totalCancelledOrders,
                totalOrders,
                totalReturnedOrders,
                totalReadyForPickupOrders
            }
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
}

export const addCityController = async (req, res) => {
    try {
        let { city } = req.body;

        if (!city) {
            return res.status(400).send({ success: false, message: "City name is required!" });
        }

        const image = req.file ? req.file.filename : null;
        if (!image) {
            return res.status(400).send({ success: false, message: "City image is required!" });
        }

        const cityLower = city.toLowerCase();

        const existingCity = await superAdminModel.findOne({
            city: { $regex: new RegExp("^" + cityLower + "$", "i") }
        });

        if (existingCity) {
            return res.status(400).send({ success: false, message: "City already exists!" });
        }

        const formattedCity = cityLower.charAt(0).toUpperCase() + cityLower.slice(1);

        const newCity = new superAdminModel({
            city: formattedCity,
            image,
            createdAt: new Date(),
        });

        await newCity.save();

        return res.status(200).send({
            success: true,
            message: "City added successfully!",
            cityName: newCity.city
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
};

export const getAllCitiesController = async (req, res) => {
    try {
        const cities = await superAdminModel.find().sort({ createdAt: -1 });
        if (cities.length === 0) {
            return res.status(404).send({ success: false, message: "No cities found!" });
        }
        return res.status(200).send({ success: true, message: "Cities fetched successfully!", cities });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
}

export const getTotalCommissionController = async (req, res) => {
    try {
        const getDateRangeFilter = (range) => {
            const now = new Date();
            let fromDate;

            switch (range) {
                case "today":
                    fromDate = new Date();
                    fromDate.setHours(0, 0, 0, 0);
                    break;
                case "yesterday":
                    fromDate = new Date();
                    fromDate.setDate(fromDate.getDate() - 1);
                    fromDate.setHours(0, 0, 0, 0);
                    break;
                case "week":
                    fromDate = new Date();
                    fromDate.setDate(fromDate.getDate() - 7);
                    break;
                case "month":
                    fromDate = new Date();
                    fromDate.setMonth(fromDate.getMonth() - 1);
                    break;
                case "three_months":
                    fromDate = new Date();
                    fromDate.setMonth(fromDate.getMonth() - 3);
                    break;
                case "year":
                    fromDate = new Date();
                    fromDate.setFullYear(fromDate.getFullYear() - 1);
                    break;
                default:
                    return {};
            }

            return { createdAt: { $gte: fromDate } };
        };
        const city = req.params.city;
        const dateRange = req.params.dateRange;
        const rangeFilter = getDateRangeFilter(dateRange);

        const matchStage = {
            status: "Delivered"
        };

        if (city !== "all") {
            matchStage["restaurantDetails.city"] = city;
        }

        const baseMatch = { status: "Delivered", ...rangeFilter };

        const totalOrders = await orderModel.countDocuments(baseMatch);

        const totalAmount = await orderModel.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$totalAmount" }
                }
            }
        ]);

        const totalEarnings = totalAmount[0] ? totalAmount[0].totalEarnings : 0;
        const totalCommission = (totalEarnings * 0.1) - (totalOrders * 220);

        const restaurantCommissionDetails = await orderModel.aggregate([
            { $match: baseMatch },
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
                $match: matchStage
            },
            {
                $group: {
                    _id: "$restaurantId",
                    totalOrders: { $sum: 1 },
                    totalCommission: {
                        $sum: {
                            $multiply: [
                                { $subtract: ["$totalAmount", { $add: [200, 20] }] },
                                0.1
                            ]
                        }
                    },
                    city: { $first: "$restaurantDetails.city" },
                    restaurantName: { $first: "$restaurantDetails.name" }
                }
            }
        ]);

        return res.status(200).send({
            success: true,
            message: "Total commission fetched successfully!",
            data: {
                totalOrders,
                totalEarnings,
                totalCommission,
                commissionRate: 10,
                restaurantCommissionDetails
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
};

export const getTotalRevenueController = async (req, res) => {
    try {
        const totalRevenue = await orderModel.aggregate([
            {
                $match: { status: "Delivered" }
            },
            {
                $project: {
                    netAmount: {
                        $max: [
                            { $subtract: ["$totalAmount", 220] },
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: { $multiply: ["$netAmount", 0.10] } }
                }
            }
        ]);

        const totalDeliveredOrders = await orderModel.countDocuments({ status: "Delivered" });
        const totalCustomers = await userModel.countDocuments({ role: "user" })
        const avgOrderValue = await orderModel.aggregate([
            {
                $match: { status: "Delivered" }
            },
            {
                $group: {
                    _id: null,
                    avgOrderValue: { $avg: "$totalAmount" }
                }
            }
        ])

        const deliveryCharges = 200;
        const serviceCharges = 20;
        const commissionRate = 0.1;

        const totalDailyRevenue = await orderModel.aggregate([
            {
                $match: {
                    status: "Delivered"
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    grossRevenue: { $sum: "$totalAmount" },
                    totalDeliveredOrders: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$userId" },
                    avgOrderValue: { $avg: "$totalAmount" }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1,
                    "_id.day": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    totalDeliveredOrders: 1,
                    totalCustomers: { $size: "$uniqueUsers" },
                    avgOrderValue: 1,
                    date: {
                        $concat: [
                            { $toString: "$_id.day" },
                            "-",
                            {
                                $arrayElemAt: [
                                    ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                                    "$_id.month"
                                ]
                            },
                            "-",
                            { $toString: "$_id.year" }
                        ]
                    },
                    netRevenue: {
                        $multiply: [
                            {
                                $subtract: [
                                    "$grossRevenue",
                                    {
                                        $add: [
                                            { $multiply: [deliveryCharges, "$totalDeliveredOrders"] },
                                            { $multiply: [serviceCharges, "$totalDeliveredOrders"] }
                                        ]
                                    }
                                ]
                            },
                            commissionRate
                        ]
                    }
                }
            }
        ]);

        const totalWeeklyRevenue = await orderModel.aggregate([
            {
                $match: {
                    status: "Delivered"
                }
            },
            {
                $group: {
                    _id: {
                        isoWeek: { $isoWeek: "$createdAt" },
                        isoWeekYear: { $isoWeekYear: "$createdAt" }
                    },
                    grossRevenue: { $sum: "$totalAmount" },
                    totalDeliveredOrders: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$userId" },
                    avgOrderValue: { $avg: "$totalAmount" }
                }
            },
            {
                $sort: {
                    "_id.isoWeekYear": 1,
                    "_id.isoWeek": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    totalDeliveredOrders: 1,
                    totalCustomers: { $size: "$uniqueUsers" },
                    avgOrderValue: 1,
                    week: {
                        $concat: [
                            "Week ",
                            { $toString: "$_id.isoWeek" },
                            " of ",
                            { $toString: "$_id.isoWeekYear" }
                        ]
                    },
                    netRevenue: {
                        $multiply: [
                            {
                                $subtract: [
                                    "$grossRevenue",
                                    {
                                        $add: [
                                            { $multiply: [deliveryCharges, "$totalDeliveredOrders"] },
                                            { $multiply: [serviceCharges, "$totalDeliveredOrders"] }
                                        ]
                                    }
                                ]
                            },
                            commissionRate
                        ]
                    }
                }
            },
        ]);

        const totalMonthlyRevenue = await orderModel.aggregate([
            {
                $match: {
                    status: "Delivered"
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    grossRevenue: { $sum: "$totalAmount" },
                    totalDeliveredOrders: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$userId" },
                    avgOrderValue: { $avg: "$totalAmount" }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    totalDeliveredOrders: 1,
                    totalCustomers: { $size: "$uniqueUsers" },
                    avgOrderValue: 1,
                    month: {
                        $concat: [
                            {
                                $arrayElemAt: [
                                    [
                                        "", "January", "February", "March", "April", "May", "June",
                                        "July", "August", "September", "October", "November", "December"
                                    ],
                                    "$_id.month"
                                ]
                            },
                            " ",
                            { $toString: "$_id.year" }
                        ]
                    },
                    netRevenue: {
                        $multiply: [
                            {
                                $subtract: [
                                    "$grossRevenue",
                                    {
                                        $add: [
                                            { $multiply: [deliveryCharges, "$totalDeliveredOrders"] },
                                            { $multiply: [serviceCharges, "$totalDeliveredOrders"] }
                                        ]
                                    }
                                ]
                            },
                            commissionRate
                        ]
                    }
                }
            },
        ]);

        const totalYearlyRevenue = await orderModel.aggregate([
            {
                $match: {
                    status: "Delivered"
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" }
                    },
                    grossRevenue: { $sum: "$totalAmount" },
                    totalDeliveredOrders: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$userId" },
                    avgOrderValue: { $avg: "$totalAmount" }
                }
            },
            {
                $sort: {
                    "_id.year": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    totalDeliveredOrders: 1,
                    totalCustomers: { $size: "$uniqueUsers" },
                    avgOrderValue: 1,
                    year: { $toString: "$_id.year" },
                    netRevenue: {
                        $multiply: [
                            {
                                $subtract: [
                                    "$grossRevenue",
                                    {
                                        $add: [
                                            { $multiply: [deliveryCharges, "$totalDeliveredOrders"] },
                                            { $multiply: [serviceCharges, "$totalDeliveredOrders"] }
                                        ]
                                    }
                                ]
                            },
                            commissionRate
                        ]
                    }
                }
            },
        ]);

        return res.status(200).send({
            success: true,
            message: "Total commission fetched successfully!",
            data: {
                totalRevenue: totalRevenue[0] ? totalRevenue[0]?.totalEarnings : 0,
                totalDeliveredOrders,
                totalCustomers,
                avgOrderValue: avgOrderValue[0] ? avgOrderValue[0]?.avgOrderValue : 0,
                totalDailyRevenue,
                totalWeeklyRevenue,
                totalMonthlyRevenue,
                totalYearlyRevenue
            }
        })
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
}

export const getTotalPayoutController = async (req, res) => {
    try {
        const totalCompletedPayouts = await orderModel.aggregate([
            {
                $match: {
                    status: "Delivered",
                    payoutStatus: "Completed"
                }
            },
            {
                $addFields: {
                    commission: {
                        $multiply: [
                            { $subtract: ["$totalAmount", { $add: [200, 20] }] },
                            0.1
                        ]
                    },
                    serviceFee: 20
                }
            },
            {
                $addFields: {
                    finalPayout: {
                        $add: ["$commission", "$serviceFee"]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrdersAmount: { $sum: "$totalAmount" },
                    totalCommission: { $sum: "$commission" },
                    totalServiceFee: { $sum: "$serviceFee" },
                    totalPayoutAmount: { $sum: "$finalPayout" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalOrdersAmount: 1,
                    totalCommission: 1,
                    totalServiceFee: 1,
                    totalPayoutAmount: 1
                }
            }
        ]);

        const totalPendingPayouts = await orderModel.aggregate([
            { $match: { status: "Delivered", payoutStatus: "Pending" } },
            {
                $addFields: {
                    commission: {
                        $multiply: [
                            { $subtract: ["$totalAmount", { $add: [200, 20] }] },
                            0.1
                        ]
                    },
                    serviceFee: 20
                }
            },
            {
                $addFields: {
                    finalPayout: {
                        $add: ["$commission", "$serviceFee"]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrdersAmount: { $sum: "$totalAmount" },
                    totalCommission: { $sum: "$commission" },
                    totalServiceFee: { $sum: "$serviceFee" },
                    totalPayoutAmount: { $sum: "$finalPayout" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalOrdersAmount: 1,
                    totalCommission: 1,
                    totalServiceFee: 1,
                    totalPayoutAmount: 1
                }
            }
        ]);

        const totalOrders = await orderModel.countDocuments({ status: "Delivered" });
        const successfulOrders = await orderModel.countDocuments({
            status: "Delivered",
            payoutStatus: "Completed"
        });

        const successRate = totalOrders === 0 ? 0 : (successfulOrders / totalOrders) * 100;

        const baseMatch = {
            status: "Delivered",
        };

        const rawPayouts = await orderModel.aggregate([
            { $match: baseMatch },
            {
                $addFields: {
                    commission: {
                        $multiply: [
                            { $subtract: ["$totalAmount", { $add: [200, 20] }] },
                            0.1
                        ]
                    },
                    serviceFee: 20
                }
            },
            {
                $addFields: {
                    finalPayout: {
                        $add: ["$commission", "$serviceFee"]
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateTrunc: { date: "$createdAt", unit: "day" }
                    },
                    totalAmount: { $sum: "$finalPayout" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const totalPayoutsByDate = rawPayouts.map(payout => ({
            date: new Date(payout._id).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric"
            }),
            totalAmount: payout.totalAmount
        }));

        const totalPendingPayoutsRestaurants = await orderModel.aggregate([
            {
                $match: {
                    status: "Delivered",
                    payoutStatus: "Pending"
                }
            },
            {
                $addFields: {
                    commission: {
                        $multiply: [
                            { $subtract: ["$totalAmount", { $add: [200, 20] }] },
                            0.1
                        ]
                    },
                    serviceFee: 20
                }
            },
            {
                $addFields: {
                    finalPayout: {
                        $add: ["$commission", "$serviceFee"]
                    }
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
                $group: {
                    _id: "$restaurantId",
                    restaurantName: { $first: "$restaurantDetails.name" },
                    totalOrdersAmount: { $sum: "$finalPayout" },
                    orderCount: { $sum: 1 },
                    status: { $first: "$payoutStatus" },
                }
            },
            {
                $project: {
                    _id: 0,
                    restaurantId: "$_id",
                    restaurantName: 1,
                    orderCount: 1,
                    totalOrdersAmount: 1,
                    status: 1,
                }
            }
        ]);

        const totalPayoutsHistory = await orderModel.aggregate([
            {
                $match: {
                    status: "Delivered",
                    payoutStatus: { $ne: "Pending" }
                }
            },
            {
                $addFields: {
                    commission: {
                        $multiply: [
                            { $subtract: ["$totalAmount", { $add: [200, 20] }] },
                            0.1
                        ]
                    },
                    serviceFee: 20
                }
            },
            {
                $addFields: {
                    finalPayout: {
                        $add: ["$commission", "$serviceFee"]
                    }
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
                $group: {
                    _id: "$restaurantId",
                    restaurantName: { $first: "$restaurantDetails.name" },
                    totalOrdersAmount: { $sum: "$finalPayout" },
                    orderCount: { $sum: 1 },
                    status: { $first: "$payoutStatus" },
                    paidAt: { $first: "$paidAt" }
                }
            },
            {
                $project: {
                    _id: 0,
                    restaurantId: "$_id",
                    restaurantName: 1,
                    orderCount: 1,
                    totalOrdersAmount: 1,
                    status: 1,
                    paidAt: 1
                }
            }
        ])

        return res.status(200).send({
            success: true,
            data: {
                totalCompletedPayouts: totalCompletedPayouts[0] ? totalCompletedPayouts[0].totalPayoutAmount : 0,
                totalPendingPayouts: totalPendingPayouts[0] ? totalPendingPayouts[0].totalPayoutAmount : 0,
                successRate,
                totalPayoutsByDate,
                totalPendingPayoutsRestaurants,
                totalPayoutsHistory,
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: "Internal server issue!"
        });
    }
};

export const checkSuperAdminController = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId)
        if (user.role !== "superadmin") {
            return res.status(401).send({ message: "Please login as user account!", success: false })
        }
        return res.status(200).send({ ok: true })
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}

export const completePayoutNowController = async (req, res) => {
    try {
        const restaurant = await orderModel.updateMany(
            { restaurantId: req.body.restaurantId },
            { $set: { paidAt: Date.now(), payoutStatus: "Completed" } }
        )
        return res.status(200).send({ success: true, message: "Restaurant payout completed", restaurant })
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Server Internal issues!", error: error })
    }
}