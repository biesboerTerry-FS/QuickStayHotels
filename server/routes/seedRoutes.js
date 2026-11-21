import express from "express";
import { seedDatabase } from "../utils/seed.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Seeding mutates the database — owner/admin only. GET routes still serve the
// seeded demo content publicly.
router.post("/", protect, requireRole("owner", "admin"), async (request, response) => {
	try {
		const result = await seedDatabase();
		response.json({ success: true, ...result });
	} catch (error) {
		response.status(500).json({ success: false, message: error.message });
	}
});

export default router;
