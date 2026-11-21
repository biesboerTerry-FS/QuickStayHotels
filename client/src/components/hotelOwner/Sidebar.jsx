import React from "react";
import { assets } from "../../assets/assets";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
	const groups = [
		{
			name: "Management",
			links: [
				{ name: "Dashboard", path: "/owner", icon: assets.dashboardIcon },
				{ name: "Add Room", path: "/owner/add-room", icon: assets.addIcon },
				{ name: "List Rooms", path: "/owner/list-rooms", icon: assets.listIcon },
				{ name: "Orders", path: "/owner/orders", icon: assets.calenderIcon },
				{ name: "Offers", path: "/owner/offers", icon: assets.badgeIcon },
				{ name: "Hotel Profile", path: "/owner/profile", icon: assets.homeIcon },
			],
		},
		{
			name: "Communication",
			links: [
				{
					name: "Messages",
					path: "/owner/messages",
					icon: assets.announcementIcon,
				},
				{
					name: "Schedule",
					path: "/owner/schedule",
					icon: assets.calenderIcon,
				},
				{
					name: "Announcements",
					path: "/owner/announcements",
					icon: assets.listIcon,
				},
			],
		},
	];

	return (
		<div className="md:w-64 w-16 border-r h-full text-base border-gray-300 pt-4 flex flex-col transition-all duration-300">
			{groups.map((group) => (
				<div key={group.name}>
					<p className="hidden md:block px-4 md:px-8 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
						{group.name}
					</p>
					{group.links.map((item) => (
						<NavLink
							to={item.path}
							key={item.path}
							end={item.path === "/owner"}
							className={({ isActive }) =>
								`flex items-center py-3 px-4 md:px-8 gap-3 border-r-4 md:border-r-[6px] ${
									isActive
										? "bg-primary/10 border-primary text-primary"
										: "hover:bg-gray-100/90 border-white text-gray-700"
								}`
							}
						>
							<img
								src={item.icon}
								alt={item.name}
								className="min-h-6 min-w-6"
							/>
							<p className="hidden md:block">{item.name}</p>
						</NavLink>
					))}
				</div>
			))}
		</div>
	);
};

export default Sidebar;
