import express from "express";
import { seedDatabase } from "../utils/seed.js";

const router = express.Router();

router.post("/", async (request, response) => {
	try {
		const result = await seedDatabase();
		response.json({ success: true, ...result });
	} catch (error) {
		response.status(500).json({ success: false, message: error.message });
	}
});

export default router;
