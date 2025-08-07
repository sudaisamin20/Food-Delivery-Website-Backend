import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    items: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'item'
        },
        name: String,
        image: String,
        quantity: Number,
        price: Number
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        fullName: String,
        email: String,
        phoneno: String,
        address: String,
        city: String,
        postalCode: String,
        province: String,
        country: String
    },
    paymentMethod: {
        type: String,
        default: 'cash'
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'restaurant'
    },
    status: {
        type: String,
        default: 'Pending'
    },
    payoutStatus: {
        type: String,
        default: 'Pending'
    },
    deliveryBoyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'deliveryboys'
    },
    acceptStatus: {
        type: String,
        default: 'Pending'
    },
    acceptAt: {
        type: Date,
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    paidAt: {
        type: Date,
        default: null
    },
    deliveredAt: {
        type: Date,
        default: null
    },
    returnedAt: {
        type: Date,
        default: null
    },
    reviewPromptDismissed: {
        type: Boolean,
        default: false
    },
    reviewedOrder: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const order = mongoose.model('Order', OrderSchema);

export default order