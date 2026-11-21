import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useClerk, useUser, UserButton } from "@clerk/react";
import ThemeToggle from "./ThemeToggle";
import Icon from "./Icons";
import { useDemoUser } from "../context/DemoAuthContext";

const navLinks = [
	{ name: "Home", path: "/" },
	{ name: "Hotels", path: "/rooms" },
	{ name: "Offers", path: "/offers" },
	{ name: "Experience", path: "/experience" },
	{ name: "About", path: "/about" },
	{ name: "My profile", path: "/profile" },
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
	const enterEmployeeDemo = () => {
		startDemo("employee");
		setIsMenuOpen(false);
		navigate("/employee");
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
					label="My profile"
					labelIcon={<Icon name="user" className="h-5 w-5 text-gray-700" />}
					onClick={() => navigate("/profile")}
				/>
				<UserButton.Action
					label="My bookings"
					labelIcon={<Icon name="book" className="h-5 w-5 text-gray-700" />}
					onClick={() => navigate("/my-bookings")}
				/>
				<UserButton.Action
					label="Saved rooms"
					labelIcon={<Icon name="heart" className="h-5 w-5 text-gray-700" />}
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
					<Icon name="search" className="h-5 w-5 transition-all duration-500" />
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
						{isDemoMode && (
							<button
								onClick={enterEmployeeDemo}
								className="hidden lg:inline px-4 py-2.5 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
							>
								Try demo employee
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
					<Icon name="menu" className="h-5 w-5" />
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
					<Icon name="close" className="h-5 w-5 text-gray-800" />
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
						{isDemoMode && (
							<button
								onClick={enterEmployeeDemo}
								className="px-8 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
							>
								Try demo employee
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
