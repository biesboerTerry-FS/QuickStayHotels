import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useBookings } from "../data/store";
import { formatCurrency } from "../lib/format";
import useDocumentTitle from "../hooks/useDocumentTitle";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const PaymentPage = () => {
	const { bookingId } = useParams();
	const bookings = useBookings();
	const booking = bookings.find((item) => item._id === bookingId);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useDocumentTitle(booking ? `Pay · ${booking.hotel.name}` : "Pay for booking");

	if (!booking) {
		return (
			<div className="flex flex-col items-center justify-center text-center px-6 py-40 min-h-[70vh]">
				<h1 className="font-playfair text-3xl text-gray-800">Booking not found</h1>
				<Link to="/my-bookings" className="mt-4 text-primary hover:underline">
					Go to my bookings
				</Link>
			</div>
		);
	}

	if (booking.status === "cancelled" || booking.isPaid) {
		return (
			<div className="flex flex-col items-center justify-center text-center px-6 py-40 min-h-[70vh]">
				<h1 className="font-playfair text-3xl text-gray-800">
					{booking.status === "cancelled"
						? "This booking was cancelled"
						: "This booking is already paid"}
				</h1>
				<Link to="/my-bookings" className="mt-4 text-primary hover:underline">
					Back to my bookings
				</Link>
			</div>
		);
	}

	const pay = async () => {
		setSubmitting(true);
		setError("");
		try {
			const response = await fetch(`${apiBase}/api/create-checkout-session`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bookingId: booking._id,
					hotelName: booking.hotel?.name || "QuickStay Hotel",
					total: booking.totalPrice,
				}),
			});
			const data = await response.json();
			if (!response.ok || !data.url) {
				throw new Error(data.message || "Could not start checkout");
			}
			window.location.replace(data.url);
		} catch (err) {
			setError(err.message || "Payment could not be started");
			setSubmitting(false);
		}
	};

	return (
		<div className="pt-32 md:pt-40 pb-24 px-4 md:px-16 lg:px-24 xl:px-32 flex justify-center">
			<div className="w-full max-w-md">
				<h1 className="font-playfair text-3xl text-gray-800">Pay for your stay</h1>
				<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
					Stripe TEST mode — no real charge is made. Use card{" "}
					<strong>4242 4242 4242 4242</strong> with any future expiry and any CVC on
					the Stripe checkout page.
				</div>

				<div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-5 shadow-lg shadow-gray-900/5">
					<div className="flex justify-between text-sm text-gray-600 border-b border-gray-200 pb-4">
						<span>Total due</span>
						<span className="font-medium text-gray-800">
							{formatCurrency(booking.totalPrice)}
						</span>
					</div>
					{error && <p className="text-sm text-red-600">{error}</p>}
					<button
						type="button"
						onClick={pay}
						disabled={submitting}
						className="py-3 rounded-xl bg-primary text-white hover:bg-primary-dull active:scale-95 transition-all cursor-pointer disabled:opacity-60"
					>
						{submitting
							? "Opening secure checkout…"
							: `Pay ${formatCurrency(booking.totalPrice)} with Stripe`}
					</button>
				</div>
			</div>
		</div>
	);
};

export default PaymentPage;
