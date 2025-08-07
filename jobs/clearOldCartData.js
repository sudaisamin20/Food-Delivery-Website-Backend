import cron from 'node-cron';
import cartModel from '../models/cartModel.js';

const clearOldCartData = () => {
    cron.schedule('0 0 * * *', async () => {
        const expirationTime = 60 * 1000;
        const now = Date.now();
        try {
            const carts = await cartModel.find();
            for (const cart of carts) {
                if (now - new Date(cart.lastUpdated).getTime() > expirationTime) {
                    await cartModel.deleteOne({ _id: cart._id });
                    console.log(`Cleared cart for user ${cart.userId}`);
                }
            }
        } catch (error) {
            console.error('Error clearing old cart data:', error);
        }
    });
};

export default clearOldCartData;