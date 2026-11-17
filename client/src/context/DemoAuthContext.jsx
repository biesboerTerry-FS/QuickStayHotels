import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getState, setState } from "../data/store";
import { createBooking } from "../lib/bookings";
import { toDay } from "../lib/format";
import { catalogRooms } from "../data/catalog";

const DEMO_KEY = "quickstay:demo";
const DEMO_ENABLED = import.meta.env.VITE_DEMO_MODE === "true";

const demoUsers = {
	guest: {
		id: "demo_guest",
		fullName: "Demo Guest",
		username: "demo_guest",
		primaryEmailAddress: { emailAddress: "demo-guest@quickstay.dev" },
		publicMetadata: { role: "guest" },
	},
	owner: {
		id: "demo_owner",
		fullName: "Demo Owner",
		username: "demo_owner",
		primaryEmailAddress: { emailAddress: "demo-owner@quickstay.dev" },
		publicMetadata: { role: "hotelOwner" },
	},
};

const loadDemoMode = () => {
	if (!DEMO_ENABLED) return null;
	try {
		const raw = localStorage.getItem(DEMO_KEY);
		if (raw) return JSON.parse(raw);
	} catch {
		localStorage.removeItem(DEMO_KEY);
	}
	return null;
};

const seedDemoBookings = () => {
	const existing = getState("bookings");
	if (existing.length > 0) return;

	const rooms = catalogRooms.slice(0, 2);
	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);
	const nextWeek = new Date(today);
	nextWeek.setDate(today.getDate() + 7);
	const weekAfter = new Date(today);
	weekAfter.setDate(today.getDate() + 8);

	const sampleBookings = [
		createBooking({
			room: rooms[0],
			checkIn: toDay(today.toISOString()),
			checkOut: toDay(tomorrow.toISOString()),
			guests: 2,
			paymentMethod: "Pay At Hotel",
			user: { id: "demo_guest", fullName: "Demo Guest", username: "demo_guest" },
		}),
		createBooking({
			room: rooms[1],
			checkIn: toDay(nextWeek.toISOString()),
			checkOut: toDay(weekAfter.toISOString()),
			guests: 1,
			paymentMethod: "Card",
			user: { id: "demo_guest", fullName: "Demo Guest", username: "demo_guest" },
		}),
	];
	setState("bookings", sampleBookings);
};

const DemoAuthContext = createContext(null);

export const DemoAuthProvider = ({ children }) => {
	const [mode, setMode] = useState(() => loadDemoMode());

	useEffect(() => {
		const handler = (event) => {
			if (event.key === DEMO_KEY) {
				setMode(loadDemoMode());
			}
		};
		window.addEventListener("storage", handler);
		return () => window.removeEventListener("storage", handler);
	}, []);

	const startDemo = useCallback((selectedMode = "guest") => {
		if (!DEMO_ENABLED) return;
		const next = { mode: selectedMode, startedAt: new Date().toISOString() };
		localStorage.setItem(DEMO_KEY, JSON.stringify(next));
		setMode(next);
		if (selectedMode === "guest") {
			seedDemoBookings();
		}
	}, []);

	const endDemo = useCallback(() => {
		localStorage.removeItem(DEMO_KEY);
		setMode(null);
	}, []);

	const value = useMemo(() => {
		const active = DEMO_ENABLED && mode ? mode.mode : null;
		return {
			isDemoMode: DEMO_ENABLED,
			isDemoUser: Boolean(active),
			isDemoOwner: active === "owner",
			mode: active,
			demoUser: active ? demoUsers[active] : null,
			startDemo,
			endDemo,
		};
	}, [mode, startDemo, endDemo]);

	return <DemoAuthContext.Provider value={value}>{children}</DemoAuthContext.Provider>;
};

export const useDemoUser = () => {
	const context = useContext(DemoAuthContext);
	if (!context) {
		throw new Error("useDemoUser must be used within DemoAuthProvider");
	}
	return context;
};
