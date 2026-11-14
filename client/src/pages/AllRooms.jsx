import React, { useState } from "react";
import { assets, facilityIcons } from "../assets/assets";
import { Link, useSearchParams } from "react-router-dom";
import StarRating from "../components/StarRating";
import SaveButton from "../components/SaveButton";
import {
	summarizeReviews,
	useRooms,
	useRoomReviews,
	useStore,
} from "../data/store";
import { filterRooms } from "../lib/roomFilters";
import { isValidRange, nightsBetween } from "../lib/bookings";
import { formatDay } from "../lib/format";
import useDocumentTitle from "../hooks/useDocumentTitle";

const roomTypes = ["Single Bed", "Double Bed", "Family Suite", "Luxury Room"];

const priceRanges = [
	{ label: "0 to 500", value: "0-500" },
	{ label: "501 to 1000", value: "501-1000" },
	{ label: "1001 to 2000", value: "1001-2000" },
	{ label: "2001 to 3000", value: "2001-3000" },
];

const sortOptions = [
	{ label: "Price Low to High", value: "price-asc" },
	{ label: "Price High to Low", value: "price-desc" },
	{ label: "Newest First", value: "newest" },
];

const CheckBox = ({ label, selected = false, onChange = () => {} }) => {
	return (
		<label className="flex gap-3 items-center cursor-pointer mt-2 text-sm">
			<input
				type="checkbox"
				checked={selected}
				onChange={() => onChange(label)}
			/>
			<span className="font-light select-none">{label}</span>
		</label>
	);
};

const RoomRating = ({ roomId }) => {
	const reviews = useRoomReviews(roomId);
	const { average, count } = summarizeReviews(reviews);
	return (
		<div className="flex items-center">
			<StarRating rating={Math.round(average)} />
			<p className="ml-2 text-sm">
				{average.toFixed(1)} · {count} reviews
			</p>
		</div>
	);
};

