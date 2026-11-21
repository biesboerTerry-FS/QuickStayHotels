import React, { useMemo } from "react";
import Title from "../../components/Title";
import { assets } from "../../assets/assets";
import { useBookings, useRooms } from "../../data/store";
import { bookingStatus } from "../../lib/bookings";
import { formatCurrency, formatDay, toDay } from "../../lib/format";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import LatestBulletinWidget from "../../components/hotelOwner/LatestBulletinWidget";
import PendingBookingsWidget from "../../components/portal/PendingBookingsWidget";

const StatCard = ({ label, value, hint, icon }) => (
	<div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
		<img src={icon} alt="" className="max-sm:hidden h-10" />
		<div className="flex flex-col">
			<p className="text-sm text-gray-500">{label}</p>
			<p className="text-2xl font-semibold text-gray-800 mt-1">{value}</p>
			<p className="text-xs text-gray-500 mt-1">{hint}</p>
		</div>
	</div>
);

const monthLabel = (key) =>
	new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-US", {
		month: "short",
		year: "2-digit",
		timeZone: "UTC",
	});

const statusColors = {
	Paid: "#16a34a",
	Pending: "#f59e0b",
	Cancelled: "#9ca3af",
};

const Dashboard = () => {
	useDocumentTitle("Owner Dashboard");
	const bookings = useBookings();
	const rooms = useRooms();

	const summary = useMemo(() => {
		const active = bookings.filter((b) => b.status !== "cancelled");
		const paid = active.filter((b) => b.isPaid);
		const pending = active.filter((b) => !b.isPaid);
		return {
			active,
			paidTotal: paid.reduce((sum, b) => sum + b.totalPrice, 0),
			pendingTotal: pending.reduce((sum, b) => sum + b.totalPrice, 0),
			paidCount: paid.length,
			pendingCount: pending.length,
			cancelledCount: bookings.length - active.length,
		};
	}, [bookings]);

	const monthly = useMemo(() => {
		const map = new Map();
		summary.active.forEach((b) => {
			const key = toDay(b.checkInDate).slice(0, 7);
			map.set(key, (map.get(key) || 0) + b.totalPrice);
		});
		return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
	}, [summary.active]);

	const maxMonth = Math.max(...monthly.map(([, value]) => value), 1);

	const revenueByRoom = useMemo(() => {
		const map = new Map();
		summary.active.forEach((b) => {
			const entry = map.get(b.roomId) || {
				id: b.roomId,
				roomType: b.room.roomType,
				hotel: b.hotel.name,
				bookings: 0,
				revenue: 0,
			};
			entry.bookings += 1;
			entry.revenue += b.totalPrice;
			map.set(b.roomId, entry);
		});
		return [...map.values()].sort((a, b) => b.revenue - a.revenue);
	}, [summary.active]);

	const maxRoomRevenue = Math.max(...revenueByRoom.map((r) => r.revenue), 1);

	const statusSlices = [
		{ label: "Paid", count: summary.paidCount },
		{ label: "Pending", count: summary.pendingCount },
		{ label: "Cancelled", count: summary.cancelledCount },
	];
	const totalBookings = bookings.length || 1;
	const circumference = 2 * Math.PI * 40;
	let offset = 0;

	const recent = [...bookings]
		.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
		.slice(0, 8);

	const availableRooms = rooms.filter((r) => r.isAvailable).length;

	return (
		<div>
			<Title
				align="left"
				title="Dashboard"
				subTitle="Monitor your listings, track bookings, and analyze revenue - all in one place."
			/>

			<div className="mt-6">
				<LatestBulletinWidget />
				<PendingBookingsWidget role="owner" />
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 my-8">
				<StatCard
					label="Active Bookings"
					value={summary.active.length}
					hint={`${summary.cancelledCount} cancelled`}
					icon={assets.totalBookingIcon}
				/>
				<StatCard
					label="Paid Revenue"
					value={formatCurrency(summary.paidTotal)}
					hint={`${summary.paidCount} paid bookings`}
					icon={assets.totalRevenueIcon}
				/>
				<StatCard
					label="Pending Payments"
					value={formatCurrency(summary.pendingTotal)}
					hint={`${summary.pendingCount} awaiting payment`}
					icon={assets.calenderIcon}
				/>
				<StatCard
					label="Rooms Open"
					value={`${availableRooms} / ${rooms.length}`}
					hint="Rooms available to book"
					icon={assets.listIcon}
				/>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
				{/* monthly bookings value */}
				<div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
					<h2 className="text-lg text-gray-800 font-medium">Booking value by check-in month</h2>
					{monthly.length === 0 ? (
						<p className="text-sm text-gray-500 mt-6">No bookings yet.</p>
					) : (
						<div className="flex items-end gap-3 h-56 mt-6 overflow-x-auto pb-1">
							{monthly.map(([key, value]) => (
								<div key={key} className="flex flex-col items-center gap-2 min-w-14 flex-1 h-full justify-end">
									<p className="text-xs text-gray-500">{formatCurrency(value)}</p>
									<div
										className="w-full max-w-16 rounded-t-lg bg-primary/80 hover:bg-primary transition-all"
										style={{ height: `${(value / maxMonth) * 75}%` }}
										title={`${monthLabel(key)}: ${formatCurrency(value)}`}
									/>
									<p className="text-xs text-gray-500">{monthLabel(key)}</p>
								</div>
							))}
						</div>
					)}
				</div>

				{/* status donut */}
				<div className="bg-white border border-gray-200 rounded-xl p-5">
					<h2 className="text-lg text-gray-800 font-medium">Payment status</h2>
					<div className="flex items-center gap-6 mt-6">
						<svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90 shrink-0" aria-label="Booking status breakdown">
							<circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="14" />
							{statusSlices.map((slice) => {
								const length = (slice.count / totalBookings) * circumference;
								const element = (
									<circle
										key={slice.label}
										cx="50"
										cy="50"
										r="40"
										fill="none"
										stroke={statusColors[slice.label]}
										strokeWidth="14"
										strokeDasharray={`${length} ${circumference - length}`}
										strokeDashoffset={-offset}
									/>
								);
								offset += length;
								return element;
							})}
						</svg>
						<ul className="flex flex-col gap-2 text-sm">
							{statusSlices.map((slice) => (
								<li key={slice.label} className="flex items-center gap-2 text-gray-700">
									<span className="h-3 w-3 rounded-full" style={{ backgroundColor: statusColors[slice.label] }} />
									{slice.label}: <span className="font-medium">{slice.count}</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* recent bookings */}
				<div className="xl:col-span-2">
					<h2 className="text-xl text-gray-800 font-medium mb-4">Recent Bookings</h2>
					<div className="w-full text-left border border-gray-200 rounded-xl overflow-x-auto bg-white">
						<table className="w-full min-w-[520px]">
							<thead className="bg-gray-50">
								<tr>
									<th scope="col" className="py-3 px-4 text-gray-800 font-medium text-left">Guest</th>
									<th scope="col" className="py-3 px-4 text-gray-800 font-medium text-left max-sm:hidden">Room</th>
									<th scope="col" className="py-3 px-4 text-gray-800 font-medium text-left max-sm:hidden">Stay</th>
									<th scope="col" className="py-3 px-4 text-gray-800 font-medium text-center">Amount</th>
									<th scope="col" className="py-3 px-4 text-gray-800 font-medium text-center">Status</th>
								</tr>
							</thead>
							<tbody className="text-sm">
								{recent.map((item, index) => {
									const status = bookingStatus(item);
									return (
										<tr key={`${item._id}-${index}`}>
											<td className="py-3 px-4 text-gray-700 border-t border-gray-200">{item.userName}</td>
											<td className="py-3 px-4 text-gray-700 border-t border-gray-200 max-sm:hidden">{item.room.roomType}</td>
											<td className="py-3 px-4 text-gray-700 border-t border-gray-200 max-sm:hidden">
												{formatDay(item.checkInDate, { month: "short", day: "numeric" })} – {formatDay(item.checkOutDate, { month: "short", day: "numeric" })}
											</td>
											<td className="py-3 px-4 text-gray-700 border-t border-gray-200 text-center">{formatCurrency(item.totalPrice)}</td>
											<td className="py-3 px-4 border-t border-gray-200">
												<span
													className={`block w-24 mx-auto py-1 px-3 text-xs rounded-full text-center ${
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
										</tr>
									);
								})}
								{recent.length === 0 && (
									<tr>
										<td colSpan={5} className="py-8 text-center text-gray-500 border-t border-gray-200">
											No bookings yet.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* revenue by room */}
				<div>
					<h2 className="text-xl text-gray-800 font-medium mb-4">Revenue by Room</h2>
					<div className="flex flex-col gap-5 border border-gray-200 rounded-xl bg-white p-5">
						{revenueByRoom.map((room) => (
							<div key={room.id}>
								<div className="flex justify-between text-sm text-gray-700">
									<span>{room.roomType} · {room.hotel}</span>
									<span className="font-medium">{formatCurrency(room.revenue)}</span>
								</div>
								<div className="h-2 w-full bg-gray-100 rounded-full mt-2">
									<div
										className="h-2 bg-primary rounded-full"
										style={{ width: `${(room.revenue / maxRoomRevenue) * 100}%` }}
									/>
								</div>
								<p className="text-xs text-gray-500 mt-1">
									{room.bookings} booking{room.bookings > 1 ? "s" : ""}
								</p>
							</div>
						))}
						{revenueByRoom.length === 0 && (
							<p className="text-sm text-gray-500">No revenue yet.</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
