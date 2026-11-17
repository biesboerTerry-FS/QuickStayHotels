import { useMemo, useSyncExternalStore } from "react";
import { userBookingsDummyData, userDummyData } from "../assets/assets";
import {
	catalogRooms,
	defaultRoomImages,
	hotelProfileDefaults,
	seedReviewsFor,
} from "./catalog";
import { offers as seedOffers } from "./offers";
import { toDay } from "../lib/format";

// Browser-side store. Only plain data is persisted (no image URLs or nested
// objects), so a redeploy can't leave stale asset links in storage.
// When the MongoDB API is live, replace these hooks with API calls.

const PREFIX = "quickstay:";

const toStoredBooking = (booking) => ({
	_id: booking._id,
	roomId: booking.room._id,
	userId: booking.user._id,
	userName: booking.user.username,
	checkInDate: toDay(booking.checkInDate),
	checkOutDate: toDay(booking.checkOutDate),
	guests: booking.guests,
	totalPrice: booking.totalPrice,
	paymentMethod: booking.paymentMethod,
	isPaid: booking.isPaid,
	status: booking.status === "cancelled" ? "cancelled" : "pending",
	createdAt: booking.createdAt,
});

const demoGuestBookings = userBookingsDummyData.slice(0, 2).map((booking) => ({
	...toStoredBooking(booking),
	userId: "demo_guest",
	userName: "Demo Guest",
}));

const defaults = {
	roomOverrides: {},
	addedRooms: [],
	bookings: [...userBookingsDummyData.map(toStoredBooking), ...demoGuestBookings],
	saved: [],
	reviews: [],
	searches: [],
	newsletter: [],
	profile: hotelProfileDefaults,
	offers: seedOffers,
};

const cache = {};
const listeners = new Set();

const load = (key) => {
	if (key in cache) return cache[key];
	let value = defaults[key];
	try {
		const raw = localStorage.getItem(PREFIX + key);
		if (raw !== null) value = JSON.parse(raw);
	} catch {
		value = defaults[key];
	}
	cache[key] = value;
	return value;
};

export const getState = (key) => load(key);

export const setState = (key, updater) => {
	const current = load(key);
	const next = typeof updater === "function" ? updater(current) : updater;
	cache[key] = next;
	try {
		localStorage.setItem(PREFIX + key, JSON.stringify(next));
	} catch {
		// Storage full or unavailable; keep the in-memory value for this session.
	}
	listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

if (typeof window !== "undefined") {
	window.addEventListener("storage", (event) => {
		if (!event.key || !event.key.startsWith(PREFIX)) return;
		delete cache[event.key.slice(PREFIX.length)];
		listeners.forEach((listener) => listener());
	});
}

export const useStore = (key) =>
	useSyncExternalStore(
		subscribe,
		() => load(key),
		() => defaults[key]
	);

const profileHotel = (profile) => ({
	...profile,
	_id: "hotel_urbanza",
	owner: userDummyData,
	lat: 40.7128,
	lng: -74.006,
});

export const useRooms = () => {
	const overrides = useStore("roomOverrides");
	const added = useStore("addedRooms");
	const profile = useStore("profile");

	return useMemo(
		() => [
			...catalogRooms.map((room) => ({
				...room,
				isAvailable: overrides[room._id] ?? room.isAvailable,
			})),
			...added.map((room) => ({
				...room,
				images: defaultRoomImages,
				hotel: profileHotel(profile),
			})),
		],
		[overrides, added, profile]
	);
};

export const useOffers = () => useStore("offers");

const fallbackRoom = (booking) => ({
	_id: booking.roomId,
	roomType: "Room",
	pricePerNight: 0,
	images: defaultRoomImages,
	hotel: { name: "QuickStay hotel", address: "", city: "" },
});

export const resolveBooking = (booking, rooms) => {
	const room = rooms.find((item) => item._id === booking.roomId);
	return {
		...booking,
		room: room ?? fallbackRoom(booking),
		hotel: room?.hotel ?? fallbackRoom(booking).hotel,
	};
};

export const useBookings = () => {
	const bookings = useStore("bookings");
	const rooms = useRooms();
	return useMemo(
		() => bookings.map((booking) => resolveBooking(booking, rooms)),
		[bookings, rooms]
	);
};

export const useSavedRoomIds = () => useStore("saved");

export const toggleSavedRoom = (roomId) =>
	setState("saved", (saved) =>
		saved.includes(roomId)
			? saved.filter((id) => id !== roomId)
			: [...saved, roomId]
	);

export const useRoomReviews = (roomId) => {
	const userReviews = useStore("reviews");
	return useMemo(
		() => [
			...seedReviewsFor(roomId),
			...userReviews.filter((review) => review.roomId === roomId),
		],
		[roomId, userReviews]
	);
};

export const summarizeReviews = (reviews) => {
	if (reviews.length === 0) return { average: 0, count: 0 };
	const total = reviews.reduce((sum, review) => sum + review.rating, 0);
	return { average: total / reviews.length, count: reviews.length };
};
