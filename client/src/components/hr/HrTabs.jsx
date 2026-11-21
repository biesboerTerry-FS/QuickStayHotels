import React from "react";
import { NavLink } from "react-router-dom";

const TABS = [
	{ name: "Directory", path: "/owner/hr", end: true },
	{ name: "Payroll", path: "/owner/hr/payroll" },
	{ name: "Time-off", path: "/owner/hr/time-off" },
	{ name: "Performance", path: "/owner/hr/performance" },
	{ name: "Roles & Departments", path: "/owner/hr/settings" },
];

const HrTabs = () => (
	<nav
		aria-label="HR sections"
		data-testid="hr-tabs"
		className="mt-6 flex flex-wrap gap-2 border-b border-gray-200 pb-3"
	>
		{TABS.map((tab) => (
			<NavLink
				key={tab.path}
				to={tab.path}
				end={tab.end}
				data-testid={`hr-tab-${tab.path.split("/").pop() || "directory"}`}
				className={({ isActive }) =>
					`rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
						isActive
							? "bg-primary text-white"
							: "bg-gray-100 text-gray-600 hover:bg-gray-200"
					}`
				}
			>
				{tab.name}
			</NavLink>
		))}
	</nav>
);

export default HrTabs;