const AllRooms = () => {
	useDocumentTitle("Hotels");
	const [searchParams, setSearchParams] = useSearchParams();
	const [openFilters, setOpenFilters] = useState(false);
	const rooms = useRooms();
	const rawBookings = useStore("bookings");

	const destination = searchParams.get("destination")?.trim() || "";
	const guests = Number(searchParams.get("guests")) || 0;
	const checkIn = searchParams.get("checkIn") || "";
	const checkOut = searchParams.get("checkOut") || "";
	const dates = isValidRange(checkIn, checkOut) ? { checkIn, checkOut } : null;
	const selectedTypes = searchParams.getAll("type");
	const selectedPrices = searchParams.getAll("price");
	const sort = searchParams.get("sort") || "";
	const hasFilters =
		selectedTypes.length > 0 ||
		selectedPrices.length > 0 ||
		sort !== "" ||
		guests > 0;

	const filteredRooms = filterRooms(rooms, {
		destination,
		types: selectedTypes,
		prices: selectedPrices,
		guests,
		dates,
		bookings: rawBookings,
		sort,
	});

	const updateParams = (update) => {
		const next = new URLSearchParams(searchParams);
		update(next);
		setSearchParams(next);
	};

	const toggleMulti = (key, value) =>
		updateParams((params) => {
			const current = params.getAll(key);
			const next = current.includes(value)
				? current.filter((item) => item !== value)
				: [...current, value];
			params.delete(key);
			next.forEach((item) => params.append(key, item));
		});

	const clearFilters = () =>
		updateParams((params) => {
			params.delete("type");
			params.delete("price");
			params.delete("sort");
			params.delete("guests");
		});

	const clearSearch = () => setSearchParams({});

	const nights = dates ? nightsBetween(dates.checkIn, dates.checkOut) : 0;

	return (
		<div className="flex flex-col-reverse lg:flex-row items-start justify-between pt-28 md:pt-35 px-4 md:px-16 lg:px-24 xl:px-32">
			<div className="w-full lg:flex-1 lg:pr-10">
				<div className="flex flex-col items-start text-left">
					<h1 className="font-playfair text-4xl md:text-[40px]">
						Hotel Rooms
					</h1>
					<p className="text-sm md:text-base text-gray-600 mt-2">
						Take advantage of our limited-time offers and special
						packages to enhance your stay and create unforgettable
						memories.
					</p>
					{(destination || hasFilters || dates) && (
						<div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
							<p className="text-gray-600">
								{filteredRooms.length} room
								{filteredRooms.length === 1 ? "" : "s"} found
								{destination && (
									<>
										{" "}
										in{" "}
										<span className="font-medium text-gray-800">
											{destination}
										</span>
									</>
								)}
								{dates && (
									<>
										{" "}
										· {formatDay(dates.checkIn)} –{" "}
										{formatDay(dates.checkOut)} ({nights} night
										{nights === 1 ? "" : "s"})
									</>
								)}
								{guests > 0 && (
									<>
										{" "}
										· {guests} guest{guests === 1 ? "" : "s"}
									</>
								)}
							</p>
							<button
								onClick={clearSearch}
								className="text-primary hover:underline cursor-pointer"
							>
								Clear search
							</button>
						</div>
					)}
				</div>

				{filteredRooms.length === 0 && (
					<div className="mt-12 max-w-xl rounded-2xl border border-dashed border-gray-300 p-8 text-center">
						<p className="text-lg font-medium text-gray-800">
							No rooms match your search
						</p>
						<p className="text-sm text-gray-500 mt-2">
							Try a different destination or dates, or remove some
							filters.
						</p>
						<div className="flex justify-center gap-3 mt-5">
							<button
								onClick={clearFilters}
								className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
							>
								Clear filters
							</button>
							<Link
								to="/rooms"
								onClick={() => window.scrollTo(0, 0)}
								className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dull"
							>
								Show all rooms
							</Link>
						</div>
					</div>
				)}

				{filteredRooms.map((room) => (
					<div
						className="flex flex-col md:flex-row items-start py-10 gap-6 border-b border-gray-300 last:pb-30 last:border-0"
						key={room._id}
					>
						<div className="relative md:w-1/2">
							<Link
								to={`/rooms/${room._id}`}
								onClick={() => window.scrollTo(0, 0)}
								className="block"
							>
								<img
									src={room.images[0]}
									alt={`${room.hotel.name} ${room.roomType}`}
									className="max-h-65 w-full rounded-2xl shadow-lg object-cover"
								/>
							</Link>
							<SaveButton roomId={room._id} className="absolute top-3 right-3" />
						</div>
						<div className="md:w-1/2 flex flex-col gap-2">
							<p className="text-gray-500">{room.hotel.city}</p>
							<h2 className="text-3xl font-playfair">
								<Link
									to={`/rooms/${room._id}`}
									onClick={() => window.scrollTo(0, 0)}
									className="text-gray-800 hover:underline"
								>
									{room.hotel.name}
								</Link>
							</h2>
							<RoomRating roomId={room._id} />
							<div className="flex items-center gap-1 text-gray-500 mt-2 text-sm">
								<img src={assets.locationIcon} alt="location-icon" />
								<span>{room.hotel.address}</span>
							</div>
							<p className="text-sm text-gray-500">
								{room.roomType} · up to {room.maxGuests} guests
							</p>
							{/* Amenities */}
							<div className="flex flex-wrap items-center mt-3 mb-6 gap-4">
								{room.amenities.map((item) => (
									<div
										key={item}
										className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f5f5ff]"
									>
										<img
											src={facilityIcons[item]}
											alt={item}
											className="w-5 h-5"
										/>
										<p className="text-xs">{item}</p>
									</div>
								))}
							</div>
							{/* room pricing */}
							<p className="text-xl font-medium text-gray-700">
								${room.pricePerNight}/night
							</p>
						</div>
					</div>
				))}
			</div>

			{/* Filters */}
			<div className="bg-white w-80 max-w-full border border-gray-300 rounded-2xl text-gray-600 max-lg:mb-8 lg:mt-16 overflow-hidden">
				<div
					className={`flex items-center justify-between px-5 py-2.5 lg:border-b border-gray-300 ${
						openFilters ? "border-b" : ""
					}`}
				>
					<p className="text-base font-medium text-gray-800">
						FILTERS
					</p>
					<div className="text-xs flex items-center gap-3">
						<button
							type="button"
							onClick={() => setOpenFilters(!openFilters)}
							aria-expanded={openFilters}
							aria-controls="room-filters"
							className="lg:hidden cursor-pointer hover:underline"
						>
							{openFilters ? "HIDE" : "SHOW"}
						</button>
						<button
							type="button"
							onClick={clearFilters}
							className="hidden lg:block cursor-pointer hover:underline"
						>
							CLEAR
						</button>
					</div>
				</div>
				<div
					id="room-filters"
					className={openFilters ? "block" : "hidden lg:block"}
				>
					<div className="px-5 pt-5">
						<p className="font-medium text-gray-800 pb-2">
							Popular filters
						</p>
						{roomTypes.map((type) => (
							<CheckBox
								key={type}
								label={type}
								selected={selectedTypes.includes(type)}
								onChange={(value) => toggleMulti("type", value)}
							/>
						))}
					</div>
					<div className="px-5 pt-5">
						<p className="font-medium text-gray-800 pb-2">
							Price range
						</p>
						{priceRanges.map((range) => (
							<label
								key={range.value}
								className="flex gap-3 items-center cursor-pointer mt-2 text-sm"
							>
								<input
									type="checkbox"
									checked={selectedPrices.includes(range.value)}
									onChange={() => toggleMulti("price", range.value)}
								/>
								<span className="font-light select-none">
									$ {range.label}
								</span>
							</label>
						))}
					</div>
					<div className="px-5 pt-5">
						<p className="font-medium text-gray-800 pb-2">
							Guests
						</p>
						<input
							type="number"
							min={1}
							max={4}
							aria-label="Number of guests"
							value={guests || ""}
							placeholder="Any"
							onChange={(event) =>
								updateParams((params) => {
									const value = event.target.value;
									if (value) params.set("guests", value);
									else params.delete("guests");
								})
							}
							className="w-24 rounded border border-gray-300 px-3 py-1.5 text-sm outline-none"
						/>
					</div>
					<div className="px-5 pt-5 pb-7">
						<p className="font-medium text-gray-800 pb-2">
							Sort By
						</p>
						{sortOptions.map((option) => (
							<label
								key={option.value}
								className="flex gap-3 items-center cursor-pointer mt-2 text-sm"
							>
								<input
									type="radio"
									name="sortOption"
									checked={sort === option.value}
									onChange={() =>
										updateParams((params) =>
											params.set("sort", option.value)
										)
									}
								/>
								<span className="font-light select-none">
									{option.label}
								</span>
							</label>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default AllRooms;
