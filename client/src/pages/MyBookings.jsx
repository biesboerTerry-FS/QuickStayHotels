import React from "react";
import { Link } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import Title from "../components/Title";
import EmptyState from "../components/EmptyState";
import { assets } from "../assets/assets";
import { setState, useBookings } from "../data/store";
import { useToast } from "../context/ToastContext";
import { bookingStatus, bookingToIcs, canCancel } from "../lib/bookings";
import { downloadFile } from "../lib/download";
import { formatDay } from "../lib/format";
import useDocumentTitle from "../hooks/useDocumentTitle";

const MyBookings = () => {
	useDocumentTitle("My Bookings");
	const { user, isLoaded } = useUser();
	const { openSignIn } = useClerk();
	const allBookings = useBookings();
	const toast = useToast();

	const bookings = user
		? allBookings.filter((booking) => booking.userId === user.id)
		: [];

	const cancelBooking = (booking) => {
		if (!window.confirm("Cancel this booking? This can't be undone.")) return;
		setState("bookings", (list) =>
			list.map((item) =>
				item._id === booking._id ? { ...item, status: "cancelled" } : item
			)
		);
		toast.show("Booking cancelled", "info");
	};

	const addToCalendar = (booking) =>
		downloadFile(
			`quickstay-${booking._id}.ics`,
			bookingToIcs(booking),
			"text/calendar"
		);

	if (isLoaded && !user) {
		return (
			<div className="flex flex-col items-center justify-center text-center px-6 py-40 min-h-[70vh]">
				<h1 className="font-playfair text-3xl text-gray-800">Sign in to see your bookings</h1>
				<button
					onClick={() => openSignIn()}
					className="mt-6 px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dull cursor-pointer"
				>
					Login
				</button>
			</div>
		);
	}

	return (
		<div className="py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32">
			<Title
				title="My Bookings"
				subTitle="Easily manage your past, current, and upcoming hotel reservations in one place. Plan your trips seamlessly with just a few clicks"
				align="left"
			/>

			{isLoaded && bookings.length === 0 && (
				<EmptyState
					title="No bookings yet"
					description="When you book a stay it will appear here. Start by browsing our hotels."
					actionLabel="Browse hotels"
					actionTo="/rooms"
					icon={
						<svg
							className="w-12 h-12 text-gray-300"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					}
				/>
			)}

			<div className="max-w-6xl mt-8 w-full text-gray-800">
				{bookings.length > 0 && (
					<div className="hidden md:grid md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 font-medium text-base py-3">
						<div>Hotels</div>
						<div>Dates &amp; Times</div>
						<div>Payment</div>
					</div>
				)}

				{bookings.map((booking) => {
					const status = bookingStatus(booking);
					const isCancelled = booking.status === "cancelled";
					return (
						<div
							key={booking._id}
							className="grid grid-cols-1 md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 py-6 first:border-t"
						>
							{/* hotel details */}
							<div className="flex flex-col md:flex-row">
								<img
									src={booking.room.images[0]}
									alt={`${booking.hotel.name} ${booking.room.roomType}`}
									className="md:w-44 rounded-xl shadow object-cover h-32 md:h-auto"
								/>
								<div className="flex flex-col gap-1.5 max-md:mt-3 md:ml-4">
									<p className="font-playfair text-2xl">
										{booking.hotel.name}
										<span className="text-sm font-sans">
											{" "}
											({booking.room.roomType})
										</span>
									</p>
									<div className="flex items-center gap-1 text-sm text-gray-500">
										<img src={assets.locationIcon} alt="" />
										<span>{booking.hotel.address}</span>
									</div>
									<div className="flex items-center gap-1 text-sm text-gray-500">
										<img src={assets.guestsIcon} alt="" />
										<span>{booking.guests}</span>
									</div>
									<p className="text-base">Total: ${booking.totalPrice}</p>
								</div>
							</div>

							{/* Dates & times */}
							<div className="flex flex-row md:items-center md:gap-12 mt-3 gap-8">
								<div>
									<p>Check-in:</p>
									<p className="text-gray-500 text-sm">
										{formatDay(booking.checkInDate)}
									</p>
								</div>
								<div>
									<p>Check-out:</p>
									<p className="text-gray-500 text-sm">
										{formatDay(booking.checkOutDate)}
									</p>
								</div>
							</div>

							{/* payment status & actions */}
							<div className="flex flex-col items-start justify-center gap-3 pt-3">
								<div className="flex items-center gap-2">
									<div
										className={`h-3 w-3 rounded-full ${
											isCancelled
												? "bg-gray-400"
												: booking.isPaid
													? "bg-green-500"
													: "bg-red-500"
										}`}
									></div>
									<p
										className={`text-sm ${
											isCancelled
												? "text-gray-500"
												: booking.isPaid
													? "text-green-500"
													: "text-red-500"
										}`}
									>
										{status}
									</p>
								</div>
								<div className="flex flex-wrap gap-2">
									{!isCancelled && !booking.isPaid && (
										<Link
											to={`/pay/${booking._id}`}
											className="px-4 py-1.5 text-xs rounded-full bg-primary text-white hover:bg-primary-dull transition-all"
										>
											Pay now
										</Link>
									)}
									{!isCancelled && (
										<button
											onClick={() => addToCalendar(booking)}
											className="px-4 py-1.5 text-xs border border-gray-300 rounded-full hover:bg-gray-50 transition-all cursor-pointer"
										>
											Add to calendar
										</button>
									)}
									{canCancel(booking) && (
										<button
											onClick={() => cancelBooking(booking)}
											className="px-4 py-1.5 text-xs border border-red-200 text-red-600 rounded-full hover:bg-red-50 transition-all cursor-pointer"
										>
											Cancel
										</button>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default MyBookings;
