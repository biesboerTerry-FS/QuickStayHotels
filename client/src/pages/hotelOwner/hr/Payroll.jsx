import React, { useEffect, useMemo, useState } from "react";
import Title from "../../../components/Title";
import HrTabs from "../../../components/hr/HrTabs";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../context/ToastContext";
import { useEmployees } from "../../../lib/employees";
import { addPayRun, useHrRefresh, useHrState, validatePayRunForm } from "../../../lib/hr";
import { formatDay } from "../../../lib/format";

const currentMonth = () => new Date().toISOString().slice(0, 7);

const money = (value) =>
	`$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Payroll = () => {
	useDocumentTitle("HR · Payroll");
	useHrRefresh();
	const toast = useToast();
	const employees = useEmployees();
	const hr = useHrState();

	const [form, setForm] = useState({
		employeeId: employees[0]?.id || "",
		period: currentMonth(),
		hours: 80,
		amount: "",
		note: "",
	});
	const [historyFilter, setHistoryFilter] = useState("all");

	useEffect(() => {
		if (!form.employeeId && employees[0]) {
			setForm((current) => ({ ...current, employeeId: employees[0].id }));
		}
	}, [employees, form.employeeId]);

	const selected = employees.find((item) => item.id === form.employeeId);

	const suggestedAmount = useMemo(() => {
		if (!selected) return "";
		const hours = Number(form.hours) || 0;
		const rate = Number(selected.payRate) || 0;
		const effective = selected.payType === "salary" ? rate / 2080 : rate;
		return (effective * hours).toFixed(2);
	}, [selected, form.hours]);

	useEffect(() => {
		setForm((current) => ({ ...current, amount: suggestedAmount }));
	}, [suggestedAmount, form.employeeId]);

	const runs = useMemo(() => {
		const list = historyFilter === "all"
			? hr.payRuns
			: hr.payRuns.filter((run) => run.employeeId === historyFilter);
		return [...list].sort((a, b) => String(b.paidAt).localeCompare(String(a.paidAt)));
	}, [hr.payRuns, historyFilter]);

	const totalPaid = hr.payRuns.reduce((sum, run) => sum + Number(run.amount || 0), 0);
	const periodTotal = hr.payRuns
		.filter((run) => run.period === form.period)
		.reduce((sum, run) => sum + Number(run.amount || 0), 0);

	const run = async (event) => {
		event.preventDefault();
		const error = validatePayRunForm(form);
		if (error) {
			toast.show(error, "error");
			return;
		}
		await addPayRun({
			...form,
			employeeName: selected?.fullName || "Team member",
		});
		toast.show(`Payroll run recorded for ${selected?.fullName} · ${form.period}`);
		setForm((current) => ({ ...current, note: "" }));
	};

	return (
		<div className="max-w-[1200px]">
			<Title align="left" title="Payroll" subTitle="Review pay-run history and record a demo pay run." />
			<HrTabs />

			<div className="mt-6 grid gap-3 sm:grid-cols-3">
				{[
					{ label: "Lifetime paid", value: money(totalPaid) },
					{ label: `Paid for ${form.period}`, value: money(periodTotal) },
					{ label: "Pay runs", value: hr.payRuns.length },
				].map((stat) => (
					<div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
						<p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
						<p className="text-2xl font-semibold text-gray-800 mt-1">{stat.value}</p>
					</div>
				))}
			</div>

			<form
				data-testid="hr-payroll-form"
				onSubmit={run}
				className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
			>
				<h2 className="sm:col-span-3 text-lg font-semibold text-gray-800">Run payroll (demo)</h2>
				<div>
					<label htmlFor="hr-payroll-employee" className="block text-sm font-medium text-gray-700">Employee</label>
					<select
						id="hr-payroll-employee"
						data-testid="hr-payroll-employee"
						value={form.employeeId}
						onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
						className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
					>
						{employees.map((employee) => (
							<option key={employee.id} value={employee.id}>
								{employee.fullName} · {employee.department}
							</option>
						))}
					</select>
				</div>
				<div>
					<label htmlFor="hr-payroll-period" className="block text-sm font-medium text-gray-700">Pay period</label>
					<input
						id="hr-payroll-period"
						data-testid="hr-payroll-period"
						type="month"
						value={form.period}
						onChange={(event) => setForm({ ...form, period: event.target.value })}
						className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
					/>
				</div>
				<div>
					<label htmlFor="hr-payroll-hours" className="block text-sm font-medium text-gray-700">Hours</label>
					<input
						id="hr-payroll-hours"
						data-testid="hr-payroll-hours"
						type="number"
						min="1"
						max="1000"
						step="0.5"
						value={form.hours}
						onChange={(event) => setForm({ ...form, hours: event.target.value })}
						className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
					/>
				</div>
				<div>
					<label htmlFor="hr-payroll-amount" className="block text-sm font-medium text-gray-700">
						Amount (USD) {selected && <span className="font-normal text-gray-400">· suggested {money(suggestedAmount)}</span>}
					</label>
					<input
						id="hr-payroll-amount"
						data-testid="hr-payroll-amount"
						type="number"
						min="0"
						step="0.01"
						value={form.amount}
						onChange={(event) => setForm({ ...form, amount: event.target.value })}
						className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
					/>
				</div>
				<div className="sm:col-span-2">
					<label htmlFor="hr-payroll-note" className="block text-sm font-medium text-gray-700">Note (optional)</label>
					<input
						id="hr-payroll-note"
						value={form.note}
						onChange={(event) => setForm({ ...form, note: event.target.value })}
						placeholder="e.g. Holiday bonus"
						className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
					/>
				</div>
				<div className="flex items-end">
					<button
						type="submit"
						data-testid="hr-run-payroll"
						className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm text-white hover:bg-primary-dull cursor-pointer"
					>
						Run payroll
					</button>
				</div>
			</form>

			<div className="mt-8 flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-lg font-semibold text-gray-800">Pay-run history</h2>
				<select
					aria-label="Filter pay runs by employee"
					data-testid="hr-payrun-filter"
					value={historyFilter}
					onChange={(event) => setHistoryFilter(event.target.value)}
					className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
				>
					<option value="all">All employees</option>
					{employees.map((employee) => (
						<option key={employee.id} value={employee.id}>{employee.fullName}</option>
					))}
				</select>
			</div>

			<div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
				<table className="w-full min-w-[760px] text-left text-sm">
					<thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
						<tr>
							<th scope="col" className="px-4 py-3">Employee</th>
							<th scope="col" className="px-4 py-3">Period</th>
							<th scope="col" className="px-4 py-3">Hours</th>
							<th scope="col" className="px-4 py-3">Amount</th>
							<th scope="col" className="px-4 py-3">Status</th>
							<th scope="col" className="px-4 py-3">Paid on</th>
							<th scope="col" className="px-4 py-3">Reference</th>
						</tr>
					</thead>
					<tbody>
						{runs.map((run) => (
							<tr key={run.id} data-testid="hr-payrun-row" className="border-t border-gray-100">
								<td className="px-4 py-3 text-gray-800">{run.employeeName}</td>
								<td className="px-4 py-3 text-gray-600">{run.period}</td>
								<td className="px-4 py-3 text-gray-600">{run.hours}</td>
								<td className="px-4 py-3 font-medium text-gray-800">{money(run.amount)}</td>
								<td className="px-4 py-3"><span className="rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700 capitalize">{run.status}</span></td>
								<td className="px-4 py-3 text-gray-600">{formatDay(run.paidAt, { month: "short", day: "numeric", year: "numeric" })}</td>
								<td className="px-4 py-3 text-gray-500 text-xs">{run.reference}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default Payroll;
