import express from "express";
import Employee from "../models/Employee.js";
import { DEMO_EMPLOYEES, seedDemoEmployees } from "../utils/seedEmployees.js";
import {
	createBlock,
	deleteBlock,
	getBlock,
	listBlocks,
	validateBlock,
} from "../utils/timeOffBlocks.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Basic contact fields only. Position, role and assignments are never writable
// through the self-service portal.
const EDITABLE_FIELDS = ["fullName", "email", "phone", "address"];

const resolveId = (request) =>
	request.header("x-employee-id") || request.query.id || DEMO_EMPLOYEES[0]._id;

const fallbackEmployee = (id) =>
	DEMO_EMPLOYEES.find((employee) => employee._id === id) || DEMO_EMPLOYEES[0];

const publicEmployee = (employee) => ({
	id: employee._id || employee.id,
	fullName: employee.fullName,
	position: employee.position,
	department: employee.department || "",
	email: employee.email || "",
	phone: employee.phone || "",
	address: employee.address || "",
	assignments: employee.assignments || [],
});

const cleanPatch = (body = {}) => {
	const patch = {};
	for (const field of EDITABLE_FIELDS) {
		if (typeof body[field] === "string") {
			patch[field] = body[field].trim().slice(0, 200);
		}
	}
	return patch;
};

router.get("/me", async (request, response) => {
	const id = resolveId(request);
	try {
		let employee = await Employee.findById(id).lean();
		if (!employee) {
			await seedDemoEmployees();
			employee = await Employee.findById(id).lean();
		}
		return response.json({
			success: true,
			persisted: Boolean(employee),
			employee: publicEmployee(employee || fallbackEmployee(id)),
		});
	} catch (error) {
		console.error("Employee GET /me failed:", error.message);
		// Demo-friendly fallback: the portal keeps working without a database.
		return response.json({
			success: true,
			persisted: false,
			employee: publicEmployee(fallbackEmployee(id)),
		});
	}
});

// GET /me stays public for the demo portal. PATCH /me is a state change and
// requires a token; the record is always scoped to the authenticated employee
// so a client cannot edit somebody else's profile via x-employee-id.
router.patch("/me", protect, async (request, response) => {
	const id =
		request.auth.role === "employee"
			? request.auth.employeeId || request.auth.id
			: request.auth.id;
	if (
		request.auth.role === "employee" &&
		resolveId(request) !== id &&
		(request.header("x-employee-id") || request.query.id)
	) {
		return response.status(403).json({
			success: false,
			message: "You can only edit your own employee profile",
		});
	}
	const patch = cleanPatch(request.body);
	if (Object.keys(patch).length === 0) {
		return response.status(400).json({
			success: false,
			message: "No editable fields supplied",
		});
	}
	if (patch.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email)) {
		return response.status(400).json({ success: false, message: "Invalid email" });
	}

	try {
		let employee = await Employee.findByIdAndUpdate(
			id,
			{ $set: patch },
			{ new: true, runValidators: true }
		).lean();
		if (!employee) {
			await seedDemoEmployees();
			employee = await Employee.findByIdAndUpdate(
				id,
				{ $set: patch },
				{ new: true, runValidators: true }
			).lean();
		}
		if (!employee) {
			return response.status(404).json({ success: false, message: "Employee not found" });
		}
		return response.json({ success: true, persisted: true, employee: publicEmployee(employee) });
	} catch (error) {
		console.error("Employee PATCH /me failed:", error.message);
		// Acknowledge the demo edit even if MongoDB is unavailable. The web demo
		// persists the same fields in localStorage, so the UI stays consistent.
		return response.json({
			success: true,
			persisted: false,
			employee: publicEmployee({ ...fallbackEmployee(id), ...patch }),
		});
	}
});

// ---- Partial-day availability blocks (time off) ----
// GET stays public like /me so the demo portal renders offline; every mutation
// is JWT protected and scoped to the authenticated employee's own record.
const scopeEmployeeId = (request) =>
	request.auth?.role === "employee"
		? request.auth.employeeId || request.auth.id
		: request.auth?.id || resolveId(request);

router.get("/timeoff", async (request, response) => {
	const { blocks, persisted } = await listBlocks(resolveId(request));
	return response.json({ success: true, persisted, blocks });
});

router.post("/timeoff", protect, async (request, response) => {
	const id = scopeEmployeeId(request);
	const requestedId = String(request.body?.employeeId || id);
	if (requestedId !== id) {
		return response.status(403).json({
			success: false,
			message: "You can only add time off to your own schedule",
		});
	}
	const error = validateBlock(request.body);
	if (error) return response.status(400).json({ success: false, message: error });

	const block = {
		id: `block_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
		employeeId: id,
		employeeName: String(request.body.employeeName || "").trim().slice(0, 120),
		date: request.body.date,
		startTime: request.body.startTime,
		endTime: request.body.endTime,
		reason: String(request.body.reason || "").trim().slice(0, 300),
		status: "pending",
		createdAt: new Date().toISOString(),
	};
	const persisted = await createBlock(block);
	return response.status(201).json({ success: true, persisted, block });
});

router.delete("/timeoff/:id", protect, async (request, response) => {
	const block = await getBlock(request.params.id);
	if (!block) {
		return response.status(404).json({ success: false, message: "Block not found" });
	}
	if (request.auth.role === "employee" && block.employeeId !== scopeEmployeeId(request)) {
		return response.status(403).json({
			success: false,
			message: "You can only remove your own time off",
		});
	}
	const persisted = await deleteBlock(request.params.id);
	return response.json({ success: true, persisted });
});

export default router;
