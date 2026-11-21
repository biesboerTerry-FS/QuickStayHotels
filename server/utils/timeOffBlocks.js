import TimeOffBlock from "../models/TimeOffBlock.js";

const dateFromToday = (offset) => {
	const date = new Date();
	date.setHours(12, 0, 0, 0);
	date.setDate(date.getDate() + offset);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
		date.getDate()
	).padStart(2, "0")}`;
};

const isoDaysAgo = (days) => {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() - days);
	return date.toISOString();
};

// Mirrored by client/src/data/hrSeed.js so both portals show the same demo data
// even when MongoDB is unavailable.
export const DEMO_TIME_OFF_BLOCKS = [
	{
		id: "block_demo_1",
		employeeId: "demo_employee_1",
		employeeName: "Maya Martinez",
		date: dateFromToday(5),
		startTime: "12:00",
		endTime: "16:00",
		reason: "School pickup · cover my afternoon desk",
		status: "pending",
		createdAt: isoDaysAgo(1),
	},
	{
		id: "block_demo_2",
		employeeId: "demo_employee_2",
		employeeName: "Daniel Kim",
		date: dateFromToday(7),
		startTime: "09:00",
		endTime: "13:00",
		reason: "Medical appointment",
		status: "approved",
		createdAt: isoDaysAgo(2),
	},
];

const publicBlock = (doc = {}) => ({
	id: doc.id || doc._id,
	employeeId: doc.employeeId || "",
	employeeName: doc.employeeName || "",
	date: doc.date || "",
	startTime: doc.startTime || "",
	endTime: doc.endTime || "",
	reason: doc.reason || "",
	status: ["pending", "approved", "denied"].includes(doc.status) ? doc.status : "pending",
	decidedBy: doc.decidedBy || "",
	decidedAt: doc.decidedAt || "",
	createdAt: doc.createdAt || new Date().toISOString(),
});

// Validate before touching the database. The client does the same, but the API
// must not trust it: dates are strings and time ranges must be ordered.
export const validateBlock = (body = {}) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.date || ""))) {
		return "A valid date is required";
	}
	if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(body.startTime || ""))) {
		return "A valid start time is required";
	}
	if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(body.endTime || ""))) {
		return "A valid end time is required";
	}
	if (body.endTime <= body.startTime) {
		return "End time must be after start time";
	}
	return null;
};

const ensureSeeded = async () => {
	const count = await TimeOffBlock.countDocuments();
	if (count === 0 && DEMO_TIME_OFF_BLOCKS.length) {
		await TimeOffBlock.insertMany(
			DEMO_TIME_OFF_BLOCKS.map((block) => ({ ...block, _id: block.id }))
		);
	}
};

export const listBlocks = async (employeeId) => {
	try {
		await ensureSeeded();
		const docs = await TimeOffBlock.find(
			employeeId ? { employeeId } : {}
		)
			.sort({ date: 1 })
			.lean();
		return { blocks: docs.map(publicBlock), persisted: true };
	} catch (error) {
		console.error("Time-off block read failed:", error.message);
		return {
			blocks: DEMO_TIME_OFF_BLOCKS.filter(
				(block) => !employeeId || block.employeeId === employeeId
			).map(publicBlock),
			persisted: false,
		};
	}
};

export const getBlock = async (id) => {
	try {
		const doc = await TimeOffBlock.findById(id).lean();
		return doc ? publicBlock(doc) : null;
	} catch (error) {
		console.error("Time-off block lookup failed:", error.message);
		return (
			DEMO_TIME_OFF_BLOCKS.find((block) => block.id === id) || null
		);
	}
};

export const createBlock = async (block) => {
	try {
		await TimeOffBlock.create({ ...block, _id: block.id });
		return true;
	} catch (error) {
		console.error("Time-off block create failed:", error.message);
		return false;
	}
};

export const deleteBlock = async (id) => {
	try {
		await TimeOffBlock.deleteOne({ _id: id });
		return true;
	} catch (error) {
		console.error("Time-off block delete failed:", error.message);
		return false;
	}
};

export const setBlockStatus = async (id, status, decidedBy = "") => {
	try {
		const doc = await TimeOffBlock.findByIdAndUpdate(
			id,
			{
				$set: {
					status,
					decidedBy,
					decidedAt: new Date().toISOString(),
				},
			},
			{ new: true, runValidators: true }
		).lean();
		return doc ? publicBlock(doc) : null;
	} catch (error) {
		console.error("Time-off block decision failed:", error.message);
		return null;
	}
};
