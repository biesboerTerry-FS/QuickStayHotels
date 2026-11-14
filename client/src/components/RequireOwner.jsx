import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";

const Message = ({ title, text, children }) => (
	<div className="flex flex-col items-center justify-center text-center px-6 py-32 min-h-[70vh]">
		<div className="max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg shadow-gray-900/5 p-8">
			<h1 className="font-playfair text-2xl text-gray-800">{title}</h1>
			<p className="text-gray-500 mt-3 text-sm leading-relaxed">{text}</p>
			<div className="flex justify-center gap-3 mt-6">{children}</div>
			<Link
				to="/"
				className="inline-block mt-5 text-sm text-primary hover:underline"
			>
				Back to home
			</Link>
		</div>
	</div>
);

const RequireOwner = ({ children }) => {
	const { user, isLoaded } = useUser();
	const { openSignIn, signOut } = useClerk();
	const location = useLocation();

	// Dev-only bypass: set VITE_DEV_OWNER_BYPASS=true in .env.local to skip auth
	const devBypass =
		import.meta.env.DEV && import.meta.env.VITE_DEV_OWNER_BYPASS === "true";

	if (devBypass) {
		return children;
	}

	if (!isLoaded) {
		return (
			<div className="flex items-center justify-center min-h-[70vh]">
				<h1 className="text-base font-normal text-gray-500">Loading…</h1>
			</div>
		);
	}

	if (!user) {
		return (
			<Message
				title="Sign in to continue"
				text="The hotel dashboard is for registered hotel owners. Sign in with your account to manage listings and bookings."
			>
				<button
					onClick={() =>
						openSignIn({
							forceRedirectUrl: location.pathname + location.search,
							fallbackRedirectUrl: "/owner",
						})
					}
					className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dull transition-all cursor-pointer"
				>
					Login
				</button>
			</Message>
		);
	}

	if (user.publicMetadata?.role !== "hotelOwner") {
		return (
			<Message
				title="Owner access required"
				text="This account doesn't have hotel owner access. Ask a QuickStay administrator to enable it, or sign in with an owner account."
			>
				<button
					onClick={() => signOut({ redirectUrl: "/" })}
					className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
				>
					Logout
				</button>
			</Message>
		);
	}

	return children;
};

export default RequireOwner;
