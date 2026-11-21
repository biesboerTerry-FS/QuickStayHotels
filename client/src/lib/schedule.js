import { useSyncExternalStore } from "react";
import { syncPortalState } from "./portalState";
import { TIME_OFF_SEED_REQUESTS } from "../data/hrSeed";

// Schedule requests, time-off requests and the availability toggle are
// persisted locally so both portals work without a database.
export const SCHEDULE_STORAGE_KEY = "quickstay-schedule";
export const DEMO_EMPLOYEE_ID = "demo_employee_1";

const SEED_STATE = {
	// Shared with the owner HR time-off queue so both portals see the same
	// requests and approvals.
	requests: TIME_OFF_SEED_REQUESTS,
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
		// Add any new demo requests without losing approvals/decisions already
		// stored in this browser.
		const known = new Set(stored.requests.map((item) => item.id));
		const missing = SEED_STATE.requests.filter((item) => !known.has(item.id));
		cache = {
			...stored,
			requests: [...stored.requests, ...missing.map((item) => ({ ...item }))],
		};
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
