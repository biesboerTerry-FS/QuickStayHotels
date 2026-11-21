import React, { useEffect, useMemo, useState } from "react";
import Title from "../../../components/Title";
import Icon from "../../../components/Icons";
import HrTabs from "../../../components/hr/HrTabs";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../context/ToastContext";
import { decideTimeOff, useHrRefresh } from "../../../lib/hr";
import { syncBlocksFromServer, useSchedule } from "../../../lib/schedule";
import { formatDay } from "../../../lib/format";

const statusClass = {
	pending: "bg-amber-100 text-amber-700",
	approved: "bg-green-100 text-green-700",
	denied: "bg-gray-100 text-gray-600",
};

const TimeOff = () => {
	useDocumentTitle("HR · Time-off Approvals");
	useHrRefresh();
	const toast = useToast();
	const schedule = useSchedule();
	const [filter, setFilter] = useState("pending");

	useEffect(() => {
		syncBlocksFromServer("all");
	}, []);

	const requests = useMemo(() => {
		const list = [...schedule.requests].sort((a, b) =>
			String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
		);
		if (filter === "pending") return list.filter((item) => item.status === "pending");
		if (filter === "time-off") return list.filter((item) => item.type === "time-off");
		return list;
	}, [schedule.requests, filter]);

	const pendingCount = schedule.requests.filter((item) => item.status === "pending").length;

	const decide = async (request, status) => {
		await decideTimeOff(request, status);
		toast.show(`${request.employeeName}'s request ${status}`);
	};

	return (
		<div className="max-w-[1000px]">
			<Title align="left" title="Time-off Approvals" subTitle="Review requests submitted in the employee portal. Decisions appear there instantly." />
			<HrTabs />

			<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
				<p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
					{pendingCount} pending request{pendingCount === 1 ? "" : "s"}
				</p>
				<select
					aria-label="Filter requests"
					data-testid="hr-timeoff-filter"
					value={filter}
					onChange={(event) => setFilter(event.target.value)}
					className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
				>
					<option value="pending">Pending only</option>
					<option value="time-off">All time-off</option>
					<option value="all">All requests</option>
				</select>
			</div>

			<ul className="mt-5 space-y-4">
				{requests.map((request) => (
					<li key={request.id} data-testid={request.kind === "block" ? "hr-timeoff-block-row" : "hr-timeoff-request"} className="rounded-xl border border-gray-200 bg-white p-5">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<div className="flex flex-wrap items-center gap-2">
									<h2 className="font-medium text-gray-800">{request.employeeName}</h2>
									<span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 capitalize">
										{request.type === "time-off" ? "Time off" : "Shift change"}
									</span>
									{request.kind === "block" && (
										<span data-testid="hr-timeoff-block" className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
											Partial day
										</span>
									)}
								</div>
								<p className="mt-2 text-sm text-gray-600">
									{formatDay(request.date, { month: "short", day: "numeric", year: "numeric" })}
									{request.endDate && request.endDate !== request.date
										? ` → ${formatDay(request.endDate, { month: "short", day: "numeric", year: "numeric" })}`
										: ""}
								</p>
								{request.kind === "block" && request.startTime && (
									<p className="mt-1 text-xs text-primary flex items-center gap-1.5">
										<Icon name="clock" className="h-4 w-4" />
										{request.startTime} – {request.endTime} unavailable
									</p>
								)}
								<p className="mt-1 text-sm text-gray-500">{request.reason || "No reason provided."}</p>
							</div>
							<div className="flex flex-col items-end gap-3">
								<span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass[request.status] || statusClass.pending}`}>
									{request.status}
								</span>
								{request.status === "pending" && (
									<div className="flex gap-2">
										<button
											type="button"
											data-testid="hr-approve-timeoff"
											onClick={() => decide(request, "approved")}
											className="rounded-full bg-green-600 px-4 py-1.5 text-xs text-white hover:bg-green-700 cursor-pointer"
										>
											Approve
										</button>
										<button
											type="button"
											data-testid="hr-deny-timeoff"
											onClick={() => decide(request, "denied")}
											className="rounded-full border border-gray-300 px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
										>
											Deny
										</button>
									</div>
								)}
							</div>
						</div>
					</li>
				))}
				{requests.length === 0 && (
					<li className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
						Nothing to review here right now.
					</li>
				)}
			</ul>
		</div>
	);
};

export default TimeOff;
