import express from "express";
import Customer from "../models/Customer.js";
import { protect } from "../middleware/auth.js";
import { validateCustomerProfile } from "../middleware/validate.js";

const router = express.Router();

// Every route in this router requires the short-lived QuickStay JWT. The
// authenticated id — never a client-supplied id — selects the customer record.
router.use(protect);

// Used only if MongoDB is temporarily unreachable, so the demo UI still works.
const fallbackProfiles = new Map();

const publicProfile = (doc, auth) => ({
	fullName: doc?.fullName || auth.name || "Guest",
	email: doc?.email || auth.email || "",
	phone: doc?.phone || "",
});

router.get("/profile", async (request, response) => {
	const id = request.auth.id;
	try {
		const doc = await Customer.findById(id).lean();
		return response.json({
			success: true,
			persisted: Boolean(doc),
			profile: publicProfile(doc || fallbackProfiles.get(id), request.auth),
		});
	} catch (error) {
		console.error("Customer profile read failed:", error.message);
		return response.json({
			success: true,
			persisted: false,
			profile: publicProfile(fallbackProfiles.get(id), request.auth),
		});
	}
});

// PATCH /api/user/profile — name, phone (and optional email) only.
router.patch("/profile", validateCustomerProfile, async (request, response) => {
	const id = request.auth.id;
	const patch = { ...request.body };
	const existing = fallbackProfiles.get(id) || {
		fullName: request.auth.name || "Guest",
		email: request.auth.email || "",
		phone: "",
	};
	const merged = { ...existing, ...patch };

	try {
		const doc = await Customer.findByIdAndUpdate(
			id,
			{
				$set: {
					_id: id,
					fullName: merged.fullName,
					email: merged.email,
					phone: merged.phone,
				},
			},
			{ new: true, upsert: true, runValidators: true }
		).lean();
		return response.json({
			success: true,
			persisted: true,
			profile: publicProfile(doc, request.auth),
		});
	} catch (error) {
		console.error("Customer profile write failed:", error.message);
		fallbackProfiles.set(id, merged);
		return response.json({
			success: true,
			persisted: false,
			profile: publicProfile(merged, request.auth),
		});
	}
});

export default router;
