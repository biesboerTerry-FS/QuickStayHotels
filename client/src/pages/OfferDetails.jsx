import React from "react";
import { Link, useParams } from "react-router-dom";
import { getOfferBySlug } from "../data/offers";
import { applyOffer } from "../lib/bookings";
import { formatCurrency } from "../lib/format";
import { assets } from "../assets/assets";
import NotFound from "./NotFound";

const OfferDetails = () => {
	const { slug } = useParams();
	const offer = getOfferBySlug(slug);

	if (!offer) {
		return <NotFound />;
	}

	const sampleTotal = 1200;
	const { discount, total } = applyOffer(sampleTotal, offer);

	return (
		<div className="px-6 md:px-16 lg:px-24 xl:px-32 pt-28 pb-20">
			<Link
				to="/offers"
				className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors mb-6"
			>
				<img src={assets.arrowIcon} alt="" className="w-3 rotate-180 dark:invert" />
				Back to offers
			</Link>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
				<div
					className="rounded-2xl bg-cover bg-center min-h-[320px] md:min-h-[420px]"
					style={{ backgroundImage: `url(${offer.image})` }}
				/>
				<div className="flex flex-col gap-6">
					<div>
						<span className="inline-block px-3 py-1 text-xs bg-primary text-white font-medium rounded-full">
							{offer.priceOff}% Off
						</span>
						<h1 className="text-3xl md:text-4xl font-playfair font-bold mt-4">
							{offer.title}
						</h1>
						<p className="text-gray-600 mt-3">{offer.description}</p>
						<p className="text-sm text-gray-500 mt-2">
							Offer expires {offer.displayExpiry}
						</p>
					</div>

					<div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
						<h2 className="text-lg font-semibold text-gray-800 mb-2">Savings preview</h2>
						<p className="text-sm text-gray-600">
							On a {formatCurrency(sampleTotal)} booking you save{" "}
							<span className="font-bold text-green-600">{formatCurrency(discount)}</span>{" "}
							and pay only{" "}
							<span className="font-bold text-gray-800">{formatCurrency(total)}</span>.
						</p>
					</div>

					<div className="bg-gray-50 rounded-xl p-6">
						<h2 className="text-lg font-semibold mb-3">Terms & Conditions</h2>
						<ul className="list-disc list-inside flex flex-col gap-2 text-sm text-gray-600">
							{offer.terms.map((term, index) => (
								<li key={index}>{term}</li>
							))}
						</ul>
					</div>

					<Link
						to={`/rooms?offer=${offer.slug}`}
						className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dull text-white font-medium rounded-xl px-6 py-3 transition-colors w-fit"
					>
						Book with this offer
						<img src={assets.arrowIcon} alt="" className="w-3.5 invert" />
					</Link>
				</div>
			</div>
		</div>
	);
};

export default OfferDetails;
