import { toDay, todayIso } from "./format";

const DAY_MS = 24 * 60 * 60 * 1000;

export const makeId = () =>
	`bk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const nightsBetween = (checkIn, checkOut) =>
	Math.round(
		(Date.parse(toDay(checkOut)) - Date.parse(toDay(checkIn))) / DAY_MS
	);

export const isValidRange = (checkIn, checkOut) =>
	Boolean(checkIn && checkOut) && nightsBetween(checkIn, checkOut) >= 1;

const rangesOverlap = (aStart, aEnd, bStart, bEnd) =>
	toDay(aStart) < toDay(bEnd) && toDay(bStart) < toDay(aEnd);

export const isRoomFree = (roomId, checkIn, checkOut, bookings) =>
	!bookings.some(
		(booking) =>
			booking.roomId === roomId &&
			booking.status !== "cancelled" &&
			rangesOverlap(
				checkIn,
				checkOut,
				booking.checkInDate,
				booking.checkOutDate
			)
	);

export const bookingStatus = (booking) => {
	if (booking.status === "cancelled") return "Cancelled";
	return booking.isPaid ? "Paid" : "Pending";
};

export const canCancel = (booking) =>
	booking.status !== "cancelled" && toDay(booking.checkInDate) > todayIso();

export const applyOffer = (total, offer) => {
	if (!offer || !offer.priceOff) return { discount: 0, total };
	const discount = Math.round((total * offer.priceOff) / 100);
	return { discount, total: total - discount };
};

export const createBooking = ({
	room,
	checkIn,
	checkOut,
	guests,
	paymentMethod,
	user,
	offer = null,
}) => {
	const baseTotal = nightsBetween(checkIn, checkOut) * room.pricePerNight;
	const { discount, total } = applyOffer(baseTotal, offer);
	return {
		_id: makeId(),
		roomId: room._id,
		userId: user.id,
		userName: user.fullName || user.username || "Guest",
		checkInDate: toDay(checkIn),
		checkOutDate: toDay(checkOut),
		guests: Number(guests),
		basePrice: baseTotal,
		discount,
		offerId: offer?._id || null,
		totalPrice: total,
		paymentMethod,
		isPaid: false,
		status: "pending",
		createdAt: new Date().toISOString(),
	};
};

const escapeIcs = (value) =>
	String(value).replace(/[\\;,]/g, (char) => `\\${char}`).replace(/\n/g, "\\n");

export const bookingToIcs = (booking) => {
	const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//QuickStay//Bookings//EN",
		"BEGIN:VEVENT",
		`UID:${booking._id}@quickstay`,
		`DTSTAMP:${stamp}`,
		`DTSTART;VALUE=DATE:${toDay(booking.checkInDate).replace(/-/g, "")}`,
		`DTEND;VALUE=DATE:${toDay(booking.checkOutDate).replace(/-/g, "")}`,
		`SUMMARY:${escapeIcs(`Stay at ${booking.hotel.name}`)}`,
		`LOCATION:${escapeIcs(booking.hotel.address || booking.hotel.city || "")}`,
		`DESCRIPTION:${escapeIcs(`${booking.room.roomType}, ${booking.guests} guest(s). Total $${booking.totalPrice}.`)}`,
		"END:VEVENT",
		"END:VCALENDAR",
	];
	return lines.join("\r\n");
};

export const bookingsToCsv = (bookings) => {
	const header = [
		"Booking ID",
		"Guest",
		"Room",
		"Check-in",
		"Check-out",
		"Guests",
		"Payment method",
		"Total",
		"Status",
	];
	const rows = bookings.map((b) => [
		b._id,
		b.userName,
		b.room.roomType,
		toDay(b.checkInDate),
		toDay(b.checkOutDate),
		b.guests,
		b.paymentMethod,
		b.totalPrice,
		bookingStatus(b),
	]);
	return [header, ...rows]
		.map((row) =>
			row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
		)
		.join("\n");
};
