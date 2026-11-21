import mongoose from "mongoose";

// Lightweight customer account record keyed by the authenticated user id.
// DemoAuth identities (demo_guest, ...) and Clerk user ids are both accepted;
// no password, card number or other sensitive data is stored here.
const CustomerSchema = mongoose.Schema(
	{
		_id: { type: String, required: true },
		fullName: { type: String, default: "", trim: true, maxlength: 120 },
		email: { type: String, default: "", trim: true, maxlength: 254 },
		phone: { type: String, default: "", trim: true, maxlength: 60 },
	},
	{ timestamps: true, versionKey: false }
);

const Customer = mongoose.model("Customer", CustomerSchema);

export default Customer;
