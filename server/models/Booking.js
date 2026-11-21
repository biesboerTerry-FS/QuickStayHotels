import mongoose from "mongoose";

const BookingSchema = mongoose.Schema(
	{
		roomId: { type: String, required: true },
		userId: { type: String, required: true },
		userName: { type: String, required: true },
		checkInDate: { type: String, required: true },
		checkOutDate: { type: String, required: true },
		guests: { type: Number, required: true, min: 1 },
		basePrice: { type: Number, required: true },
		discount: { type: Number, default: 0 },
		offerId: { type: String, default: null },
		totalPrice: { type: Number, required: true },
		paymentMethod: { type: String, required: true },
		isPaid: { type: Boolean, default: false },
		status: { type: String, enum: ["pending", "cancelled"], default: "pending" },
		fulfillmentStatus: {
			type: String,
			enum: ["pending", "confirmed", "checked-in", "completed"],
			default: "pending",
		},
	},
	{ timestamps: true }
);

const Booking = mongoose.model("Booking", BookingSchema);
export default Booking;
