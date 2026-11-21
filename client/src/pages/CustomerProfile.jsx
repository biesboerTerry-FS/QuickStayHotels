import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useClerk, useUser } from "@clerk/react";
import { useDemoUser } from "../context/DemoAuthContext";
import { useToast } from "../context/ToastContext";
import Title from "../components/Title";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
	createRemoteAddress,
	deleteRemoteAddress,
	loadRemoteProfile,
	maskDemoCard,
	newAddressId,
	patchRemoteAddress,
	profileKeyFor,
	saveRemoteProfile,
	useCustomerProfile,
} from "../lib/customerProfile";

const fieldClass =
	"w-full rounded-lg border border-gray-300 bg-white px-3 py-2 mt-1.5 text-sm text-gray-800 outline-none focus:border-primary";
const labelClass = "block text-sm font-medium text-gray-700";
const primaryButton =
	"px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dull transition-all cursor-pointer";
const secondaryButton =
	"px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer";
const smallButton =
	"px-3 py-1.5 rounded-full border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer";
const cardClass =
	"rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8";

const emptyAddress = {
	label: "Home",
	line1: "",
	line2: "",
	city: "",
	state: "",
	zip: "",
	country: "",
};

const emptyCard = { label: "", number: "", expiry: "" };

const UserIcon = () => (
	<svg className="h-5 w-5 text-primary" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
		<circle cx="12" cy="8" r="4" />
		<path strokeLinecap="round" d="M4 21a8 8 0 0 1 16 0" />
	</svg>
);

const PinIcon = () => (
	<svg className="h-5 w-5 text-primary" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
		<path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" />
		<circle cx="12" cy="10" r="2.5" />
	</svg>
);

const CardIcon = () => (
	<svg className="h-5 w-5 text-primary" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
		<rect x="2" y="5" width="20" height="14" rx="2" />
		<path strokeLinecap="round" d="M2 10h20" />
	</svg>
);

const Badge = ({ children }) => (
	<span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
		{children}
	</span>
);

const SectionHeader = ({ id, icon, title, description, children }) => (
	<div className="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div className="flex items-start gap-3">
			<span className="rounded-xl bg-primary/10 p-2">{icon}</span>
			<div>
				<h2 id={id} className="text-xl font-semibold text-gray-800">{title}</h2>
				<p className="mt-1 text-sm text-gray-600">{description}</p>
			</div>
		</div>
		{children}
	</div>
);

