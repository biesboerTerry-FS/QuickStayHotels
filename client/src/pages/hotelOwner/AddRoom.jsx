import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../../components/Title";
import ImageUpload from "../../components/ImageUpload";
import { setState } from "../../data/store";
import { useToast } from "../../context/ToastContext";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { makeId } from "../../lib/bookings";

const roomTypes = ["Single Bed", "Double Bed", "Family Suite", "Luxury Room"];
const amenityOptions = [
	"Free WiFi",
	"Free Breakfast",
	"Room Service",
	"Mountain View",
	"Pool Access",
];

const emptyForm = {
	roomType: "",
	pricePerNight: "",
	maxGuests: "2",
	amenities: [],
	images: [],
};

const AddRoom = () => {
	useDocumentTitle("Add Room");
	const navigate = useNavigate();
	const toast = useToast();
	const [form, setForm] = useState(emptyForm);
	const [errors, setErrors] = useState({});

	const toggleAmenity = (amenity) =>
		setForm((prev) => ({
			...prev,
			amenities: prev.amenities.includes(amenity)
				? prev.amenities.filter((item) => item !== amenity)
				: [...prev.amenities, amenity],
		}));

	const validate = () => {
		const next = {};
		if (!form.roomType) next.roomType = "Choose a room type.";
		const price = Number(form.pricePerNight);
		if (!price || price < 1 || price > 10000) {
			next.pricePerNight = "Enter a price between $1 and $10,000.";
		}
		const guests = Number(form.maxGuests);
		if (!guests || guests < 1 || guests > 8) {
			next.maxGuests = "Guests must be between 1 and 8.";
		}
		return next;
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		const nextErrors = validate();
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		const now = new Date().toISOString();
		const room = {
			_id: makeId(),
			roomType: form.roomType,
			pricePerNight: Number(form.pricePerNight),
			maxGuests: Number(form.maxGuests),
			amenities: form.amenities,
			images: form.images.length
				? form.images
				: ["https://placehold.co/600x400?text=QuickStay+Room"],
			isAvailable: true,
			createdAt: now,
			updatedAt: now,
			__v: 0,
		};
		setState("addedRooms", (list) => [room, ...list]);
		toast.show(`${room.roomType} added to your listings`);
		navigate("/owner/list-rooms");
	};

	return (
		<form onSubmit={handleSubmit} noValidate className="max-w-3xl">
			<Title
				align="left"
				title="Add Room"
				subTitle="Provide accurate room information, pricing, and amenities to maintain quality and consistency across the platform."
			/>

			<div className="bg-white border border-gray-200 rounded-2xl p-6 mt-8 flex flex-col gap-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
					<div>
						<label htmlFor="roomType" className="text-sm font-medium text-gray-800">
							Room type
						</label>
						<select
							id="roomType"
							value={form.roomType}
							onChange={(e) => setForm({ ...form, roomType: e.target.value })}
							className="w-full border border-gray-300 rounded-lg p-2.5 mt-1.5 text-sm outline-none focus:border-primary"
						>
							<option value="">Select room type</option>
							{roomTypes.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
						{errors.roomType && <p className="text-xs text-red-600 mt-1">{errors.roomType}</p>}
					</div>
					<div>
						<label htmlFor="price" className="text-sm font-medium text-gray-800">
							Price per night (USD)
						</label>
						<input
							id="price"
							type="number"
							min={1}
							placeholder="0"
							value={form.pricePerNight}
							onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
							className="w-full border border-gray-300 rounded-lg p-2.5 mt-1.5 text-sm outline-none focus:border-primary"
						/>
						{errors.pricePerNight && <p className="text-xs text-red-600 mt-1">{errors.pricePerNight}</p>}
					</div>
					<div>
						<label htmlFor="maxGuests" className="text-sm font-medium text-gray-800">
							Max guests
						</label>
						<input
							id="maxGuests"
							type="number"
							min={1}
							max={8}
							value={form.maxGuests}
							onChange={(e) => setForm({ ...form, maxGuests: e.target.value })}
							className="w-full border border-gray-300 rounded-lg p-2.5 mt-1.5 text-sm outline-none focus:border-primary"
						/>
						{errors.maxGuests && <p className="text-xs text-red-600 mt-1">{errors.maxGuests}</p>}
					</div>
				</div>

				<fieldset>
					<legend className="text-sm font-medium text-gray-800">Amenities</legend>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
						{amenityOptions.map((amenity) => (
							<label key={amenity} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
								<input
									type="checkbox"
									checked={form.amenities.includes(amenity)}
									onChange={() => toggleAmenity(amenity)}
								/>
								{amenity}
							</label>
						))}
					</div>
				</fieldset>

				<div>
					<label className="text-sm font-medium text-gray-800">Photos</label>
					<div className="mt-3">
						<ImageUpload
							value={form.images}
							maxFiles={8}
							onUpload={(url) =>
								setForm((prev) => ({ ...prev, images: [...prev.images, url] }))
							}
							onRemove={(_, index) =>
								setForm((prev) => ({
									...prev,
									images: prev.images.filter((_, i) => i !== index),
								}))
							}
						/>
					</div>
					<p className="text-xs text-gray-500 mt-2">Attach up to 8 photos. Use the × on a photo to remove it.</p>
				</div>
			</div>

			<div className="flex items-center gap-3 mt-8">
				<button
					type="submit"
					className="px-8 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dull transition-all cursor-pointer"
				>
					Add Room
				</button>
				<button
					type="button"
					onClick={() => setForm(emptyForm)}
					className="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
				>
					Reset
				</button>
			</div>
			<p className="text-xs text-gray-500 mt-4">
				Rooms are saved on this device for now. Photo uploads require Cloudinary credentials on the server.
			</p>
		</form>
	);
};

export default AddRoom;
