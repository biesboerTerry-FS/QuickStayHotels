import jwt from "jsonwebtoken";

const ISSUER = "quickstay-api";
const AUDIENCE = "quickstay-client";
const MIN_SECRET_LENGTH = 32;

// A missing/weak secret must fail closed rather than silently allowing requests.
export const getJwtSecret = () => {
	const secret = process.env.JWT_SECRET;
	if (typeof secret !== "string" || secret.trim().length < MIN_SECRET_LENGTH) {
		return null;
	}
	return secret;
};

export const isAuthConfigured = () => Boolean(getJwtSecret());

export const signAccessToken = (claims) => {
	const secret = getJwtSecret();
	if (!secret) {
		throw new Error("JWT_SECRET is not configured");
	}
	return jwt.sign(
		{ ...claims, type: "access" },
		secret,
		{
			algorithm: "HS256",
			expiresIn: process.env.JWT_EXPIRES_IN || "12h",
			issuer: ISSUER,
			audience: AUDIENCE,
		}
	);
};

// Verify signature, algorithm, issuer, audience and expiry. Never echo the
// token or the underlying verification error back to the caller.
export const protect = (request, response, next) => {
	const secret = getJwtSecret();
	if (!secret) {
		console.error("JWT_SECRET is missing or too short; refusing to authorize");
		return response.status(500).json({
			success: false,
			message: "Authentication is not configured on this server",
		});
	}

	const authorization = request.get("authorization") || "";
	const parts = authorization.split(" ");
	if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer" || !parts[1]) {
		return response.status(401).json({
			success: false,
			message: "Authorization bearer token required",
		});
	}

	try {
		const payload = jwt.verify(parts[1], secret, {
			algorithms: ["HS256"],
			issuer: ISSUER,
			audience: AUDIENCE,
		});

		if (
			!payload ||
			typeof payload !== "object" ||
			payload.type !== "access" ||
			typeof payload.sub !== "string" ||
			!payload.sub
		) {
			throw new Error("Malformed token payload");
		}

		request.auth = {
			id: payload.sub,
			role: typeof payload.role === "string" ? payload.role : "guest",
			name: typeof payload.name === "string" ? payload.name : "",
			email: typeof payload.email === "string" ? payload.email : "",
			employeeId: typeof payload.employeeId === "string" ? payload.employeeId : "",
		};
		return next();
	} catch {
		return response.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};

export const requireRole = (...roles) => (request, response, next) => {
	if (!request.auth) {
		return response.status(401).json({
			success: false,
			message: "Authorization bearer token required",
		});
	}
	if (!roles.includes(request.auth.role)) {
		return response.status(403).json({
			success: false,
			message: "You do not have permission to perform this action",
		});
	}
	return next();
};
