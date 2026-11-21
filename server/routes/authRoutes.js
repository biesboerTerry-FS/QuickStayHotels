import express from "express";
import rateLimit from "express-rate-limit";
import { protect, signAccessToken } from "../middleware/auth.js";
import { validateDemoLogin } from "../middleware/validate.js";

const router = express.Router();

// The demo login is the only credential-free way to obtain a token. Keep it
// tightly rate limited so it can't be used to mint tokens in a loop.
const demoLoginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: "draft-7",
	legacyHeaders: false,
	message: { success: false, message: "Too many demo login attempts, please try again later." },
});

const DEMO_IDENTITIES = {
	guest: {
		sub: "demo_guest",
		role: "guest",
		name: "Demo Guest",
		email: "demo-guest@quickstay.dev",
	},
	owner: {
		sub: "demo_owner",
		role: "owner",
		name: "Demo Owner",
		email: "demo-owner@quickstay.dev",
	},
	employee: {
		sub: "demo_employee",
		role: "employee",
		name: "Maya Martinez",
		email: "maya.martinez@quickstay.dev",
		employeeId: "demo_employee_1",
	},
	admin: {
		sub: "demo_admin",
		role: "admin",
		name: "QuickStay Admin",
		email: "admin@quickstay.dev",
	},
};

const normalizeRole = (role) => (role === "hotelOwner" ? "owner" : role);

// POST /api/auth/demo — issues a short-lived, demo-scoped access token.
// Identities are fixed in code; callers cannot choose their own user id/role
// beyond the documented demo roles.
router.post("/demo", demoLoginLimiter, validateDemoLogin, (request, response) => {
	try {
		const role = normalizeRole(request.body.role);
		const identity = DEMO_IDENTITIES[role];
		if (!identity) {
			return response.status(400).json({ success: false, message: "Invalid demo role" });
		}

		const token = signAccessToken({
			sub: identity.sub,
			role: identity.role,
			name: identity.name,
			email: identity.email,
			employeeId: identity.employeeId || "",
		});

		// Never return the token in logs, headers or error messages — only in
		// the JSON body that the client stores in session storage.
		return response.json({
			success: true,
			token,
			tokenType: "Bearer",
			expiresIn: process.env.JWT_EXPIRES_IN || "12h",
			user: {
				id: identity.sub,
				role: identity.role,
				name: identity.name,
				email: identity.email,
				employeeId: identity.employeeId || null,
			},
		});
	} catch (error) {
		console.error("Demo login failed:", error.message);
		return response.status(500).json({
			success: false,
			message: "Could not start demo session",
		});
	}
});

// Useful for clients and smoke tests to inspect the authenticated identity.
router.get("/me", protect, (request, response) =>
	response.json({ success: true, user: request.auth })
);

export default router;
