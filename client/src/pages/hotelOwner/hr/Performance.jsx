import React, { useMemo, useState } from "react";
import Title from "../../../components/Title";
import HrTabs from "../../../components/hr/HrTabs";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../context/ToastContext";
import { useEmployees } from "../../../lib/employees";
import { addPerformanceNote, useHrRefresh, useHrState } from "../../../lib/hr";
import { useDemoUser } from "../../../context/DemoAuthContext";
import { formatDay } from "../../../lib/format";

const Performance = () => {
	useDocumentTitle("HR · Performance Notes");
	useHrRefresh();
	const toast = useToast();
	const employees = useEmployees();
	const hr = useHrState();
	const { demoUser } = useDemoUser();

	const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
	const [text, setText] = useState("");
	const [author, setAuthor] = useState(demoUser?.fullName || "Demo Owner");

	const selected = employees.find((item) => item.id === employeeId) || employees[0];

	const notes = useMemo(() => {
		return hr.performanceNotes
			.filter((note) => note.employeeId === selected?.id)
			.sort((a, b) => String(b.date).localeCompare(String(a.date)));
	}, [hr.performanceNotes, selected]);

	const submit = async (event) => {
		event.preventDefault();
		if (!text.trim()) {
			toast.show("Write a note before saving.", "error");
			return;
		}
		await addPerformanceNote({
			employeeId: selected.id,
			employeeName: selected.fullName,
			text,
			author,
		});
		setText("");
		toast.show(`Performance note added for ${selected.fullName}`);
	};

	return (
		<div className="max-w-[1000px]">
			<Title align="left" title="Performance Notes" subTitle="Keep a dated record of feedback, wins and coaching for each team member." />
			<HrTabs />

			<div className="mt-6">
				<label htmlFor="hr-note-employee" className="block text-sm font-medium text-gray-700">Employee</label>
				<select
					id="hr-note-employee"
					data-testid="hr-note-employee"
					value={selected?.id || ""}
					onChange={(event) => setEmployeeId(event.target.value)}
					className="mt-1 w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
				>
					{employees.map((employee) => (
						<option key={employee.id} value={employee.id}>
							{employee.fullName} · {employee.position}
						</option>
					))}
				</select>
			</div>

			<form onSubmit={submit} data-testid="hr-note-form" className="mt-5 rounded-2xl border border-gray-200 bg-white p-6">
				<h2 className="text-lg font-semibold text-gray-800">Add a note for {selected?.fullName}</h2>
				<div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
					<div>
						<label htmlFor="hr-note-author" className="block text-sm font-medium text-gray-700">Author</label>
						<input
							id="hr-note-author"
							data-testid="hr-note-author"
							value={author}
							onChange={(event) => setAuthor(event.target.value)}
							className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
						/>
					</div>
					<div>
						<label htmlFor="hr-note-text" className="block text-sm font-medium text-gray-700">Note</label>
						<textarea
							id="hr-note-text"
							data-testid="hr-note-text"
							rows={3}
							value={text}
							onChange={(event) => setText(event.target.value)}
							placeholder="e.g. Led the morning briefing and coached two new agents."
							className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
						/>
					</div>
				</div>
				<button type="submit" data-testid="hr-add-note" className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm text-white hover:bg-primary-dull cursor-pointer">
					Add note
				</button>
			</form>

			<h2 className="mt-8 text-lg font-semibold text-gray-800">Note history ({notes.length})</h2>
			<ul className="mt-4 space-y-4">
				{notes.map((note) => (
					<li key={note.id} data-testid="hr-note-item" className="rounded-xl border border-gray-200 bg-white p-5">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<p className="text-sm font-medium text-gray-800">{note.author}</p>
							<p className="text-xs text-gray-500">{formatDay(note.date, { month: "short", day: "numeric", year: "numeric" })}</p>
						</div>
						<p className="mt-2 text-sm text-gray-600">{note.text}</p>
					</li>
				))}
				{notes.length === 0 && (
					<li className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
						No performance notes for this employee yet.
					</li>
				)}
			</ul>
		</div>
	);
};

export default Performance;
