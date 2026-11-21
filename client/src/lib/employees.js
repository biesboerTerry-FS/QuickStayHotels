import { useSyncExternalStore } from "react";
import { apiFetch } from "./api";
import { dateFromToday } from "../data/hrSeed";

// Demo employee records are kept in localStorage, like bulletins and bookings.
// The backend exposes a matching Employee model + GET/PATCH /api/employee/me,
// but the demo never depends on a network call so edits always persist. The
// owner-only HR suite uses the same store and also mirrors changes to the
// JWT-protected /api/hr routes when the API is reachable.
export const EMPLOYEE_STORAGE_KEY = "quickstay-employees";
export const DEMO_EMPLOYEE_ID = "demo_employee_1";
export const EMPLOYEE_EDITABLE_FIELDS = ["fullName", "email", "phone", "address"];

// Only the owner/admin HR routes may write these fields.
export const HR_EDITABLE_FIELDS = [
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
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SEED_EMPLOYEES = [
	{
		id: DEMO_EMPLOYEE_ID,
		fullName: "Maya Martinez",
		position: "Front Desk Agent",
		department: "Guest Services",
		email: "maya.martinez@quickstay.dev",
		phone: "+1 (415) 555-0134",
		address: "218 Harbor Street, Apt 4B, San Francisco, CA 94105",
		assignments: [
			{
				id: "shift_maya_1",
				title: "Front desk · Morning shift",
				date: dateFromToday(1),
				startTime: "07:00",
				endTime: "15:00",
				location: "QuickStay Downtown · Main lobby",
			},
			{
				id: "shift_maya_2",
				title: "VIP arrival handover",
				date: dateFromToday(3),
				startTime: "09:30",
				endTime: "11:00",
				location: "QuickStay Downtown · Suite 402",
			},
		],
		employmentStatus: "active",
		payType: "hourly",
		payRate: 24,
		hireDate: "2023-03-14",
	},
	{
		id: "demo_employee_2",
		fullName: "Daniel Kim",
		position: "Housekeeping Supervisor",
		department: "Operations",
		email: "daniel.kim@quickstay.dev",
		phone: "+1 (415) 555-0187",
		address: "76 Pine Avenue, Oakland, CA 94612",
		assignments: [
			{
				id: "shift_daniel_1",
				title: "Floor inspection · East wing",
				date: dateFromToday(2),
				startTime: "08:00",
				endTime: "16:30",
				location: "QuickStay Downtown · East wing",
			},
		],
		employmentStatus: "active",
		payType: "salary",
		payRate: 62000,
		hireDate: "2021-08-02",
	},
	{
		id: "demo_employee_3",
		fullName: "Sofia Reyes",
		position: "Guest Relations Manager",
		department: "Guest Services",
		email: "sofia.reyes@quickstay.dev",
		phone: "+1 (415) 555-0162",
		address: "1440 Market Street, San Francisco, CA 94102",
		assignments: [
			{
				id: "shift_sofia_1",
				title: "VIP guest welcome · Tower B",
				date: dateFromToday(2),
				startTime: "10:00",
				endTime: "18:00",
				location: "QuickStay Downtown · Tower B",
			},
		],
		employmentStatus: "active",
		payType: "salary",
		payRate: 78000,
		hireDate: "2020-06-18",
	},
	{
		id: "demo_employee_4",
		fullName: "Marcus Thompson",
		position: "Housekeeping Attendant",
		department: "Housekeeping",
		email: "marcus.thompson@quickstay.dev",
		phone: "+1 (510) 555-0148",
		address: "908 Broadway, Oakland, CA 94607",
		assignments: [
			{
				id: "shift_marcus_1",
				title: "Room turnover · Floors 4-6",
				date: dateFromToday(1),
				startTime: "08:00",
				endTime: "16:00",
				location: "QuickStay Downtown · Floors 4-6",
			},
		],
		employmentStatus: "active",
		payType: "hourly",
		payRate: 19.5,
		hireDate: "2024-01-09",
	},
	{
		id: "demo_employee_5",
		fullName: "Priya Patel",
		position: "Food & Beverage Supervisor",
		department: "Food & Beverage",
		email: "priya.patel@quickstay.dev",
		phone: "+1 (415) 555-0119",
		address: "330 Brannan Street, San Francisco, CA 94107",
		assignments: [
			{
				id: "shift_priya_1",
				title: "Breakfast service · Terrace",
				date: dateFromToday(3),
				startTime: "06:30",
				endTime: "14:30",
				location: "QuickStay Downtown · Terrace",
			},
		],
		employmentStatus: "active",
		payType: "salary",
		payRate: 66000,
		hireDate: "2022-04-25",
	},
	{
		id: "demo_employee_6",
		fullName: "Ethan Brooks",
		position: "Maintenance Engineer",
		department: "Engineering",
		email: "ethan.brooks@quickstay.dev",
		phone: "+1 (510) 555-0176",
		address: "512 8th Street, Oakland, CA 94607",
		assignments: [
			{
				id: "shift_ethan_1",
				title: "HVAC inspection · Penthouse",
				date: dateFromToday(2),
				startTime: "09:00",
				endTime: "17:00",
				location: "QuickStay Downtown · Penthouse",
			},
		],
		employmentStatus: "active",
		payType: "hourly",
		payRate: 28,
		hireDate: "2019-11-04",
	},
	{
		id: "demo_employee_7",
		fullName: "Aisha Johnson",
		position: "Sales & Marketing Coordinator",
		department: "Sales & Marketing",
		email: "aisha.johnson@quickstay.dev",
		phone: "+1 (415) 555-0193",
		address: "75 Mission Street, Apt 12F, San Francisco, CA 94105",
		assignments: [
			{
				id: "shift_aisha_1",
				title: "Corporate rate follow-ups",
				date: dateFromToday(4),
				startTime: "09:00",
				endTime: "17:00",
				location: "QuickStay Downtown · Sales office",
			},
		],
		employmentStatus: "active",
		payType: "salary",
		payRate: 58000,
		hireDate: "2023-09-12",
	},
	{
		id: "demo_employee_8",
		fullName: "Noah Williams",
		position: "Security Officer",
		department: "Security",
		email: "noah.williams@quickstay.dev",
		phone: "+1 (510) 555-0126",
		address: "1180 Ashby Avenue, Berkeley, CA 94710",
		assignments: [],
		employmentStatus: "inactive",
		payType: "hourly",
		payRate: 22,
		hireDate: "2022-02-14",
	},
];

const listeners = new Set();
let cache = null;

const notify = () => listeners.forEach((listener) => listener());

const readStorage = () => {
	try {
		const raw = localStorage.getItem(EMPLOYEE_STORAGE_KEY);
		return raw === null ? null : JSON.parse(raw);
	} catch {
		return null;
	}
};

const writeStorage = (value) => {
	try {
		localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(value));
	} catch {
		// Storage unavailable (private mode / full): keep the in-memory value.
	}
};

