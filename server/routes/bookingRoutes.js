import express from "express";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import { sendBookingConfirmation } from "../utils/mailer.js";
import { protect, requireRole } from "../middleware/auth.js";
import {
	validateBooking,
	validateBookingPatch,
	validateFulfillmentStatus,
} from "../middleware/validate.js";

const router = express.Router();
const PRIVILEGED_ROLES = ["owner", "admin"];
const FULFILL_ROLES = [...PRIVILEGED_ROLES, "employee"];
const ID_RE = /^[A-Za-z0-9_-]{1,120}$/;

// Booking data is personal, so the list requires a token. Owners/admins can
// query any user's bookings; everyone else is scoped to their own id.
router.get("/", protect, async (request, response) => {
	try {
		const privileged = PRIVILEGED_ROLES.includes(request.auth.role);
		const requestedUserId = request.query.userId;
		if (!privileged && requestedUserId && requestedUserId !== request.auth.id) {
			return response.status(403).json({
				success: false,
				message: "You can only view your own bookings",
			});
		}
		if (requestedUserId && (typeof requestedUserId !== "string" || !ID_RE.test(requestedUserId))) {
			return response.status(400).json({ success: false, message: "Invalid userId" });
		}
		const userId = privileged ? requestedUserId : request.auth.id;
		const filter = userId ? { userId } : {};
		const bookings = await Booking.find(filter).sort({ createdAt: -1 });
		response.json({ success: true, bookings });
	} catch (error) {
		response.status(500).json({ success: false, message: error.message });
	}
});

router.post("/", protect, validateBooking, async (request, response) => {
	// Guests may only create bookings for themselves.
	if (
		!PRIVILEGED_ROLES.includes(request.auth.role) &&
		request.body.userId !== request.auth.id
	) {
		return response.status(403).json({
			success: false,
			message: "You can only create a booking for your own account",
		});
	}
	try {
		const booking = new Booking(request.body);
		await booking.save();

		const room = await Room.findById(booking.roomId);
		if (room && request.body.userEmail) {
			try {
				await sendBookingConfirmation({
					to: request.body.userEmail,
					booking,
					room,
				});
			} catch (emailError) {
				console.error("Booking confirmation email failed:", emailError.message);
			}
		}

		response.status(201).json({ success: true, booking });
	} catch (error) {
		response.status(400).json({ success: false, message: error.message });
	}
});

// Advance a booking through the fulfillment workflow. Available to owners,
// admins and employees; the client falls back to localStorage when offline.
router.patch(
	"/:id/status",
	protect,
	requireRole(...FULFILL_ROLES),
	validateFulfillmentStatus,
	async (request, response) => {
		if (!ID_RE.test(request.params.id)) {
			return response.status(400).json({ success: false, message: "Invalid booking id" });
		}
		try {
			const booking = await Booking.findByIdAndUpdate(
				request.params.id,
				{ fulfillmentStatus: request.body.status },
				{ new: true, runValidators: true }
			);
			if (!booking) {
				return response.status(404).json({ success: false, message: "Booking not found" });
			}
			return response.json({ success: true, booking });
		} catch (error) {
			return response.status(400).json({ success: false, message: error.message });
		}
	}
);

router.patch("/:id", protect, requireRole(...PRIVILEGED_ROLES), validateBookingPatch, async (request, response) => {
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

router.delete("/:id", protect, requireRole(...PRIVILEGED_ROLES), async (request, response) => {
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
