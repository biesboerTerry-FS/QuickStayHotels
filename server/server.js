import express, { request, response } from "express";
import "dotenv/config";
import cors from "cors";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhooks from "./controllers/clerkWebhooks.js";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import seedRoutes from "./routes/seedRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { initSentry } from "./utils/sentry.js";
import Stripe from "stripe";

let stripeClient;
const getStripe = () => {
	if (!stripeClient) {
		stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
	}
	return stripeClient;
};

initSentry();

const app = express();

//^ CORS: allow local dev and the configured frontend origin
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

app.use(
	cors({
		origin: allowedOrigins,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		credentials: true,
	})
);

//^ middleware
app.use(express.json());
app.use(clerkMiddleware({ authorizedParties: allowedOrigins }));

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	message: { success: false, message: "Too many requests, please try again later." },
});
app.use(limiter);

//^ api to listen for clerk webhooks
app.post("/api/clerk", clerkWebhooks);

//^ Stripe Checkout (test mode demo) for booking payments
app.post("/api/create-checkout-session", async (request, response) => {
	try {
		const { bookingId, hotelName, total } = request.body || {};
		const amount = Math.max(0, Math.round(Number(total) * 100));
		if (!amount) {
			return response.status(400).json({ message: "Invalid booking total" });
		}

		const origin = request.headers.origin || allowedOrigins[0];
		const session = await getStripe().checkout.sessions.create({
			mode: "payment",
			line_items: [
				{
					price_data: {
						currency: "usd",
						product_data: {
							name: `Stay at ${hotelName || "QuickStay Hotel"}`,
						},
						unit_amount: amount,
					},
					quantity: 1,
				},
			],
			success_url: `${origin}/pay/success?bookingId=${encodeURIComponent(bookingId || "")}`,
			cancel_url: `${origin}/pay/${encodeURIComponent(bookingId || "")}`,
			metadata: { bookingId: String(bookingId || "") },
		});

		return response.json({ url: session.url });
	} catch (error) {
		console.error("Stripe checkout error:", error.message);
		return response.status(500).json({ message: error.message });
	}
});

//^ resource routes
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (request, response) => response.send("API is working, yo"));
app.get("/health", (request, response) =>
	response.json({ status: "ok", time: new Date().toISOString() })
);

//^ database connection (lazy so serverless cold starts don't crash on import)
let dbConnected = false;
const ensureDB = async () => {
	if (!dbConnected) {
		await connectDB();
		dbConnected = true;
	}
};

//^ local dev entry point
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production" || process.env.VERCEL !== "1") {
	ensureDB().then(() => {
		app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
	});
}

// Vercel serverless entry point
export default async function handler(request, response) {
	await ensureDB();
	return app(request, response);
}
