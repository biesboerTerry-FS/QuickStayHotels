import React from "react";
import Title from "../components/Title";
import HotelCard from "../components/HotelCard";
import EmptyState from "../components/EmptyState";
import { useRooms, useStore } from "../data/store";
import useDocumentTitle from "../hooks/useDocumentTitle";

const SavedRooms = () => {
	useDocumentTitle("Saved rooms");
	const savedIds = useStore("saved");
	const rooms = useRooms();
	const saved = savedIds
		.map((id) => rooms.find((room) => room._id === id))
		.filter(Boolean);

	return (
		<div className="py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32">
			<Title
				title="Saved Rooms"
				subTitle="Rooms you've hearted are kept here so you can compare them and book when you're ready."
				align="left"
			/>

			{saved.length === 0 ? (
				<EmptyState
					title="Nothing saved yet"
					description="Tap the heart on any room to save it here for later."
					actionLabel="Browse hotels"
					actionTo="/rooms"
					icon={
						<svg
							className="w-12 h-12 text-gray-300"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
							/>
						</svg>
					}
				/>
			) : (
				<div className="flex flex-wrap gap-6 mt-10">
					{saved.map((room, index) => (
						<HotelCard key={room._id} room={room} index={index} />
					))}
				</div>
			)}
		</div>
	);
};

export default SavedRooms;
