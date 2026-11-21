import React from "react";
import { Link } from "react-router-dom";
import { useBookings } from "../../data/store";
import { advanceBooking, getFulfillmentStatus, useFulfillment } from "../../lib/orders";
import { formatDay } from "../../lib/format";

const badgeClass = {
	pending: "bg-amber-100 text-amber-700",
	confirmed: "bg-blue-100 text-blue-700",
	"checked-in": "bg-purple-100 text-purple-700",
	completed: "bg-green-100 text-green-700",
	cancelled: "bg-gray-100 text-gray-500",
};

const PendingBookingsWidget = ({ role = "owner" }) => {
	useFulfillment();
	const bookings = useBookings();
	const pending = bookings.filter(
		(booking) => booking.status !== "cancelled" && getFulfillmentStatus(booking) === "pending"
	);
	const ordersPath = role === "employee" ? "/employee/orders" : "/owner/orders";

	return (
		<section
			data-testid="pending-bookings-widget"
			aria-label="Pending bookings"
			className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-5"
		>
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<div className="flex items-baseline gap-3">
					<h2 className="text-lg font-semibold text-gray-800">Pending bookings</h2>
					<span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
						{pending.length}
					</span>
				</div>
				<Link to={ordersPath} className="text-xs text-primary hover:underline">
					View all orders
				</Link>
			</div>
			{pending.length === 0 ? (
				<p className="text-sm text-gray-600 mt-3">Everything is up to date.</p>
			) : (
				<ul className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
					{pending.slice(0, 3).map((booking) => (
						<li
							key={booking._id}
							data-testid="pending-booking"
							className="rounded-lg border border-amber-200 bg-white p-3"
						>
							<div className="flex items-start justify-between gap-2">
								<p className="text-sm font-medium text-gray-800">{booking.userName}</p>
								<span
									className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
										badgeClass.pending
									}`}
								>
									pending
								</span>
							</div>
							<p className="text-xs text-gray-500 mt-1">
								{booking.room.roomType} · {formatDay(booking.checkInDate, { month: "short", day: "numeric" })}
							</p>
							<button
								type="button"
								data-testid="fulfill-pending"
								onClick={() => advanceBooking(booking)}
								className="mt-3 rounded-full bg-primary px-3 py-1 text-xs text-white hover:bg-primary-dull cursor-pointer"
							>
								Fulfill → Confirmed
							</button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
};

export default PendingBookingsWidget;
