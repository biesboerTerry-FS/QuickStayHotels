import { useSyncExternalStore } from "react";
import { apiFetch } from "./api";

// Fulfillment status is stored separately from payment status so the existing
// booking flow stays intact. The backend is attempted first, localStorage is
// always updated so the demo works offline.
const STORAGE_KEY = "quickstay-fulfillment";
export const FULFILLMENT_STATUSES = ["pending", "confirmed", "checked-in", "completed"];

const listeners = new Set();
const EMPTY = Object.freeze({});
let cache = null;

const notify = () => listeners.forEach((listener) => listener());

const readStorage = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};

const load = () => {
	if (cache) return cache;
	const stored = readStorage();
	cache = stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
	return cache;
};

const subscribe = (listener) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

export const getFulfillmentMap = load;
export const useFulfillment = () => useSyncExternalStore(subscribe, load, () => EMPTY);

export const getFulfillmentStatus = (booking) => {
	if (booking?.status === "cancelled") return "cancelled";
	return load()[booking?._id] || "pending";
};

export const nextFulfillmentStatus = (booking) => {
	const current = getFulfillmentStatus(booking);
	const index = FULFILLMENT_STATUSES.indexOf(current);
	if (index < 0 || index >= FULFILLMENT_STATUSES.length - 1) return null;
	return FULFILLMENT_STATUSES[index + 1];
};

export const setFulfillmentStatus = (booking, status) => {
	if (!booking?._id || !FULFILLMENT_STATUSES.includes(status)) return;
	cache = { ...load(), [booking._id]: status };
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
	} catch {
		// storage unavailable: keep the in-memory value for this session
	}
	notify();

	apiFetch(`/api/booking/${encodeURIComponent(booking._id)}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status }),
	}).catch(() => {
		// localStorage fallback already applied; no need to surface an error.
	});
};

export const advanceBooking = (booking) => {
	const next = nextFulfillmentStatus(booking);
	if (next) setFulfillmentStatus(booking, next);
	return next;
};
