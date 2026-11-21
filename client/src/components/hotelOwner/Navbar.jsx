import React from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useClerk, useUser } from "@clerk/react";
import ThemeToggle from "../ThemeToggle";

const Navbar = () => {
	const { user, isLoaded } = useUser();
	const { openSignIn, signOut } = useClerk();

	return (
		<header className="sticky top-0 z-50 flex h-[60px] shrink-0 items-center justify-between border-b border-gray-300 bg-white px-4 transition-all duration-300 md:px-8">
			<Link to={"/"}>
				<img
					src={assets.logo}
					alt="logo"
					className="h-9 w-auto invert opacity-80"
				/>
			</Link>

			<div className="flex items-center gap-4">
				<ThemeToggle />
				{isLoaded &&
					(user ? (
						<>
							<div className="hidden sm:flex items-center gap-2">
								<img
									src={user.imageUrl}
									alt=""
									className="h-8 w-8 rounded-full object-cover"
								/>
								<span className="text-sm text-gray-700">
									{user.fullName || user.username}
								</span>
							</div>
							<button
								onClick={() => signOut({ redirectUrl: "/" })}
								className="border border-gray-300 text-gray-700 px-5 py-1.5 text-sm rounded-full hover:bg-gray-100 transition-all cursor-pointer"
							>
								Logout
							</button>
						</>
					) : (
						<button
							onClick={() => openSignIn()}
							className="bg-primary hover:bg-primary-dull text-white px-6 py-1.5 text-sm rounded-full transition-all cursor-pointer"
						>
							Login
						</button>
					))}
			</div>
		</header>
	);
};

export default Navbar;
