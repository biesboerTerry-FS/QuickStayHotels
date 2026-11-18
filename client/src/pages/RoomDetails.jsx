import React, { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { assets, facilityIcons, roomCommonData } from "../assets/assets";
import StarRating from "../components/StarRating";
import SaveButton from "../components/SaveButton";
import DateInput from "../components/DateInput";
import {
	setState,
	summarizeReviews,
	useRooms,
	useRoomReviews,
	useStore,
} from "../data/store";
import { useToast } from "../context/ToastContext";
import { isRoomFree, isValidRange, nightsBetween } from "../lib/bookings";
import { formatCurrency, formatDay, todayIso } from "../lib/format";
import { getOfferBySlug } from "../data/offers";
import useDocumentTitle from "../hooks/useDocumentTitle";

const inputClass =
	"w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none focus:border-primary";

const RoomDetails = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const rooms = useRooms();
	const rawBookings = useStore("bookings");
	const reviews = useRoomReviews(id);
	const { average, count } = summarizeReviews(reviews);
	const { user } = useUser();
	const { openSignIn } = useClerk();
	const toast = useToast();

	const room = rooms.find((item) => item._id === id);
	const [searchParams] = useSearchParams();
	const offerCode = searchParams.get("offer") || "";
	const activeOffer = getOfferBySlug(offerCode);

	const [mainImage, setMainImage] = useState(null);
	const [stay, setStay] = useState({ checkIn: "", checkOut: "", guests: "1" });
	const [error, setError] = useState("");
	const [review, setReview] = useState({ rating: 5, comment: "" });

	useDocumentTitle(room ? `${room.hotel.name} · ${room.roomType}` : "Room not found");

	if (!room) {
		return (
			<div className="flex flex-col items-center justify-center text-center px-6 py-40 min-h-[70vh]">
				<h1 className="font-playfair text-3xl text-gray-800">Room not found</h1>
				<p className="text-gray-500 mt-3">This room may have been removed.</p>
				<Link
					to="/rooms"
					className="mt-6 px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dull"
				>
					Browse hotels
				</Link>
			</div>
		);
	}

	const activeImage = mainImage ?? room.images[0];
	const validRange = isValidRange(stay.checkIn, stay.checkOut);
	const nights = validRange ? nightsBetween(stay.checkIn, stay.checkOut) : 0;
	const lat = room.hotel.lat ?? 40.7128;
	const lng = room.hotel.lng ?? -74.006;
	const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.012},${lng + 0.02},${lat + 0.012}&layer=mapnik&marker=${lat},${lng}`;

	const validateStay = () => {
		if (!validRange) return "Choose a check-out date after your check-in date.";
		if (stay.checkIn < todayIso()) return "Check-in can't be in the past.";
		const guests = Number(stay.guests);
		if (!guests || guests < 1 || guests > room.maxGuests) {
			return `This room sleeps up to ${room.maxGuests} guest${room.maxGuests === 1 ? "" : "s"}.`;
		}
		if (!isRoomFree(room._id, stay.checkIn, stay.checkOut, rawBookings)) {
			return "This room is already booked for those dates. Try different dates.";
		}
		return "";
	};

	const handleCheck = (event) => {
		event.preventDefault();
		const message = validateStay();
		setError(message);
		if (message) return;

		const params = new URLSearchParams({
			checkIn: stay.checkIn,
			checkOut: stay.checkOut,
			guests: stay.guests,
		});
		if (offerCode) params.set("offer", offerCode);
		navigate(`/book/${room._id}?${params.toString()}`);
	};

	const submitReview = (event) => {
		event.preventDefault();
		if (review.comment.trim().length < 10) {
			toast.show("Please write at least 10 characters.", "error");
			return;
		}
		setState("reviews", (list) => [
			{
				id: `review-${Date.now()}`,
				roomId: room._id,
				name: user.fullName || user.username || "Guest",
				rating: Number(review.rating),
				comment: review.comment.trim(),
				date: todayIso(),
			},
			...list,
		]);
		setReview({ rating: 5, comment: "" });
		toast.show("Thanks! Your review has been posted.");
	};

	const structuredData = {
		"@context": "https://schema.org",
		"@type": "LodgingReservation",
		reservationFor: {
			"@type": "LodgingBusiness",
			name: room.hotel.name,
			address: {
				"@type": "PostalAddress",
				streetAddress: room.hotel.address,
				addressLocality: room.hotel.city,
			},
		},
		price: room.pricePerNight,
		priceCurrency: "USD",
	};

	return (
		<div className="py-28 md:py-35 px-4 md:px-16 lg:px-24 xl:px-32">
			<script type="application/ld+json">
				{JSON.stringify(structuredData)}
			</script>
			{/* Room Details */}
			<div className="flex flex-col md:flex-row items-start md:items-center gap-2">
				<h1 className="text-3xl md:text-4xl font-playfair">
					{room.hotel.name}
					<span className="text-sm font-sans ml-2">({room.roomType})</span>
				</h1>
				{activeOffer ? (
					<p className="text-xs py-1.5 px-3 text-white bg-orange-700 rounded-full">
						{activeOffer.priceOff}% Off
					</p>
				) : null}
			</div>

			{/* Room Rating */}
			<div className="flex items-center gap-1 mt-2">
				<StarRating rating={Math.round(average)} />
				<p className="ml-2">
					{average.toFixed(1)} · {count} reviews
				</p>
			</div>

			{/* Room Address */}
			<div className="flex items-center gap-1 text-gray-500 mt-2">
				<img src={assets.locationIcon} alt="location-icon" />
				<span>{room.hotel.address}</span>
			</div>

			{/* Room Images */}
			<div className="flex flex-col lg:flex-row mt-6 gap-6">
				<div className="relative lg:w-1/2 w-full">
					<img
						src={activeImage}
						alt={`${room.hotel.name} ${room.roomType}`}
						className="w-full rounded-2xl shadow-lg object-cover"
					/>
					<SaveButton roomId={room._id} className="absolute top-4 right-4" />
				</div>
				<div className="grid grid-cols-2 gap-4 lg:w-1/2 w-full">
					{room.images.map((image, index) => (
						<button
							type="button"
							key={index}
							onClick={() => setMainImage(image)}
							aria-label={`Show photo ${index + 1}`}
							className="cursor-pointer"
						>
							<img
								src={image}
								alt=""
								className={`w-full rounded-xl shadow-md object-cover ${
									activeImage === image ? "outline-3 outline-primary" : ""
								}`}
							/>
						</button>
					))}
				</div>
			</div>

			{/* Room highlights */}
			<div className="flex flex-col md:flex-row md:justify-between mt-10">
				<div className="flex flex-col">
					<h2 className="text-3xl md:text-4xl font-playfair">
						Experience Luxury Like Never Before
					</h2>
					<p className="text-sm text-gray-500 mt-2">
						Up to {room.maxGuests} guest{room.maxGuests === 1 ? "" : "s"}
					</p>
					<div className="flex flex-wrap items-center mt-3 mb-6 gap-4">
						{room.amenities.map((item) => (
							<div
								key={item}
								className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100"
							>
								<img src={facilityIcons[item]} alt={item} className="w-5 h-5 amenity-icon" />
								<p className="text-xs">{item}</p>
							</div>
						))}
					</div>
				</div>

				{/* room price */}
				<p className="text-2xl font-medium">${room.pricePerNight}/night</p>
			</div>

			{/* checkin, checkout form */}
			<form
				onSubmit={handleCheck}
				className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white shadow-[0px_0px_20px_rgba(0,0,0,0.15)] p-6 rounded-2xl mx-auto mt-16 max-w-6xl"
			>
				<div className="flex flex-col flex-wrap md:flex-row items-start md:items-center gap-4 md:gap-10 text-gray-500">
					<div className="flex flex-col">
						<label htmlFor="checkInDate" className="font-medium">
							Check-in
						</label>
						<DateInput
							id="checkInDate"
							label="Check-in"
							value={stay.checkIn}
							min={todayIso()}
							onChange={(e) => setStay({ ...stay, checkIn: e.target.value })}
							className="mt-1.5 md:w-56"
							inputClassName="border-gray-300"
							required
						/>
					</div>
					<div className="w-px h-15 bg-gray-300/70 max-md:hidden"></div>

					<div className="flex flex-col">
						<label htmlFor="checkOutDate" className="font-medium">
							Check-out
						</label>
						<DateInput
							id="checkOutDate"
							label="Check-out"
							value={stay.checkOut}
							min={stay.checkIn || todayIso()}
							onChange={(e) => setStay({ ...stay, checkOut: e.target.value })}
							className="mt-1.5 md:w-56"
							inputClassName="border-gray-300"
							required
						/>
					</div>

					<div className="w-px h-15 bg-gray-300/70 max-md:hidden"></div>
					<div className="flex flex-col">
						<label htmlFor="guests" className="font-medium">
							Guests
						</label>
						<input
							type="number"
							id="guests"
							min={1}
							max={room.maxGuests}
							value={stay.guests}
							onChange={(e) => setStay({ ...stay, guests: e.target.value })}
							className="max-w-24 rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none"
							required
						/>
					</div>
					{validRange && (
						<p className="text-sm text-gray-600 md:self-end md:pb-2">
							{nights} night{nights === 1 ? "" : "s"} ·{" "}
							<span className="font-medium text-gray-800">
								{formatCurrency(nights * room.pricePerNight)}
							</span>
						</p>
					)}
				</div>
				<button
					type="submit"
					className="bg-primary hover:bg-primary-dull active:scale-95 transition-all text-white rounded-xl max-md:w-full max-md:mt-6 md:px-16 py-3 md:py-4 text-base cursor-pointer"
				>
					Check Availability
				</button>
			</form>
			{error && (
				<p role="alert" className="max-w-6xl mx-auto mt-4 text-sm text-red-600">
					{error}
				</p>
			)}

			{/* common specs */}
			<div className="mt-20 space-y-4">
				{roomCommonData.map((spec) => (
					<div key={spec.title} className="flex items-start gap-2">
						<img src={spec.icon} alt="" className="w-6.5 dark:invert" />
						<div>
							<p className="text-base">{spec.title}</p>
							<p className="text-gray-500">{spec.description}</p>
						</div>
					</div>
				))}
			</div>

			<div className="max-w-3xl border-y border-gray-300 my-15 py-10 text-gray-500 leading-relaxed">
				<p>
					Enjoy a {room.roomType.toLowerCase()} at {room.hotel.name} on{" "}
					{room.hotel.address}. The room sleeps up to {room.maxGuests}{" "}
					guest{room.maxGuests === 1 ? "" : "s"}. Prices shown are per
					night and include the amenities listed above. Choose your dates
					to see the total before you confirm.
				</p>
			</div>

			{/* location */}
			<section className="max-w-3xl">
				<h2 className="text-2xl font-playfair text-gray-800">Location</h2>
				<p className="text-gray-500 mt-1 text-sm">{room.hotel.address}, {room.hotel.city}</p>
				<iframe
					title={`Map of ${room.hotel.name}`}
					src={mapUrl}
					loading="lazy"
					className="w-full h-72 mt-4 rounded-2xl border border-gray-200"
				/>
			</section>

			{/* reviews */}
			<section className="max-w-3xl mt-16">
				<h2 className="text-2xl font-playfair text-gray-800">
					Guest reviews
				</h2>
				<div className="flex flex-col gap-4 mt-6">
					{reviews.map((item) => (
						<div key={item.id} className="border border-gray-200 rounded-xl p-5 bg-white">
							<div className="flex items-center justify-between gap-4">
								<p className="font-medium text-gray-800">{item.name}</p>
								<p className="text-xs text-gray-500">{formatDay(item.date)}</p>
							</div>
							<div className="flex items-center mt-1">
								<StarRating rating={item.rating} />
							</div>
							<p className="text-gray-600 mt-3 text-sm leading-relaxed">{item.comment}</p>
						</div>
					))}
				</div>

				{user ? (
					<form onSubmit={submitReview} className="mt-8 flex flex-col gap-4 border border-gray-200 rounded-xl p-5">
						<p className="font-medium text-gray-800">Share your stay</p>
						<div>
							<label htmlFor="review-rating" className="text-sm text-gray-600">
								Rating
							</label>
							<select
								id="review-rating"
								value={review.rating}
								onChange={(e) => setReview({ ...review, rating: e.target.value })}
								className={`${inputClass} max-w-40`}
							>
								{[5, 4, 3, 2, 1].map((value) => (
									<option key={value} value={value}>
										{value} star{value === 1 ? "" : "s"}
									</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="review-comment" className="text-sm text-gray-600">
								Your review
							</label>
							<textarea
								id="review-comment"
								rows={4}
								value={review.comment}
								onChange={(e) => setReview({ ...review, comment: e.target.value })}
								className={`${inputClass} resize-y`}
								placeholder="What did you enjoy most?"
							/>
						</div>
						<button
							type="submit"
							className="self-start px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dull cursor-pointer"
						>
							Post review
						</button>
					</form>
				) : (
					<button
						onClick={() => openSignIn()}
						className="mt-8 px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
					>
						Sign in to write a review
					</button>
				)}
			</section>

			{/* hosted by */}
			<div className="flex flex-col items-start gap-4 mt-16">
				<div className="flex gap-4">
					<img
						src={room.hotel.owner.image}
						alt="Host"
						className="h-14 w-14 md:h-18 md:w-18 rounded-full"
					/>
					<div>
						<p className="text-lg md:text-xl">Hosted by {room.hotel.name}</p>
						<div className="flex items-center mt-1">
							<StarRating rating={Math.round(average)} />
							<p className="ml-2 text-sm">{count} reviews</p>
						</div>
					</div>
				</div>
				<button
					onClick={() => navigate("/contact")}
					className="px-6 py-2.5 mt-4 rounded-lg text-white bg-primary hover:bg-primary-dull transition-all cursor-pointer"
				>
					Contact Now
				</button>
			</div>
		</div>
	);
};

export default RoomDetails;
