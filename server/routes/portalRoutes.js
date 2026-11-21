import express from "express";
import PortalState from "../models/PortalState.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();
const STATE_ID = "quickstay-portal-demo";
const PORTAL_ROLES = ["owner", "admin", "employee"];

const EMPTY_STATE = { messages: [], requests: [], availability: {} };

const validState = (body) => {
	if (!body || typeof body !== "object" || Array.isArray(body)) return false;
	if (!Array.isArray(body.messages) || body.messages.length > 500) return false;
	if (!Array.isArray(body.requests) || body.requests.length > 500) return false;
	if (!body.availability || typeof body.availability !== "object" || Array.isArray(body.availability)) {
		return false;
	}
	for (const item of [...body.messages, ...body.requests]) {
		if (!item || typeof item !== "object" || Array.isArray(item)) return false;
		if (JSON.stringify(item).length > 4000) return false;
	}
	return true;
};

router.use(protect, requireRole(...PORTAL_ROLES));

router.get("/state", async (request, response) => {
	try {
		const doc = await PortalState.findById(STATE_ID).lean();
		return response.json({ success: true, state: doc?.value || EMPTY_STATE });
	} catch (error) {
		console.error("Portal state read failed:", error.message);
		return response.json({ success: true, state: EMPTY_STATE, persisted: false });
	}
});

router.put("/state", async (request, response) => {
	if (!validState(request.body)) {
		return response.status(400).json({ success: false, message: "Invalid portal state" });
	}
	try {
		await PortalState.findByIdAndUpdate(
			STATE_ID,
			{ $set: { value: request.body } },
			{ new: true, upsert: true, runValidators: true }
		);
		return response.json({ success: true, persisted: true });
	} catch (error) {
		console.error("Portal state write failed:", error.message);
		return response.json({ success: true, persisted: false });
	}
});

export default router;
