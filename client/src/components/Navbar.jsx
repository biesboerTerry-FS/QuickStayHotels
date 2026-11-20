import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useClerk, useUser, UserButton } from "@clerk/react";
import ThemeToggle from "./ThemeToggle";
import { useDemoUser } from "../context/DemoAuthContext";

const BookIcon = () => (
	<svg
		className="w-4 h-4 text-gray-700"
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		fill="none"
		viewBox="0 0 24 24"
	>
		<path
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			d="M5 19V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13H7a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h12M9 3v14m7 0v4"
		/>
	</svg>
);

const HeartIcon = () => (
	<svg
		className="w-4 h-4 text-gray-700"
		aria-hidden="true"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinejoin="round"
	>
		<path d="M12 21s-7-4.35-9.5-8.5C.8 9.6 2.2 5.5 6 5.5c2.2 0 3.5 1.3 4.5 2.7C11.5 6.8 12.8 5.5 15 5.5c3.8 0 5.2 4.1 3.5 7C19 17.15 12 21 12 21z" />
	</svg>
);

const navLinks = [
	{ name: "Home", path: "/" },
	{ name: "Hotels", path: "/rooms" },
	{ name: "Offers", path: "/offers" },
	{ name: "Experience", path: "/experience" },
	{ name: "About", path: "/about" },
];

