// Lightweight, dependency-free request validation for JSON mutation routes.
// Rejects malformed bodies, unknown fields and oversized values before they
// reach Mongoose, while leaving the public GET browse routes untouched.

const MAX_STRING = 2000;
const MAX_FIELDS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^[A-Za-z0-9_-]{1,120}$/;

const isPlainObject = (value) =>
	Boolean(value) && typeof value === "object" && !Array.isArray(value);

const fail = (response, message) =>
	response.status(400).json({ success: false, message });

const stringField = (max = MAX_STRING) => (value) => {
	if (typeof value !== "string") return "must be a string";
	if (!value.trim()) return "cannot be empty";
	if (value.length > max) return `must be at most ${max} characters`;
	return null;
};

const nullableStringField = (max = MAX_STRING) => (value) => {
	if (value === null) return null;
	return stringField(max)(value);
};

const idField = (value) => {
	const error = stringField(120)(value);
	if (error) return error;
	if (!ID_RE.test(value)) return "has an invalid format";
	return null;
};

const emailField = (value) => {
	const error = stringField(254)(value);
	if (error) return error;
	if (!EMAIL_RE.test(value)) return "must be a valid email address";
	return null;
};

const dateField = (value) => {
	const error = stringField(10)(value);
	if (error) return error;
	if (!DATE_RE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
		return "must be a valid YYYY-MM-DD date";
	}
	return null;
};

const numberField = (min, max) => (value) => {
	if (typeof value !== "number" || !Number.isFinite(value)) return "must be a finite number";
	if (value < min || value > max) return `must be between ${min} and ${max}`;
	return null;
};

const intField = (min, max) => (value) => {
	if (!Number.isInteger(value)) return "must be an integer";
	return numberField(min, max)(value);
};

const boolField = (value) => {
	if (typeof value !== "boolean") return "must be a boolean";
	return null;
};

const enumField = (allowed) => (value) => {
	if (!allowed.includes(value)) return `must be one of: ${allowed.join(", ")}`;
	return null;
};

const stringArrayField = (maxItems, maxLength) => (value) => {
	if (!Array.isArray(value)) return "must be an array";
	if (value.length > maxItems) return `must contain at most ${maxItems} items`;
	for (const item of value) {
		if (typeof item !== "string" || item.length > maxLength) {
			return "contains an invalid item";
		}
	}
	return null;
};

const hotelField = (value) => {
	if (!isPlainObject(value)) return "must be an object";
	for (const key of ["name", "address", "city", "contact"]) {
		if (value[key] !== undefined) {
			const error = stringField(200)(value[key]);
			if (error) return `hotel.${key} ${error}`;
		}
	}
	for (const key of ["lat", "lng"]) {
		if (value[key] !== undefined) {
			const error = numberField(-180, 180)(value[key]);
			if (error) return `hotel.${key} ${error}`;
		}
	}
	return null;
};

const required = (validator) => {
	validator.required = true;
	return validator;
};

export const validateFields = (schema, options = {}) => (request, response, next) => {
	const body = request.body;
	if (!isPlainObject(body) || Object.keys(body).length === 0) {
		return fail(response, "A non-empty JSON object body is required");
	}

	for (const [key, value] of Object.entries(body)) {
		if (
			key.length > 60 ||
			key.startsWith("$") ||
			key === "__proto__" ||
			key === "constructor"
		) {
			return fail(response, `Invalid field name: ${key}`);
		}
		const validator = schema[key];
		if (!validator) {
			return fail(response, `Unknown field: ${key}`);
		}
		const error = validator(value);
		if (error) {
			return fail(response, `${key} ${error}`);
		}
	}

	if (!options.partial) {
		for (const [key, validator] of Object.entries(schema)) {
			if (validator.required && body[key] === undefined) {
				return fail(response, `${key} is required`);
			}
		}
	}

	if (options.after) {
		const error = options.after(body);
		if (error) return fail(response, error);
	}

	return next();
};

