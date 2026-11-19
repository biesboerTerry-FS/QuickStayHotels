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
import InfoPage from "./pages/InfoPage";
import NotFound from "./pages/NotFound";
import Offers from "./pages/Offers";
import OfferDetails from "./pages/OfferDetails";
import RequireOwner from "./components/RequireOwner";
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
	const isOwnerPath = useLocation().pathname.includes("owner");

	return (
		<div>
			<ScrollToTop />
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-white focus:text-gray-900 focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
			>
				Skip to content
			</a>
			{!isOwnerPath && <Navbar />}
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
						<Route path="offers" element={<OwnerOffers />} />
						<Route path="profile" element={<HotelProfile />} />
					</Route>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</main>
			{!isOwnerPath && <Footer />}
			{!isOwnerPath && <CookieBanner />}
			<SpeedInsights />
			<Analytics />
		</div>
	);
};

export default App;
