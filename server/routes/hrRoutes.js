import express from "express";
import Employee from "../models/Employee.js";
import HrState from "../models/HrState.js";
import { DEMO_EMPLOYEES, HR_SEED, seedDemoEmployees } from "../utils/seedEmployees.js";
import { protect, requireRole } from "../middleware/auth.js";
import {
	validateHrEmployee,
	validateHrEmployeePatch,
	validateHrEmploymentStatus,
	validateHrSettings,
	validatePayRun,
	validatePerformanceNote,
	validateTimeOffDecision,
} from "../middleware/validate.js";

const router = express.Router();
const STATE_ID = "quickstay-hr-demo";

// Everything in this router is owner/admin only. Public room browsing and the
// employee self-service portal never touch these routes.
router.use(protect, requireRole("owner", "admin"));

const clone = (value) => JSON.parse(JSON.stringify(value));

const defaultState = () => ({
	departments: clone(HR_SEED.departments),
	roles: clone(HR_SEED.roles),
	payRuns: clone(HR_SEED.payRuns),
	timeOff: clone(HR_SEED.timeOff),
	performanceNotes: clone(HR_SEED.performanceNotes),
});

const normalizeState = (value = {}) => {
	const seed = defaultState();
	for (const key of Object.keys(seed)) {
		if (Array.isArray(value[key])) seed[key] = clone(value[key]);
	}
	return seed;
};

const readState = async () => {
	try {
		const doc = await HrState.findById(STATE_ID).lean();
		if (doc?.value && typeof doc.value === "object" && !Array.isArray(doc.value)) {
			return { state: normalizeState(doc.value), persisted: true };
		}
	} catch (error) {
		console.error("HR state read failed:", error.message);
	}
	return { state: defaultState(), persisted: false };
};

const writeState = async (state) => {
	try {
		await HrState.findByIdAndUpdate(
			STATE_ID,
			{ $set: { value: state } },
			{ new: true, upsert: true, runValidators: true }
		);
		return true;
	} catch (error) {
		console.error("HR state write failed:", error.message);
		return false;
	}
};

const publicEmployee = (employee) => ({
	id: employee._id || employee.id,
	fullName: employee.fullName || "",
	position: employee.position || "",
	department: employee.department || "",
	email: employee.email || "",
	phone: employee.phone || "",
	address: employee.address || "",
	assignments: Array.isArray(employee.assignments) ? employee.assignments : [],
	employmentStatus: employee.employmentStatus || "active",
	payType: employee.payType || "hourly",
	payRate: typeof employee.payRate === "number" ? employee.payRate : 0,
	hireDate: employee.hireDate || "",
});

const seedFallback = (id) =>
	DEMO_EMPLOYEES.find((employee) => employee._id === id) || DEMO_EMPLOYEES[0];

const readEmployees = async () => {
	try {
		let docs = await Employee.find({}).lean();
		const present = new Set(docs.map((doc) => doc._id));
		const missing = DEMO_EMPLOYEES.filter((employee) => !present.has(employee._id));
		if (missing.length) {
			await Promise.all(
				missing.map((employee) =>
					Employee.updateOne(
						{ _id: employee._id },
						{ $setOnInsert: employee },
						{ upsert: true }
					)
				)
			);
			docs = await Employee.find({}).lean();
		}
		return { employees: docs.map(publicEmployee), persisted: true };
	} catch (error) {
		console.error("HR employee read failed:", error.message);
		return { employees: DEMO_EMPLOYEES.map(publicEmployee), persisted: false };
	}
};

