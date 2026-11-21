import Employee from "../models/Employee.js";

const dateFromToday = (offset) => {
	const date = new Date();
	date.setHours(12, 0, 0, 0);
	date.setDate(date.getDate() + offset);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

// Two staff records for the self-service demo. Positions/roles are read-only
// from the portal; only basic contact details can be edited.
export const DEMO_EMPLOYEES = [
	{
		_id: "demo_employee_1",
		fullName: "Maya Martinez",
		position: "Front Desk Agent",
		department: "Guest Services",
		email: "maya.martinez@quickstay.dev",
		phone: "+1 (415) 555-0134",
		address: "218 Harbor Street, Apt 4B, San Francisco, CA 94105",
		assignments: [
			{
				id: "shift_maya_1",
				title: "Front desk · Morning shift",
				date: dateFromToday(1),
				startTime: "07:00",
				endTime: "15:00",
				location: "QuickStay Downtown · Main lobby",
			},
			{
				id: "shift_maya_2",
				title: "VIP arrival handover",
				date: dateFromToday(3),
				startTime: "09:30",
				endTime: "11:00",
				location: "QuickStay Downtown · Suite 402",
			},
		],
	},
	{
		_id: "demo_employee_2",
		fullName: "Daniel Kim",
		position: "Housekeeping Supervisor",
		department: "Operations",
		email: "daniel.kim@quickstay.dev",
		phone: "+1 (415) 555-0187",
		address: "76 Pine Avenue, Oakland, CA 94612",
		assignments: [
			{
				id: "shift_daniel_1",
				title: "Floor inspection · East wing",
				date: dateFromToday(2),
				startTime: "08:00",
				endTime: "16:30",
				location: "QuickStay Downtown · East wing",
			},
		],
	},
];

// $setOnInsert keeps any edits made through PATCH /api/employee/me.
export const seedDemoEmployees = async () =>
	Promise.all(
		DEMO_EMPLOYEES.map((employee) =>
			Employee.updateOne({ _id: employee._id }, { $setOnInsert: employee }, { upsert: true })
		)
	);
