import React from "react";

const Title = ({ title, subTitle, align, font, as: Tag = "h1", inverse = false }) => {
	return (
		<div
			className={`flex flex-col justify-center items-center text-center ${
				align === "left" && "md:items-start md:text-left"
			}`}
		>
			{React.createElement(
				Tag,
				{
					className: `text-4xl md:text-[40px] ${font === "playfair" ? "font-playfair" : ""}`,
				},
				title
			)}
			<p className={`text-sm md:text-base mt-2 max-w-174 ${inverse ? "text-gray-300" : "text-gray-600"}`}>
				{subTitle}
			</p>
		</div>
	);
};

export default Title;
