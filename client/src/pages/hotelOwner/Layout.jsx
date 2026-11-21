import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/hotelOwner/Navbar";
import Sidebar from "../../components/hotelOwner/Sidebar";
import { Outlet } from "react-router-dom";

const Layout = () => {
	const mainRef = useRef(null);
	const { pathname } = useLocation();

	// The window no longer scrolls in the admin shell — reset the content pane
	// itself when navigating between pages.
	useEffect(() => {
		if (mainRef.current) mainRef.current.scrollTop = 0;
	}, [pathname]);

	return (
		<div className="flex h-screen flex-col overflow-hidden">
			<Navbar />
			<div className="flex min-h-0 flex-1">
				<Sidebar />
				<main
					ref={mainRef}
					data-testid="owner-main"
					className="portal-scroll min-h-0 flex-1 overflow-y-auto p-4 pt-10 md:px-10"
				>
					<Outlet />
				</main>
			</div>
		</div>
	);
};

export default Layout;
