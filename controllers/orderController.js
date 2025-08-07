import cartModel from '../models/cartModel.js';
import orderModel from '../models/orderModel.js';
import Stripe from 'stripe';

export const createOrderController = async (req, res) => {
    try {
        const {
            userId,
            items,
            totalAmount,
            shippingDetails,
            paymentMethod,
            restaurantId,
            DELIVERY_CHARGE,
            serviceCharge
        } = req.body;

        const newOrder = new orderModel({
            userId,
            items: items.map(item => ({
                item: item.itemId,
                name: item.name,
                image: item.image,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: totalAmount + DELIVERY_CHARGE + serviceCharge,
            shippingAddress: shippingDetails,
            paymentMethod,
            restaurantId,
            status: 'Pending'
        });

        await newOrder.save();

        await cartModel.findOneAndUpdate(
            { userId, restaurantId },
            { items: [], totalAmount: 0 },
            { new: true }
        );

        if (paymentMethod === 'cash') {
            return res.status(200).json({
                success: true,
                message: "Order placed successfully with Cash on Delivery",
                orderId: newOrder._id,
                method: paymentMethod
            });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        const line_items = items.map(item => ({
            price_data: {
                currency: "pkr",
                product_data: {
                    name: item.name,
                    images: [item.image],
                },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity,
        }));

        line_items.push({
            price_data: {
                currency: "pkr",
                product_data: {
                    name: "Delivery Charges",
                },
                unit_amount: DELIVERY_CHARGE * 100,
            },
            quantity: 1,
        });

        line_items.push({
            price_data: {
                currency: "pkr",
                product_data: {
                    name: "Service Charges",
                },
                unit_amount: serviceCharge * 100,
            },
            quantity: 1,
        });

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items,
            success_url: `${process.env.CLIENT_SITE_URL}/order-confirm?orderId=${newOrder._id}`,
            cancel_url: `${process.env.CLIENT_SITE_URL}/cancel?success=false&orderId=${newOrder._id}`
        });

        res.status(200).json({ success: true, sessionURL: session.url });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
};


export const getOrderDetailsController = async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.orderId)

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order details'
        });
    }
}

export const getRestaurantOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ restaurantId: req.params.restaurantId });
        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No orders found'
            });
        }
        return res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
}

export const updateOrderStatusController = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        const updateData = { status };

        if (status === 'Delivered') {
            updateData.deliveredAt = new Date();
        }

        const order = await orderModel.findByIdAndUpdate(orderId, updateData, { new: true });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No order found'
            });
        }

        return res.status(201).send({
            message: "Order status updated",
            status: order.status,
            deliveredAt: order.deliveredAt,
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
};


export const getFilterOrdersByStatusController = async (req, res) => {
    const { status, restaurantId } = req.params
    try {
        const orders = await orderModel.find({ restaurantId, status })
        if (!orders) {
            return res.status(404).json({
                success: false,
                message: 'No orders found'
            });
        }
        return res.status(201).send({ orders, success: true })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders by status'
        });
    }
}

export const getUserOrdersController = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const orders = await orderModel.find({ userId: req.userId, createdAt: { $gte: sevenDaysAgo } }).populate("restaurantId").populate("deliveryBoyId");
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return res.status(200).send({ success: true, message: "Fetching orders", orders })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
}

export const getUserOrderStatusController = async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.statusOrderId)
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        return res.status(200).send({ success: true, status: order.status })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order status'
        });
    }
}

export const deleteUserOrderController = async (req, res) => {
    try {
        const order = await orderModel.findByIdAndDelete(req.params.orderId)
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        return res.status(200).send({ success: true, message: "Order Removed from order history" })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order status'
        });
    }
}

export const dismissReviewPromptController = async (req, res) => {
    const { statusOrderId } = req.body
    try {
        const order = await orderModel.findByIdAndUpdate(statusOrderId, { reviewPromptDismissed: true }, { new: true })
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        return res.status(201).send({ success: true, message: "Review dismissed for this order" })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order status'
        });
    }
}

export const cancelOrderController = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        order.status = req.body.status || 'Cancelled';
        order.cancelledAt = new Date();
        await order.save();
        return res.status(200).send({ success: true, message: "Order cancelled successfully" })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order'
        });
    }
}
