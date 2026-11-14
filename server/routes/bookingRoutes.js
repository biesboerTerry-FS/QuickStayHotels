import express from "express";
import Booking from "../models/Booking.js";

const router = express.Router();

router.get("/", async (request, response) => {
	try {
		const { userId } = request.query;
		const filter = userId ? { userId } : {};
		const bookings = await Booking.find(filter).sort({ createdAt: -1 });
		response.json({ success: true, bookings });
	} catch (error) {
		response.status(500).json({ success: false, message: error.message });
	}
});

router.post("/", async (request, response) => {
	try {
		const booking = new Booking(request.body);
		await booking.save();
		response.status(201).json({ success: true, booking });
	} catch (error) {
		response.status(400).json({ success: false, message: error.message });
	}
});

router.patch("/:id", async (request, response) => {
	try {
		const booking = await Booking.findByIdAndUpdate(request.params.id, request.body, {
			new: true,
			runValidators: true,
		});
		if (!booking) {
			return response.status(404).json({ success: false, message: "Booking not found" });
		}
		response.json({ success: true, booking });
	} catch (error) {
		response.status(400).json({ success: false, message: error.message });
	}
});

router.delete("/:id", async (request, response) => {
	try {
		const booking = await Booking.findByIdAndDelete(request.params.id);
		if (!booking) {
			return response.status(404).json({ success: false, message: "Booking not found" });
		}
		response.json({ success: true, message: "Booking deleted" });
	} catch (error) {
		response.status(500).json({ success: false, message: error.message });
	}
});

export default router;
