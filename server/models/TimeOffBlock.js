import mongoose from "mongoose";

// Partial-day availability blocks ("unavailable 12:00–16:00"). They are kept in
// their own collection so owner time-off approvals can manage them through the
// same decision flow as whole-day requests without losing the time range.
const TimeOffBlockSchema = new mongoose.Schema(
	{
		_id: { type: String, required: true },
		employeeId: { type: String, required: true, index: true },
		employeeName: { type: String, default: "" },
		date: { type: String, required: true },
		startTime: { type: String, default: "" },
		endTime: { type: String, default: "" },
		reason: { type: String, default: "" },
		status: {
			type: String,
			enum: ["pending", "approved", "denied"],
			default: "pending",
		},
		decidedBy: { type: String, default: "" },
		decidedAt: { type: String, default: "" },
	},
	{ timestamps: true, versionKey: false }
);

const TimeOffBlock = mongoose.model("TimeOffBlock", TimeOffBlockSchema);
export default TimeOffBlock;
