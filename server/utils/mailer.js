const RESEND_API_URL = "https://api.resend.com/emails";

export const sendEmail = async ({ to, subject, html, text }) => {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		console.warn("RESEND_API_KEY not set; email not sent.");
		return { id: null, skipped: true };
	}

	const response = await fetch(RESEND_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			from: process.env.FROM_EMAIL || "QuickStay <onboarding@resend.dev>",
			to,
			subject,
			html,
			text,
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Resend error: ${error}`);
	}

	return response.json();
};

export const sendBookingConfirmation = async ({ to, booking, room }) => {
	const html = `
		<h1>Booking confirmed</h1>
		<p>Thank you for booking with QuickStay.</p>
		<ul>
			<li><strong>Hotel:</strong> ${room.hotel.name}</li>
			<li><strong>Room:</strong> ${room.roomType}</li>
			<li><strong>Check-in:</strong> ${booking.checkInDate}</li>
			<li><strong>Check-out:</strong> ${booking.checkOutDate}</li>
			<li><strong>Guests:</strong> ${booking.guests}</li>
			<li><strong>Total:</strong> $${booking.totalPrice}</li>
		</ul>
	`;

	return sendEmail({
		to,
		subject: `Your QuickStay booking at ${room.hotel.name}`,
		html,
		text: `Booking confirmed at ${room.hotel.name}. Total $${booking.totalPrice}.`,
	});
};
