import mongoose from "mongoose";
import deliveryBoyModel from "../models/deliveryBoyModel.js";
import orderModel from "../models/orderModel.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const registerDeliveryBoy = async (req, res) => {
    try {
        const { fullname, cnicno, dob, phoneno, email, password, address, city, numberPlate, gender, vehicleType, licenseNo, licenseExpiry } = req.body;
        const picture = req.file.filename;
        if (!fullname || !cnicno || !dob || !phoneno || !email || !password || !address || !city || !numberPlate || !gender || !vehicleType || !licenseNo || !licenseExpiry || !picture) {
            return res.status(400).json({ success: false, message: "Please fill all the fields" });
        }
        const existingDeliveryBoy = await deliveryBoyModel.findOne({ email });
        if (existingDeliveryBoy) {
            return res.status(400).json({ success: false, message: "Delivery Boy already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newDeliveryBoy = new deliveryBoyModel({
            fullname,
            cnicno,
            dob,
            phoneno,
            email,
            password: hashedPassword,
            address,
            city,
            numberPlate,
            gender,
            vehicleType,
            licenseNo,
            licenseExpiry,
            picture
        });
        await newDeliveryBoy.save();

        const payload = {
            deliveryBoy: {
                id: newDeliveryBoy._id
            }
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);

        res.status(201).json({
            message: "Delivery boy registered successfully", success: true, deliveryBoy: {
                id: newDeliveryBoy._id,
                fullname: newDeliveryBoy.fullname,
                cnicno: newDeliveryBoy.cnicno,
                dob: newDeliveryBoy.dob,
                phoneno: newDeliveryBoy.phoneno,
                email: newDeliveryBoy.email,
                address: newDeliveryBoy.address,
                city: newDeliveryBoy.city,
                numberPlate: newDeliveryBoy.numberPlate,
                gender: newDeliveryBoy.gender,
                vehicleType: newDeliveryBoy.vehicleType,
                licenseNo: newDeliveryBoy.licenseNo,
                licenseExpiry: newDeliveryBoy.licenseExpiry,
                picture: newDeliveryBoy.picture
            },
            token
        });
    } catch (error) {
        console.error("Error registering delivery boy:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const loginDeliveryBoyController = async (req, res) => {
    try {
        const { cnicno, email, password } = req.body;
        if (!cnicno || !email || !password) {
            return res.status(400).json({ success: false, message: "Please fill all the fields" });
        }
        const deliveryBoy = await deliveryBoyModel.findOne({ cnicno, email });
        if (!deliveryBoy) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, deliveryBoy.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        const payload = {
            deliveryBoy: {
                id: deliveryBoy._id
            }
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);
        res.status(200).json({
            success: true,
            message: "Login Successful",
            deliveryBoy: {
                id: deliveryBoy._id,
                fullname: deliveryBoy.fullname,
                cnicno: deliveryBoy.cnicno,
                dob: deliveryBoy.dob,
                phoneno: deliveryBoy.phoneno,
                email: deliveryBoy.email,
                address: deliveryBoy.address,
                city: deliveryBoy.city,
                numberPlate: deliveryBoy.numberPlate,
                gender: deliveryBoy.gender,
                vehicleType: deliveryBoy.vehicleType,
                licenseNo: deliveryBoy.licenseNo,
                licenseExpiry: deliveryBoy.licenseExpiry,
                picture: deliveryBoy.picture
            },
            token
        });
    } catch (error) {
        console.error("Error logging while logging in delivery boy:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getDeliveryBoyDataController = async (req, res) => {
    try {
        const { deliveryBoyId } = req.params;
        const deliveryBoy = await deliveryBoyModel.findById(deliveryBoyId).select("-password");
        if (!deliveryBoy) {
            return res.status(404).json({ success: false, message: "Delivery not found" });
        }
        res.status(200).json({ success: true, deliveryBoyData: deliveryBoy });
    } catch (error) {
        console.error("Error while fetching delivery boy data:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const updateProfileInfoController = async (req, res) => {
    try {
        const { deliveryBoyId } = req.params;
        const {
            fullname, cnicno, dob, phoneno, email, address, city, numberPlate,
            gender, vehicleType, licenseNo, licenseExpiry,
            currentPassword, newPassword
        } = req.body;

        if (!fullname || !cnicno || !dob || !phoneno || !email || !address || !city || !numberPlate || !gender || !vehicleType || !licenseNo || !licenseExpiry) {
            return res.status(400).json({ success: false, message: "Please fill all the fields" });
        }

        const deliveryBoy = await deliveryBoyModel.findById(deliveryBoyId);
        if (!deliveryBoy) {
            return res.status(404).json({ success: false, message: "Delivery boy not found" });
        }

        const updateData = {
            fullname, cnicno, dob, phoneno, email, address, city,
            numberPlate, gender, vehicleType, licenseNo, licenseExpiry,
        };

        if (newPassword && currentPassword) {
            const isMatch = await bcrypt.compare(currentPassword, deliveryBoy.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Current password is incorrect" });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
        } else if (newPassword || currentPassword) {
            return res.status(400).json({ success: false, message: "Both current and new passwords are required to change password" });
        }

        if (req.file && req.file.filename) {
            updateData.picture = req.file.filename;
        }

        const updatedDeliveryBoy = await deliveryBoyModel.findByIdAndUpdate(
            deliveryBoyId,
            updateData,
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Delivery profile updated successfully",
            deliveryBoyData: updatedDeliveryBoy,
        });
    } catch (error) {
        console.error("Error while updating profile info:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getAllCityOrders = async (req, res) => {
    try {
        const { city } = req.params;

        const orders = await orderModel.aggregate([
            {
                $lookup: {
                    from: "restaurants",
                    localField: "restaurantId",
                    foreignField: "_id",
                    as: "restaurant"
                }
            },
            { $unwind: "$restaurant" },
            {
                $match: {
                    "restaurant.city": { $regex: new RegExp(city, "i") }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" }
        ]);

        if (!orders.length) {
            return res.status(404).json({ success: false, message: "No orders found for this city" });
        }

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching orders by city:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const acceptOrderController = async (req, res) => {
    try {
        const { orderId } = req.params
        const { status, deliveryBoyId } = req.body
        const order = await orderModel.findById(orderId)
        if (!order) {
            return res.status(404).send({ success: false, message: "Order not found" })
        }
        if (order.deliveryBoyId) {
            return res.status(404).send({ success: false, message: "Order already accepted" })
        }
        order.status = status;
        order.acceptStatus = "Accepted";
        order.acceptAt = new Date();
        order.deliveryBoyId = deliveryBoyId;
        order.save()
        return res.status(201).send({ success: true, message: "Order is accepted" })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order'
        });
    }
}

export const orderDeliveredController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        order.status = status;
        order.deliveredAt = new Date();
        await order.save();

        res.status(200).json({ success: true, message: "Order delivered successfully" });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const returnOrderController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        order.status = status;
        order.returnedAt = new Date();
        await order.save();

        res.status(200).json({ success: true, message: "Order returned to the resturant" });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getDeliveryBoyDashboardOverviewController = async (req, res) => {
    try {
        const { deliveryBoyId } = req.params;
        const deliveryBoyIdObjectId = new mongoose.Types.ObjectId(deliveryBoyId);

        const totalEarnings = await orderModel.aggregate([
            {
                $match: {
                    deliveryBoyId: deliveryBoyIdObjectId,
                    status: "Delivered",
                    acceptStatus: "Accepted",
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                },
            },
            {
                $addFields: {
                    totalEarnings: { $multiply: ["$count", 200] },
                },
            },
        ]);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const dailyDeliveries = await orderModel.countDocuments({
            deliveryBoyId: deliveryBoyIdObjectId,
            status: "Delivered",
            acceptStatus: "Accepted",
            deliveredAt: { $gte: todayStart, $lte: todayEnd }
        });

        const now = new Date();
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weeklyDeliveries = await orderModel.countDocuments({
            deliveryBoyId: deliveryBoyIdObjectId,
            status: "Delivered",
            acceptStatus: "Accepted",
            deliveredAt: { $gte: weekStart, $lte: weekEnd }
        });

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const monthlyDeliveries = await orderModel.countDocuments({
            deliveryBoyId: deliveryBoyIdObjectId,
            status: "Delivered",
            acceptStatus: "Accepted",
            deliveredAt: { $gte: monthStart, $lte: monthEnd }
        });

        const totalDeliveries = await orderModel.countDocuments({
            deliveryBoyId: deliveryBoyIdObjectId,
            status: "Delivered",
            acceptStatus: "Accepted",
        });

        const totalInProgressDeliveries = await orderModel.countDocuments({
            deliveryBoyId: deliveryBoyIdObjectId,
            status: "Out for delivery",
            acceptStatus: "Accepted",
        });

        const totalDeliveredDeliveries = await orderModel.countDocuments({
            deliveryBoyId: deliveryBoyIdObjectId,
            status: "Delivered",
            acceptStatus: "Accepted",
        });

        const totalCancelledDeliveries = await orderModel.countDocuments({
            deliveryBoyId: deliveryBoyIdObjectId,
            status: "Cancelled",
            acceptStatus: "Accepted",
        });

        const totalReturnedDeliveries = await orderModel.countDocuments({
            deliveryBoyId: deliveryBoyIdObjectId,
            status: "Returned",
            acceptStatus: "Accepted",
        });

        const totalCompletedDeliveries = await orderModel.countDocuments({
            deliveryBoyId: deliveryBoyIdObjectId,
            status: "Delivered",
            acceptStatus: "Accepted",
        });
        const totalAcceptedDeliveries = await orderModel.countDocuments({
            deliveryBoyId: deliveryBoyIdObjectId,
            acceptStatus: "Accepted",
            status: { $nin: ["Returned", "Cancelled"] }
        });

        const complettionRate = (totalCompletedDeliveries / totalAcceptedDeliveries) * 100;

        const todayEarnings = await orderModel.aggregate([
            {
                $match: {
                    deliveryBoyId: deliveryBoyIdObjectId,
                    status: "Delivered",
                    acceptStatus: "Accepted",
                    deliveredAt: { $gte: todayStart, $lte: todayEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 }
                }
            },
            {
                $addFields: {
                    earnings: { $multiply: ["$count", 200] }
                }
            },
            {
                $project: {
                    _id: 0,
                    earnings: 1
                }
            }
        ]);

        const earningRate = 200;

        const weeklyEarnings = await orderModel.aggregate([
            {
                $match: {
                    deliveryBoyId: deliveryBoyIdObjectId,
                    status: "Delivered",
                    acceptStatus: "Accepted",
                    deliveredAt: {
                        $gte: new Date(new Date().setDate(new Date().getDate() - 6)) // past 7 days
                    }
                }
            },
            {
                $addFields: {
                    dayOfMonth: { $dayOfMonth: "$deliveredAt" },
                    month: { $month: "$deliveredAt" },
                    year: { $year: "$deliveredAt" },
                    dayOfWeek: { $isoDayOfWeek: "$deliveredAt" }
                }
            },
            {
                $addFields: {
                    weekOfMonth: { $ceil: { $divide: ["$dayOfMonth", 7] } }
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
                    count: { $sum: 1 }
                }
            },
            {
                $addFields: {
                    day: {
                        $arrayElemAt: [
                            ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                            "$_id.dayOfWeek"
                        ]
                    },
                    monthName: {
                        $arrayElemAt: [
                            ["", "January", "February", "March", "April", "May", "June", "July",
                                "August", "September", "October", "November", "December"],
                            "$_id.month"
                        ]
                    },
                    amount: { $multiply: ["$count", earningRate] }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: {
                        $concat: [
                            "$day",
                            " - Week ",
                            { $toString: "$_id.weekOfMonth" },
                            " of ",
                            "$monthName",
                            " ",
                            { $toString: "$_id.year" }
                        ]
                    },
                    amount: 1
                }
            },
            {
                $sort: { name: 1 }
            }
        ]);

        const monthlyEarnings = await orderModel.aggregate([
            {
                $match: {
                    deliveryBoyId: deliveryBoyIdObjectId,
                    status: "Delivered",
                    acceptStatus: "Accepted"
                }
            },
            {
                $addFields: {
                    dayOfMonth: { $dayOfMonth: "$deliveredAt" },
                    month: { $month: "$deliveredAt" },
                    year: { $year: "$deliveredAt" }
                }
            },
            {
                $addFields: {
                    weekOfMonth: { $ceil: { $divide: ["$dayOfMonth", 7] } }
                }
            },
            {
                $group: {
                    _id: {
                        year: "$year",
                        month: "$month",
                        weekOfMonth: "$weekOfMonth"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $addFields: {
                    monthName: {
                        $arrayElemAt: [
                            ["", "January", "February", "March", "April", "May", "June", "July",
                                "August", "September", "October", "November", "December"],
                            "$_id.month"
                        ]
                    },
                    amount: { $multiply: ["$count", earningRate] }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: {
                        $concat: [
                            "Week ",
                            { $toString: "$_id.weekOfMonth" },
                            " of ",
                            "$monthName",
                            " ",
                            { $toString: "$_id.year" }
                        ]
                    },
                    amount: 1
                }
            },
            {
                $sort: { name: 1 }
            }
        ]);

        const yearlyEarnings = await orderModel.aggregate([
            {
                $match: {
                    deliveryBoyId: deliveryBoyIdObjectId,
                    status: "Delivered",
                    acceptStatus: "Accepted",
                    deliveredAt: {
                        $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
                    }
                }
            },
            {
                $addFields: {
                    month: { $month: "$deliveredAt" },
                    year: { $year: "$deliveredAt" }
                }
            },
            {
                $group: {
                    _id: {
                        year: "$year",
                        month: "$month"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $addFields: {
                    monthName: {
                        $arrayElemAt: [
                            ["", "January", "February", "March", "April", "May", "June", "July",
                                "August", "September", "October", "November", "December"],
                            "$_id.month"
                        ]
                    },
                    amount: { $multiply: ["$count", earningRate] }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: {
                        $concat: [
                            "$monthName",
                            " ",
                            { $toString: "$_id.year" }
                        ]
                    },
                    amount: 1
                }
            },
            {
                $sort: { name: 1 }
            }
        ]);


        const recentDeliveries = await orderModel.aggregate([
            {
                $match: {
                    deliveryBoyId: deliveryBoyIdObjectId,
                    status: { $ne: "Out for delivery" },
                    acceptStatus: "Accepted",
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    customer: "$user.fullname",
                    address: "$shippingAddress.address",
                    deliveredAt: "$deliveredAt",
                    returnedAt: "$returnedAt",
                    cancelledAt: "$cancelledAt",
                    status: "$status",
                    amount: "$totalAmount",
                    createdAt: "$createdAt",
                }
            },
            {
                $sort: { createdAt: -1 }
            },
        ])

        return res.status(200).send({
            success: true, data: {
                totalEarnings: totalEarnings[0] ? totalEarnings[0].totalEarnings : 0,
                deliveriesTimeline: [
                    { name: "Daily", deliveries: dailyDeliveries || 0 },
                    { name: "Weekly", deliveries: weeklyDeliveries || 0 },
                    { name: "Monthly", deliveries: monthlyDeliveries || 0 },
                    { name: "Total", deliveries: totalDeliveries || 0 }
                ],
                totalInProgressDeliveries: totalInProgressDeliveries ? totalInProgressDeliveries : 0,
                totalDeliveredDeliveries: totalDeliveredDeliveries ? totalDeliveredDeliveries : 0,
                totalCancelledDeliveries: totalCancelledDeliveries ? totalCancelledDeliveries : 0,
                totalReturnedDeliveries: totalReturnedDeliveries ? totalReturnedDeliveries : 0,
                totalCompletedDeliveries: totalCompletedDeliveries ? totalCompletedDeliveries : 0,
                completionRate: complettionRate ? complettionRate : 0,
                todayEarnings: todayEarnings[0] ? todayEarnings[0].earnings : 0,
                weeklyEarnings: weeklyEarnings || 0,
                monthlyEarnings: monthlyEarnings || 0,
                yearlyEarnings: yearlyEarnings || 0,
                recentDeliveries: recentDeliveries || 0
            }
        })
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getDeliveryBoyEarningController = async (req, res) => {
    try {
        const { deliveryBoyId } = req.params;
        const deliveryBoyIdObjectId = new mongoose.Types.ObjectId(deliveryBoyId);

        return res.status(200).send({
            success: true,
            data: {
                totalEarnings: totalEarnings[0] ? totalEarnings[0].totalEarnings : 0,
                totalCompletedDeliveries: totalCompletedDeliveries ? totalCompletedDeliveries : 0,
                completionRate: complettionRate ? complettionRate : 0,
                todayEarnings: todayEarnings[0] ? todayEarnings[0].earnings : 0,
                weeklyEarnings,
                monthlyEarnings,
                yearlyEarnings,
                recentDeliveries
            }
        })
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getDeliveryBoyOrdersController = async (req, res) => {
    try {
        const { deliveryBoyId } = req.params
        const orders = await orderModel.find({ deliveryBoyId }).populate('restaurantId').populate('userId').sort({ createdAt: -1 });
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "No order found for delivery boy" })
        }
        return res.status(200).json({ success: true, orders, message: "Delivery Boy Orders are fetched" })
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}