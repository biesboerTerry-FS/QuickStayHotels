// Thin API client that attaches the short-lived demo JWT to state-changing
// requests. The token is kept in sessionStorage (never localStorage) and is
// re-issued whenever the demo role changes.

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "quickstay:apiToken";
const DEMO_KEY = "quickstay:demo";

const demoRole = () => {
	try {
		const raw = localStorage.getItem(DEMO_KEY);
		const mode = raw ? JSON.parse(raw)?.mode : null;
		if (mode === "owner") return "owner";
		if (mode === "employee") return "employee";
	} catch {
		// fall through to guest
	}
	return "guest";
};

const readToken = () => {
	try {
		return sessionStorage.getItem(TOKEN_KEY) || null;
	} catch {
		return null;
	}
};

export const endApiSession = () => {
	try {
		sessionStorage.removeItem(TOKEN_KEY);
	} catch {
		// session storage unavailable
	}
};

let pendingToken = null;
let clerkTokenProvider = null;

// Set by the app when a Clerk user is signed in. The provider returns a Clerk
// session token that is exchanged for a QuickStay JWT; demo users keep using
// the fixed demo login below.
export const setApiClerkTokenProvider = (provider) => {
	clerkTokenProvider = provider;
};

const storeToken = (token) => {
	try {
		sessionStorage.setItem(TOKEN_KEY, token);
	} catch {
		// session storage unavailable; token is used for this request only
	}
	return token;
};

const requestDemoToken = () =>
	fetch(`${API_BASE}/api/auth/demo`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ role: demoRole() }),
	})
		.then(async (response) => {
			if (!response.ok) throw new Error("Could not start secure session");
			const data = await response.json();
			if (!data?.token) throw new Error("No session token returned");
			return storeToken(data.token);
		});

const requestClerkToken = async () => {
	if (!clerkTokenProvider) return null;
	const clerkToken = await clerkTokenProvider();
	if (!clerkToken) return null;
	const response = await fetch(`${API_BASE}/api/auth/clerk`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${clerkToken}`,
		},
		body: "{}",
	});
	if (!response.ok) throw new Error("Could not start secure Clerk session");
	const data = await response.json();
	if (!data?.token) throw new Error("No session token returned");
	return storeToken(data.token);
};

export const getApiToken = () => {
	const cached = readToken();
	if (cached) return Promise.resolve(cached);
	if (pendingToken) return pendingToken;

	pendingToken = (async () => {
		try {
			const clerkToken = await requestClerkToken();
			if (clerkToken) return clerkToken;
		} catch {
			// Fall back to the demo login when a Clerk exchange is unavailable.
		}
		return requestDemoToken();
	})().finally(() => {
		pendingToken = null;
	});

	return pendingToken;
};

export const apiFetch = async (path, options = {}) => {
	const send = (token) =>
		fetch(`${API_BASE}${path}`, {
			...options,
			headers: {
				...(options.headers || {}),
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		});

	let token = null;
	try {
		token = await getApiToken();
	} catch {
		// Let the caller handle an unreachable auth endpoint.
	}

	let response = await send(token);
	if (response.status === 401 && token) {
		// Token may have expired; retry once with a fresh one.
		endApiSession();
		try {
			token = await getApiToken();
			response = await send(token);
		} catch {
			// keep the original 401 response
		}
	}
	return response;
};
