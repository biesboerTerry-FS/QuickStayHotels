import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema(
	{
		id: { type: String, required: true },
		title: { type: String, required: true },
		date: { type: String, required: true },
		startTime: { type: String, default: "" },
		endTime: { type: String, default: "" },
		location: { type: String, default: "" },
	},
	{ _id: false }
);

const EmployeeSchema = new mongoose.Schema(
	{
		_id: { type: String, required: true },
		fullName: { type: String, required: true },
		position: { type: String, required: true },
		department: { type: String, default: "" },
		email: { type: String, default: "" },
		phone: { type: String, default: "" },
		address: { type: String, default: "" },
		assignments: { type: [AssignmentSchema], default: [] },
	},
	{ timestamps: true, versionKey: false }
);

const Employee = mongoose.model("Employee", EmployeeSchema);
export default Employee;
