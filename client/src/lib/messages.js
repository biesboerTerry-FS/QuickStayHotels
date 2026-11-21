import { useSyncExternalStore } from "react";
import { syncPortalState } from "./portalState";

// Messages are seeded per role and persisted in localStorage. The backend
// mirror is best-effort; the inbox never depends on a network call.
export const MESSAGES_STORAGE_KEY = "quickstay-messages";

const SEED_MESSAGES = [
	{
		id: "msg_owner_1",
		audience: "owner",
		subject: "New booking needs confirmation",
		sender: "Booking system",
		body: "A new reservation for the Family Suite is pending. Please confirm it from the Orders page so the front desk can prepare the room.",
		date: "2026-11-20T08:15:00.000Z",
		read: false,
	},
	{
		id: "msg_owner_2",
		audience: "owner",
		subject: "Guest question about late check-in",
		sender: "Emma Rodriguez",
		body: "Hi, our flight is delayed and we should arrive around 23:00. Is late check-in possible? Thank you!",
		date: "2026-11-19T16:40:00.000Z",
		read: false,
	},
	{
		id: "msg_owner_3",
		audience: "owner",
		subject: "Housekeeping report",
		sender: "Daniel Kim",
		body: "East wing floors are inspected and ready. Two rooms are awaiting a final linen check before check-in.",
		date: "2026-11-18T11:05:00.000Z",
		read: true,
	},
	{
		id: "msg_employee_1",
		audience: "employee",
		subject: "Shift swap approved",
		sender: "Front Desk Manager",
		body: "Your request to swap next Saturday's morning shift has been approved. Please check the Schedule page for the updated assignment.",
		date: "2026-11-20T07:30:00.000Z",
		read: false,
	},
	{
		id: "msg_employee_2",
		audience: "employee",
		subject: "VIP arrival tomorrow",
		sender: "Hotel Owner",
		body: "A VIP guest arrives tomorrow at 09:30. Please have Suite 402 ready and notify me when the room is inspected.",
		date: "2026-11-19T18:10:00.000Z",
		read: false,
	},
];

const listeners = new Set();
let cache = null;

const notify = () => listeners.forEach((listener) => listener());

const readStorage = () => {
	try {
		const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};

const load = () => {
	if (cache) return cache;
	const stored = readStorage();
	if (Array.isArray(stored)) {
		cache = stored;
	} else {
		cache = SEED_MESSAGES.map((item) => ({ ...item }));
		writeStorage(cache);
	}
	return cache;
};

const writeStorage = (value) => {
	try {
		localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(value));
	} catch {
		// storage unavailable
	}
};

const setMessages = (updater) => {
	cache = typeof updater === "function" ? updater(load()) : updater;
	writeStorage(cache);
	notify();
	syncPortalState();
	return cache;
};

const subscribe = (listener) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

export const getMessages = load;
export const useMessages = () => useSyncExternalStore(subscribe, load, () => SEED_MESSAGES);

export const getMessagesFor = (audience, list = getMessages()) =>
	list
		.filter((message) => message.audience === audience)
		.slice()
		.sort((a, b) => new Date(b.date) - new Date(a.date));

export const getMessage = (id) => getMessages().find((message) => message.id === id) || null;

export const markRead = (id) =>
	setMessages((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item)));

export const sendMessage = ({ audience, subject, sender, body }) => {
	const message = {
		id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
		audience: audience === "employee" ? "employee" : "owner",
		subject: String(subject || "").trim().slice(0, 120) || "New message",
		sender: String(sender || "QuickStay team").trim().slice(0, 120),
		body: String(body || "").trim().slice(0, 2000),
		date: new Date().toISOString(),
		read: false,
	};
	setMessages((list) => [message, ...list]);
	return message;
};
