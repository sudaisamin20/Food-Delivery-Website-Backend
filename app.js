import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from "path";
import ConnDB from './config/db.js';
import { fileURLToPath } from 'url'
import userAuthRoute from "./routes/userAuthRoute.js"
import ownerRoute from "./routes/ownerRoute.js"
import restaurantRoute from "./routes/restaurantRoute.js"
import categoryRoute from "./routes/categoryRoute.js"
import itemRoute from "./routes/itemRoute.js"
import cartRoute from "./routes/cartRoute.js"
import orderRoute from "./routes/orderRoute.js"
import reviewRoute from "./routes/reviewRoute.js"
import reportRoute from "./routes/reportRoute.js"
import superAdminRoute from "./routes/superAdminRoute.js"
import deliveryBoyRoute from "./routes/deliveryBoyRoute.js"
import ragRoute from "./routes/ragRoute.js"

dotenv.config();
const app = express();

ConnDB();

const PORT = process.env.PORT || 5000;

app.use(express.json())
app.use(cors())

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

app.use("/api/v1/auth/user", userAuthRoute)
app.use("/api/v1/auth/owner", ownerRoute)
app.use("/api/v1/auth/restaurant", restaurantRoute)
app.use("/api/v1/category", categoryRoute)
app.use("/api/v1/item", itemRoute)
app.use("/api/v1/cart", cartRoute)
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/review", reviewRoute);
app.use("/api/v1/report", reportRoute);
app.use("/api/v1/superadmin", superAdminRoute)
app.use("/api/v1/deliveryboy", deliveryBoyRoute)
app.use("/api/v1/rag", ragRoute)

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});