const cloneSeeds = () =>
	SEED_EMPLOYEES.map((employee) => ({
		...employee,
		assignments: employee.assignments.map((assignment) => ({ ...assignment })),
	}));

// Stored records from older demos may not have the HR fields yet. Fill them
// from the matching seed so existing localStorage data keeps working.
const normalize = (employee) => {
	const seed = SEED_EMPLOYEES.find((item) => item.id === employee.id) || {};
	return {
		...seed,
		...employee,
		assignments: Array.isArray(employee.assignments) ? employee.assignments : [],
		employmentStatus: employee.employmentStatus || seed.employmentStatus || "active",
		payType: employee.payType || seed.payType || "hourly",
		payRate: typeof employee.payRate === "number" ? employee.payRate : seed.payRate || 0,
		hireDate: employee.hireDate || seed.hireDate || "",
	};
};

const load = () => {
	if (cache !== null) return cache;
	let value = readStorage();
	if (!Array.isArray(value) || value.length === 0) {
		value = cloneSeeds();
	} else {
		const known = new Set(value.map((employee) => employee.id));
		const missing = SEED_EMPLOYEES.filter((employee) => !known.has(employee.id));
		value = [...value, ...missing.map((employee) => ({ ...employee }))];
	}
	cache = value.map(normalize);
	writeStorage(cache);
	return cache;
};

export const getEmployees = load;
export const useEmployees = () =>
	useSyncExternalStore(subscribe, load, cloneSeeds);