const bookingSchema = {
	roomId: required(idField),
	userId: required(idField),
	userName: required(stringField(120)),
	userEmail: emailField,
	checkInDate: required(dateField),
	checkOutDate: required(dateField),
	guests: required(intField(1, 20)),
	basePrice: required(numberField(0, 1_000_000)),
	discount: numberField(0, 1_000_000),
	offerId: nullableStringField(120),
	totalPrice: required(numberField(0, 1_000_000)),
	paymentMethod: required(stringField(40)),
	isPaid: boolField,
	status: enumField(["pending", "cancelled"]),
};

const checkDateOrder = (body) => {
	if (body.checkInDate && body.checkOutDate && body.checkOutDate <= body.checkInDate) {
		return "checkOutDate must be after checkInDate";
	}
	return null;
};

export const validateBooking = validateFields(bookingSchema, { after: checkDateOrder });
export const validateBookingPatch = validateFields(bookingSchema, {
	partial: true,
	after: checkDateOrder,
});

const roomSchema = {
	hotel: required(hotelField),
	roomType: required(enumField(["Single Bed", "Double Bed", "Family Suite", "Luxury Room"])),
	pricePerNight: required(numberField(0, 1_000_000)),
	maxGuests: required(intField(1, 20)),
	amenities: stringArrayField(30, 80),
	images: stringArrayField(20, 1000),
	isAvailable: boolField,
};

export const validateRoom = validateFields(roomSchema);
export const validateRoomPatch = validateFields(roomSchema, { partial: true });

const reviewSchema = {
	roomId: required(stringField(120)),
	name: required(stringField(120)),
	rating: required(intField(1, 5)),
	comment: required(stringField(2000)),
	date: required(stringField(40)),
};

export const validateReview = validateFields(reviewSchema);

const DEMO_ROLES = ["guest", "owner", "hotelOwner", "employee", "admin"];

export const FULFILLMENT_STATUSES = ["pending", "confirmed", "checked-in", "completed"];

export const validateFulfillmentStatus = (request, response, next) => {
	if (!request.body || typeof request.body.status !== "string") {
		return fail(response, "A status is required");
	}
	if (!FULFILLMENT_STATUSES.includes(request.body.status)) {
		return fail(response, `Status must be one of: ${FULFILLMENT_STATUSES.join(", ")}`);
	}
	return next();
};

export const validateCheckout = (request, response, next) => {
	const body = request.body;
	if (!isPlainObject(body) || Object.keys(body).length === 0) {
		return fail(response, "A non-empty JSON object body is required");
	}
	if (body.bookingId !== undefined) {
		const error = stringField(120)(body.bookingId);
		if (error) return fail(response, `bookingId ${error}`);
	}
	if (body.hotelName !== undefined) {
		const error = stringField(200)(body.hotelName);
		if (error) return fail(response, `hotelName ${error}`);
	}
	const error = numberField(0.01, 1_000_000)(body.total);
	if (error) return fail(response, `total ${error}`);
	return next();
};

export const validateDemoLogin = (request, response, next) => {
	const body = request.body;
	if (!isPlainObject(body) || typeof body.role !== "string" || !body.role.trim()) {
		return fail(response, "A role is required (guest, owner, employee or admin)");
	}
	if (!DEMO_ROLES.includes(body.role)) {
		return fail(response, "Invalid demo role");
	}
	return next();
};

export const rejectMalformedBody = (request, response, next) => {
	const body = request.body;
	if (!isPlainObject(body) || Object.keys(body).length === 0) {
		return fail(response, "A non-empty JSON object body is required");
	}
	if (Object.keys(body).length > MAX_FIELDS) {
		return fail(response, "Too many fields in request body");
	}
	for (const [key, value] of Object.entries(body)) {
		if (key.length > 60 || key.startsWith("$") || key === "__proto__") {
			return fail(response, `Invalid field name: ${key}`);
		}
		if (typeof value === "string" && value.length > MAX_STRING) {
			return fail(response, `Field "${key}" is too long`);
		}
		if (typeof value === "number" && !Number.isFinite(value)) {
			return fail(response, `Field "${key}" is not a valid number`);
		}
		if (Array.isArray(value) && value.length > 50) {
			return fail(response, `Field "${key}" contains too many items`);
		}
	}
	return next();
};
