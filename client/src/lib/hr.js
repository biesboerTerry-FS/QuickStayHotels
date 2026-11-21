import { useEffect, useSyncExternalStore } from "react";
import { apiFetch } from "./api";
import { HR_SEED } from "../data/hrSeed";
import { updateRequestStatus } from "./schedule";
import { mergeEmployeesFromServer } from "./employees";

// Owner-only HR data. localStorage is the demo source of truth (the same
// pattern as bulletins and bookings); every change is also sent to the JWT
// protected /api/hr routes so it survives a browser reset when the API is
// available.
export const HR_STORAGE_KEY = "quickstay-hr";

const KEYS = ["departments", "roles", "payRuns", "performanceNotes"];
const listeners = new Set();
let cache = null;

const notify = () => listeners.forEach((listener) => listener());

const cloneSeed = () =>
	Object.fromEntries(KEYS.map((key) => [key, HR_SEED[key].map((item) => ({ ...item }))]));

const readStorage = () => {
	try {
		const raw = localStorage.getItem(HR_STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};

const writeStorage = (value) => {
	try {
		localStorage.setItem(HR_STORAGE_KEY, JSON.stringify(value));
	} catch {
		// storage unavailable – keep the in-memory value
	}
};

const normalize = (value) => {
	const seed = cloneSeed();
	if (!value || typeof value !== "object") return seed;
	for (const key of KEYS) {
		if (Array.isArray(value[key])) seed[key] = value[key].map((item) => ({ ...item }));
	}
	return seed;
};

const load = () => {
	if (cache) return cache;
	cache = normalize(readStorage());
	writeStorage(cache);
	return cache;
};

const subscribe = (listener) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

export const getHrState = load;
export const useHrState = () => useSyncExternalStore(subscribe, load, cloneSeed);

const hrRequest = async (path, options = {}) => {
	try {
		const response = await apiFetch(path, {
			...options,
			headers: { "Content-Type": "application/json", ...(options.headers || {}) },
		});
		if (!response.ok) return null;
		return await response.json().catch(() => null);
	} catch {
		return null;
	}
};

const update = (updater) => {
	const next = updater(load());
	cache = normalize(next);
	writeStorage(cache);
	notify();
	return cache;
};

const idFor = (prefix) =>
	`${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// Merge server data without dropping local changes made while offline.
const mergeById = (local = [], remote = []) => {
	const merged = [...local];
	const seen = new Set(local.map((item) => item.id));
	for (const item of remote) {
		if (item?.id && !seen.has(item.id)) {
			merged.push({ ...item });
			seen.add(item.id);
		}
	}
	return merged;
};

export const useHrRefresh = () => {
	useEffect(() => {
		refreshFromServer();
	}, []);
};

export const refreshFromServer = async () => {
	const data = await hrRequest("/api/hr/state");
	if (!data?.success) return false;
	mergeEmployeesFromServer(data.employees);
	update((current) => ({
		...current,
		departments: mergeById(current.departments, data.departments),
		roles: mergeById(current.roles, data.roles),
		payRuns: mergeById(current.payRuns, data.payRuns),
		performanceNotes: mergeById(current.performanceNotes, data.performanceNotes),
	}));
	return Boolean(data.persisted);
};

export const addDepartment = async ({ name, description = "" }) => {
	const department = {
		id: idFor("dept"),
		name: String(name || "").trim().slice(0, 120),
		description: String(description || "").trim().slice(0, 300),
	};
	if (!department.name) return null;
	update((current) => ({ ...current, departments: [...current.departments, department] }));
	const next = load();
	await hrRequest("/api/hr/settings", {
		method: "PUT",
		body: JSON.stringify({ departments: next.departments, roles: next.roles }),
	});
	return department;
};

export const removeDepartment = async (id) => {
	update((current) => ({
		...current,
		departments: current.departments.filter((item) => item.id !== id),
	}));
	const next = load();
	await hrRequest("/api/hr/settings", {
		method: "PUT",
		body: JSON.stringify({ departments: next.departments, roles: next.roles }),
	});
};

export const addRole = async ({ label, department = "" }) => {
	const role = {
		id: idFor("role"),
		label: String(label || "").trim().slice(0, 120),
		department: String(department || "").trim().slice(0, 120),
	};
	if (!role.label) return null;
	update((current) => ({ ...current, roles: [...current.roles, role] }));
	const next = load();
	await hrRequest("/api/hr/settings", {
		method: "PUT",
		body: JSON.stringify({ departments: next.departments, roles: next.roles }),
	});
	return role;
};

export const removeRole = async (id) => {
	update((current) => ({ ...current, roles: current.roles.filter((item) => item.id !== id) }));
	const next = load();
	await hrRequest("/api/hr/settings", {
		method: "PUT",
		body: JSON.stringify({ departments: next.departments, roles: next.roles }),
	});
};

export const validatePayRunForm = (form) => {
	if (!form.employeeId) return "Choose an employee";
	if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(form.period || "")) return "Choose a valid pay period";
	if (Number(form.hours) <= 0 || Number(form.hours) > 1000) return "Hours must be between 1 and 1000";
	if (Number(form.amount) <= 0 || !Number.isFinite(Number(form.amount))) return "Amount must be greater than zero";
	return null;
};

export const addPayRun = async (form) => {
	const run = {
		id: idFor("payrun"),
		employeeId: form.employeeId,
		employeeName: form.employeeName,
		period: form.period,
		hours: Number(form.hours),
		amount: Number(form.amount),
		note: String(form.note || "").trim().slice(0, 500),
		status: "paid",
		method: "Direct deposit",
		reference: `PR-${Date.now().toString().slice(-6)}`,
		paidAt: new Date().toISOString(),
	};
	update((current) => ({ ...current, payRuns: [run, ...current.payRuns] }));
	await hrRequest("/api/hr/payroll", {
		method: "POST",
		body: JSON.stringify({
			employeeId: run.employeeId,
			employeeName: run.employeeName,
			period: run.period,
			hours: run.hours,
			amount: run.amount,
			note: run.note,
		}),
	});
	return run;
};

export const addPerformanceNote = async ({ employeeId, employeeName, text, author }) => {
	const note = {
		id: idFor("note"),
		employeeId,
		employeeName,
		author: String(author || "Demo Owner").trim().slice(0, 120) || "Demo Owner",
		date: new Date().toISOString(),
		text: String(text || "").trim().slice(0, 2000),
	};
	if (!employeeId || !note.text) return null;
	update((current) => ({ ...current, performanceNotes: [note, ...current.performanceNotes] }));
	await hrRequest("/api/hr/notes", {
		method: "POST",
		body: JSON.stringify({ employeeId, text: note.text, author: note.author }),
	});
	return note;
};

// Approvals update the existing Schedule store first, so the employee portal
// sees the new status immediately, then mirror the decision to the HR API.
export const decideTimeOff = async (request, status) => {
	updateRequestStatus(request.id, status);
	await hrRequest(`/api/hr/timeoff/${encodeURIComponent(request.id)}`, {
		method: "PATCH",
		body: JSON.stringify({
			status,
			decidedBy: "Demo Owner",
			type: request.type || "time-off",
			employeeId: request.employeeId || "",
			employeeName: request.employeeName || "",
			date: request.date || "",
			endDate: request.endDate || request.date || "",
			reason: request.reason || "",
		}),
	});
};
