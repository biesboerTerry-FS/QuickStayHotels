import express from "express";
import Review from "../models/Review.js";

const router = express.Router();

router.get("/", async (request, response) => {
	try {
		const { roomId } = request.query;
		const filter = roomId ? { roomId } : {};
		const reviews = await Review.find(filter).sort({ createdAt: -1 });
		response.json({ success: true, reviews });
	} catch (error) {
		response.status(500).json({ success: false, message: error.message });
	}
});

router.post("/", async (request, response) => {
	try {
		const review = new Review(request.body);
		await review.save();
		response.status(201).json({ success: true, review });
	} catch (error) {
		response.status(400).json({ success: false, message: error.message });
	}
});

export default router;
