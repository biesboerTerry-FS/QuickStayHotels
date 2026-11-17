import Room from "../models/Room.js";

const seedRooms = [
	{
		hotel: {
			name: "Urbanza Suites",
			address: "Main Road 123 Street, 23 Colony",
			city: "New York",
			contact: "+0123456789",
			lat: 40.7128,
			lng: -74.006,
		},
		roomType: "Double Bed",
		pricePerNight: 399,
		maxGuests: 2,
		amenities: ["Room Service", "Mountain View", "Pool Access"],
		images: ["https://placehold.co/600x400?text=Urbanza+Suite"],
		isAvailable: true,
	},
	{
		hotel: {
			name: "Thames Crown Hotel",
			address: "12 Riverside Walk, Southbank",
			city: "London",
			contact: "+44 20 7946 0100",
			lat: 51.5072,
			lng: -0.1276,
		},
		roomType: "Family Suite",
		pricePerNight: 459,
		maxGuests: 4,
		amenities: ["Free WiFi", "Pool Access", "Room Service"],
		images: ["https://placehold.co/600x400?text=Thames+Family"],
		isAvailable: true,
	},
	{
		hotel: {
			name: "Dubai Marina Lodge",
			address: "45 Marina Boulevard, Dubai Marina",
			city: "Dubai",
			contact: "+971 4 555 0100",
			lat: 25.2048,
			lng: 55.2708,
		},
		roomType: "Luxury Room",
		pricePerNight: 699,
		maxGuests: 2,
		amenities: ["Mountain View", "Pool Access", "Free WiFi"],
		images: ["https://placehold.co/600x400?text=Dubai+Luxury"],
		isAvailable: true,
	},
];

export const seedDatabase = async () => {
	const count = await Room.countDocuments();
	if (count > 0) {
		console.log("Database already seeded.");
		return { seeded: false, count };
	}
	await Room.insertMany(seedRooms);
	console.log("Database seeded with sample rooms.");
	return { seeded: true, count: seedRooms.length };
};
