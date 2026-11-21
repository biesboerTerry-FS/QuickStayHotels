import mongoose from "mongoose";

// A customer's saved billing / check-in address. Records are always scoped to
// the authenticated id (`request.auth.id`) by the address routes.
const AddressSchema = mongoose.Schema(
	{
		_id: { type: String, required: true },
		userId: { type: String, required: true, index: true },
		label: { type: String, default: "Home", trim: true, maxlength: 60 },
		line1: { type: String, required: true, trim: true, maxlength: 200 },
		line2: { type: String, default: "", trim: true, maxlength: 200 },
		city: { type: String, required: true, trim: true, maxlength: 100 },
		state: { type: String, default: "", trim: true, maxlength: 100 },
		zip: { type: String, default: "", trim: true, maxlength: 20 },
		country: { type: String, required: true, trim: true, maxlength: 100 },
		isDefault: { type: Boolean, default: false },
	},
	{ timestamps: true, versionKey: false }
);

AddressSchema.index({ userId: 1, isDefault: -1 });

const Address = mongoose.model("Address", AddressSchema);

export default Address;
