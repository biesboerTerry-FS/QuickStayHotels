import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets, cities } from "../assets/assets";
import heroImage from "../assets/heroImage.png";
import { setState, useStore } from "../data/store";
import DateInput from "../components/DateInput";

const inputClass =
	"rounded-lg border border-white/60 bg-white/80 px-3 py-2 mt-1.5 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all";

const buildSearchUrl = (search) => {
	const params = new URLSearchParams();
	Object.entries(search).forEach(([key, value]) => {
		if (value) params.set(key, value);
	});
	return `/rooms?${params.toString()}`;
};

const Hero = () => {
	const navigate = useNavigate();
	const recentSearches = useStore("searches");
	const [search, setSearch] = useState({
		destination: "",
		checkIn: "",
		checkOut: "",
		guests: "",
	});

	const updateSearch = (field) => (event) =>
		setSearch((prev) => ({ ...prev, [field]: event.target.value }));

	const runSearch = (value) => {
		const entry = { ...value, savedAt: new Date().toISOString() };
		setState("searches", (list) =>
			[
				entry,
				...list.filter(
					(item) =>
						item.destination !== entry.destination ||
						item.checkIn !== entry.checkIn ||
						item.checkOut !== entry.checkOut
				),
			].slice(0, 5)
		);
		navigate(buildSearchUrl(value));
		window.scrollTo(0, 0);
	};

	const handleSearch = (event) => {
		event.preventDefault();
		runSearch(search);
	};

	return (
		<div
			className="relative flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 py-16 text-white bg-no-repeat bg-cover bg-center min-h-screen"
			style={{
				backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.35), rgba(15,23,42,0.75)), url(${heroImage})`,
			}}
		>
			<p className="bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-1 rounded-full mt-20 text-sm">
				The Ultimate Hotel Experience
			</p>
			<h1 className="font-playfair text-3xl md:text-5xl md:text-[60px] md:leading-[64px] font-bold md:font-extrabold max-w-2xl mt-5 tracking-tight">
				Discover Your Perfect Getaway Destination
			</h1>
			<p className="max-w-130 mt-3 text-sm md:text-base text-white/85 leading-relaxed">
				Unparalleled luxury and comfort await at the world's most
				exclusive hotels and resorts. Start your journey today.
			</p>

			<form
				onSubmit={handleSearch}
				className="glass-panel w-full max-w-4xl text-gray-600 rounded-2xl px-6 py-5 mt-10 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:items-end gap-4 shadow-2xl shadow-black/20"
			>
				<div>
					<div className="flex items-center gap-2 text-sm font-medium text-gray-800">
						<img src={assets.calenderIcon} alt="" className="h-4" />
						<label htmlFor="destinationInput">Destination</label>
					</div>
					<input
						list="destinations"
						id="destinationInput"
						type="text"
						value={search.destination}
						onChange={updateSearch("destination")}
						className={`${inputClass} w-44`}
						placeholder="Type here"
						required
					/>
					<datalist id="destinations">
						{cities.map((city) => (
							<option value={city} key={city} />
						))}
					</datalist>
				</div>

				<div>
					<div className="flex items-center gap-2 text-sm font-medium text-gray-800">
						<img src={assets.calenderIcon} alt="" className="h-4" />
						<label htmlFor="checkIn">Check in</label>
					</div>
					<DateInput
						id="checkIn"
						label="Check in"
						value={search.checkIn}
						onChange={updateSearch("checkIn")}
						min={new Date().toISOString().slice(0, 10)}
						className="mt-1.5"
					/>
				</div>

				<div>
					<div className="flex items-center gap-2 text-sm font-medium text-gray-800">
						<img src={assets.calenderIcon} alt="" className="h-4" />
						<label htmlFor="checkOut">Check out</label>
					</div>
					<DateInput
						id="checkOut"
						label="Check out"
						value={search.checkOut}
						onChange={updateSearch("checkOut")}
						min={search.checkIn || new Date().toISOString().slice(0, 10)}
						className="mt-1.5"
					/>
				</div>

				<div className="flex flex-col">
					<label htmlFor="guests" className="text-sm font-medium text-gray-800">
						Guests
					</label>
					<input
						min={1}
						max={4}
						id="guests"
						type="number"
						value={search.guests}
						onChange={updateSearch("guests")}
						className={`${inputClass} max-w-20`}
						placeholder="0"
					/>
				</div>

				<button className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dull active:scale-95 transition-all text-white py-3 px-6 cursor-pointer sm:col-span-2 lg:col-auto">
					<img src={assets.searchIcon} alt="searchIcon" className="h-6" />
					<span className="font-medium">Search</span>
				</button>
			</form>

			{recentSearches.length > 0 && (
				<div className="flex flex-wrap items-center gap-2 mt-5 text-sm">
					<span className="text-white/70">Recent:</span>
					{recentSearches.map((item) => (
						<button
							key={`${item.destination}-${item.checkIn}-${item.checkOut}-${item.savedAt}`}
							onClick={() => runSearch(item)}
							className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 transition-all cursor-pointer"
						>
							{item.destination}
							{item.checkIn && ` · ${item.checkIn}`}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default Hero;
