import React, { useMemo, useState } from "react";
import Title from "../../../components/Title";
import HrTabs from "../../../components/hr/HrTabs";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../context/ToastContext";
import {
	createEmployee,
	setEmployeeStatus,
	updateHrEmployee,
	useEmployees,
	validateHrEmployee,
} from "../../../lib/employees";
import { useHrRefresh, useHrState } from "../../../lib/hr";
import { useSchedule } from "../../../lib/schedule";
import { formatDay } from "../../../lib/format";

const emptyForm = {
	fullName: "",
	position: "",
	department: "",
	email: "",
	phone: "",
	address: "",
	employmentStatus: "active",
	payType: "hourly",
	payRate: "",
	hireDate: "",
};

const payLabel = (employee) => {
	const amount = Number(employee.payRate || 0);
	const value = amount.toLocaleString("en-US", {
		minimumFractionDigits: amount % 1 ? 2 : 0,
		maximumFractionDigits: 2,
	});
	return employee.payType === "salary" ? `$${value} / yr` : `$${value} / hr`;
};

const statusClass = (status) =>
	status === "inactive"
		? "bg-gray-100 text-gray-600"
		: "bg-green-100 text-green-700";

const Field = ({ label, id, children, wide = false }) => (
	<div className={wide ? "sm:col-span-2" : ""}>
		<label htmlFor={id} className="block text-sm font-medium text-gray-700">
			{label}
		</label>
		{children}
	</div>
);

const inputClass =
	"mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary";

