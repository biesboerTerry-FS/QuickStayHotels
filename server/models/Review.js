import mongoose from "mongoose";

const ReviewSchema = mongoose.Schema(
	{
		roomId: { type: String, required: true },
		name: { type: String, required: true },
		rating: { type: Number, required: true, min: 1, max: 5 },
		comment: { type: String, required: true },
		date: { type: String, required: true },
	},
	{ timestamps: true }
);

const Review = mongoose.model("Review", ReviewSchema);
export default Review;
