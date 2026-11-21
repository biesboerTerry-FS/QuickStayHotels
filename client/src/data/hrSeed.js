// Shared demo seeds for the owner-only HR suite. These mirror the backend
// seeds in server/utils/seedEmployees.js so the browser fallback and the JWT
// protected API show the same roster, payroll history and requests.

export const dateFromToday = (offset) => {
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

const monthOffset = (offset) => {
	const date = new Date();
	date.setDate(1);
	date.setMonth(date.getMonth() + offset);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const HR_SEED = {
	departments: [
		{ id: "dept_guest_services", name: "Guest Services", description: "Front desk, concierge and guest relations" },
		{ id: "dept_operations", name: "Operations", description: "Daily hotel operations and housekeeping leadership" },
		{ id: "dept_housekeeping", name: "Housekeeping", description: "Room cleaning and public areas" },
		{ id: "dept_food_beverage", name: "Food & Beverage", description: "Breakfast, bar and in-room dining" },
		{ id: "dept_engineering", name: "Engineering", description: "Maintenance, HVAC and safety systems" },
		{ id: "dept_sales", name: "Sales & Marketing", description: "Corporate accounts, events and promotions" },
		{ id: "dept_security", name: "Security", description: "Front-of-house safety and surveillance" },
		{ id: "dept_administration", name: "Administration", description: "HR, finance and back-office support" },
	],
	roles: [
		{ id: "role_front_desk", label: "Front Desk Agent", department: "Guest Services" },
		{ id: "role_guest_relations", label: "Guest Relations Manager", department: "Guest Services" },
		{ id: "role_housekeeping_sup", label: "Housekeeping Supervisor", department: "Operations" },
		{ id: "role_housekeeping_att", label: "Housekeeping Attendant", department: "Housekeeping" },
		{ id: "role_fnb_sup", label: "Food & Beverage Supervisor", department: "Food & Beverage" },
		{ id: "role_engineer", label: "Maintenance Engineer", department: "Engineering" },
		{ id: "role_sales", label: "Sales & Marketing Coordinator", department: "Sales & Marketing" },
		{ id: "role_security", label: "Security Officer", department: "Security" },
	],
	payRuns: [
		{ id: "payrun_1001", employeeId: "demo_employee_1", employeeName: "Maya Martinez", period: monthOffset(-1), hours: 160, amount: 3840, status: "paid", method: "Direct deposit", reference: "PR-1001", paidAt: isoDaysAgo(28) },
		{ id: "payrun_1002", employeeId: "demo_employee_2", employeeName: "Daniel Kim", period: monthOffset(-1), hours: 174, amount: 5166.67, status: "paid", method: "Direct deposit", reference: "PR-1002", paidAt: isoDaysAgo(28) },
		{ id: "payrun_1003", employeeId: "demo_employee_3", employeeName: "Sofia Reyes", period: monthOffset(-1), hours: 172, amount: 6500, status: "paid", method: "Direct deposit", reference: "PR-1003", paidAt: isoDaysAgo(28) },
		{ id: "payrun_1004", employeeId: "demo_employee_4", employeeName: "Marcus Thompson", period: monthOffset(-1), hours: 152, amount: 2964, status: "paid", method: "Direct deposit", reference: "PR-1004", paidAt: isoDaysAgo(28) },
		{ id: "payrun_1005", employeeId: "demo_employee_5", employeeName: "Priya Patel", period: monthOffset(-1), hours: 168, amount: 5500, status: "paid", method: "Direct deposit", reference: "PR-1005", paidAt: isoDaysAgo(28) },
		{ id: "payrun_1006", employeeId: "demo_employee_6", employeeName: "Ethan Brooks", period: monthOffset(-1), hours: 160, amount: 4480, status: "paid", method: "Direct deposit", reference: "PR-1006", paidAt: isoDaysAgo(28) },
		{ id: "payrun_1007", employeeId: "demo_employee_7", employeeName: "Aisha Johnson", period: monthOffset(-1), hours: 160, amount: 4833.33, status: "paid", method: "Direct deposit", reference: "PR-1007", paidAt: isoDaysAgo(28) },
		{ id: "payrun_1008", employeeId: "demo_employee_1", employeeName: "Maya Martinez", period: monthOffset(-2), hours: 156, amount: 3744, status: "paid", method: "Direct deposit", reference: "PR-1008", paidAt: isoDaysAgo(58) },
		{ id: "payrun_1009", employeeId: "demo_employee_3", employeeName: "Sofia Reyes", period: monthOffset(-2), hours: 160, amount: 6500, status: "paid", method: "Direct deposit", reference: "PR-1009", paidAt: isoDaysAgo(58) },
		{ id: "payrun_1010", employeeId: "demo_employee_6", employeeName: "Ethan Brooks", period: monthOffset(-2), hours: 148, amount: 4144, status: "paid", method: "Direct deposit", reference: "PR-1010", paidAt: isoDaysAgo(58) },
	],
	timeOff: [
		{ id: "req_shift_1", employeeId: "demo_employee_1", employeeName: "Maya Martinez", type: "shift", date: dateFromToday(4), endDate: dateFromToday(4), reason: "Prefer the evening shift to cover the VIP arrival.", status: "pending", createdAt: isoDaysAgo(1) },
		{ id: "req_timeoff_1", employeeId: "demo_employee_1", employeeName: "Maya Martinez", type: "time-off", date: dateFromToday(10), endDate: dateFromToday(11), reason: "Personal appointment.", status: "pending", createdAt: isoDaysAgo(2) },
		{ id: "req_timeoff_2", employeeId: "demo_employee_2", employeeName: "Daniel Kim", type: "time-off", date: dateFromToday(6), endDate: dateFromToday(6), reason: "Annual leave.", status: "approved", createdAt: isoDaysAgo(3) },
		{ id: "req_timeoff_3", employeeId: "demo_employee_3", employeeName: "Sofia Reyes", type: "time-off", date: dateFromToday(14), endDate: dateFromToday(16), reason: "Family visit in Los Angeles.", status: "pending", createdAt: isoDaysAgo(2) },
		{ id: "req_timeoff_4", employeeId: "demo_employee_4", employeeName: "Marcus Thompson", type: "time-off", date: dateFromToday(8), endDate: dateFromToday(8), reason: "Medical appointment.", status: "pending", createdAt: isoDaysAgo(1) },
		{ id: "req_timeoff_5", employeeId: "demo_employee_5", employeeName: "Priya Patel", type: "time-off", date: dateFromToday(21), endDate: dateFromToday(23), reason: "Planned vacation.", status: "approved", createdAt: isoDaysAgo(5) },
		{ id: "req_timeoff_6", employeeId: "demo_employee_6", employeeName: "Ethan Brooks", type: "time-off", date: dateFromToday(12), endDate: dateFromToday(12), reason: "Home repairs.", status: "pending", createdAt: isoDaysAgo(4) },
		{ id: "req_timeoff_7", employeeId: "demo_employee_7", employeeName: "Aisha Johnson", type: "time-off", date: dateFromToday(18), endDate: dateFromToday(19), reason: "Attending an industry conference.", status: "denied", createdAt: isoDaysAgo(6) },
	],
	performanceNotes: [
		{ id: "note_2001", employeeId: "demo_employee_1", author: "Sofia Reyes", date: isoDaysAgo(6), text: "Maya handled a difficult late check-in with real empathy. The guest left a five-star review mentioning her by name." },
		{ id: "note_2002", employeeId: "demo_employee_1", author: "Demo Owner", date: isoDaysAgo(34), text: "Reliable on morning shifts and always cross-trains new front desk starters. Ready for senior agent responsibilities." },
		{ id: "note_2003", employeeId: "demo_employee_2", author: "Demo Owner", date: isoDaysAgo(12), text: "Inspection scores are consistently above 98%. Keep the east wing as the reference standard for the rest of the team." },
		{ id: "note_2004", employeeId: "demo_employee_3", author: "Demo Owner", date: isoDaysAgo(19), text: "Renewed the corporate account with Harbor & Co. after a thoughtful recovery plan. Excellent relationship management." },
		{ id: "note_2005", employeeId: "demo_employee_4", author: "Daniel Kim", date: isoDaysAgo(9), text: "Fastest room turnover in the east wing three weeks running. Great attitude during the busy holiday weekend." },
		{ id: "note_2006", employeeId: "demo_employee_5", author: "Sofia Reyes", date: isoDaysAgo(15), text: "Breakfast service ran smoothly despite two large walk-in groups. Suggest adding a second coffee station at peak times." },
		{ id: "note_2007", employeeId: "demo_employee_6", author: "Demo Owner", date: isoDaysAgo(23), text: "Resolved the penthouse HVAC issue same day and documented the fix. Preventive maintenance log is now up to date." },
		{ id: "note_2008", employeeId: "demo_employee_7", author: "Demo Owner", date: isoDaysAgo(11), text: "Campaign brought in 14 new corporate inquiries this month. Follow-up cadence is excellent." },
		{ id: "note_2009", employeeId: "demo_employee_8", author: "Sofia Reyes", date: isoDaysAgo(45), text: "Night audit coverage was dependable throughout the summer season. Former team member, kept for HR records." },
	],
};

// The Schedule portal owns the request records; the HR time-off queue uses
// this same list so approvals show up on both sides immediately.
export const TIME_OFF_SEED_REQUESTS = HR_SEED.timeOff.map((item) => ({ ...item }));
