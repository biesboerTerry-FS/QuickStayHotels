import { useSyncExternalStore } from "react";
import { apiFetch } from "./api";
import { syncPortalState } from "./portalState";
import { TIME_OFF_BLOCK_SEED, TIME_OFF_SEED_REQUESTS } from "../data/hrSeed";

// Schedule requests, time-off requests and the availability toggle are
// persisted locally so both portals work without a database. Partial-day
// availability blocks live in the same request list (`kind: "block"`) so the
// owner HR approval flow works unchanged, and are mirrored to the JWT
// protected /api/employee/timeoff + /api/hr routes when the API is reachable.
export const SCHEDULE_STORAGE_KEY = "quickstay-schedule";
export const DEMO_EMPLOYEE_ID = "demo_employee_1";

const SEED_STATE = {
	// Shared with the owner HR time-off queue so both portals see the same
	// requests and approvals.
	requests: [...TIME_OFF_SEED_REQUESTS, ...TIME_OFF_BLOCK_SEED],
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
	}
	writeStorage(cache);
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

const newRequestId = (prefix) =>
	`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

const buildRequest = ({
	type,
	kind,
	employeeId,
	employeeName,
	date,
	endDate,
	reason,
	startTime,
	endTime,
}) => ({
	id: newRequestId(kind === "block" ? "block" : "req"),
	type: type === "time-off" || kind === "block" ? "time-off" : "shift",
	kind: kind || "request",
	employeeId,
	employeeName,
	date,
	endDate: endDate || date,
	startTime: startTime || "",
	endTime: endTime || "",
	reason: String(reason || "").trim().slice(0, 500),
	status: "pending",
	createdAt: new Date().toISOString(),
});

export const submitRequest = (input) => {
	const request = buildRequest(input);
	setSchedule((current) => ({ ...current, requests: [request, ...current.requests] }));
	return request;
};

const blockRequest = (block) => ({
	id: block.id,
	type: "time-off",
	kind: "block",
	employeeId: block.employeeId || "",
	employeeName: block.employeeName || "",
	date: block.date || "",
	endDate: block.date || "",
	startTime: block.startTime || "",
	endTime: block.endTime || "",
	reason: block.reason || "",
	status: ["pending", "approved", "denied"].includes(block.status)
		? block.status
		: "pending",
	createdAt: block.createdAt || new Date().toISOString(),
});

export const getBlocks = (employeeId, requests = getSchedule().requests) =>
	requests.filter(
		(item) =>
			item.kind === "block" && (!employeeId || item.employeeId === employeeId)
	);

const blockRequestApi = async (path, options) => {
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

export const addAvailabilityBlock = async (input) => {
	if (!input.date || !input.startTime || !input.endTime || input.endTime <= input.startTime) {
		return null;
	}
	const request = submitRequest({ ...input, type: "time-off", kind: "block" });
	await blockRequestApi("/api/employee/timeoff", {
		method: "POST",
		body: JSON.stringify({
			id: request.id,
			employeeId: request.employeeId,
			employeeName: request.employeeName,
			date: request.date,
			startTime: request.startTime,
			endTime: request.endTime,
			reason: request.reason,
		}),
	});
	return request;
};

export const removeAvailabilityBlock = async (id) => {
	setSchedule((current) => ({
		...current,
		requests: current.requests.filter((item) => item.id !== id),
	}));
	await blockRequestApi(`/api/employee/timeoff/${encodeURIComponent(id)}`, {
		method: "DELETE",
	});
};

// Pull blocks created on another browser/session. Local edits and decisions
// always win; only genuinely new ids (or newly decided statuses) are merged.
export const syncBlocksFromServer = async (scope = "self") => {
	const data = await blockRequestApi(
		scope === "all" ? "/api/hr/timeoff-blocks" : "/api/employee/timeoff"
	);
	if (!Array.isArray(data?.blocks) || data.blocks.length === 0) return false;
	const remote = new Map(data.blocks.map((block) => [block.id, block]));
	setSchedule((current) => {
		const known = new Set(current.requests.map((item) => item.id));
		let changed = false;
		const requests = current.requests.map((item) => {
			const match = remote.get(item.id);
			if (
				item.kind === "block" &&
				match &&
				match.status &&
				match.status !== "pending" &&
				item.status === "pending"
			) {
				changed = true;
				return { ...item, status: match.status };
			}
			return item;
		});
		const additions = data.blocks
			.filter((block) => block.id && !known.has(block.id))
			.map(blockRequest);
		if (additions.length) changed = true;
		return changed ? { ...current, requests: [...requests, ...additions] } : current;
	});
	return true;
};

export const updateRequestStatus = (id, status) =>
	setSchedule((current) => ({
		...current,
		requests: current.requests.map((item) =>
			item.id === id ? { ...item, status } : item
		),
	}));
