import React, { useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useDemoUser } from "../../context/DemoAuthContext";
import { DEMO_EMPLOYEE_ID, useEmployee } from "../../lib/employees";
import EmployeeSidebar from "../../components/employee/Sidebar";

const EmployeeLayout = () => {
	const { demoUser, isDemoUser, endDemo } = useDemoUser();
	const employeeId = demoUser?.employeeId || DEMO_EMPLOYEE_ID;
	const employee = useEmployee(employeeId);
	const mainRef = useRef(null);
	const { pathname } = useLocation();

	useEffect(() => {
		if (mainRef.current) mainRef.current.scrollTop = 0;
	}, [pathname]);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-gray-50">
			<header className="sticky top-0 z-50 flex h-[60px] shrink-0 items-center border-b border-gray-200 bg-white px-4 md:px-8">
				<div className="flex w-full items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<span className="font-playfair text-xl text-gray-800">QuickStay</span>
						<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
							Employee portal
						</span>
					</div>
					<div className="flex items-center gap-3">
						<span className="hidden text-sm text-gray-600 sm:inline">
							{employee?.fullName || "Employee"}
						</span>
						{isDemoUser && (
							<button
								onClick={endDemo}
								className="cursor-pointer rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-all hover:bg-gray-50"
							>
								Exit demo
							</button>
						)}
						<Link
							to="/"
							className="cursor-pointer rounded-full bg-primary px-4 py-2 text-sm text-white transition-all hover:bg-primary-dull"
						>
							Back to site
						</Link>
					</div>
				</div>
			</header>

			<div className="flex min-h-0 flex-1">
				<EmployeeSidebar />
				<main
					ref={mainRef}
					data-testid="employee-main"
					className="portal-scroll min-h-0 flex-1 overflow-y-auto px-4 py-10 md:px-8 md:py-14"
				>
					<Outlet />
				</main>
			</div>
		</div>
	);
};

export default EmployeeLayout;
