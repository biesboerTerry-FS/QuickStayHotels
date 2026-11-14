import React, { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { assets } from "../assets/assets";
import { offers } from "../data/offers";
import { setState, useRooms, useStore } from "../data/store";
import {
	applyOffer,
	createBooking,
	isRoomFree,
	isValidRange,
	nightsBetween,
} from "../lib/bookings";
import { formatCurrency, formatDay, todayIso } from "../lib/format";
import useDocumentTitle from "../hooks/useDocumentTitle";

const paymentOptions = [
	{
		value: "Pay At Hotel",
		label: "Pay at the hotel",
		note: "No payment now. Pay when you check in.",
	},
	{
		value: "Card",
		label: "Pay now by card",
		note: "Test mode: you'll enter card details on the next step. No real charge is made.",
	},
];

const Notice = ({ title, children }) => (
	<div className="flex flex-col items-center justify-center text-center px-6 py-40 min-h-[70vh]">
		<h1 className="font-playfair text-3xl text-gray-800">{title}</h1>
		<div className="text-gray-500 mt-3 max-w-md">{children}</div>
	</div>
);

const BookingPage = () => {
	useDocumentTitle("Confirm booking");
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const rooms = useRooms();
	const rawBookings = useStore("bookings");
	const { user, isLoaded } = useUser();
	const { openSignIn } = useClerk();
	const [payment, setPayment] = useState("Pay At Hotel");
	const [error, setError] = useState("");

	const room = rooms.find((item) => item._id === id);
	const checkIn = searchParams.get("checkIn") || "";
	const checkOut = searchParams.get("checkOut") || "";
	const guests = Number(searchParams.get("guests")) || 1;
	const offerCode = searchParams.get("offer") || "";
	const offer = offers.find((item) => item.slug === offerCode || item._id === offerCode);

	if (!room) {
		return (
			<Notice title="Room not found">
				<Link to="/rooms" className="text-primary hover:underline">
					Browse hotels
				</Link>
			</Notice>
		);
	}

	const stayValid =
		isValidRange(checkIn, checkOut) &&
		checkIn >= todayIso() &&
		guests >= 1 &&
		guests <= room.maxGuests;

	if (!stayValid) {
		return (
			<Notice title="Check your dates">
				<p>Your stay details are missing or no longer valid.</p>
				<Link
					to={`/rooms/${room._id}`}
					className="inline-block mt-4 text-primary hover:underline"
				>
					Choose dates again
				</Link>
			</Notice>
		);
	}

	if (!isLoaded) {
		return <Notice title="Loading…" />;
	}

	if (!user) {
		return (
			<Notice title="Sign in to book">
				<p>We'll keep your selected dates while you sign in.</p>
				<button
					onClick={() => openSignIn()}
					className="mt-6 px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dull cursor-pointer"
				>
					Login
				</button>
			</Notice>
		);
	}

	const nights = nightsBetween(checkIn, checkOut);
	const baseTotal = nights * room.pricePerNight;
	const { discount, total } = applyOffer(baseTotal, offer);
	const email = user.primaryEmailAddress?.emailAddress;

	const confirm = () => {
		if (!isRoomFree(room._id, checkIn, checkOut, rawBookings)) {
			setError("Sorry, this room was just booked for those dates. Please choose other dates.");
			return;
		}
		const booking = createBooking({
			room,
			checkIn,
			checkOut,
			guests,
			paymentMethod: payment,
			user,
			offer,
		});
		setState("bookings", (list) => [booking, ...list]);
		navigate(
			payment === "Card"
				? `/pay/${booking._id}`
				: `/booking-confirmed/${booking._id}`
		);
	};

	return (
		<div className="pt-28 md:pt-35 pb-24 px-4 md:px-16 lg:px-24 xl:px-32">
			<h1 className="font-playfair text-4xl text-gray-800">Confirm your stay</h1>
			<p className="text-gray-500 mt-2">
				Review your details, then choose how you'd like to pay.
			</p>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
				<div className="lg:col-span-2 flex flex-col gap-6">
					<section className="bg-white border border-gray-200 rounded-2xl p-6">
						<h2 className="font-medium text-gray-800">Guest</h2>
						<p className="mt-2 text-sm text-gray-600">
							{user.fullName || user.username}
							{email && ` · ${email}`}
						</p>
					</section>

					<section className="bg-white border border-gray-200 rounded-2xl p-6">
						<h2 className="font-medium text-gray-800">Payment</h2>
						<div className="flex flex-col gap-3 mt-4">
							{paymentOptions.map((option) => (
								<label
									key={option.value}
									className={`flex gap-3 items-start border rounded-xl p-4 cursor-pointer transition-all ${
										payment === option.value
											? "border-primary bg-primary/5"
											: "border-gray-200 hover:bg-gray-50"
									}`}
								>
									<input
										type="radio"
										name="payment"
										value={option.value}
										checked={payment === option.value}
										onChange={() => setPayment(option.value)}
										className="mt-1"
									/>
									<span>
										<span className="block font-medium text-gray-800">
											{option.label}
										</span>
										<span className="block text-sm text-gray-500 mt-1">
											{option.note}
										</span>
									</span>
								</label>
							))}
						</div>
					</section>

					{error && (
						<p role="alert" className="text-sm text-red-600">
							{error}
						</p>
					)}
				</div>

				<aside className="bg-white border border-gray-200 rounded-2xl p-6 h-fit lg:sticky lg:top-28">
					<img
						src={room.images[0]}
						alt={`${room.hotel.name} ${room.roomType}`}
						className="w-full h-40 rounded-xl object-cover"
					/>
					<p className="font-playfair text-xl text-gray-800 mt-4">
						{room.hotel.name}
					</p>
					<p className="text-sm text-gray-500">{room.roomType}</p>
					<div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
						<img src={assets.locationIcon} alt="" className="w-4" />
						<span>{room.hotel.address}</span>
					</div>

					{offer && (
						<div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 rounded-lg px-3 py-2 mt-4">
							<span>🎉</span>
							<span>
								{offer.title} applied ({offer.priceOff}% off)
							</span>
						</div>
					)}

					<dl className="grid grid-cols-2 gap-y-3 text-sm mt-6 border-t border-gray-200 pt-5">
						<dt className="text-gray-500">Check-in</dt>
						<dd className="text-right text-gray-800">{formatDay(checkIn)}</dd>
						<dt className="text-gray-500">Check-out</dt>
						<dd className="text-right text-gray-800">{formatDay(checkOut)}</dd>
						<dt className="text-gray-500">Guests</dt>
						<dd className="text-right text-gray-800">{guests}</dd>
						<dt className="text-gray-500">
							{formatCurrency(room.pricePerNight)} × {nights} night
							{nights === 1 ? "" : "s"}
						</dt>
						<dd className="text-right text-gray-800">{formatCurrency(baseTotal)}</dd>
						{discount > 0 && (
							<>
								<dt className="text-gray-500">Discount</dt>
								<dd className="text-right text-green-600">-{formatCurrency(discount)}</dd>
							</>
						)}
					</dl>
					<div className="flex justify-between border-t border-gray-200 mt-4 pt-4 font-medium text-gray-800">
						<span>Total</span>
						<span>{formatCurrency(total)}</span>
					</div>

					<button
						onClick={confirm}
						className="w-full mt-6 py-3 rounded-xl bg-primary text-white hover:bg-primary-dull active:scale-95 transition-all cursor-pointer"
					>
						Confirm booking
					</button>
					<p className="text-xs text-gray-500 mt-3 text-center">
						Bookings are saved on this device until accounts sync with the server.
					</p>
				</aside>
			</div>
		</div>
	);
};

export default BookingPage;