const newId = (prefix) =>
	`${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const employeePatch = (body = {}) => {
	const patch = {};
	for (const field of [
		"fullName",
		"position",
		"department",
		"email",
		"phone",
		"address",
		"employmentStatus",
		"payType",
		"payRate",
		"hireDate",
	]) {
		if (body[field] !== undefined) patch[field] = body[field];
	}
	return patch;
};

// Upserting keeps the demo usable even when a record only exists in the
// browser's localStorage (e.g. an employee added while the API was offline).
const writeEmployee = async (id, patch) => {
	const base = seedFallback(id);
	return Employee.findByIdAndUpdate(
		id,
		{
			$set: patch,
			$setOnInsert: {
				_id: id,
				fullName: base.fullName,
				position: base.position,
				department: base.department || "",
				email: base.email || "",
				phone: base.phone || "",
				address: base.address || "",
				assignments: [],
			},
		},
		{ new: true, upsert: true, runValidators: true }
	).lean();
};

router.get("/state", async (_request, response) => {
	const [{ state, persisted: statePersisted }, employees] = await Promise.all([
		readState(),
		readEmployees(),
	]);
	return response.json({
		success: true,
		...state,
		employees: employees.employees,
		persisted: statePersisted || employees.persisted,
	});
});

router.post("/employees", validateHrEmployee, async (request, response) => {
	const id = newId("emp");
	const record = publicEmployee({
		_id: id,
		...request.body,
		assignments: [],
		employmentStatus: request.body.employmentStatus || "active",
		payType: request.body.payType || "hourly",
		payRate: request.body.payRate ?? 0,
		hireDate: request.body.hireDate || "",
	});
	try {
		await Employee.create({
			...record,
			_id: id,
		});
		return response.status(201).json({ success: true, persisted: true, employee: record });
	} catch (error) {
		console.error("HR employee create failed:", error.message);
		return response.status(201).json({ success: true, persisted: false, employee: record });
	}
});

router.patch("/employees/:id", validateHrEmployeePatch, async (request, response) => {
	const { id } = request.params;
	const patch = employeePatch(request.body);
	if (Object.keys(patch).length === 0) {
		return response.status(400).json({ success: false, message: "No editable fields supplied" });
	}
	try {
		const employee = await writeEmployee(id, patch);
		return response.json({ success: true, persisted: true, employee: publicEmployee(employee) });
	} catch (error) {
		console.error("HR employee update failed:", error.message);
		const fallback = publicEmployee({ ...seedFallback(id), _id: id, ...patch });
		return response.json({ success: true, persisted: false, employee: fallback });
	}
});

router.patch("/employees/:id/status", validateHrEmploymentStatus, async (request, response) => {
	const { id } = request.params;
	const patch = { employmentStatus: request.body.status };
	try {
		const employee = await writeEmployee(id, patch);
		return response.json({ success: true, persisted: true, employee: publicEmployee(employee) });
	} catch (error) {
		console.error("HR employee status update failed:", error.message);
		return response.json({
			success: true,
			persisted: false,
			employee: publicEmployee({ ...seedFallback(id), _id: id, ...patch }),
		});
	}
});

router.put("/settings", validateHrSettings, async (request, response) => {
	const state = normalizeState(request.body);
	const persisted = await writeState(state);
	return response.json({ success: true, persisted, ...state });
});

router.post("/payroll", validatePayRun, async (request, response) => {
	const { state } = await readState();
	const run = {
		id: newId("payrun"),
		employeeId: request.body.employeeId,
		employeeName: request.body.employeeName,
		period: request.body.period,
		hours: request.body.hours,
		amount: request.body.amount,
		note: request.body.note || "",
		status: "paid",
		method: "Direct deposit",
		reference: `PR-${Date.now().toString().slice(-6)}`,
		paidAt: new Date().toISOString(),
	};
	state.payRuns = [run, ...state.payRuns].slice(0, 500);
	const persisted = await writeState(state);
	return response.status(201).json({ success: true, persisted, payRun: run });
});

// Decisions are an upsert so a request created in the browser (Schedule
// portal) can be approved even if the backend mirror has not seen it yet.
router.patch("/timeoff/:id", validateTimeOffDecision, async (request, response) => {
	const { id } = request.params;
	const { state } = await readState();
	const existing = state.timeOff.find((item) => item.id === id);
	const decision = {
		...(existing || {
			id,
			type: request.body.type || "time-off",
			employeeId: request.body.employeeId || "",
			employeeName: request.body.employeeName || "",
			date: request.body.date || "",
			endDate: request.body.endDate || request.body.date || "",
			reason: request.body.reason || "",
			createdAt: new Date().toISOString(),
		}),
		status: request.body.status,
		decidedBy: request.body.decidedBy || request.auth.name || "Owner",
		decidedAt: new Date().toISOString(),
	};
	state.timeOff = existing
		? state.timeOff.map((item) => (item.id === id ? decision : item))
		: [decision, ...state.timeOff];
	const persisted = await writeState(state);
	return response.json({ success: true, persisted, request: decision });
});

router.post("/notes", validatePerformanceNote, async (request, response) => {
	const { state } = await readState();
	const note = {
		id: newId("note"),
		employeeId: request.body.employeeId,
		author: request.body.author || request.auth.name || "Owner",
		date: new Date().toISOString(),
		text: request.body.text,
	};
	state.performanceNotes = [note, ...state.performanceNotes].slice(0, 500);
	const persisted = await writeState(state);
	return response.status(201).json({ success: true, persisted, note });
});

export default router;
