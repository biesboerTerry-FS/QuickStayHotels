import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useDemoUser } from "../../context/DemoAuthContext";
import { DEMO_EMPLOYEE_ID, useEmployee } from "../../lib/employees";

const links = [
	{ name: "Overview", path: "/employee" },
	{ name: "Orders", path: "/employee/orders" },
	{ name: "Messages", path: "/employee/messages" },
	{ name: "Schedule", path: "/employee/schedule" },
];

const EmployeeLayout = () => {
	const { demoUser, isDemoUser, endDemo } = useDemoUser();
	const employeeId = demoUser?.employeeId || DEMO_EMPLOYEE_ID;
	const employee = useEmployee(employeeId);

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="border-b border-gray-200 bg-white">
				<div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<span className="font-playfair text-xl text-gray-800">QuickStay</span>
						<span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-3 py-1">
							Employee portal
						</span>
					</div>
					<div className="flex items-center gap-3">
						<span className="hidden sm:inline text-sm text-gray-600">
							{employee?.fullName || "Employee"}
						</span>
						{isDemoUser && (
							<button
								onClick={endDemo}
								className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
							>
								Exit demo
							</button>
						)}
						<Link
							to="/"
							className="px-4 py-2 rounded-full bg-primary text-white text-sm hover:bg-primary-dull transition-all"
						>
							Back to site
						</Link>
					</div>
				</div>
				<nav aria-label="Employee portal navigation" className="max-w-5xl mx-auto px-4 md:px-8 flex gap-2 overflow-x-auto">
					{links.map((item) => (
						<NavLink
							key={item.path}
							to={item.path}
							end={item.path === "/employee"}
							className={({ isActive }) =>
								`shrink-0 border-b-2 px-3 py-2 text-sm transition-colors ${
									isActive
										? "border-primary text-primary font-medium"
										: "border-transparent text-gray-600 hover:text-gray-900"
								}`
							}
						>
							{item.name}
						</NavLink>
					))}
				</nav>
			</header>

			<main className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14">
				<Outlet />
			</main>
		</div>
	);
};

export default EmployeeLayout;
