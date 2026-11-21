import { useSyncExternalStore } from "react";
import { syncPortalState } from "./portalState";

// Schedule requests, time-off requests and the availability toggle are
// persisted locally so both portals work without a database.
export const SCHEDULE_STORAGE_KEY = "quickstay-schedule";
export const DEMO_EMPLOYEE_ID = "demo_employee_1";

const dateFromToday = (offset) => {
	const date = new Date();
	date.setHours(12, 0, 0, 0);
	date.setDate(date.getDate() + offset);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
		date.getDate()
	).padStart(2, "0")}`;
};

const SEED_STATE = {
	requests: [
		{
			id: "req_shift_1",
			type: "shift",
			employeeId: DEMO_EMPLOYEE_ID,
			employeeName: "Maya Martinez",
			date: dateFromToday(4),
			reason: "Prefer the evening shift to cover the VIP arrival.",
			status: "pending",
			createdAt: "2026-11-19T09:00:00.000Z",
		},
		{
			id: "req_timeoff_1",
			type: "time-off",
			employeeId: DEMO_EMPLOYEE_ID,
			employeeName: "Maya Martinez",
			date: dateFromToday(10),
			endDate: dateFromToday(11),
			reason: "Personal appointment.",
			status: "pending",
			createdAt: "2026-11-18T14:20:00.000Z",
		},
		{
			id: "req_timeoff_2",
			type: "time-off",
			employeeId: "demo_employee_2",
			employeeName: "Daniel Kim",
			date: dateFromToday(6),
			endDate: dateFromToday(6),
			reason: "Annual leave.",
			status: "approved",
			createdAt: "2026-11-17T10:00:00.000Z",
		},
	],
	availability: { [DEMO_EMPLOYEE_ID]: true, demo_employee_2: true },
};

const listeners = new Set();
let cache = null;

const notify = () => listeners.forEach((listener) => listener());

const readStorage = () => {
	try {
		const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};

const writeStorage = (value) => {
	try {
		localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(value));
	} catch {
		// storage unavailable
	}
};

const load = () => {
	if (cache) return cache;
	const stored = readStorage();
	if (stored && Array.isArray(stored.requests) && stored.availability) {
		cache = stored;
	} else {
		cache = {
			requests: SEED_STATE.requests.map((item) => ({ ...item })),
			availability: { ...SEED_STATE.availability },
		};
		writeStorage(cache);
	}
	return cache;
};

const setSchedule = (updater) => {
	const current = load();
	cache = typeof updater === "function" ? updater(current) : updater;
	writeStorage(cache);
	notify();
	syncPortalState();
	return cache;
};

const subscribe = (listener) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

export const getSchedule = load;
export const useSchedule = () => useSyncExternalStore(subscribe, load, () => SEED_STATE);

export const getRequestsFor = (employeeId, requests = getSchedule().requests) =>
	employeeId ? requests.filter((item) => item.employeeId === employeeId) : requests;

export const isAvailable = (employeeId) => getSchedule().availability[employeeId] !== false;

export const setAvailability = (employeeId, available) =>
	setSchedule((current) => ({
		...current,
		availability: { ...current.availability, [employeeId]: Boolean(available) },
	}));

export const submitRequest = ({ type, employeeId, employeeName, date, endDate, reason }) =>
	setSchedule((current) => ({
		...current,
		requests: [
			{
				id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
				type: type === "time-off" ? "time-off" : "shift",
				employeeId,
				employeeName,
				date,
				endDate: endDate || date,
				reason: String(reason || "").trim().slice(0, 500),
				status: "pending",
				createdAt: new Date().toISOString(),
			},
			...current.requests,
		],
	}));

export const updateRequestStatus = (id, status) =>
	setSchedule((current) => ({
		...current,
		requests: current.requests.map((item) =>
			item.id === id ? { ...item, status } : item
		),
	}));
