import mongoose from "mongoose";

// A single document mirrors the owner-only HR demo state (departments, role
// labels, payroll history, time-off decisions and performance notes). Employee
// records themselves live in the Employee model so /api/employee/me keeps
// working unchanged.
const HrStateSchema = new mongoose.Schema(
	{
		_id: { type: String },
		value: { type: mongoose.Schema.Types.Mixed, default: {} },
	},
	{ versionKey: false }
);

const HrState = mongoose.model("HrState", HrStateSchema);
export default HrState;