const ProfileSections = ({ user }) => {
	const { profile, update } = useCustomerProfile(user);
	const toast = useToast();

	const [editingInfo, setEditingInfo] = useState(false);
	const [infoForm, setInfoForm] = useState({
		fullName: profile.fullName,
		email: profile.email,
		phone: profile.phone,
	});

	const [addresses, setAddresses] = useState(profile.addresses);
	const [addressForm, setAddressForm] = useState(null);
	const [editingAddressId, setEditingAddressId] = useState(null);

	const [cards, setCards] = useState(profile.paymentMethods);
	const [cardForm, setCardForm] = useState(null);
	const profileTouched = useRef(false);
	const addressesTouched = useRef(false);

	// Hydrate from the protected backend; localStorage is only a fallback.
	// Never let a slow GET overwrite edits the customer already started.
	useEffect(() => {
		let live = true;
		loadRemoteProfile().then((remote) => {
			if (!live || !remote) return;
			if (remote.profile && !profileTouched.current) {
				const next = {
					fullName: remote.profile.fullName || profile.fullName,
					email: remote.profile.email || profile.email,
					phone: remote.persisted
						? remote.profile.phone || ""
						: profile.phone,
				};
				update((current) => ({ ...current, ...next }));
				setInfoForm(next);
			}
			if (Array.isArray(remote.addresses) && !addressesTouched.current) {
				setAddresses(remote.addresses);
			}
		});
		return () => {
			live = false;
		};
		// This runs once per signed-in identity; the component is keyed by user id.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const saveInfo = async (event) => {
		event.preventDefault();
		profileTouched.current = true;
		const next = {
			fullName: infoForm.fullName.trim(),
			email: infoForm.email.trim(),
			phone: infoForm.phone.trim(),
		};
		if (!next.fullName || !next.email) {
			toast.show("Name and email are required", "error");
			return;
		}
		update((current) => ({ ...current, ...next }));
		setEditingInfo(false);
		const saved = await saveRemoteProfile(next);
		toast.show(
			saved ? "Personal details saved" : "Personal details saved on this device"
		);
	};

	const persistAddresses = (next, message) => {
		setAddresses(next);
		update((current) => ({ ...current, addresses: next }));
		if (message) toast.show(message);
	};

	const openAddressForm = (address) => {
		addressesTouched.current = true;
		setEditingAddressId(address?.id || null);
		setAddressForm(address ? { ...address } : { ...emptyAddress });
	};

	const saveAddress = async (event) => {
		event.preventDefault();
		addressesTouched.current = true;
		const form = addressForm;
		if (!form.line1.trim() || !form.city.trim() || !form.country.trim()) {
			toast.show("Street, city and country are required", "error");
			return;
		}
		const entry = {
			...form,
			id: editingAddressId || newAddressId(),
			label: form.label.trim() || "Home",
			line1: form.line1.trim(),
			line2: form.line2.trim(),
			city: form.city.trim(),
			state: form.state.trim(),
			zip: form.zip.trim(),
			country: form.country.trim(),
			isDefault:
				form.isDefault ||
				(editingAddressId
					? addresses.find((a) => a.id === editingAddressId)?.isDefault
					: addresses.length === 0),
		};
		const saved = editingAddressId
			? await patchRemoteAddress(editingAddressId, entry)
			: await createRemoteAddress(entry);
		const finalEntry = saved?.id ? { ...entry, id: saved.id } : entry;
		const next = editingAddressId
			? addresses.map((item) =>
					item.id === editingAddressId
						? finalEntry
						: finalEntry.isDefault
							? { ...item, isDefault: false }
							: item
				)
			: [
					...addresses.map((item) =>
						finalEntry.isDefault ? { ...item, isDefault: false } : item
					),
					finalEntry,
				];
		const suffix = saved ? "" : " on this device";
		persistAddresses(
			next,
			editingAddressId ? `Address updated${suffix}` : `Address added${suffix}`
		);
		setAddressForm(null);
		setEditingAddressId(null);
	};

	const deleteAddress = async (address) => {
		if (!window.confirm(`Delete your ${address.label} address?`)) return;
		addressesTouched.current = true;
		const removed = await deleteRemoteAddress(address.id);
		let next = addresses.filter((item) => item.id !== address.id);
		if (address.isDefault && next.length > 0) {
			if (removed) await patchRemoteAddress(next[0].id, { isDefault: true });
			next = next.map((item, index) => ({ ...item, isDefault: index === 0 }));
		}
		persistAddresses(next, removed ? "Address removed" : "Address removed from this device");
		if (addressForm?.id === address.id) setAddressForm(null);
	};

	const makeDefaultAddress = async (id) => {
		addressesTouched.current = true;
		const saved = await patchRemoteAddress(id, { isDefault: true });
		persistAddresses(
			addresses.map((item) => ({ ...item, isDefault: item.id === id })),
			saved ? "Default address updated" : "Default address updated on this device"
		);
	};

	const persistCards = (next, message) => {
		setCards(next);
		update((current) => ({ ...current, paymentMethods: next }));
		if (message) toast.show(message);
	};

	const saveCard = (event) => {
		event.preventDefault();
		let card;
		try {
			card = maskDemoCard(cardForm);
		} catch (error) {
			toast.show(error.message, "error");
			return;
		}
		const next = [
			...cards.map((item) => ({ ...item, isDefault: false })),
			{ ...card, isDefault: cards.length === 0 },
		];
		persistCards(next, "Demo card added — only masked details were saved");
		// The full test number is intentionally dropped as soon as it is masked.
		setCardForm(null);
	};

	const deleteCard = (card) => {
		if (!window.confirm(`Remove demo card ending in ${card.last4}?`)) return;
		let next = cards.filter((item) => item.id !== card.id);
		if (card.isDefault && next.length > 0) {
			next = next.map((item, index) => ({ ...item, isDefault: index === 0 }));
		}
		persistCards(next, "Demo card removed");
	};

	const makeDefaultCard = (id) =>
		persistCards(
			cards.map((item) => ({ ...item, isDefault: item.id === id })),
			"Default demo card updated"
		);

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
			{/* --- Personal information --- */}
			<section className={`${cardClass} lg:col-span-2`} aria-labelledby="personal-heading">
				<SectionHeader
					id="personal-heading"
					icon={<UserIcon />}
					title="Personal information"
					description="The contact details used for your reservations and booking confirmations."
				>
					{!editingInfo && (
						<button
							type="button"
							className={secondaryButton}
							onClick={() => {
								profileTouched.current = true;
								setEditingInfo(true);
							}}
						>
							Edit details
						</button>
					)}
				</SectionHeader>

				{editingInfo ? (
					<form onSubmit={saveInfo} className="grid grid-cols-1 gap-5 md:grid-cols-3">
						<div>
							<label className={labelClass} htmlFor="profile-name">Full name</label>
							<input
								id="profile-name"
								className={fieldClass}
								type="text"
								required
								value={infoForm.fullName}
								onChange={(e) => setInfoForm({ ...infoForm, fullName: e.target.value })}
							/>
						</div>
						<div>
							<label className={labelClass} htmlFor="profile-email">Email address</label>
							<input
								id="profile-email"
								className={fieldClass}
								type="email"
								required
								value={infoForm.email}
								onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
							/>
						</div>
						<div>
							<label className={labelClass} htmlFor="profile-phone">Phone number</label>
							<input
								id="profile-phone"
								className={fieldClass}
								type="tel"
								value={infoForm.phone}
								onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
							/>
						</div>
						<div className="flex flex-wrap gap-3 md:col-span-3">
							<button type="submit" className={primaryButton}>Save changes</button>
							<button
								type="button"
								className={secondaryButton}
								onClick={() => {
									setInfoForm({
										fullName: profile.fullName,
										email: profile.email,
										phone: profile.phone,
									});
									setEditingInfo(false);
								}}
							>
								Cancel
							</button>
						</div>
					</form>
				) : (
					<dl className="grid grid-cols-1 gap-5 md:grid-cols-3">
						<div>
							<dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Full name</dt>
							<dd className="mt-1 text-sm text-gray-800">{profile.fullName || "—"}</dd>
						</div>
						<div>
							<dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email address</dt>
							<dd className="mt-1 break-all text-sm text-gray-800">{profile.email || "—"}</dd>
						</div>
						<div>
							<dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone number</dt>
							<dd className="mt-1 text-sm text-gray-800">{profile.phone || "Not provided"}</dd>
						</div>
					</dl>
				)}
			</section>

			{/* --- Addresses / billing details --- */}
			<section className={cardClass} aria-labelledby="addresses-heading">
				<SectionHeader
					id="addresses-heading"
					icon={<PinIcon />}
					title="Addresses & billing"
					description="Saved addresses for billing and check-in, stored with your account."
				>
					<button type="button" className={secondaryButton} onClick={() => openAddressForm()}>
						Add address
					</button>
				</SectionHeader>

				{addressForm && (
					<form
						onSubmit={saveAddress}
						className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 md:grid-cols-2"
					>
						<div>
							<label className={labelClass} htmlFor="address-label">Label</label>
							<input
								id="address-label"
								className={fieldClass}
								type="text"
								placeholder="Home or Work"
								value={addressForm.label}
								onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
							/>
						</div>
						<div>
							<label className={labelClass} htmlFor="address-line1">Street address</label>
							<input
								id="address-line1"
								className={fieldClass}
								type="text"
								required
								value={addressForm.line1}
								onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
							/>
						</div>
						<div>
							<label className={labelClass} htmlFor="address-line2">Apartment, suite (optional)</label>
							<input
								id="address-line2"
								className={fieldClass}
								type="text"
								value={addressForm.line2}
								onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
							/>
						</div>
						<div>
							<label className={labelClass} htmlFor="address-city">City</label>
							<input
								id="address-city"
								className={fieldClass}
								type="text"
								required
								value={addressForm.city}
								onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
							/>
						</div>
						<div>
							<label className={labelClass} htmlFor="address-state">State / region</label>
							<input
								id="address-state"
								className={fieldClass}
								type="text"
								value={addressForm.state || ""}
								onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
							/>
						</div>
						<div>
							<label className={labelClass} htmlFor="address-zip">ZIP / postal code</label>
							<input
								id="address-zip"
								className={fieldClass}
								type="text"
								value={addressForm.zip || ""}
								onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
							/>
						</div>
						<div>
							<label className={labelClass} htmlFor="address-country">Country</label>
							<input
								id="address-country"
								className={fieldClass}
								type="text"
								required
								value={addressForm.country}
								onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
							/>
						</div>
						<div className="flex items-end md:col-span-2">
							<label className="flex items-center gap-2 text-sm text-gray-700">
								<input
									type="checkbox"
									className="h-4 w-4 accent-primary"
									checked={Boolean(addressForm.isDefault)}
									onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
								/>
								Set as default address
							</label>
						</div>
						<div className="flex flex-wrap gap-3 md:col-span-2">
							<button type="submit" className={primaryButton}>
								{editingAddressId ? "Save address" : "Add address"}
							</button>
							<button
								type="button"
								className={secondaryButton}
								onClick={() => {
									setAddressForm(null);
									setEditingAddressId(null);
								}}
							>
								Cancel
							</button>
						</div>
					</form>
				)}

				{addresses.length === 0 && !addressForm ? (
					<p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center text-sm text-gray-600">
						No saved addresses yet. Add one to speed up your next booking.
					</p>
				) : (
					<ul className="space-y-4">
						{addresses.map((address) => (
							<li key={address.id} className="rounded-xl border border-gray-200 p-5">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<p className="font-medium text-gray-800">{address.label}</p>
									{address.isDefault && <Badge>Default</Badge>}
								</div>
								<p className="mt-2 text-sm text-gray-600">
									{[address.line1, address.line2, address.city, address.state, address.zip, address.country]
										.filter(Boolean)
										.join(", ")}
								</p>
								<div className="mt-4 flex flex-wrap gap-2">
									<button type="button" className={smallButton} onClick={() => openAddressForm(address)}>
										Edit
									</button>
									{!address.isDefault && (
										<button type="button" className={smallButton} onClick={() => makeDefaultAddress(address.id)}>
											Set as default
										</button>
									)}
									<button
										type="button"
										className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
										onClick={() => deleteAddress(address)}
									>
										Delete
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			{/* --- Demo payment methods --- */}
			<section className={cardClass} aria-labelledby="payments-heading">
				<SectionHeader
					id="payments-heading"
					icon={<CardIcon />}
					title="Payment methods"
					description="Demo cards for the QuickStay test checkout only."
				>
					<button type="button" className={secondaryButton} onClick={() => setCardForm({ ...emptyCard })}>
						Add demo card
					</button>
				</SectionHeader>

				<div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
					<p className="font-semibold">Test mode — no real payments.</p>
					<p className="mt-1">
						These cards are placeholders for the Stripe test checkout. We store only the
						brand and last four digits — never a full card number, CVC, or any real card
						data. No real charge is ever made.
					</p>
				</div>

				{cardForm && (
					<form
						onSubmit={saveCard}
						className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 md:grid-cols-2"
					>
						<div>
							<label className={labelClass} htmlFor="demo-card-label">Card nickname (optional)</label>
							<input
								id="demo-card-label"
								className={fieldClass}
								type="text"
								placeholder="My test card"
								maxLength={40}
								value={cardForm.label}
								onChange={(e) => setCardForm({ ...cardForm, label: e.target.value })}
							/>
						</div>
						<div>
							<label className={labelClass} htmlFor="demo-card-number">Test card number</label>
							<input
								id="demo-card-number"
								className={fieldClass}
								type="text"
								inputMode="numeric"
								autoComplete="off"
								required
								placeholder="4242 4242 4242 4242"
								value={cardForm.number}
								onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
							/>
						</div>
						<div>
							<label className={labelClass} htmlFor="demo-card-expiry">Expiry (optional, MM/YY)</label>
							<input
								id="demo-card-expiry"
								className={fieldClass}
								type="text"
								placeholder="12/34"
								maxLength={5}
								value={cardForm.expiry}
								onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
							/>
						</div>
						<div className="flex flex-wrap items-end gap-3 md:col-span-2">
							<button type="submit" className={primaryButton}>Save demo card</button>
							<button type="button" className={secondaryButton} onClick={() => setCardForm(null)}>
								Cancel
							</button>
							<p className="text-xs text-gray-600">Only the last four digits will be kept.</p>
						</div>
					</form>
				)}

				<ul className="space-y-4">
					{cards.map((card) => (
						<li key={card.id} className="rounded-xl border border-gray-200 p-5">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="font-medium text-gray-800">
									{card.brand} •••• {card.last4}
								</p>
								{card.isDefault && <Badge>Default</Badge>}
							</div>
							<p className="mt-1 text-sm text-gray-600">
								{card.label}
								{card.expiry && card.expiry !== "—" ? ` · Expires ${card.expiry}` : ""}
							</p>
							<div className="mt-4 flex flex-wrap gap-2">
								{!card.isDefault && (
									<button type="button" className={smallButton} onClick={() => makeDefaultCard(card.id)}>
										Set as default
									</button>
								)}
								<button
									type="button"
									className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
									onClick={() => deleteCard(card)}
								>
									Remove
								</button>
							</div>
						</li>
					))}
				</ul>

				<p className="mt-6 text-xs text-gray-600">
					Need to pay for a booking?{" "}
					<Link to="/my-bookings" className="font-medium text-primary hover:underline">
						Go to my bookings
					</Link>
				</p>
			</section>
		</div>
	);
};

const CustomerProfile = () => {
	useDocumentTitle("My Profile");
	const { user, isLoaded } = useUser();
	const { openSignIn } = useClerk();
	const { isDemoUser, isDemoMode, demoUser, startDemo } = useDemoUser();

	const activeUser = user || (isDemoUser ? demoUser : null);
	const key = profileKeyFor(activeUser);

	return (
		<div className="px-4 pt-28 pb-24 md:px-16 md:pt-32 md:pb-35 lg:px-24 xl:px-32">
			<Title
				title="My Profile"
				subTitle="Manage your contact details, saved addresses and demo payment methods in one place."
				align="left"
			/>

			{!isLoaded && !activeUser && (
				<p className="mt-8 text-sm text-gray-600">Loading your profile…</p>
			)}

			{isLoaded && !activeUser && (
				<div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
					<p className="text-sm text-gray-600">
						You're browsing as a guest. Sign in or try the guest demo to keep a profile
						for your bookings.
					</p>
					<div className="flex flex-wrap gap-2">
						<button type="button" className={primaryButton} onClick={() => openSignIn()}>
							Login
						</button>
						{isDemoMode && (
							<button type="button" className={secondaryButton} onClick={() => startDemo("guest")}>
								Try demo
							</button>
						)}
					</div>
				</div>
			)}

			{activeUser && (
				<p className="mt-6 text-sm text-gray-600">
					Signed in as <span className="font-medium text-gray-800">{activeUser.fullName || activeUser.username}</span>
				</p>
			)}

			<ProfileSections key={key} user={activeUser} />
		</div>
	);
};

export default CustomerProfile;
