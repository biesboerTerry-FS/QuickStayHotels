import { apiFetch } from "./api";

// Mirror the localStorage-backed demo state to the backend. Failures are
// ignored: localStorage remains the source of truth for the demo portals.
export const syncPortalState = () => {
	Promise.all([import("./messages"), import("./schedule")])
		.then(([messages, schedule]) => {
			const current = schedule.getSchedule();
			return apiFetch("/api/portal/state", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: messages.getMessages(),
					requests: current.requests,
					availability: current.availability,
				}),
			});
		})
		.catch(() => {
			// demo mode works without the API
		});
};
