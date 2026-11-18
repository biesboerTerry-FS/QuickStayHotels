import React from "react";
import { Link } from "react-router-dom";
import Title from "./Title";
import { assets } from "../assets/assets";
import { useOffers } from "../data/store";

const ExclusiveOffers = () => {
	const offers = useOffers();
	const featuredOffers = offers.slice(0, 3);

	return (
		<div className="flex flex-col items-center px-6 md:px-16 lg:px-24 xl:px-32 pt-20 pb-30">
			<div className="flex flex-col md:flex-row items-center justify-between w-full">
				<Title
					as="h2"
					align="left"
					title="Exclusive Offers"
					subTitle="Take advantage of our limited-time offers and special packages to enhance your stay and create unforgettable memories."
				/>
				<Link
					to="/offers"
					className="group flex items-center gap-2 font-medium cursor-pointer max-md:mt-12"
				>
					View All Offers
					<img
						src={assets.arrowIcon}
						alt=""
						className="group-hover:translate-x-1 transition-all dark:invert"
					/>
				</Link>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
				{featuredOffers.map((item) => (
					<div
						key={item._id}
						className="group relative flex flex-col items-start justify-between gap-1 min-h-[360px] pt-12 md:pt-18 px-4 rounded-2xl text-white bg-no-repeat bg-cover bg-center overflow-hidden"
						style={{ backgroundImage: `url(${item.image})` }}
					>
						<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
						<p className="px-3 py-1 absolute top-4 left-4 text-xs bg-white text-gray-800 font-medium rounded-full z-10">
							{item.priceOff}% Off
						</p>
						<div className="relative z-10 mt-auto">
							<p className="text-2xl font-medium font-playfair">
								{item.title}
							</p>
							<p className="text-sm text-white/90">
								{item.shortDescription}
							</p>
							<p className="text-xs text-white/70 mt-3">
								Expires {item.displayExpiry}
							</p>
						</div>
						<Link
							to={`/offers/${item.slug}`}
							className="relative z-10 flex items-center gap-2 font-medium cursor-pointer mt-4 mb-5 group-hover:translate-x-1 transition-transform"
						>
							View Offer
							<img
								className="invert"
								src={assets.arrowIcon}
								alt=""
							/>
						</Link>
					</div>
				))}
			</div>
		</div>
	);
};

export default ExclusiveOffers;
