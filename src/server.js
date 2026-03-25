import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import dns from "dns";
dns.setServers(["1.1.1.1"]);
import cron from 'node-cron';
// Connect to MongoDB
connectDB();

const app = express();

// Ping self every 10 minutes to prevent Render sleep
// cron.schedule('*/10 * * * *', async () => {
//   try {
//     await fetch('https://YOUR-APP-NAME.onrender.com/health');
//     console.log('Keep-alive ping sent');
//   } catch (err) {
//     console.log('Ping failed:', err.message);
//   }
// });


// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/health", (_, res) => res.json({ status: "ok", env: process.env.NODE_ENV }));

// ── Error Handling ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

export default app;
