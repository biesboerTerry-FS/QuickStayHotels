import React, { useState } from "react";
import { setState, useOffers } from "../../data/store";
import { useToast } from "../../context/ToastContext";

const emptyOffer = {
	title: "",
	description: "",
	shortDescription: "",
	priceOff: "",
	expiryDate: "",
	displayExpiry: "",
	terms: [""],
};

const today = () => new Date().toISOString().split("T")[0];

const Offers = () => {
	const offers = useOffers();
	const toast = useToast();
	const [form, setForm] = useState(emptyOffer);
	const [editingId, setEditingId] = useState(null);
	const [showForm, setShowForm] = useState(false);

	const reset = () => {
		setForm(emptyOffer);
		setEditingId(null);
		setShowForm(false);
	};

	const save = (event) => {
		event.preventDefault();
		const priceOff = Number(form.priceOff);
		if (!form.title || !form.description || !priceOff || priceOff < 1 || priceOff > 100) {
			toast.show("Enter a valid title, description, and discount between 1-100.", "error");
			return;
		}

		const payload = {
			...form,
			priceOff,
			terms: form.terms.filter((term) => term.trim() !== ""),
			displayExpiry: form.displayExpiry || form.expiryDate,
		};

		if (editingId) {
			setState("offers", (list) =>
				list.map((item) =>
					item._id === editingId ? { ...item, ...payload } : item
				)
			);
			toast.show("Offer updated");
		} else {
			const slug = form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
			const newOffer = {
				...payload,
				_id: `offer_${Date.now()}`,
				slug: `${slug}-${Date.now().toString(36)}`,
				image: "/roomImg1.png",
			};
			setState("offers", (list) => [newOffer, ...list]);
			toast.show("Offer created");
		}
		reset();
	};

	const edit = (offer) => {
		setForm({
			title: offer.title,
			description: offer.description,
			shortDescription: offer.shortDescription,
			priceOff: String(offer.priceOff),
			expiryDate: offer.expiryDate,
			displayExpiry: offer.displayExpiry,
			terms: offer.terms.length ? offer.terms : [""],
		});
		setEditingId(offer._id);
		setShowForm(true);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const remove = (id) => {
		if (!window.confirm("Delete this offer?")) return;
		setState("offers", (list) => list.filter((item) => item._id !== id));
		toast.show("Offer deleted", "info");
	};

	const updateTerm = (index, value) => {
		const next = [...form.terms];
		next[index] = value;
		if (index === next.length - 1 && value.trim() !== "") next.push("");
		setForm({ ...form, terms: next });
	};

	return (
		<div className="max-w-5xl">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-playfair font-bold">Offers & Promotions</h1>
				<button
					onClick={() => setShowForm((value) => !value)}
					className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dull cursor-pointer"
				>
					{showForm ? "Close" : "Add Offer"}
				</button>
			</div>

			{showForm && (
				<form
					onSubmit={save}
					className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-5"
				>
					<div className="md:col-span-2">
						<label className="text-sm font-medium text-gray-700">Title</label>
						<input
							type="text"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							className="w-full rounded border border-gray-300 px-3 py-2 mt-1 outline-none focus:border-primary"
							placeholder="e.g. Summer Escape Package"
						/>
					</div>
					<div className="md:col-span-2">
						<label className="text-sm font-medium text-gray-700">Description</label>
						<textarea
							value={form.description}
							onChange={(e) => setForm({ ...form, description: e.target.value })}
							rows={3}
							className="w-full rounded border border-gray-300 px-3 py-2 mt-1 outline-none focus:border-primary"
							placeholder="Full offer description"
						/>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">Short description</label>
						<input
							type="text"
							value={form.shortDescription}
							onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
							className="w-full rounded border border-gray-300 px-3 py-2 mt-1 outline-none focus:border-primary"
							placeholder="Shown on cards"
						/>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">Discount %</label>
						<input
							type="number"
							min={1}
							max={100}
							value={form.priceOff}
							onChange={(e) => setForm({ ...form, priceOff: e.target.value })}
							className="w-full rounded border border-gray-300 px-3 py-2 mt-1 outline-none focus:border-primary"
						/>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">Expiry date</label>
						<input
							type="date"
							min={today()}
							value={form.expiryDate}
							onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
							className="w-full rounded border border-gray-300 px-3 py-2 mt-1 outline-none focus:border-primary"
						/>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">Display expiry</label>
						<input
							type="text"
							value={form.displayExpiry}
							onChange={(e) => setForm({ ...form, displayExpiry: e.target.value })}
							className="w-full rounded border border-gray-300 px-3 py-2 mt-1 outline-none focus:border-primary"
							placeholder="e.g. Aug 31"
						/>
					</div>
					<div className="md:col-span-2">
						<label className="text-sm font-medium text-gray-700">Terms</label>
						{form.terms.map((term, index) => (
							<input
								key={index}
								type="text"
								value={term}
								onChange={(e) => updateTerm(index, e.target.value)}
								className="w-full rounded border border-gray-300 px-3 py-2 mt-2 outline-none focus:border-primary"
								placeholder={`Term ${index + 1}`}
							/>
						))}
					</div>
					<div className="md:col-span-2 flex gap-3">
						<button
							type="submit"
							className="px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-dull cursor-pointer"
						>
							{editingId ? "Update offer" : "Create offer"}
						</button>
						<button
							type="button"
							onClick={reset}
							className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
						>
							Cancel
						</button>
					</div>
				</form>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{offers.map((offer) => (
					<div
						key={offer._id}
						className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-2"
					>
						<div className="flex items-start justify-between">
							<h2 className="font-playfair text-xl font-bold">{offer.title}</h2>
							<span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">
								{offer.priceOff}% off
							</span>
						</div>
						<p className="text-sm text-gray-600">{offer.shortDescription}</p>
						<p className="text-xs text-gray-500">Expires {offer.displayExpiry}</p>
						<div className="flex gap-2 mt-3">
							<button
								onClick={() => edit(offer)}
								className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
							>
								Edit
							</button>
							<button
								onClick={() => remove(offer._id)}
								className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
							>
								Delete
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default Offers;
