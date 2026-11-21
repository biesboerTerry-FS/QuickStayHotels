import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/react";
import { useDemoUser } from "../context/DemoAuthContext";

const Message = ({ title, text, children }) => (
	<div className="flex flex-col items-center justify-center text-center px-6 py-32 min-h-[70vh]">
		<div className="max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg shadow-gray-900/5 p-8">
			<h1 className="font-playfair text-2xl text-gray-800">{title}</h1>
			<p className="text-gray-500 mt-3 text-sm leading-relaxed">{text}</p>
			<div className="flex flex-wrap justify-center gap-3 mt-6">{children}</div>
			<Link
				to="/"
				className="inline-block mt-5 text-sm text-primary hover:underline"
			>
				Back to home
			</Link>
		</div>
	</div>
);

const RequireEmployee = ({ children }) => {
	const { user, isLoaded } = useUser();
	const { openSignIn, signOut } = useClerk();
	const location = useLocation();
	const navigate = useNavigate();
	const { isDemoUser, demoUser, startDemo, endDemo } = useDemoUser();

	const enterEmployeeDemo = () => {
		startDemo("employee");
		navigate("/employee");
	};

	const activeUser = user || (isDemoUser ? demoUser : null);
	const isEmployee = activeUser?.publicMetadata?.role === "employee";

	if (isEmployee) {
		return children;
	}

	if (!isLoaded && !isDemoUser) {
		return (
			<div className="flex items-center justify-center min-h-[70vh]">
				<h1 className="text-base font-normal text-gray-500">Loading…</h1>
			</div>
		);
	}

	if (!activeUser) {
		return (
			<Message
				title="Sign in to continue"
				text="The employee portal shows only your own profile and upcoming shifts. Sign in with your staff account or try the employee demo."
			>
				<button
					onClick={() =>
						openSignIn({
							forceRedirectUrl: location.pathname + location.search,
							fallbackRedirectUrl: "/employee",
						})
					}
					className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dull transition-all cursor-pointer"
				>
					Login
				</button>
				<button
					onClick={enterEmployeeDemo}
					className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
				>
					Try demo employee
				</button>
			</Message>
		);
	}

	return (
		<Message
			title="Employee access required"
			text="This account doesn't have staff access. Sign in with an employee account, or try the employee demo to see a limited self-service view."
		>
			{isDemoUser ? (
				<button
					onClick={endDemo}
					className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
				>
					Exit demo
				</button>
			) : (
				<button
					onClick={() => signOut({ redirectUrl: "/" })}
					className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
				>
					Logout
				</button>
			)}
			<button
				onClick={enterEmployeeDemo}
				className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dull transition-all cursor-pointer"
			>
				Try demo employee
			</button>
		</Message>
	);
};

export default RequireEmployee;
