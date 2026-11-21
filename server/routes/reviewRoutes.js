import express from "express";
import Review from "../models/Review.js";
import { protect } from "../middleware/auth.js";
import { validateReview } from "../middleware/validate.js";

const router = express.Router();

// Public browse: reviews are readable by anyone.
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

// Posting a review is a state change and requires a token.
router.post("/", protect, validateReview, async (request, response) => {
	try {
		const review = new Review(request.body);
		await review.save();
		response.status(201).json({ success: true, review });
	} catch (error) {
		response.status(400).json({ success: false, message: error.message });
	}
});

export default router;
