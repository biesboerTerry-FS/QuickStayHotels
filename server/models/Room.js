import mongoose from "mongoose";

const RoomSchema = mongoose.Schema(
	{
		hotel: {
			name: { type: String, required: true },
			address: { type: String, required: true },
			city: { type: String, required: true },
			contact: { type: String, required: true },
			lat: { type: Number, required: true },
			lng: { type: Number, required: true },
		},
		roomType: {
			type: String,
			enum: ["Single Bed", "Double Bed", "Family Suite", "Luxury Room"],
			required: true,
		},
		pricePerNight: { type: Number, required: true, min: 0 },
		maxGuests: { type: Number, required: true, min: 1 },
		amenities: [{ type: String }],
		images: [{ type: String }],
		isAvailable: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

const Room = mongoose.model("Room", RoomSchema);
export default Room;
