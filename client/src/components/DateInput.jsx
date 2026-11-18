import React, { useRef } from "react";
import { assets } from "../assets/assets";

const DateInput = ({
	id,
	label,
	value,
	min,
	onChange,
	className = "",
	inputClassName = "",
	required = false,
}) => {
	const inputRef = useRef(null);

	const openPicker = () => {
		inputRef.current?.showPicker?.();
	};

	return (
		<div className={`relative flex items-center ${className}`}>
			<input
				ref={inputRef}
				id={id}
				type="date"
				value={value}
				min={min}
				onChange={onChange}
				required={required}
				className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all ${
					inputClassName || "border-white/60 bg-white/80"
				}`}
			/>
			<button
				type="button"
				onClick={openPicker}
				className="absolute right-3 p-1 hover:bg-black/5 rounded transition-colors cursor-pointer"
				aria-label={`Open date picker for ${label}`}
			>
				<img src={assets.calenderIcon} alt="" className="h-4 w-4" />
			</button>
		</div>
	);
};

export default DateInput;
