import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import Icon from "../Icons";

const groups = [
	{
		name: "My work",
		links: [
			{ name: "Overview", path: "/employee", icon: "dashboard", end: true },
			{ name: "Orders", path: "/employee/orders", icon: "orders" },
			{ name: "Schedule", path: "/employee/schedule", icon: "calendar" },
		],
	},
	{
		name: "Communication",
		links: [{ name: "Messages", path: "/employee/messages", icon: "message" }],
	},
];

const EmployeeSidebar = () => {
	// Categories are collapsed on first load, matching the owner portal.
	const [open, setOpen] = useState({});
	const toggle = (name) => setOpen((current) => ({ ...current, [name]: !current[name] }));

	return (
		<aside
			data-testid="employee-sidebar"
			className="portal-scroll sticky top-[60px] h-[calc(100vh_-_60px)] w-16 shrink-0 overflow-y-auto bg-white pt-2 text-base transition-all duration-300 md:w-56"
		>
			{groups.map((group) => {
				const isOpen = Boolean(open[group.name]);
				return (
					<div key={group.name} data-testid="employee-sidebar-group">
						<button
							type="button"
							data-testid={`employee-group-${group.name.toLowerCase().replace(/\s+/g, "-")}`}
							aria-expanded={isOpen}
							onClick={() => toggle(group.name)}
							className="flex w-full cursor-pointer items-center justify-center gap-2 px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 transition-colors hover:text-gray-600 md:justify-between md:px-6"
						>
							<span className="hidden md:inline">{group.name}</span>
							<Icon
								name="chevron"
								className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
							/>
						</button>

						{isOpen && (
							<div className="pb-1">
								{group.links.map((item) => (
									<NavLink
										to={item.path}
										key={item.path}
										end={item.end}
										title={item.name}
										data-testid="employee-nav-link"
										className={({ isActive }) =>
											`relative flex items-center justify-center gap-3 py-3 px-3 transition-colors md:justify-start md:px-6 ${
												isActive
													? "bg-primary/10 text-primary"
													: "text-gray-700 hover:bg-gray-100/90"
											}`
										}
									>
										{({ isActive }) => (
											<>
												{isActive && (
													<span
														aria-hidden="true"
														className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-primary"
													/>
												)}
												<Icon name={item.icon} className="h-5 w-5 shrink-0" />
												<span className="hidden md:block">{item.name}</span>
											</>
										)}
									</NavLink>
								))}
							</div>
						)}
					</div>
				);
			})}
		</aside>
	);
};

export default EmployeeSidebar;