export const getEmployee = (id) => load().find((employee) => employee.id === id) || null;

export const updateEmployee = (id, patch) => {
	const clean = {};
	for (const field of EMPLOYEE_EDITABLE_FIELDS) {
		if (typeof patch?.[field] === "string") {
			clean[field] = patch[field].trim().slice(0, 200);
		}
	}
	cache = load().map((employee) =>
		employee.id === id ? { ...employee, ...clean } : employee
	);
	writeStorage(cache);
	notify();
	return getEmployee(id);
};

const hrRequest = async (path, options) => {
	try {
		const response = await apiFetch(path, {
			...options,
			headers: { "Content-Type": "application/json", ...(options.headers || {}) },
		});
		if (!response.ok) return null;
		return await response.json().catch(() => null);
	} catch {
		// localStorage remains the source of truth in demo mode.
		return null;
	}
};

const cleanHrFields = (patch = {}) => {
	const clean = {};
	for (const field of HR_EDITABLE_FIELDS) {
		const value = patch[field];
		if (value === undefined) continue;
		if (field === "payRate") {
			const rate = Number(value);
			clean[field] = Number.isFinite(rate) ? Math.max(0, Math.round(rate * 100) / 100) : 0;
		} else if (field === "employmentStatus") {
			clean[field] = value === "inactive" ? "inactive" : "active";
		} else if (field === "payType") {
			clean[field] = value === "salary" ? "salary" : "hourly";
		} else if (typeof value === "string") {
			clean[field] = value.trim().slice(0, 300);
		}
	}
	return clean;
};

export const validateHrEmployee = (form) => {
	if (!form.fullName?.trim()) return "Full name is required";
	if (!form.position?.trim()) return "Position is required";
	if (!form.email?.trim()) return "Email is required";
	if (!EMAIL_RE.test(form.email.trim())) return "Enter a valid email address";
	if (Number(form.payRate) < 0 || !Number.isFinite(Number(form.payRate))) {
		return "Pay rate must be zero or greater";
	}
	return null;
};

const newId = () =>
	`emp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const createEmployee = async (form) => {
	const clean = cleanHrFields(form);
	const employee = normalize({
		id: newId(),
		...clean,
		assignments: [],
	});
	cache = [employee, ...load()];
	writeStorage(cache);
	notify();
	await hrRequest("/api/hr/employees", {
		method: "POST",
		body: JSON.stringify({
			fullName: clean.fullName,
			position: clean.position,
			department: clean.department || "",
			email: clean.email,
			phone: clean.phone || "",
			address: clean.address || "",
			employmentStatus: clean.employmentStatus || "active",
			payType: clean.payType || "hourly",
			payRate: clean.payRate || 0,
			hireDate: clean.hireDate,
		}),
	});
	return employee;
};

export const updateHrEmployee = async (id, patch) => {
	const clean = cleanHrFields(patch);
	cache = load().map((employee) =>
		employee.id === id ? { ...employee, ...clean } : employee
	);
	writeStorage(cache);
	notify();
	await hrRequest(`/api/hr/employees/${encodeURIComponent(id)}`, {
		method: "PATCH",
		body: JSON.stringify(clean),
	});
	return getEmployee(id);
};

export const setEmployeeStatus = async (id, status) => {
	const employmentStatus = status === "inactive" ? "inactive" : "active";
	cache = load().map((employee) =>
		employee.id === id ? { ...employee, employmentStatus } : employee
	);
	writeStorage(cache);
	notify();
	await hrRequest(`/api/hr/employees/${encodeURIComponent(id)}/status`, {
		method: "PATCH",
		body: JSON.stringify({ status: employmentStatus }),
	});
	return getEmployee(id);
};

if (typeof window !== "undefined") {
	window.addEventListener("storage", (event) => {
		if (event.key !== EMPLOYEE_STORAGE_KEY) return;
		cache = readStorage() || cloneSeeds();
		notify();
	});
}

const subscribe = (listener) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

export const useEmployee = (id) =>
	useSyncExternalStore(
		subscribe,
		() => getEmployee(id),
		() => SEED_EMPLOYEES.find((employee) => employee.id === id) || null
	);
