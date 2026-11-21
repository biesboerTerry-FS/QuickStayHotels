import express from "express";
import Employee from "../models/Employee.js";
import { DEMO_EMPLOYEES, seedDemoEmployees } from "../utils/seedEmployees.js";
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

export default router;