const HrDirectory = () => {
	useDocumentTitle("HR · Employee Directory");
	useHrRefresh();
	const toast = useToast();
	const employees = useEmployees();
	const hr = useHrState();
	const schedule = useSchedule();

	const [search, setSearch] = useState("");
	const [department, setDepartment] = useState("all");
	const [status, setStatus] = useState("all");
	const [detailId, setDetailId] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [editingId, setEditingId] = useState(null);
	const [showForm, setShowForm] = useState(false);

	const departments = useMemo(() => {
		const values = [
			...hr.departments.map((item) => item.name),
			...employees.map((item) => item.department),
		].filter(Boolean);
		return [...new Set(values)].sort((a, b) => a.localeCompare(b));
	}, [hr.departments, employees]);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		return employees.filter((employee) => {
			if (term && !["fullName", "position", "department", "email", "phone", "address"]
				.some((key) => String(employee[key] || "").toLowerCase().includes(term))) {
				return false;
			}
			if (department !== "all" && employee.department !== department) return false;
			if (status !== "all" && (employee.employmentStatus || "active") !== status) return false;
			return true;
		});
	}, [employees, search, department, status]);

	const activeCount = employees.filter((e) => e.employmentStatus !== "inactive").length;

	const openAdd = () => {
		setForm({ ...emptyForm, department: departments[0] || "" });
		setEditingId(null);
		setShowForm(true);
	};

	const openEdit = (employee) => {
		setForm({
			fullName: employee.fullName || "",
			position: employee.position || "",
			department: employee.department || "",
			email: employee.email || "",
			phone: employee.phone || "",
			address: employee.address || "",
			employmentStatus: employee.employmentStatus || "active",
			payType: employee.payType || "hourly",
			payRate: employee.payRate ?? "",
			hireDate: employee.hireDate || "",
		});
		setEditingId(employee.id);
		setShowForm(true);
	};

	const save = async (event) => {
		event.preventDefault();
		const error = validateHrEmployee(form);
		if (error) {
			toast.show(error, "error");
			return;
		}
		if (editingId) {
			await updateHrEmployee(editingId, form);
			toast.show(`${form.fullName} updated`);
		} else {
			await createEmployee(form);
			toast.show(`${form.fullName} added to the directory`);
		}
		setShowForm(false);
		setEditingId(null);
	};

	const toggleStatus = async (employee) => {
		const next = employee.employmentStatus === "inactive" ? "active" : "inactive";
		if (next === "inactive" && !window.confirm(`Deactivate ${employee.fullName}? Their record and history will be kept.`)) {
			return;
		}
		await setEmployeeStatus(employee.id, next);
		toast.show(`${employee.fullName} ${next === "inactive" ? "deactivated" : "reactivated"}`);
	};

	const detail = employees.find((employee) => employee.id === detailId) || null;
	const detailPayRuns = hr.payRuns.filter((run) => run.employeeId === detailId);
	const detailNotes = hr.performanceNotes.filter((note) => note.employeeId === detailId);
	const detailRequests = schedule.requests.filter((item) => item.employeeId === detailId);

	return (
		<div className="max-w-[1400px]">
			<Title
				align="left"
				title="Human Resources"
				subTitle="Manage your team, payroll, time-off and performance records."
			/>
			<HrTabs />

			<div className="mt-6 grid gap-3 sm:grid-cols-3">
				{[
					{ label: "Team members", value: employees.length },
					{ label: "Active", value: activeCount },
					{ label: "Departments", value: departments.length },
				].map((stat) => (
					<div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
						<p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
						<p className="text-2xl font-semibold text-gray-800 mt-1">{stat.value}</p>
					</div>
				))}
			</div>

			<div className="mt-6 flex flex-wrap items-end gap-3">
				<div className="min-w-[220px] flex-1">
					<label htmlFor="hr-search" className="block text-sm font-medium text-gray-700">
						Search employees
					</label>
					<input
						id="hr-search"
						data-testid="hr-search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Name, role, email or phone"
						className={inputClass}
					/>
				</div>
				<div>
					<label htmlFor="hr-filter-department" className="block text-sm font-medium text-gray-700">
						Department
					</label>
					<select
						id="hr-filter-department"
						data-testid="hr-filter-department"
						value={department}
						onChange={(event) => setDepartment(event.target.value)}
						className={inputClass}
					>
						<option value="all">All departments</option>
						{departments.map((item) => (
							<option key={item} value={item}>{item}</option>
						))}
					</select>
				</div>
				<div>
					<label htmlFor="hr-filter-status" className="block text-sm font-medium text-gray-700">
						Status
					</label>
					<select
						id="hr-filter-status"
						data-testid="hr-filter-status"
						value={status}
						onChange={(event) => setStatus(event.target.value)}
						className={inputClass}
					>
						<option value="all">All statuses</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>
				<button
					type="button"
					data-testid="hr-add-employee"
					onClick={openAdd}
					className="rounded-lg bg-primary px-5 py-2.5 text-sm text-white hover:bg-primary-dull cursor-pointer"
				>
					+ Add employee
				</button>
			</div>

			{showForm && (
				<form
					data-testid="hr-employee-form"
					aria-label={editingId ? "Edit employee" : "Add employee"}
					onSubmit={save}
					className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 grid gap-4 sm:grid-cols-2"
				>
					<h2 className="sm:col-span-2 text-lg font-semibold text-gray-800">
						{editingId ? "Edit employee" : "New employee"}
					</h2>
					<Field label="Full name" id="hr-form-name">
						<input id="hr-form-name" data-testid="hr-form-name" className={inputClass} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
					</Field>
					<Field label="Position" id="hr-form-position">
						<input id="hr-form-position" data-testid="hr-form-position" className={inputClass} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
					</Field>
					<Field label="Department" id="hr-form-department">
						<input id="hr-form-department" list="hr-department-options" className={inputClass} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
						<datalist id="hr-department-options">
							{departments.map((item) => <option key={item} value={item} />)}
						</datalist>
					</Field>
					<Field label="Email" id="hr-form-email">
						<input id="hr-form-email" data-testid="hr-form-email" type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
					</Field>
					<Field label="Phone" id="hr-form-phone">
						<input id="hr-form-phone" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
					</Field>
					<Field label="Address" id="hr-form-address" wide>
						<input id="hr-form-address" className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
					</Field>
					<Field label="Pay type" id="hr-form-paytype">
						<select id="hr-form-paytype" className={inputClass} value={form.payType} onChange={(e) => setForm({ ...form, payType: e.target.value })}>
							<option value="hourly">Hourly</option>
							<option value="salary">Salary</option>
						</select>
					</Field>
					<Field label={form.payType === "salary" ? "Annual salary (USD)" : "Hourly rate (USD)"} id="hr-form-rate">
						<input id="hr-form-rate" data-testid="hr-form-rate" type="number" min="0" step="0.01" className={inputClass} value={form.payRate} onChange={(e) => setForm({ ...form, payRate: e.target.value })} />
					</Field>
					<Field label="Start date" id="hr-form-hiredate">
						<input id="hr-form-hiredate" type="date" className={inputClass} value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
					</Field>
					<Field label="Status" id="hr-form-status">
						<select id="hr-form-status" className={inputClass} value={form.employmentStatus} onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
					</Field>
					<div className="sm:col-span-2 flex gap-3">
						<button type="submit" data-testid="hr-form-submit" className="rounded-lg bg-primary px-5 py-2 text-sm text-white hover:bg-primary-dull cursor-pointer">
							{editingId ? "Save changes" : "Add employee"}
						</button>
						<button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-5 py-2 text-sm hover:bg-gray-50 cursor-pointer">
							Cancel
						</button>
					</div>
				</form>
			)}

			<div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
				<table data-testid="hr-directory-table" className="w-full min-w-[1080px] text-left text-sm">
					<thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
						<tr>
							<th scope="col" className="px-4 py-3">Name / Role</th>
							<th scope="col" className="px-4 py-3">Department</th>
							<th scope="col" className="px-4 py-3">Email</th>
							<th scope="col" className="px-4 py-3">Phone</th>
							<th scope="col" className="px-4 py-3">Address</th>
							<th scope="col" className="px-4 py-3">Pay / rate</th>
							<th scope="col" className="px-4 py-3">Status</th>
							<th scope="col" className="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((employee) => (
							<tr key={employee.id} data-testid="hr-employee-row" className="border-t border-gray-100 hover:bg-gray-50/60">
								<td className="px-4 py-3">
									<p className="font-medium text-gray-800">{employee.fullName}</p>
									<p className="text-xs text-gray-500">{employee.position}</p>
								</td>
								<td className="px-4 py-3 text-gray-600">{employee.department || "—"}</td>
								<td className="px-4 py-3 text-gray-600">{employee.email}</td>
								<td className="px-4 py-3 text-gray-600 whitespace-nowrap">{employee.phone || "—"}</td>
								<td className="px-4 py-3 text-gray-600 max-w-[220px] truncate" title={employee.address}>{employee.address || "—"}</td>
								<td className="px-4 py-3 text-gray-600 whitespace-nowrap">{payLabel(employee)}</td>
								<td className="px-4 py-3">
									<span data-testid="hr-status-badge" className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(employee.employmentStatus)}`}>
										{employee.employmentStatus || "active"}
									</span>
								</td>
								<td className="px-4 py-3 text-right whitespace-nowrap">
									<button type="button" data-testid="hr-view-employee" onClick={() => setDetailId(employee.id)} className="px-2 py-1 text-sm text-primary hover:underline cursor-pointer">View</button>
									<button type="button" data-testid="hr-edit-employee" onClick={() => openEdit(employee)} className="px-2 py-1 text-sm text-gray-600 hover:underline cursor-pointer">Edit</button>
									<button
										type="button"
										data-testid="hr-deactivate-employee"
										onClick={() => toggleStatus(employee)}
										className={`px-2 py-1 text-sm cursor-pointer ${employee.employmentStatus === "inactive" ? "text-green-600 hover:underline" : "text-red-600 hover:underline"}`}
									>
										{employee.employmentStatus === "inactive" ? "Reactivate" : "Deactivate"}
									</button>
								</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr>
								<td colSpan={8} className="px-4 py-10 text-center text-gray-500">No employees match those filters.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{detail && (
				<div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`${detail.fullName} details`}>
					<button type="button" aria-label="Close details" className="absolute inset-0 bg-black/40 cursor-default" onClick={() => setDetailId(null)} />
					<div data-testid="hr-employee-detail" className="relative h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
						<div className="flex items-start justify-between gap-4">
							<div>
								<h2 className="text-2xl font-semibold text-gray-800">{detail.fullName}</h2>
								<p className="text-sm text-gray-500">{detail.position} · {detail.department || "No department"}</p>
							</div>
							<button type="button" onClick={() => setDetailId(null)} className="rounded-full border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 cursor-pointer">Close</button>
						</div>
						<dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
							{[
								["Email", detail.email],
								["Phone", detail.phone],
								["Address", detail.address],
								["Pay", payLabel(detail)],
								["Start date", detail.hireDate],
								["Status", detail.employmentStatus],
							].map(([label, value]) => (
								<div key={label}>
									<dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
									<dd className="mt-1 text-gray-700">{value || "—"}</dd>
								</div>
							))}
						</dl>
						<div className="mt-6 flex gap-3">
							<button type="button" data-testid="hr-detail-edit" onClick={() => openEdit(detail)} className="rounded-lg bg-primary px-4 py-2 text-sm text-white cursor-pointer">Edit profile</button>
							<button type="button" data-testid="hr-detail-status" onClick={() => toggleStatus(detail)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm cursor-pointer">
								{detail.employmentStatus === "inactive" ? "Reactivate" : "Deactivate"}
							</button>
						</div>
						{[
							{ title: "Upcoming shifts", items: detail.assignments, render: (item) => `${item.title} · ${formatDay(item.date)} ${item.startTime}–${item.endTime}` },
							{ title: "Payroll history", items: detailPayRuns, render: (item) => `${item.period} · $${item.amount.toLocaleString()} · ${item.status}` },
							{ title: "Requests", items: detailRequests, render: (item) => `${item.type} · ${item.date} · ${item.status}` },
							{ title: "Performance notes", items: detailNotes, render: (item) => `${formatDay(item.date)} · ${item.author}: ${item.text}` },
						].map((section) => (
							<section key={section.title} className="mt-6 border-t border-gray-200 pt-5">
								<h3 className="text-sm font-semibold text-gray-800">{section.title}</h3>
								<ul className="mt-2 space-y-2 text-sm text-gray-600">
									{section.items.map((item) => <li key={item.id}>{section.render(item)}</li>)}
									{section.items.length === 0 && <li className="text-gray-400">Nothing recorded yet.</li>}
								</ul>
							</section>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default HrDirectory;
