import express from "express";
import { randomUUID } from "node:crypto";
import PaymentMethod from "../models/PaymentMethod.js";
import { protect } from "../middleware/auth.js";
import {
	validatePaymentMethod,
	validatePaymentMethodPatch,
} from "../middleware/validate.js";

const router = express.Router();

// TEST MODE ONLY. These routes accept masked metadata (brand, last4, exp)
// and reject any full card number at validation time. No Stripe call is made.
router.use(protect);

const fallbackMethods = new Map();
const readFallback = (userId) => fallbackMethods.get(userId) || [];
const writeFallback = (userId, list) => fallbackMethods.set(userId, list);

const publicMethod = (doc) => ({
	id: doc._id,
	brand: doc.brand,
	label: doc.label,
	last4: doc.last4,
	exp: doc.exp || "",
	isDefault: Boolean(doc.isDefault),
});

const normalizeBody = (body = {}) => {
	const entry = {};
	for (const field of ["brand", "label", "last4", "exp"]) {
		if (typeof body[field] === "string") entry[field] = body[field].trim();
	}
	if (!entry.brand) entry.brand = "Test card";
	if (!entry.label) entry.label = "Demo card";
	if (typeof body.isDefault === "boolean") entry.isDefault = body.isDefault;
	return entry;
};

const makeDefault = async (userId, id) => {
	await PaymentMethod.updateMany(
		{ userId, _id: { $ne: id }, isDefault: true },
		{ $set: { isDefault: false } }
	);
	await PaymentMethod.updateOne({ userId, _id: id }, { $set: { isDefault: true } });
};

router.get("/", async (request, response) => {
	const userId = request.auth.id;
	try {
		const docs = await PaymentMethod.find({ userId })
			.sort({ isDefault: -1, createdAt: 1 })
			.lean();
		return response.json({
			success: true,
			persisted: true,
			paymentMethods: docs.map(publicMethod),
		});
	} catch (error) {
		console.error("Demo payment method list failed:", error.message);
		return response.json({
			success: true,
			persisted: false,
			paymentMethods: readFallback(userId).map(publicMethod),
		});
	}
});

router.post("/", validatePaymentMethod, async (request, response) => {
	const userId = request.auth.id;
	const data = normalizeBody(request.body);
	const doc = { _id: randomUUID(), userId, ...data, isDefault: Boolean(data.isDefault) };

	try {
		const count = await PaymentMethod.countDocuments({ userId });
		if (count === 0) doc.isDefault = true;
		if (doc.isDefault) {
			await PaymentMethod.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
		}
		await PaymentMethod.create(doc);
		return response.status(201).json({
			success: true,
			persisted: true,
			paymentMethod: publicMethod(doc),
		});
	} catch (error) {
		console.error("Demo payment method create failed:", error.message);
		const list = readFallback(userId);
		if (list.length === 0) doc.isDefault = true;
		if (doc.isDefault) list.forEach((item) => { item.isDefault = false; });
		list.push(doc);
		writeFallback(userId, list);
		return response.status(201).json({
			success: true,
			persisted: false,
			paymentMethod: publicMethod(doc),
		});
	}
});

router.patch("/:id", validatePaymentMethodPatch, async (request, response) => {
	const userId = request.auth.id;
	const patch = normalizeBody(request.body);
	if (Object.keys(patch).length === 0) {
		return response.status(400).json({ success: false, message: "No editable fields supplied" });
	}

	try {
		const existing = await PaymentMethod.findOne({ _id: request.params.id, userId }).lean();
		if (!existing) {
			return response.status(404).json({ success: false, message: "Payment method not found" });
		}
		const updated = await PaymentMethod.findOneAndUpdate(
			{ _id: request.params.id, userId },
			{ $set: patch },
			{ new: true, runValidators: true }
		).lean();
		if (patch.isDefault) await makeDefault(userId, request.params.id);
		return response.json({
			success: true,
			persisted: true,
			paymentMethod: publicMethod(patch.isDefault ? { ...updated, isDefault: true } : updated),
		});
	} catch (error) {
		console.error("Demo payment method update failed:", error.message);
		const list = readFallback(userId);
		const index = list.findIndex((item) => item._id === request.params.id);
		if (index === -1) {
			return response.status(404).json({ success: false, message: "Payment method not found" });
		}
		const updated = { ...list[index], ...patch };
		if (patch.isDefault) list.forEach((item) => { item.isDefault = false; });
		list[index] = updated;
		writeFallback(userId, list);
		return response.json({ success: true, persisted: false, paymentMethod: publicMethod(updated) });
	}
});

router.delete("/:id", async (request, response) => {
	const userId = request.auth.id;
	try {
		const doc = await PaymentMethod.findOneAndDelete({ _id: request.params.id, userId }).lean();
		if (!doc) {
			return response.status(404).json({ success: false, message: "Payment method not found" });
		}
		if (doc.isDefault) {
			const next = await PaymentMethod.findOne({ userId }).sort({ createdAt: 1 }).lean();
			if (next) await makeDefault(userId, next._id);
		}
		return response.json({ success: true, persisted: true });
	} catch (error) {
		console.error("Demo payment method delete failed:", error.message);
		const list = readFallback(userId);
		const index = list.findIndex((item) => item._id === request.params.id);
		if (index === -1) {
			return response.status(404).json({ success: false, message: "Payment method not found" });
		}
		const wasDefault = list[index].isDefault;
		list.splice(index, 1);
		if (wasDefault && list.length > 0) list[0].isDefault = true;
		writeFallback(userId, list);
		return response.json({ success: true, persisted: false });
	}
});

export default router;
