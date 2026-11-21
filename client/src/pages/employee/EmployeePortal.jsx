import React, { useState } from "react";
import { Link } from "react-router-dom";
import Title from "../../components/Title";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useToast } from "../../context/ToastContext";
import { useDemoUser } from "../../context/DemoAuthContext";
import {
	DEMO_EMPLOYEE_ID,
	EMPLOYEE_EDITABLE_FIELDS,
	updateEmployee,
	useEmployee,
} from "../../lib/employees";
import { formatDay } from "../../lib/format";
import PendingBookingsWidget from "../../components/portal/PendingBookingsWidget";

const pickEditable = (employee) => ({
	fullName: employee?.fullName || "",
	email: employee?.email || "",
	phone: employee?.phone || "",
	address: employee?.address || "",
});

const labels = {
	fullName: "Full name",
	email: "Email",
	phone: "Phone",
	address: "Address",
};

const Detail = ({ label, value, testId }) => (
	<div data-testid={testId}>
		<dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
		<dd className="mt-1 text-sm text-gray-800 break-words">{value || "—"}</dd>
	</div>
);

const EmployeePortal = () => {
	useDocumentTitle("Employee Portal");
	const toast = useToast();
	const { demoUser } = useDemoUser();
	const employeeId = demoUser?.employeeId || DEMO_EMPLOYEE_ID;
	const employee = useEmployee(employeeId);
	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState(() => pickEditable(employee));

	if (!employee) {
		return (
			<div className="max-w-2xl mx-auto px-4 py-24 text-center">
				<h1 className="font-playfair text-2xl text-gray-800">Profile not found</h1>
				<p className="text-sm text-gray-500 mt-3">
					We couldn't load an employee profile for this demo account.
				</p>
				<Link to="/" className="text-sm text-primary hover:underline mt-4 inline-block">
					Back to home
				</Link>
			</div>
		);
	}

	const startEditing = () => {
		setForm(pickEditable(employee));
		setEditing(true);
	};

	const cancelEditing = () => {
		setForm(pickEditable(employee));
		setEditing(false);
	};

	const save = (event) => {
		event.preventDefault();
		if (!form.fullName.trim() || !form.email.trim()) {
			toast.show("Name and email are required.", "error");
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
			toast.show("Enter a valid email address.", "error");
			return;
		}
		const patch = {};
		for (const field of EMPLOYEE_EDITABLE_FIELDS) patch[field] = form[field];
		updateEmployee(employee.id, patch);
		setEditing(false);
		toast.show("Your details were saved.");
	};

	const assignments = [...employee.assignments].sort(
		(a, b) => new Date(a.date) - new Date(b.date)
	);

	return (
		<div>
				<Title
					align="left"
					title="My employee portal"
					subTitle="Your own profile and upcoming assignments."
				/>

				<p className="mt-6 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-gray-600">
					Limited view · Only your own details and shifts are shown here. Hotel
					management tools live in a separate area.
				</p>

				<div className="mt-8">
					<PendingBookingsWidget role="employee" />
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
					<section
						aria-label="My details"
						className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
					>
						<div className="flex items-start justify-between gap-4">
							<div>
								<h2 className="font-playfair text-2xl text-gray-800">
									{employee.fullName}
								</h2>
								<p className="text-sm text-primary mt-1">{employee.position}</p>
								<p className="text-xs text-gray-500 mt-0.5">{employee.department}</p>
							</div>
							{!editing && (
								<button
									onClick={startEditing}
									className="shrink-0 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
								>
									Edit my details
								</button>
							)}
						</div>

						{editing ? (
							<form onSubmit={save} aria-label="Edit my details" className="mt-6 grid gap-4">
								{EMPLOYEE_EDITABLE_FIELDS.map((field) => (
									<div key={field}>
										<label
											htmlFor={`employee-${field}`}
											className="block text-sm font-medium text-gray-700"
										>
											{labels[field]}
										</label>
										{field === "address" ? (
											<textarea
												id={`employee-${field}`}
												rows={2}
												value={form[field]}
												onChange={(e) => setForm({ ...form, [field]: e.target.value })}
												className="w-full rounded border border-gray-300 px-3 py-2 mt-1 outline-none focus:border-primary"
											/>
										) : (
											<input
												id={`employee-${field}`}
												type={field === "email" ? "email" : "text"}
												value={form[field]}
												onChange={(e) => setForm({ ...form, [field]: e.target.value })}
												className="w-full rounded border border-gray-300 px-3 py-2 mt-1 outline-none focus:border-primary"
											/>
										)}
									</div>
								))}
								<div className="flex gap-3 pt-1">
									<button
										type="submit"
										className="px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-dull cursor-pointer"
									>
										Save changes
									</button>
									<button
										type="button"
										onClick={cancelEditing}
										className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
									>
										Cancel
									</button>
								</div>
								<p className="text-xs text-gray-400">
									You can only change your own contact details. Your position and
									role are managed by the hotel.
								</p>
							</form>
						) : (
							<dl className="grid grid-cols-1 gap-4 mt-6">
								<Detail label="Email" value={employee.email} testId="employee-email" />
								<Detail label="Phone" value={employee.phone} testId="employee-phone" />
								<Detail label="Address" value={employee.address} testId="employee-address" />
							</dl>
						)}
					</section>

					<section
						aria-label="Upcoming assignments"
						className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
					>
						<div className="flex items-baseline justify-between gap-3">
							<h2 className="font-playfair text-2xl text-gray-800">
								Upcoming assignments
							</h2>
							<span className="text-xs text-gray-500">
								{assignments.length} scheduled
							</span>
						</div>
						<ul className="mt-5 space-y-3">
							{assignments.map((assignment) => (
								<li
									key={assignment.id}
									data-testid="employee-shift"
									className="rounded-xl border border-gray-200 p-4"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<p className="text-sm font-medium text-gray-800">
											{assignment.title}
										</p>
										<span className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1">
											{formatDay(assignment.date, {
												weekday: "short",
												month: "short",
												day: "numeric",
											})}
										</span>
									</div>
									<p className="text-sm text-gray-600 mt-2">
										{assignment.startTime} – {assignment.endTime}
									</p>
									<p className="text-xs text-gray-500 mt-1">{assignment.location}</p>
								</li>
							))}
							{assignments.length === 0 && (
								<li className="text-sm text-gray-500 py-4">
									No upcoming assignments.
								</li>
							)}
						</ul>
					</section>
				</div>
		</div>
	);
};

export default EmployeePortal;
