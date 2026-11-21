import React, { useState } from "react";
import { Link } from "react-router-dom";
import { formatDay } from "../../lib/format";
import { getActiveBulletins, useBulletins } from "../../lib/bulletins";

const DISMISSED_KEY = "quickstay-bulletin-dismissed";

const badgeClass = {
	info: "bg-blue-100 text-blue-700",
	warning: "bg-amber-100 text-amber-700",
	promotion: "bg-purple-100 text-purple-700",
};

const LatestBulletinWidget = () => {
	const bulletins = useBulletins();
	const latest = getActiveBulletins(bulletins)[0];
	const [dismissedId, setDismissedId] = useState(() => {
		try {
			return sessionStorage.getItem(DISMISSED_KEY);
		} catch {
			return null;
		}
	});

	if (!latest || latest.id === dismissedId) return null;

	const dismiss = () => {
		try {
			sessionStorage.setItem(DISMISSED_KEY, latest.id);
		} catch {
			// Session storage unavailable: dismissal lasts for this render only.
		}
		setDismissedId(latest.id);
	};

	return (
		<section
			data-testid="latest-bulletin"
			aria-label="Latest bulletin"
			className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3"
		>
			<span className={`shrink-0 px-2 py-1 text-xs rounded-full font-medium capitalize ${badgeClass[latest.type] || badgeClass.info}`}>
				{latest.type}
			</span>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-baseline gap-2">
					<h2 className="text-sm font-semibold text-gray-800">Latest bulletin</h2>
					<span className="text-xs text-gray-500">
						{formatDay(latest.createdAt, { month: "short", day: "numeric" })}
					</span>
				</div>
				<p className="text-sm font-medium text-gray-800 mt-0.5">{latest.title}</p>
				<p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{latest.body}</p>
				<Link
					to="/owner/announcements"
					className="text-xs text-primary hover:underline mt-1 inline-block"
				>
					Manage announcements
				</Link>
			</div>
			<button
				onClick={dismiss}
				aria-label="Dismiss latest bulletin"
				className="shrink-0 text-gray-500 hover:text-gray-800 text-xl leading-none px-1 cursor-pointer"
			>
				&times;
			</button>
		</section>
	);
};

export default LatestBulletinWidget;
