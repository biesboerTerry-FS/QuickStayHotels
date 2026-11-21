import React, { useMemo, useState } from "react";
import Title from "../../components/Title";
import { setState, useBookings } from "../../data/store";
import { useToast } from "../../context/ToastContext";
import { bookingStatus, bookingsToCsv, nightsBetween } from "../../lib/bookings";
import { downloadFile } from "../../lib/download";
import { formatCurrency, formatDay, todayIso } from "../../lib/format";
import {
	advanceBooking,
	getFulfillmentStatus,
	nextFulfillmentStatus,
	useFulfillment,
} from "../../lib/orders";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const filters = ["All", "Paid", "Pending", "Cancelled"];

const fulfillmentClass = {
	pending: "bg-amber-100 text-amber-700",
	confirmed: "bg-blue-100 text-blue-700",
	"checked-in": "bg-purple-100 text-purple-700",
	completed: "bg-green-100 text-green-700",
	cancelled: "bg-gray-100 text-gray-500",
};

const Bookings = () => {
	useDocumentTitle("Bookings");
	const bookings = useBookings();
	useFulfillment();
	const toast = useToast();
	const [filter, setFilter] = useState("All");
	const [query, setQuery] = useState("");

	const counts = useMemo(() => {
		const byStatus = (name) =>
			bookings.filter((b) => bookingStatus(b) === name).length;
		return {
			All: bookings.length,
			Paid: byStatus("Paid"),
			Pending: byStatus("Pending"),
			Cancelled: byStatus("Cancelled"),
		};
	}, [bookings]);

	const visible = useMemo(() => {
		const term = query.trim().toLowerCase();
		return bookings.filter((booking) => {
			if (filter !== "All" && bookingStatus(booking) !== filter) return false;
			if (!term) return true;
			return (
				booking.userName.toLowerCase().includes(term) ||
				booking.room.roomType.toLowerCase().includes(term) ||
				booking.hotel.name.toLowerCase().includes(term) ||
				booking._id.toLowerCase().includes(term)
			);
		});
	}, [bookings, filter, query]);

	const markPaid = (booking) => {
		setState("bookings", (list) =>
			list.map((item) =>
				item._id === booking._id ? { ...item, isPaid: true } : item
			)
		);
		toast.show(`Marked ${booking.userName}'s booking as paid`);
	};

	const exportCsv = () => {
		downloadFile(
			`quickstay-bookings-${todayIso()}.csv`,
			bookingsToCsv(visible),
			"text/csv"
		);
		toast.show(`Exported ${visible.length} booking${visible.length === 1 ? "" : "s"}`, "info");
	};

	return (
		<div>
			<Title
				align="left"
				title="Bookings"
				subTitle="Review every reservation, check dates and payment status, and follow up on pending payments."
			/>

			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-8">
				<div className="flex flex-wrap gap-2">
					{filters.map((name) => (
						<button
							key={name}
							onClick={() => setFilter(name)}
							className={`px-4 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
								filter === name
									? "bg-primary text-white border-primary"
									: "border-gray-300 text-gray-600 hover:bg-gray-100"
							}`}
						>
							{name} ({counts[name]})
						</button>
					))}
				</div>
				<div className="flex gap-3">
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search guest, room or booking ID"
						aria-label="Search bookings"
						className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full lg:w-72 outline-none focus:border-primary"
					/>
					<button
						onClick={exportCsv}
						disabled={visible.length === 0}
						className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
					>
						Export CSV
					</button>
				</div>
			</div>

			<div className="mt-6 overflow-x-auto border border-gray-200 rounded-xl bg-white">
				<table className="w-full min-w-[900px] text-sm text-left">
					<thead className="bg-gray-50 text-gray-800">
						<tr>
							<th scope="col" className="py-3 px-4 font-medium">Booking</th>
							<th scope="col" className="py-3 px-4 font-medium">Guest</th>
							<th scope="col" className="py-3 px-4 font-medium">Room</th>
							<th scope="col" className="py-3 px-4 font-medium">Stay</th>
							<th scope="col" className="py-3 px-4 font-medium text-center">Guests</th>
							<th scope="col" className="py-3 px-4 font-medium">Payment method</th>
							<th scope="col" className="py-3 px-4 font-medium text-right">Total</th>
							<th scope="col" className="py-3 px-4 font-medium text-center">Status</th>
							<th scope="col" className="py-3 px-4 font-medium text-center">Fulfillment</th>
							<th scope="col" className="py-3 px-4 font-medium text-center">Action</th>
						</tr>
					</thead>
					<tbody className="text-gray-700">
						{visible.map((booking, index) => {
							const status = bookingStatus(booking);
							const fulfillment = getFulfillmentStatus(booking);
							const next = nextFulfillmentStatus(booking);
							return (
								<tr key={`${booking._id}-${index}`} data-testid="order-row" className="border-t border-gray-200">
									<td className="py-3 px-4 font-mono text-xs text-gray-500">
										{booking._id.slice(-6).toUpperCase()}
									</td>
									<td className="py-3 px-4">{booking.userName}</td>
									<td className="py-3 px-4">
										{booking.room.roomType}
										<span className="block text-xs text-gray-500">{booking.hotel.name}</span>
									</td>
									<td className="py-3 px-4">
										<p>
											{formatDay(booking.checkInDate)} – {formatDay(booking.checkOutDate)}
										</p>
										<p className="text-xs text-gray-500">
											{nightsBetween(booking.checkInDate, booking.checkOutDate)} night(s)
										</p>
									</td>
									<td className="py-3 px-4 text-center">{booking.guests}</td>
									<td className="py-3 px-4">{booking.paymentMethod}</td>
									<td className="py-3 px-4 text-right font-medium">
										{formatCurrency(booking.totalPrice)}
									</td>
									<td className="py-3 px-4 text-center">
										<span
											className={`inline-block px-3 py-1 text-xs rounded-full ${
												status === "Paid"
													? "bg-green-100 text-green-700"
													: status === "Cancelled"
														? "bg-gray-100 text-gray-500"
														: "bg-amber-100 text-amber-700"
											}`}
										>
											{status}
										</span>
									</td>
									<td className="py-3 px-4 text-center">
										<span
											data-testid="order-status"
											className={`inline-block px-3 py-1 text-xs rounded-full capitalize ${fulfillmentClass[fulfillment]}`}
										>
											{fulfillment}
										</span>
										{next && (
											<button
												type="button"
												data-testid="advance-order"
												onClick={() => {
													advanceBooking(booking);
													toast.show(`Order moved to ${next}`);
												}}
												className="block mx-auto mt-2 px-3 py-1 text-xs rounded-full border border-gray-300 hover:bg-gray-50 cursor-pointer"
											>
												Advance → {next}
											</button>
										)}
									</td>
									<td className="py-3 px-4 text-center">
										{status === "Pending" && (
											<button
												onClick={() => markPaid(booking)}
												className="px-3 py-1 text-xs rounded-full border border-gray-300 hover:bg-gray-50 cursor-pointer"
											>
												Mark paid
											</button>
										)}
									</td>
								</tr>
							);
						})}
						{visible.length === 0 && (
							<tr>
								<td colSpan={10} className="py-10 text-center text-gray-500 border-t border-gray-200">
									No bookings match your filters.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default Bookings;
