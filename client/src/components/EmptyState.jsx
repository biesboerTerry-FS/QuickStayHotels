import React from "react";
import { Link } from "react-router-dom";

const EmptyState = ({
	title,
	description,
	actionLabel,
	actionTo,
	onAction,
	icon,
}) => {
	return (
		<div className="mt-10 max-w-xl rounded-2xl border border-dashed border-gray-300 bg-white/50 p-8 text-center">
			{icon && <div className="mb-4 flex justify-center">{icon}</div>}
			<p className="text-lg font-medium text-gray-800">{title}</p>
			<p className="text-sm text-gray-500 mt-2">{description}</p>
			{actionLabel && (actionTo || onAction) && (
				<Link
					to={actionTo || "#"}
					onClick={onAction}
					className="inline-block mt-5 px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dull transition-colors"
				>
					{actionLabel}
				</Link>
			)}
		</div>
	);
};

export default EmptyState;
