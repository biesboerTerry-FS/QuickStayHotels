import React, { useEffect } from "react";
import Navbar from "./components/Navbar";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import "./index.css";
import Footer from "./components/Footer";
import AllRooms from "./pages/AllRooms";
import RoomDetails from "./pages/RoomDetails";
import MyBookings from "./pages/MyBookings";
import SavedRooms from "./pages/SavedRooms";
import BookingPage from "./pages/BookingPage";
import BookingConfirmed from "./pages/BookingConfirmed";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import Layout from "./pages/hotelOwner/Layout";
import Dashboard from "./pages/hotelOwner/Dashboard";
import AddRoom from "./pages/hotelOwner/AddRoom";
import ListRooms from "./pages/hotelOwner/ListRooms";
import Bookings from "./pages/hotelOwner/Bookings";
import HotelProfile from "./pages/hotelOwner/HotelProfile";
import OwnerOffers from "./pages/hotelOwner/Offers";
import Announcements from "./pages/hotelOwner/Announcements";
import HrDirectory from "./pages/hotelOwner/hr/HrDirectory";
import Payroll from "./pages/hotelOwner/hr/Payroll";
import TimeOff from "./pages/hotelOwner/hr/TimeOff";
import Performance from "./pages/hotelOwner/hr/Performance";
import HrSettings from "./pages/hotelOwner/hr/HrSettings";
import InfoPage from "./pages/InfoPage";
import NotFound from "./pages/NotFound";
import Offers from "./pages/Offers";
import OfferDetails from "./pages/OfferDetails";
import RequireOwner from "./components/RequireOwner";
import RequireEmployee from "./components/RequireEmployee";
import EmployeePortal from "./pages/employee/EmployeePortal";
import EmployeeLayout from "./pages/employee/Layout";
import PortalMessages from "./pages/portal/Messages";
import PortalSchedule from "./pages/portal/Schedule";
import CookieBanner from "./components/CookieBanner";
import { infoPages } from "./data/infoPages";

import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

const ScrollToTop = () => {
	const { pathname } = useLocation();
	useEffect(() => {
		window.scrollTo(0, 0);
	}, [pathname]);
	return null;
};

const App = () => {
	const pathname = useLocation().pathname;
	const isOwnerPath = pathname.includes("owner");
	const isEmployeePath = pathname.startsWith("/employee");
	const isPortalPath = isOwnerPath || isEmployeePath;

	return (
		<div>
			<ScrollToTop />
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-white focus:text-gray-900 focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
			>
				Skip to content
			</a>
			{!isPortalPath && <Navbar />}
			<main id="main-content" tabIndex={-1} className="min-h-[70vh] focus:outline-none">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/rooms" element={<AllRooms />} />
					<Route path="/rooms/:id" element={<RoomDetails />} />
					<Route path="/book/:id" element={<BookingPage />} />
					<Route
						path="/booking-confirmed/:bookingId"
						element={<BookingConfirmed />}
					/>
					<Route path="/pay/:bookingId" element={<PaymentPage />} />
					<Route path="/pay/success" element={<PaymentSuccess />} />
					<Route path="/my-bookings" element={<MyBookings />} />
					<Route path="/saved" element={<SavedRooms />} />
					<Route path="/offers" element={<Offers />} />
					<Route path="/offers/:slug" element={<OfferDetails />} />
					<Route
						path="/employee"
						element={
							<RequireEmployee>
								<EmployeeLayout />
							</RequireEmployee>
						}
					>
						<Route index element={<EmployeePortal />} />
						<Route path="orders" element={<Bookings />} />
						<Route path="messages" element={<PortalMessages role="employee" />} />
						<Route path="schedule" element={<PortalSchedule role="employee" />} />
					</Route>
					{Object.keys(infoPages).map((slug) => (
						<Route
							key={slug}
							path={`/${slug}`}
							element={<InfoPage slug={slug} />}
						/>
					))}
					<Route
						path="/owner"
						element={
							<RequireOwner>
								<Layout />
							</RequireOwner>
						}
					>
						<Route index element={<Dashboard />} />
						<Route path="add-room" element={<AddRoom />} />
						<Route path="list-rooms" element={<ListRooms />} />
						<Route path="bookings" element={<Bookings />} />
						<Route path="orders" element={<Bookings />} />
						<Route path="messages" element={<PortalMessages role="owner" />} />
						<Route path="schedule" element={<PortalSchedule role="owner" />} />
						<Route path="offers" element={<OwnerOffers />} />
						<Route path="announcements" element={<Announcements />} />
						{/* Owner-only HR suite — every route sits behind RequireOwner. */}
						<Route path="hr" element={<HrDirectory />} />
						<Route path="hr/payroll" element={<Payroll />} />
						<Route path="hr/time-off" element={<TimeOff />} />
						<Route path="hr/performance" element={<Performance />} />
						<Route path="hr/settings" element={<HrSettings />} />
						<Route path="profile" element={<HotelProfile />} />
					</Route>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</main>
			{!isPortalPath && <Footer />}
			{!isPortalPath && <CookieBanner />}
			<SpeedInsights />
			<Analytics />
		</div>
	);
};

export default App;
