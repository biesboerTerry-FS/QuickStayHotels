import exclusiveOfferCardImg1 from "../assets/exclusiveOfferCardImg1.png";
import exclusiveOfferCardImg2 from "../assets/exclusiveOfferCardImg2.png";
import exclusiveOfferCardImg3 from "../assets/exclusiveOfferCardImg3.png";
import roomImg1 from "../assets/roomImg1.png";
import roomImg2 from "../assets/roomImg2.png";
import roomImg3 from "../assets/roomImg3.png";

export const offers = [
	{
		_id: "offer_summer_escape",
		slug: "summer-escape-package",
		title: "Summer Escape Package",
		description: "Enjoy a complimentary night and daily breakfast when you book a minimum three-night stay at participating resorts.",
		shortDescription: "Enjoy a complimentary night and daily breakfast",
		priceOff: 25,
		expiryDate: "2026-08-31",
		displayExpiry: "Aug 31",
		image: exclusiveOfferCardImg1,
		terms: [
			"Minimum 3-night stay required",
			"Complimentary night applied to the lowest-rated night",
			"Daily breakfast for two guests",
			"Subject to availability",
		],
	},
	{
		_id: "offer_romantic_getaway",
		slug: "romantic-getaway",
		title: "Romantic Getaway",
		description: "Treat someone special to a couples package including a welcome bottle of wine, late checkout, and a 60-minute spa treatment.",
		shortDescription: "Special couples package including spa treatment",
		priceOff: 20,
		expiryDate: "2026-09-20",
		displayExpiry: "Sep 20",
		image: exclusiveOfferCardImg2,
		terms: [
			"Valid for two guests per room",
			"Spa treatment must be booked 24 hours in advance",
			"Late checkout subject to availability",
		],
	},
	{
		_id: "offer_luxury_retreat",
		slug: "luxury-retreat",
		title: "Luxury Retreat",
		description: "Book 60 days in advance and save on your stay at any of our luxury properties worldwide. Best rates guaranteed.",
		shortDescription: "Book 60 days in advance and save on luxury stays",
		priceOff: 30,
		expiryDate: "2026-09-25",
		displayExpiry: "Sep 25",
		image: exclusiveOfferCardImg3,
		terms: [
			"Booking must be made at least 60 days before arrival",
			"Non-refundable rate",
			"Valid at participating luxury properties",
		],
	},
	{
		_id: "offer_family_fun",
		slug: "family-fun-package",
		title: "Family Fun Package",
		description: "Kids stay and eat free at select family suites. Includes pool access, game credits, and a daily snack platter.",
		shortDescription: "Kids stay and eat free at select family suites",
		priceOff: 15,
		expiryDate: "2026-10-15",
		displayExpiry: "Oct 15",
		image: roomImg1,
		terms: [
			"Valid for families with children under 12",
			"Kids' meals from kids' menu only",
			"Pool access during scheduled hours",
		],
	},
	{
		_id: "offer_workation",
		slug: "workation-special",
		title: "Workation Special",
		description: "Combine business and leisure with high-speed WiFi, a dedicated workspace, and 20% off stays of 7 nights or more.",
		shortDescription: "High-speed WiFi and 20% off extended stays",
		priceOff: 20,
		expiryDate: "2026-11-30",
		displayExpiry: "Nov 30",
		image: roomImg2,
		terms: [
			"Minimum 7-night stay required",
			"Workspace setup subject to room type",
			"Discount applied to nightly rate",
		],
	},
	{
		_id: "offer_weekend_break",
		slug: "weekend-break",
		title: "Weekend Break",
		description: "Escape the city with 15% off Friday and Saturday stays. Includes a late checkout so you can sleep in.",
		shortDescription: "15% off weekend stays with late checkout",
		priceOff: 15,
		expiryDate: "2026-12-31",
		displayExpiry: "Dec 31",
		image: roomImg3,
		terms: [
			"Valid for Friday and Saturday nights",
			"Late checkout until 2 PM",
			"Blackout dates may apply",
		],
	},
];

export const getOfferBySlug = (slug) => offers.find((offer) => offer.slug === slug);
