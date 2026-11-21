import { useSyncExternalStore } from "react";

// Bulletins are persisted in localStorage only (demo mode). No backend calls.
export const BULLETINS_STORAGE_KEY = "quickstay-bulletins";

export const BULLETIN_TYPES = ["info", "warning", "promotion"];

const SEED_BULLETINS = [
	{
		id: "bulletin_welcome",
		title: "Welcome to the new admin panel",
		body: "You can now post announcements for your team here. Use bulletins to share important updates, warnings, and promotions.",
		type: "info",
		active: true,
		createdAt: "2026-11-18T09:00:00.000Z",
	},
	{
		id: "bulletin_maintenance",
		title: "Scheduled maintenance this weekend",
		body: "The booking engine will be briefly unavailable Sunday from 02:00 to 04:00 UTC while we apply updates. Please plan accordingly.",
		type: "warning",
		active: true,
		createdAt: "2026-11-17T14:30:00.000Z",
	},
	{
		id: "bulletin_holiday",
		title: "Holiday special: 20% off extended stays",
		body: "A draft promotion for the upcoming holiday season. Enable it when the campaign is ready to go live.",
		type: "promotion",
		active: false,
		createdAt: "2026-11-16T11:00:00.000Z",
	},
];

const listeners = new Set();
let cache = null;

const notify = () => listeners.forEach((listener) => listener());

const readStorage = () => {
	try {
		const raw = localStorage.getItem(BULLETINS_STORAGE_KEY);
		return raw === null ? null : JSON.parse(raw);
	} catch {
		return null;
	}
};

const writeStorage = (value) => {
	try {
		localStorage.setItem(BULLETINS_STORAGE_KEY, JSON.stringify(value));
	} catch {
		// Storage unavailable (private mode / full): keep the in-memory value.
	}
};

const load = () => {
	if (cache !== null) return cache;
	let value = readStorage();
	if (!Array.isArray(value)) {
		// First load with empty localStorage: seed demo bulletins once.
		value = SEED_BULLETINS.map((item) => ({ ...item }));
		writeStorage(value);
	}
	cache = value;
	return cache;
};

export const getBulletins = () => load();

/** Active bulletins only, newest first. Safe to call outside React. */
export const getActiveBulletins = (list = getBulletins()) =>
	list
		.filter((bulletin) => bulletin.active)
		.slice()
		.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const setBulletins = (updater) => {
	const next = typeof updater === "function" ? updater(load()) : updater;
	cache = Array.isArray(next) ? next : [];
	writeStorage(cache);
	notify();
	return cache;
};

export const createBulletin = ({ title, body, type, active }) => {
	const bulletin = {
		id: `bulletin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
		title: title.trim(),
		body: body.trim(),
		type: BULLETIN_TYPES.includes(type) ? type : "info",
		active: Boolean(active),
		createdAt: new Date().toISOString(),
	};
	setBulletins((list) => [bulletin, ...list]);
	return bulletin;
};

export const updateBulletin = (id, patch) =>
	setBulletins((list) =>
		list.map((item) => (item.id === id ? { ...item, ...patch } : item))
	);

export const deleteBulletin = (id) =>
	setBulletins((list) => list.filter((item) => item.id !== id));

export const toggleBulletin = (id) =>
	setBulletins((list) =>
		list.map((item) =>
			item.id === id ? { ...item, active: !item.active } : item
		)
	);

if (typeof window !== "undefined") {
	window.addEventListener("storage", (event) => {
		if (event.key !== BULLETINS_STORAGE_KEY) return;
		cache = readStorage() || [];
		notify();
	});
}

const subscribe = (listener) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

export const useBulletins = () =>
	useSyncExternalStore(subscribe, getBulletins, () => SEED_BULLETINS);
