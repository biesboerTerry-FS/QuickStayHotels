import React from "react";

// Monochrome, currentColor SVGs used across the public navbar and both portals.
// Keeping them inline (instead of the old static `assets.*Icon` images) means a
// single sizing contract and reliable contrast in light and dark themes — the
// inherited `color` already flips with the existing CSS dark-mode overrides.

const paths = {
	dashboard: (
		<>
			<rect x="3" y="3" width="7" height="7" rx="1.5" />
			<rect x="14" y="3" width="7" height="7" rx="1.5" />
			<rect x="3" y="14" width="7" height="7" rx="1.5" />
			<rect x="14" y="14" width="7" height="7" rx="1.5" />
		</>
	),
	add: (
		<>
			<rect x="3" y="3" width="18" height="18" rx="3" />
			<path d="M12 8v8M8 12h8" />
		</>
	),
	list: (
		<>
			<path d="M9 6h11M9 12h11M9 18h11" />
			<path d="M4 6h.01M4 12h.01M4 18h.01" />
		</>
	),
	calendar: (
		<>
			<rect x="3" y="5" width="18" height="16" rx="2" />
			<path d="M8 3v4M16 3v4M3 10h18" />
		</>
	),
	badge: (
		<>
			<circle cx="12" cy="9" r="5" />
			<path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5" />
		</>
	),
	home: (
		<>
			<path d="m3 10 9-7 9 7" />
			<path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
			<path d="M9.5 21v-6h5v6" />
		</>
	),
	user: (
		<>
			<circle cx="12" cy="8" r="4" />
			<path d="M4 21a8 8 0 0 1 16 0" />
		</>
	),
	announcement: (
		<>
			<path d="M4 10v4a1 1 0 0 0 1 1h2l7 5V4L7 9H5a1 1 0 0 0-1 1Z" />
			<path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a7.5 7.5 0 0 1 0 11" />
		</>
	),
	orders: (
		<>
			<path d="M6 3h12a1 1 0 0 1 1 1v17l-3.5-2-3.5 2-3.5-2L5 21V4a1 1 0 0 1 1-1Z" />
			<path d="M9 8h6M9 12h6" />
		</>
	),
	message: (
		<>
			<path d="M20 15a3 3 0 0 1-3 3H8l-4 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9Z" />
			<path d="M8 9h8M8 13h5" />
		</>
	),
	clock: (
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3.5 2" />
		</>
	),
	search: (
		<>
			<circle cx="11" cy="11" r="7" />
			<path d="m20 20-4-4" />
		</>
	),
	menu: <path d="M4 7h16M4 12h16M4 17h16" />,
	close: <path d="M6 6l12 12M18 6 6 18" />,
	chevron: <path d="m6 9 6 6 6-6" />,
	book: (
		<>
			<path d="M5 19V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13H7a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h12" />
			<path d="M9 3v14M16 17v4" />
		</>
	),
	heart: (
		<path d="M12 21s-7-4.35-9.5-8.5C.8 9.6 2.2 5.5 6 5.5c2.2 0 3.5 1.3 4.5 2.7C11.5 6.8 12.8 5.5 15 5.5c3.8 0 5.2 4.1 3.5 7C19 17.15 12 21 12 21Z" />
	),
	settings: (
		<>
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.51 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.36.36.68.66.9.3.23.66.36 1.04.36H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
		</>
	),
};

const Icon = ({ name, className = "h-5 w-5", strokeWidth = 1.8, ...props }) => (
	<svg
		aria-hidden="true"
		focusable="false"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={strokeWidth}
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
		{...props}
	>
		{paths[name] || paths.list}
	</svg>
);

export default Icon;
