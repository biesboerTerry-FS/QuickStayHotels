import React, { useState } from "react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";
import { setState } from "../data/store";
import { useToast } from "../context/ToastContext";

const footerLinks = {
	Company: [
		{ name: "About", path: "/about" },
		{ name: "Careers", path: "/careers" },
		{ name: "Press", path: "/press" },
		{ name: "Blog", path: "/blog" },
		{ name: "Partners", path: "/partners" },
	],
	Support: [
		{ name: "Help Center", path: "/help" },
		{ name: "Safety Information", path: "/safety" },
		{ name: "Cancellation Options", path: "/cancellation" },
		{ name: "Contact Us", path: "/contact" },
		{ name: "Accessibility", path: "/accessibility" },
	],
};

const legalLinks = [
	{ name: "Privacy", path: "/privacy" },
	{ name: "Terms", path: "/terms" },
	{ name: "Sitemap", path: "/sitemap" },
];

const socialLinks = [
	{ src: assets.instagramIcon, label: "Instagram", href: "#" },
	{ src: assets.facebookIcon, label: "Facebook", href: "#" },
	{ src: assets.twitterIcon, label: "X (Twitter)", href: "#" },
	{ src: assets.linkendinIcon, label: "LinkedIn", href: "#" },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Footer = () => {
	const toast = useToast();
	const [email, setEmail] = useState("");

	const subscribe = (event) => {
		event.preventDefault();
		if (!emailPattern.test(email.trim())) {
			toast.show("Please enter a valid email address.", "error");
			return;
		}
		setState("newsletter", (list) =>
			list.includes(email.trim()) ? list : [...list, email.trim()]
		);
		setEmail("");
		toast.show("Thanks for subscribing!");
	};

	return (
		<footer className="bg-[#f6f9fc] text-gray-600 pt-6 px-4 md:px-10 lg:px-16 xl:px-20">
			<div className="flex flex-wrap justify-between gap-8 md:gap-4">
				<div className="w-full md:max-w-sm lg:max-w-64">
					<img
						src={assets.logo}
						alt="logo"
						className="invert opacity-80 h-8 md:h-9"
					/>
					<p className="text-sm mt-4">
						Discover the world's most extraordinary places to stay,
						from boutique hotels to luxury villas and private
						islands.
					</p>
				</div>

				<div className="grid grid-cols-2 gap-8 w-full sm:w-auto">
					{Object.entries(footerLinks).map(([heading, links]) => (
						<div key={heading}>
							<p className="font-playfair text-lg text-gray-800 uppercase">
								{heading}
							</p>
							<ul className="mt-3 flex flex-col gap-2 text-sm">
								{links.map((link) => (
									<li key={link.path}>
										<Link
											to={link.path}
											className="hover:text-gray-900 transition-colors"
										>
											{link.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="w-full xl:w-1/4 flex flex-col gap-3">
					<div>
						<p className="font-playfair text-lg text-gray-800 uppercase">
							Stay Updated
						</p>
						<p className="mt-2 text-sm">
							Subscribe to our newsletter for inspiration and special
							offers.
						</p>
					</div>
					<form onSubmit={subscribe} noValidate className="flex items-center">
						<input
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							aria-label="Email address"
							className="bg-white rounded-l border border-gray-300 h-9 px-2 outline-none w-full"
							placeholder="Your email"
						/>
						<button
							type="submit"
							aria-label="Subscribe"
							className="flex items-center justify-center bg-primary hover:bg-primary-dull h-9 w-9 aspect-square rounded-r cursor-pointer transition-all"
						>
							<img
								src={assets.arrowIcon}
								alt=""
								className="w-3.5 invert"
							/>
						</button>
					</form>
					<div className="flex items-center justify-between mt-1">
						{socialLinks.map((icon) => (
							<a
								key={icon.label}
								href={icon.href}
								aria-label={icon.label}
								onClick={(event) => {
									event.preventDefault();
									toast.show(`Follow us on ${icon.label} (link coming soon)`);
								}}
								className="hover:opacity-75 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
							>
								<img src={icon.src} alt="" className="w-6" />
							</a>
						))}
					</div>
				</div>
			</div>
			<hr className="border-gray-300 mt-6" />
			<div className="flex flex-col md:flex-row gap-2 items-center justify-between py-3">
				<p>
					© {new Date().getFullYear()} QuickStay. All rights reserved.
				</p>
				<ul className="flex items-center gap-4 flex-wrap justify-center">
					<li>
						<Link
							to="/owner"
							className="hover:text-gray-900 transition-colors"
						>
							Dashboard
						</Link>
					</li>
					{legalLinks.map((link) => (
						<li key={link.path}>
							<Link
								to={link.path}
								className="hover:text-gray-900 transition-colors"
							>
								{link.name}
							</Link>
						</li>
					))}
				</ul>
			</div>
		</footer>
	);
};

export default Footer;
