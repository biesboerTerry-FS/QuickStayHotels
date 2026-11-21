import React, { useMemo, useState } from "react";
import Title from "../../components/Title";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useToast } from "../../context/ToastContext";
import { useDemoUser } from "../../context/DemoAuthContext";
import { DEMO_EMPLOYEE_ID, SEED_EMPLOYEES, useEmployee } from "../../lib/employees";
import {
	isAvailable,
	setAvailability,
	submitRequest,
	updateRequestStatus,
	useSchedule,
} from "../../lib/schedule";
import { formatDay, todayIso } from "../../lib/format";

const statusClass = {
	pending: "bg-amber-100 text-amber-700",
	approved: "bg-green-100 text-green-700",
	denied: "bg-gray-100 text-gray-500",
};

const tomorrow = () => {
	const date = new Date();
	date.setDate(date.getDate() + 1);
	return date.toISOString().slice(0, 10);
};

const RequestRow = ({ request, showEmployee, onDecision }) => (
	<li
		data-testid={request.type === "time-off" ? "timeoff-request-item" : "schedule-request-item"}
		className="rounded-xl border border-gray-200 p-4"
	>
		<div className="flex flex-wrap items-start justify-between gap-3">
			<div>
				<p className="text-sm font-medium text-gray-800">
					{request.type === "time-off" ? "Time off" : "Shift change"} · {request.date}
					{request.endDate && request.endDate !== request.date ? ` → ${request.endDate}` : ""}
				</p>
				{showEmployee && (
					<p className="text-xs text-gray-500 mt-1">{request.employeeName}</p>
				)}
				<p className="text-sm text-gray-600 mt-2">{request.reason || "No reason provided."}</p>
			</div>
			<div className="flex flex-col items-end gap-2">
				<span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass[request.status] || statusClass.pending}`}>
					{request.status}
				</span>
				{onDecision && request.status === "pending" && (
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => onDecision(request.id, "approved")}
							className="rounded-full border border-green-300 px-3 py-1 text-xs text-green-700 hover:bg-green-50 cursor-pointer"
						>
							Approve
						</button>
						<button
							type="button"
							onClick={() => onDecision(request.id, "denied")}
							className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
						>
							Deny
						</button>
					</div>
				)}
			</div>
		</div>
	</li>
);

const Schedule = ({ role = "employee" }) => {
	useDocumentTitle("Schedule");
	const toast = useToast();
	const { demoUser } = useDemoUser();
	const employeeId = demoUser?.employeeId || DEMO_EMPLOYEE_ID;
	const employee = useEmployee(employeeId);
	const state = useSchedule();
	const isOwner = role === "owner";

	const [form, setForm] = useState({ type: "shift", date: tomorrow(), endDate: "", reason: "" });

	const assignments = useMemo(() => {
		const source = isOwner ? SEED_EMPLOYEES : employee ? [employee] : [];
		return source
			.flatMap((item) =>
				(item.assignments || []).map((assignment) => ({
					...assignment,
					employeeName: item.fullName,
				}))
			)
			.filter((assignment) => assignment.date >= todayIso())
			.sort((a, b) => a.date.localeCompare(b.date));
	}, [isOwner, employee]);

	const requests = state.requests;
	const shiftRequests = isOwner ? requests.filter((r) => r.type === "shift") : requests.filter((r) => r.employeeId === employeeId && r.type === "shift");
	const timeOffRequests = isOwner ? requests.filter((r) => r.type === "time-off") : requests.filter((r) => r.employeeId === employeeId && r.type === "time-off");

	const decide = (id, decision) => {
		updateRequestStatus(id, decision);
		toast.show(`Request ${decision}`);
	};

	const submit = (event) => {
		event.preventDefault();
		if (!form.date) {
			toast.show("Choose a date for your request.", "error");
			return;
		}
		submitRequest({
			type: form.type,
			employeeId,
			employeeName: employee?.fullName || "Demo employee",
			date: form.date,
			endDate: form.type === "time-off" ? form.endDate || form.date : form.date,
			reason: form.reason,
		});
		setForm({ type: "shift", date: tomorrow(), endDate: "", reason: "" });
		toast.show("Your request was submitted");
	};

	const toggleAvailability = () => {
		const next = !isAvailable(employeeId);
		setAvailability(employeeId, next);
		toast.show(next ? "You are marked available" : "You are marked unavailable");
	};

	return (
		<div>
			<Title
				align="left"
				title="Schedule"
				subTitle={isOwner ? "Team shifts, requests and availability at a glance." : "Your upcoming shifts, requests and availability."}
			/>

			<div className="mt-8 grid gap-6 lg:grid-cols-2">
				<section aria-label="Upcoming shifts" className="rounded-xl border border-gray-200 bg-white p-5">
					<h2 className="text-lg font-semibold text-gray-800">Upcoming shifts</h2>
					<ul className="mt-4 space-y-3">
						{assignments.map((assignment) => (
							<li key={assignment.id} data-testid="shift-item" className="rounded-lg border border-gray-200 p-3">
								<div className="flex flex-wrap justify-between gap-2">
									<p className="text-sm font-medium text-gray-800">{assignment.title}</p>
									<span className="text-xs text-primary">
										{formatDay(assignment.date, { weekday: "short", month: "short", day: "numeric" })}
									</span>
								</div>
								<p className="text-xs text-gray-500 mt-1">
									{assignment.startTime} – {assignment.endTime} · {assignment.location}
								</p>
								{isOwner && <p className="text-xs text-gray-500 mt-1">{assignment.employeeName}</p>}
							</li>
						))}
						{assignments.length === 0 && <li className="text-sm text-gray-500">No upcoming shifts.</li>}
					</ul>
				</section>

				<section aria-label="Availability" className="rounded-xl border border-gray-200 bg-white p-5">
					<h2 className="text-lg font-semibold text-gray-800">Availability</h2>
					{isOwner ? (
						<ul className="mt-4 space-y-3">
							{SEED_EMPLOYEES.map((item) => (
								<li key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
									<span className="text-sm text-gray-700">{item.fullName}</span>
									<span className={`rounded-full px-3 py-1 text-xs ${isAvailable(item.id) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
										{isAvailable(item.id) ? "Available" : "Unavailable"}
									</span>
								</li>
							))}
						</ul>
					) : (
						<div className="mt-4 rounded-lg border border-gray-200 p-4 flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-800">Available for shifts</p>
								<p className="text-xs text-gray-500 mt-1">Let the team know you can take assignments.</p>
							</div>
							<button
								type="button"
								role="switch"
								aria-checked={isAvailable(employeeId)}
								data-testid="availability-toggle"
								onClick={toggleAvailability}
								className={`relative h-7 w-12 rounded-full transition-colors cursor-pointer ${isAvailable(employeeId) ? "bg-primary" : "bg-gray-300"}`}
							>
								<span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${isAvailable(employeeId) ? "left-6" : "left-1"}`} />
							</button>
						</div>
					)}
				</section>

				{!isOwner && (
					<section aria-label="Submit a request" className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
						<h2 className="text-lg font-semibold text-gray-800">New request</h2>
						<form data-testid="schedule-request-form" onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
							<div>
								<label htmlFor="request-type" className="block text-sm font-medium text-gray-700">Request type</label>
								<select
									id="request-type"
									value={form.type}
									onChange={(e) => setForm({ ...form, type: e.target.value })}
									className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
								>
									<option value="shift">Schedule request</option>
									<option value="time-off">Time off request</option>
								</select>
							</div>
							<div>
								<label htmlFor="request-date" className="block text-sm font-medium text-gray-700">Date</label>
								<input
									id="request-date"
									type="date"
									value={form.date}
									onChange={(e) => setForm({ ...form, date: e.target.value })}
									className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
								/>
							</div>
							{form.type === "time-off" && (
								<div>
									<label htmlFor="request-end-date" className="block text-sm font-medium text-gray-700">End date</label>
									<input
										id="request-end-date"
										type="date"
										value={form.endDate}
										onChange={(e) => setForm({ ...form, endDate: e.target.value })}
										className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
									/>
								</div>
							)}
							<div className={form.type === "time-off" ? "" : "sm:col-span-1"}>
								<label htmlFor="request-reason" className="block text-sm font-medium text-gray-700">Reason</label>
								<input
									id="request-reason"
									value={form.reason}
									onChange={(e) => setForm({ ...form, reason: e.target.value })}
									placeholder="Optional details"
									className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
								/>
							</div>
							<div className="flex items-end">
								<button
									type="submit"
									data-testid="schedule-request-submit"
									className="rounded-lg bg-primary px-5 py-2 text-sm text-white hover:bg-primary-dull cursor-pointer"
								>
									Submit request
								</button>
							</div>
						</form>
					</section>
				)}

				<section aria-label="Schedule requests" className="rounded-xl border border-gray-200 bg-white p-5">
					<h2 className="text-lg font-semibold text-gray-800">Schedule requests</h2>
					<ul className="mt-4 space-y-3">
						{shiftRequests.map((request) => (
							<RequestRow key={request.id} request={request} showEmployee={isOwner} onDecision={isOwner ? decide : null} />
						))}
						{shiftRequests.length === 0 && <li className="text-sm text-gray-500">No schedule requests.</li>}
					</ul>
				</section>

				<section aria-label="Time off requests" className="rounded-xl border border-gray-200 bg-white p-5">
					<h2 className="text-lg font-semibold text-gray-800">Time off requests</h2>
					<ul className="mt-4 space-y-3">
						{timeOffRequests.map((request) => (
							<RequestRow key={request.id} request={request} showEmployee={isOwner} onDecision={isOwner ? decide : null} />
						))}
						{timeOffRequests.length === 0 && <li className="text-sm text-gray-500">No time off requests.</li>}
					</ul>
				</section>
			</div>
		</div>
	);
};

export default Schedule;
