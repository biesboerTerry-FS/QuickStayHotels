// Customer profile storage.
//
// Profiles live in the same localStorage-backed store as the rest of the demo
// data, keyed by the signed-in Clerk user id (or the active demo user id), so
// switching between Clerk and demo accounts keeps each profile separate.
// Payment methods are DEMO ONLY: we never keep a full card number, only the
// last four digits and an optional expiry for display.

import { useCallback } from "react";
import { setState, useStore } from "../data/store";
import { apiFetch } from "./api";

const STORE_KEY = "customerProfiles";

const newId = () =>
	typeof crypto !== "undefined" && crypto.randomUUID
		? crypto.randomUUID()
		: `qs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const profileKeyFor = (user) =>
	user?.id || user?._id || user?.username || "guest";

const demoPaymentMethods = () => [
	{
		id: "demo_test_card_4242",
		brand: "Test card",
		last4: "4242",
		expiry: "12/34",
		label: "Stripe test card",
		isDefault: true,
		isSeeded: true,
	},
];

const defaultsFor = (user) => ({
	fullName: user?.fullName || user?.username || "Guest",
	email:
		user?.primaryEmailAddress?.emailAddress ||
		user?.email ||
		(user?.username ? `${user.username}@quickstay.dev` : ""),
	phone: user?.primaryPhoneNumber?.phoneNumber || "",
	addresses: [],
	paymentMethods: demoPaymentMethods(),
});

/** Read + update helpers for one customer profile. */
export const useCustomerProfile = (user) => {
	const profiles = useStore(STORE_KEY);
	const key = profileKeyFor(user);
	const profile = profiles[key] || defaultsFor(user);

	const update = useCallback(
		(updater) => {
			setState(STORE_KEY, (all) => {
				const current = all[key] || defaultsFor(user);
				return {
					...all,
					[key]:
						typeof updater === "function" ? updater(current) : updater,
				};
			});
		},
		[key, user]
	);

	return { profile, update, key };
};

/** Only the last four digits are kept; the rest of the input is discarded. */
export const maskDemoCard = ({ number, label, expiry }) => {
	const digits = String(number || "").replace(/\D/g, "");
	if (digits.length < 4 || digits.length > 19) {
		throw new Error("Enter a 4–19 digit test card number");
	}
	return {
		id: newId(),
		brand: "Test card",
		last4: digits.slice(-4),
		expiry: String(expiry || "").trim().slice(0, 5) || "—",
		label: String(label || "Demo card").trim().slice(0, 40),
		isDefault: false,
	};
};

export const newAddressId = newId;

// ---------------------------------------------------------------------------
// Backend helpers. Profile and addresses live in MongoDB behind JWT-protected
// routes. localStorage mirrors the result so the demo still works if the API
// is temporarily unreachable. Demo cards stay localStorage-only.
// ---------------------------------------------------------------------------
const readJson = async (path, options) => {
	const response = await apiFetch(path, options);
	const data = await response.json().catch(() => ({}));
	if (!response.ok || data?.success === false) throw new Error(data?.message || "Request failed");
	return data;
};

export const loadRemoteProfile = async () => {
	try {
		const [profileData, addressData] = await Promise.all([
			readJson("/api/user/profile"),
			readJson("/api/address"),
		]);
		return {
			profile: profileData.profile || null,
			persisted: Boolean(profileData.persisted),
			addresses: Array.isArray(addressData.addresses) ? addressData.addresses : [],
		};
	} catch {
		return null;
	}
};

export const saveRemoteProfile = async (values) => {
	try {
		const data = await readJson("/api/user/profile", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(values),
		});
		return data.profile || null;
	} catch {
		return null;
	}
};

const toApiAddress = (address) => {
	const payload = {};
	for (const field of ["label", "line1", "line2", "city", "state", "zip", "country"]) {
		if (typeof address[field] === "string") payload[field] = address[field];
	}
	if (typeof address.isDefault === "boolean") payload.isDefault = address.isDefault;
	return payload;
};

export const createRemoteAddress = async (address) => {
	try {
		const data = await readJson("/api/address", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(toApiAddress(address)),
		});
		return data.address || null;
	} catch {
		return null;
	}
};

export const patchRemoteAddress = async (id, patch) => {
	try {
		const data = await readJson(`/api/address/${encodeURIComponent(id)}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(toApiAddress(patch)),
		});
		return data.address || null;
	} catch {
		return null;
	}
};

export const deleteRemoteAddress = async (id) => {
	try {
		await readJson(`/api/address/${encodeURIComponent(id)}`, { method: "DELETE" });
		return true;
	} catch {
		return false;
	}
};
