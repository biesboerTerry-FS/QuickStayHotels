import React from "react";
import { Link } from "react-router-dom";
import Title from "../components/Title";
import { useOffers } from "../data/store";
import { assets } from "../assets/assets";

const Offers = () => {
	const offers = useOffers();

	return (
		<div className="px-6 md:px-16 lg:px-24 xl:px-32 pt-28 pb-20">
			<Title
				title="Special Offers"
				subTitle="Hand-picked deals and packages to make your next stay even more memorable."
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
				{offers.map((offer) => (
					<div
						key={offer._id}
						className="group relative flex flex-col items-start justify-between gap-4 min-h-[360px] pt-12 md:pt-18 px-5 rounded-2xl text-white bg-no-repeat bg-cover bg-center overflow-hidden"
						style={{ backgroundImage: `url(${offer.image})` }}
					>
						<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
						<p className="px-3 py-1 absolute top-4 left-4 text-xs bg-white text-gray-800 font-medium rounded-full z-10">
							{offer.priceOff}% Off
						</p>
						<div className="relative z-10 mt-auto">
							<p className="text-2xl font-medium font-playfair">
								{offer.title}
							</p>
							<p className="text-sm text-white/90 mt-1">
								{offer.shortDescription}
							</p>
							<p className="text-xs text-white/70 mt-3">
								Expires {offer.displayExpiry}
							</p>
						</div>
						<Link
							to={`/offers/${offer.slug}`}
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

export default Offers;
