import express from "express";
import { uploadImage } from "../utils/cloudinary.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Image uploads are a privileged mutation used by the owner dashboard.
router.post(
	"/",
	protect,
	requireRole("owner", "admin"),
	express.raw({ type: "image/*", limit: "5mb" }),
	async (request, response) => {
		try {
			if (!request.body || !request.body.length) {
				return response.status(400).json({ success: false, message: "No image provided" });
			}
			const url = await uploadImage(request.body);
			response.json({ success: true, url });
		} catch (error) {
			response.status(500).json({ success: false, message: error.message });
		}
	}
);

export default router;
