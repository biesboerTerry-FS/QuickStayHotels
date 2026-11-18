import React from "react";
import { toggleSavedRoom, useSavedRoomIds } from "../data/store";
import { useToast } from "../context/ToastContext";

const SaveButton = ({ roomId, className = "" }) => {
	const saved = useSavedRoomIds();
	const toast = useToast();
	const isSaved = saved.includes(roomId);

	const handleClick = (event) => {
		event.preventDefault();
		event.stopPropagation();
		toggleSavedRoom(roomId);
		toast.show(isSaved ? "Removed from saved rooms" : "Saved to your rooms", "info");
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-pressed={isSaved}
			aria-label={isSaved ? "Remove from saved rooms" : "Save room"}
			title={isSaved ? "Remove from saved" : "Save room"}
			className={`flex items-center justify-center h-9 w-9 rounded-full bg-white/90 shadow-md backdrop-blur hover:scale-110 transition-all cursor-pointer ${className}`}
		>
			<svg
				aria-hidden="true"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				className={isSaved ? "text-rose-600" : "text-gray-600 dark:text-gray-300"}
				fill={isSaved ? "currentColor" : "none"}
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
			>
				<path d="M12 21s-7-4.35-9.5-8.5C.8 9.6 2.2 5.5 6 5.5c2.2 0 3.5 1.3 4.5 2.7C11.5 6.8 12.8 5.5 15 5.5c3.8 0 5.2 4.1 3.5 7C19 17.15 12 21 12 21z" />
			</svg>
		</button>
	);
};

export default SaveButton;
