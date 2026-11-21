import React, { useState } from "react";
import Title from "../../../components/Title";
import HrTabs from "../../../components/hr/HrTabs";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../context/ToastContext";
import { useEmployees } from "../../../lib/employees";
import { addDepartment, addRole, removeDepartment, removeRole, useHrRefresh, useHrState } from "../../../lib/hr";

const inputClass =
	"w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary";

const HrSettings = () => {
	useDocumentTitle("HR · Roles & Departments");
	useHrRefresh();
	const toast = useToast();
	const hr = useHrState();
	const employees = useEmployees();
	const [department, setDepartment] = useState({ name: "", description: "" });
	const [role, setRole] = useState({ label: "", department: "" });

	const saveDepartment = async (event) => {
		event.preventDefault();
		if (!department.name.trim()) {
			toast.show("Enter a department name.", "error");
			return;
		}
		await addDepartment(department);
		setDepartment({ name: "", description: "" });
		toast.show(`Department "${department.name.trim()}" added`);
	};

	const saveRole = async (event) => {
		event.preventDefault();
		if (!role.label.trim()) {
			toast.show("Enter a role label.", "error");
			return;
		}
		await addRole(role);
		setRole({ label: "", department: hr.departments[0]?.name || "" });
		toast.show(`Role "${role.label.trim()}" added`);
	};

	const dropDepartment = async (item) => {
		const inUse = employees.filter((employee) => employee.department === item.name).length;
		if (inUse > 0 && !window.confirm(`${inUse} employee(s) still use ${item.name}. Remove it anyway?`)) {
			return;
		}
		await removeDepartment(item.id);
		toast.show(`Department "${item.name}" removed`);
	};

	const dropRole = async (item) => {
		await removeRole(item.id);
		toast.show(`Role "${item.label}" removed`);
	};

	return (
		<div className="max-w-[1100px]">
			<Title align="left" title="Roles & Departments" subTitle="Keep your organisation structure up to date for the employee directory." />
			<HrTabs />

			<div className="mt-6 grid gap-6 lg:grid-cols-2">
				<section className="rounded-2xl border border-gray-200 bg-white p-6">
					<h2 className="text-lg font-semibold text-gray-800">Departments ({hr.departments.length})</h2>
					<form onSubmit={saveDepartment} className="mt-4 grid gap-3">
						<input
							aria-label="Department name"
							data-testid="hr-department-name"
							value={department.name}
							onChange={(event) => setDepartment({ ...department, name: event.target.value })}
							placeholder="e.g. Guest Services"
							className={inputClass}
						/>
						<input
							aria-label="Department description"
							value={department.description}
							onChange={(event) => setDepartment({ ...department, description: event.target.value })}
							placeholder="Short description (optional)"
							className={inputClass}
						/>
						<button type="submit" data-testid="hr-add-department" className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dull cursor-pointer">
							Add department
						</button>
					</form>
					<ul className="mt-5 space-y-2">
						{hr.departments.map((item) => (
							<li key={item.id} data-testid="hr-department-item" className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
								<div>
									<p className="text-sm font-medium text-gray-800">{item.name}</p>
									{item.description && <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>}
								</div>
								<button type="button" aria-label={`Remove ${item.name}`} onClick={() => dropDepartment(item)} className="text-xs text-red-600 hover:underline cursor-pointer">
									Remove
								</button>
							</li>
						))}
					</ul>
				</section>

				<section className="rounded-2xl border border-gray-200 bg-white p-6">
					<h2 className="text-lg font-semibold text-gray-800">Role labels ({hr.roles.length})</h2>
					<form onSubmit={saveRole} className="mt-4 grid gap-3 sm:grid-cols-2">
						<input
							aria-label="Role label"
							data-testid="hr-role-label"
							value={role.label}
							onChange={(event) => setRole({ ...role, label: event.target.value })}
							placeholder="e.g. Concierge"
							className={inputClass}
						/>
						<select
							aria-label="Role department"
							data-testid="hr-role-department"
							value={role.department}
							onChange={(event) => setRole({ ...role, department: event.target.value })}
							className={inputClass}
						>
							<option value="">No department</option>
							{hr.departments.map((item) => (
								<option key={item.id} value={item.name}>{item.name}</option>
							))}
						</select>
						<button type="submit" data-testid="hr-add-role" className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dull cursor-pointer sm:col-span-2">
							Add role
						</button>
					</form>
					<ul className="mt-5 space-y-2">
						{hr.roles.map((item) => (
							<li key={item.id} data-testid="hr-role-item" className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
								<div>
									<p className="text-sm font-medium text-gray-800">{item.label}</p>
									{item.department && <p className="mt-0.5 text-xs text-gray-500">{item.department}</p>}
								</div>
								<button type="button" aria-label={`Remove ${item.label}`} onClick={() => dropRole(item)} className="text-xs text-red-600 hover:underline cursor-pointer">
									Remove
								</button>
							</li>
						))}
					</ul>
				</section>
			</div>
		</div>
	);
};

export default HrSettings;
