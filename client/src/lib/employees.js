import { useSyncExternalStore } from "react";

// Demo employee records are kept in localStorage, like bulletins and bookings.
// The backend exposes a matching Employee model + GET/PATCH /api/employee/me,
// but the demo never depends on a network call so edits always persist.
export const EMPLOYEE_STORAGE_KEY = "quickstay-employees";
export const DEMO_EMPLOYEE_ID = "demo_employee_1";
export const EMPLOYEE_EDITABLE_FIELDS = ["fullName", "email", "phone", "address"];

const dateFromToday = (offset) => {
	const date = new Date();
	date.setHours(12, 0, 0, 0);
	date.setDate(date.getDate() + offset);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

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

const load = () => {
	if (cache !== null) return cache;
	let value = readStorage();
	if (!Array.isArray(value) || value.length === 0) {
		value = cloneSeeds();
		writeStorage(value);
	}
	cache = value;
	return cache;
};

export const getEmployees = load;

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
