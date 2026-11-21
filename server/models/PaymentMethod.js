import mongoose from "mongoose";

// TEST MODE ONLY. This record contains masked metadata for a demo card —
// brand, last4 and optional expiry. A full card number, CVC or Stripe token
// must never be written to this collection.
const PaymentMethodSchema = mongoose.Schema(
	{
		_id: { type: String, required: true },
		userId: { type: String, required: true, index: true },
		brand: { type: String, default: "Test card", trim: true, maxlength: 40 },
		label: { type: String, default: "Demo card", trim: true, maxlength: 60 },
		last4: {
			type: String,
			required: true,
			trim: true,
			match: [/^\d{4}$/, "last4 must be exactly four digits"],
		},
		exp: { type: String, default: "", trim: true, maxlength: 5 },
		isDefault: { type: Boolean, default: false },
	},
	{ timestamps: true, versionKey: false }
);

PaymentMethodSchema.index({ userId: 1, isDefault: -1 });

const PaymentMethod = mongoose.model("PaymentMethod", PaymentMethodSchema);

export default PaymentMethod;
