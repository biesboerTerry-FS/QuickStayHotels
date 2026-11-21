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

export const getApiToken = () => {
	const cached = readToken();
	if (cached) return Promise.resolve(cached);
	if (pendingToken) return pendingToken;

	pendingToken = fetch(`${API_BASE}/api/auth/demo`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ role: demoRole() }),
	})
		.then(async (response) => {
			if (!response.ok) throw new Error("Could not start secure session");
			const data = await response.json();
			if (!data?.token) throw new Error("No session token returned");
			try {
				sessionStorage.setItem(TOKEN_KEY, data.token);
			} catch {
				// session storage unavailable; token is used for this request only
			}
			return data.token;
		})
		.finally(() => {
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
