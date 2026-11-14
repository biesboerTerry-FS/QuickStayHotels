import express from "express";
import Room from "../models/Room.js";

const router = express.Router();

router.get("/", async (request, response) => {
	try {
		const rooms = await Room.find().sort({ createdAt: -1 });
		response.json({ success: true, rooms });
	} catch (error) {
		response.status(500).json({ success: false, message: error.message });
	}
});

router.get("/:id", async (request, response) => {
	try {
		const room = await Room.findById(request.params.id);
		if (!room) {
			return response.status(404).json({ success: false, message: "Room not found" });
		}
		response.json({ success: true, room });
	} catch (error) {
		response.status(500).json({ success: false, message: error.message });
	}
});

router.post("/", async (request, response) => {
	try {
		const room = new Room(request.body);
		await room.save();
		response.status(201).json({ success: true, room });
	} catch (error) {
		response.status(400).json({ success: false, message: error.message });
	}
});

router.patch("/:id", async (request, response) => {
	try {
		const room = await Room.findByIdAndUpdate(request.params.id, request.body, {
			new: true,
			runValidators: true,
		});
		if (!room) {
			return response.status(404).json({ success: false, message: "Room not found" });
		}
		response.json({ success: true, room });
	} catch (error) {
		response.status(400).json({ success: false, message: error.message });
	}
});

router.delete("/:id", async (request, response) => {
	try {
		const room = await Room.findByIdAndDelete(request.params.id);
		if (!room) {
			return response.status(404).json({ success: false, message: "Room not found" });
		}
		response.json({ success: true, message: "Room deleted" });
	} catch (error) {
		response.status(500).json({ success: false, message: error.message });
	}
});

export default router;