const Navbar = () => {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const { openSignIn } = useClerk();
	const { user } = useUser();
	const { isDemoMode, isDemoUser, isDemoOwner, demoUser, startDemo, endDemo } = useDemoUser();

	const navigate = useNavigate();

	const enterOwnerDemo = () => {
		startDemo("owner");
		setIsMenuOpen(false);
		navigate("/owner");
	};
	const location = useLocation();

	useEffect(() => {
		setIsMenuOpen(false);

		if (location.pathname !== "/") {
			setIsScrolled(true);
			return;
		}

		const handleScroll = () => setIsScrolled(window.scrollY > 10);
		handleScroll();
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [location.pathname]);

	const accountMenu = (
		<UserButton>
			<UserButton.MenuItems>
				<UserButton.Action
					label="My bookings"
					labelIcon={<BookIcon />}
					onClick={() => navigate("/my-bookings")}
				/>
				<UserButton.Action
					label="Saved rooms"
					labelIcon={<HeartIcon />}
					onClick={() => navigate("/saved")}
				/>
			</UserButton.MenuItems>
		</UserButton>
	);

	return (
		<nav
			className={`fixed top-0 left-0 w-full flex items-center justify-between px-4 md:px-10 lg:px-16 xl:px-20 transition-all duration-500 z-50 ${
				isScrolled
					? "bg-white/80 shadow-md text-gray-700 backdrop-blur-lg py-2 md:py-3"
					: "py-2 md:py-4"
			}`}
		>
			<Link
				to="/"
				onClick={(e) => {
					if (location.pathname === "/") {
						e.preventDefault();
						window.scrollTo({ top: 0, behavior: "smooth" });
					} else {
						window.scrollTo(0, 0);
					}
				}}
				aria-label="QuickStay home"
			>
				<img
					src={assets.logo}
					alt="QuickStay logo"
					className={`h-9 ${isScrolled ? "invert opacity-80" : ""}`}
				/>
			</Link>

			{/* Desktop Nav */}
			<div className="hidden md:flex items-center gap-4 lg:gap-8">
				{navLinks.map((link) => (
					<NavLink
						key={link.name}
						to={link.path}
						end
						onClick={(e) => {
							if (link.path === "/" && location.pathname === "/") {
								e.preventDefault();
								window.scrollTo({ top: 0, behavior: "smooth" });
							} else {
								window.scrollTo(0, 0);
							}
						}}
						className={`group flex flex-col gap-0.5 ${
							isScrolled ? "text-gray-700" : "text-white"
						}`}
					>
						{link.name}
						<div
							className={`${
								isScrolled ? "bg-gray-700" : "bg-white"
							} h-0.5 w-0 group-hover:w-full transition-all duration-300`}
						/>
					</NavLink>
				))}
			</div>

			{/* Desktop Right */}
			<div className="hidden md:flex items-center gap-4">
				<ThemeToggle />
				<button
					type="button"
					onClick={() => navigate("/rooms")}
					aria-label="Search hotels"
					className="cursor-pointer"
				>
					<img
						src={assets.searchIcon}
						alt="search"
						className={`${isScrolled ? "invert" : ""} h-7 transition-all duration-500`}
					/>
				</button>

				{user ? (
					accountMenu
				) : isDemoUser ? (
					<div className="flex items-center gap-3 ml-4">
						<span className="hidden lg:inline text-sm text-gray-600">
							{demoUser.fullName}
						</span>
						<button
							onClick={endDemo}
							className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
						>
							Exit demo
						</button>
					</div>
				) : (
					<div className="flex items-center gap-3 ml-4">
						{isDemoMode && (
							<button
								onClick={() => startDemo("guest")}
								className="hidden sm:inline px-4 py-2.5 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
							>
								Try demo
							</button>
						)}
						{isDemoMode && !isDemoOwner && (
							<button
								onClick={enterOwnerDemo}
								className="hidden lg:inline px-4 py-2.5 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
							>
								Owner demo
							</button>
						)}
						<button
							onClick={() => openSignIn()}
							className="bg-primary hover:bg-primary-dull text-white px-8 py-2.5 rounded-full transition-all duration-500 cursor-pointer"
						>
							Login
						</button>
					</div>
				)}
			</div>

			{/* Mobile Menu Button */}
			<div className="flex items-center gap-3 md:hidden">
				<ThemeToggle />
				{user && accountMenu}
				{isDemoUser && (
					<span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
						Demo
					</span>
				)}
				<button
					type="button"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					aria-label="Open menu"
					aria-expanded={isMenuOpen}
					className="cursor-pointer"
				>
					<img
						src={assets.menuIcon}
						alt="open menu"
						className={`${isScrolled ? "invert" : ""} h-4`}
					/>
				</button>
			</div>

			{/* Mobile Menu */}
			<div
				className={`fixed top-0 left-0 w-full h-screen bg-white text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-gray-800 transition-all duration-500 ${
					isMenuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<button
					className="absolute top-4 right-4 cursor-pointer"
					onClick={() => setIsMenuOpen(false)}
					aria-label="Close menu"
				>
					<img src={assets.closeIcon} alt="close menu" className="h-6.5" />
				</button>

				{navLinks.map((link) => (
					<Link
						key={link.name}
						to={link.path}
						onClick={(e) => {
							setIsMenuOpen(false);
							if (link.path === "/" && location.pathname === "/") {
								e.preventDefault();
								window.scrollTo({ top: 0, behavior: "smooth" });
							} else {
								window.scrollTo(0, 0);
							}
						}}
					>
						{link.name}
					</Link>
				))}

				{(user || isDemoUser) && (
					<Link to="/saved" onClick={() => setIsMenuOpen(false)}>
						Saved rooms
					</Link>
				)}

				{isDemoUser ? (
					<button
						onClick={() => {
							endDemo();
							setIsMenuOpen(false);
						}}
						className="px-6 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
					>
						Exit demo
					</button>
				) : (
					<div className="flex flex-col items-center gap-4">
						{isDemoMode && (
							<button
								onClick={() => {
									startDemo("guest");
									setIsMenuOpen(false);
								}}
								className="px-8 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
							>
								Try demo
							</button>
						)}
						{isDemoMode && !isDemoOwner && (
							<button
								onClick={enterOwnerDemo}
								className="px-8 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
							>
								Owner demo
							</button>
						)}
						<button
							onClick={() => openSignIn()}
							className="bg-primary hover:bg-primary-dull text-white px-8 py-2.5 rounded-full transition-all duration-500 cursor-pointer"
						>
							Login
						</button>
					</div>
				)}
			</div>
		</nav>
	);
};

export default Navbar;
