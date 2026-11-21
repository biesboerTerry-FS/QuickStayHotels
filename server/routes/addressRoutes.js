import express from "express";
import { randomUUID } from "node:crypto";
import Address from "../models/Address.js";
import { protect } from "../middleware/auth.js";
import {
	validateAddress,
	validateAddressPatch,
} from "../middleware/validate.js";

const router = express.Router();

// All address routes are JWT protected and scoped to the authenticated id.
router.use(protect);

// In-memory fallback keeps the demo usable when MongoDB is unreachable.
const fallbackAddresses = new Map();
const readFallback = (userId) => fallbackAddresses.get(userId) || [];
const writeFallback = (userId, list) => fallbackAddresses.set(userId, list);

const publicAddress = (doc) => ({
	id: doc._id,
	label: doc.label,
	line1: doc.line1,
	line2: doc.line2 || "",
	city: doc.city,
	state: doc.state || "",
	zip: doc.zip || "",
	country: doc.country,
	isDefault: Boolean(doc.isDefault),
});

const normalizeBody = (body = {}) => {
	const entry = {};
	for (const field of ["label", "line1", "line2", "city", "state", "zip", "country"]) {
		if (typeof body[field] === "string") entry[field] = body[field].trim();
	}
	if (!entry.label) entry.label = "Home";
	if (typeof body.isDefault === "boolean") entry.isDefault = body.isDefault;
	return entry;
};

const makeDefault = async (userId, id) => {
	await Address.updateMany(
		{ userId, _id: { $ne: id }, isDefault: true },
		{ $set: { isDefault: false } }
	);
	await Address.updateOne({ userId, _id: id }, { $set: { isDefault: true } });
};

// GET /api/address — list the caller's saved addresses.
router.get("/", async (request, response) => {
	const userId = request.auth.id;
	try {
		const docs = await Address.find({ userId }).sort({ isDefault: -1, createdAt: 1 }).lean();
		return response.json({
			success: true,
			persisted: true,
			addresses: docs.map(publicAddress),
		});
	} catch (error) {
		console.error("Address list failed:", error.message);
		return response.json({
			success: true,
			persisted: false,
			addresses: readFallback(userId).map(publicAddress),
		});
	}
});

// GET /api/address/:id
router.get("/:id", async (request, response) => {
	const userId = request.auth.id;
	try {
		const doc = await Address.findOne({ _id: request.params.id, userId }).lean();
		if (!doc) return response.status(404).json({ success: false, message: "Address not found" });
		return response.json({ success: true, address: publicAddress(doc) });
	} catch (error) {
		console.error("Address read failed:", error.message);
		const doc = readFallback(userId).find((item) => item._id === request.params.id);
		if (!doc) return response.status(404).json({ success: false, message: "Address not found" });
		return response.json({ success: true, persisted: false, address: publicAddress(doc) });
	}
});

// POST /api/address
router.post("/", validateAddress, async (request, response) => {
	const userId = request.auth.id;
	const data = normalizeBody(request.body);
	const id = randomUUID();
	const doc = {
		_id: id,
		userId,
		...data,
		isDefault: Boolean(data.isDefault),
	};

	try {
		const count = await Address.countDocuments({ userId });
		if (count === 0) doc.isDefault = true;
		if (doc.isDefault) {
			await Address.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
		}
		await Address.create(doc);
		return response.status(201).json({ success: true, persisted: true, address: publicAddress(doc) });
	} catch (error) {
		console.error("Address create failed:", error.message);
		const list = readFallback(userId);
		if (list.length === 0) doc.isDefault = true;
		if (doc.isDefault) list.forEach((item) => { item.isDefault = false; });
		list.push(doc);
		writeFallback(userId, list);
		return response.status(201).json({
			success: true,
			persisted: false,
			address: publicAddress(doc),
		});
	}
});

// PATCH /api/address/:id
router.patch("/:id", validateAddressPatch, async (request, response) => {
	const userId = request.auth.id;
	const patch = normalizeBody(request.body);
	if (Object.keys(patch).length === 0) {
		return response.status(400).json({ success: false, message: "No editable fields supplied" });
	}

	try {
		const existing = await Address.findOne({ _id: request.params.id, userId }).lean();
		if (!existing) return response.status(404).json({ success: false, message: "Address not found" });
		const updated = await Address.findOneAndUpdate(
			{ _id: request.params.id, userId },
			{ $set: patch },
			{ new: true, runValidators: true }
		).lean();
		if (patch.isDefault) await makeDefault(userId, request.params.id);
		const final = patch.isDefault
			? { ...updated, isDefault: true }
			: updated;
		return response.json({ success: true, persisted: true, address: publicAddress(final) });
	} catch (error) {
		console.error("Address update failed:", error.message);
		const list = readFallback(userId);
		const index = list.findIndex((item) => item._id === request.params.id);
		if (index === -1) return response.status(404).json({ success: false, message: "Address not found" });
		const updated = { ...list[index], ...patch };
		if (patch.isDefault) list.forEach((item) => { item.isDefault = false; });
		list[index] = updated;
		writeFallback(userId, list);
		return response.json({ success: true, persisted: false, address: publicAddress(updated) });
	}
});

// DELETE /api/address/:id
router.delete("/:id", async (request, response) => {
	const userId = request.auth.id;
	try {
		const doc = await Address.findOneAndDelete({ _id: request.params.id, userId }).lean();
		if (!doc) return response.status(404).json({ success: false, message: "Address not found" });
		if (doc.isDefault) {
			const next = await Address.findOne({ userId }).sort({ createdAt: 1 }).lean();
			if (next) await makeDefault(userId, next._id);
		}
		return response.json({ success: true, persisted: true });
	} catch (error) {
		console.error("Address delete failed:", error.message);
		const list = readFallback(userId);
		const index = list.findIndex((item) => item._id === request.params.id);
		if (index === -1) return response.status(404).json({ success: false, message: "Address not found" });
		const wasDefault = list[index].isDefault;
		list.splice(index, 1);
		if (wasDefault && list.length > 0) list[0].isDefault = true;
		writeFallback(userId, list);
		return response.json({ success: true, persisted: false });
	}
});

export default router;
