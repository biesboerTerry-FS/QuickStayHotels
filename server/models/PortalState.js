import mongoose from "mongoose";

// One document mirrors the demo portal's localStorage state (messages,
// schedule requests and availability) so it can be backed up server-side.
const PortalStateSchema = mongoose.Schema(
	{
		_id: { type: String },
		value: { type: mongoose.Schema.Types.Mixed, default: {} },
	},
	{ versionKey: false }
);

const PortalState = mongoose.model("PortalState", PortalStateSchema);
export default PortalState;
