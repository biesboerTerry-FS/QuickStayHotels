import React, { useState } from "react";
import Title from "../../components/Title";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useToast } from "../../context/ToastContext";
import { formatDay } from "../../lib/format";
import {
	BULLETIN_TYPES,
	createBulletin,
	deleteBulletin,
	toggleBulletin,
	updateBulletin,
	useBulletins,
} from "../../lib/bulletins";

const emptyForm = { title: "", body: "", type: "info", active: true };

const badgeClass = {
	info: "bg-blue-100 text-blue-700",
	warning: "bg-amber-100 text-amber-700",
	promotion: "bg-purple-100 text-purple-700",
};

const Announcements = () => {
	useDocumentTitle("Announcements");
	const bulletins = useBulletins();
	const toast = useToast();
	const [form, setForm] = useState(emptyForm);
	const [editingId, setEditingId] = useState(null);
	const [showForm, setShowForm] = useState(false);

	const reset = () => {
		setForm(emptyForm);
		setEditingId(null);
		setShowForm(false);
	};

	const save = (event) => {
		event.preventDefault();
		if (!form.title.trim() || !form.body.trim()) {
			toast.show("Enter a title and message for the bulletin.", "error");
			return;
		}
		if (editingId) {
			updateBulletin(editingId, {
				title: form.title.trim(),
				body: form.body.trim(),
				type: form.type,
				active: form.active,
			});
			toast.show("Bulletin updated");
		} else {
			createBulletin(form);
			toast.show("Bulletin published");
		}
		reset();
	};

	const edit = (bulletin) => {
		setForm({
			title: bulletin.title,
			body: bulletin.body,
			type: bulletin.type,
			active: bulletin.active,
		});
		setEditingId(bulletin.id);
		setShowForm(true);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const remove = (bulletin) => {
		if (!window.confirm(`Delete "${bulletin.title}"?`)) return;
		deleteBulletin(bulletin.id);
		toast.show("Bulletin deleted", "info");
		if (editingId === bulletin.id) reset();
	};

	const sorted = [...bulletins].sort(
		(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
	);

	return (
		<div className="max-w-5xl">
			<Title
				align="left"
				title="Announcements"
				subTitle="Post and manage bulletins for your team."
			/>

			<div className="flex flex-wrap items-center justify-between gap-3 mb-6">
				<p className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
					Demo mode · Bulletins are saved in this browser (localStorage), not to a server.
				</p>
				<button
					onClick={() => (showForm ? reset() : setShowForm(true))}
					className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dull cursor-pointer"
				>
					{showForm ? "Close" : "New bulletin"}
				</button>
			</div>

			{showForm && (
				<form
					onSubmit={save}
					aria-label={editingId ? "Edit bulletin" : "Create bulletin"}
					className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 grid grid-cols-1 gap-5"
				>
					<div>
						<label htmlFor="bulletin-title" className="text-sm font-medium text-gray-700">
							Title
						</label>
						<input
							id="bulletin-title"
							type="text"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							className="w-full rounded border border-gray-300 px-3 py-2 mt-1 outline-none focus:border-primary"
							placeholder="e.g. Front desk handover notes"
						/>
					</div>
					<div>
						<label htmlFor="bulletin-body" className="text-sm font-medium text-gray-700">
							Message
						</label>
						<textarea
							id="bulletin-body"
							value={form.body}
							onChange={(e) => setForm({ ...form, body: e.target.value })}
							rows={4}
							className="w-full rounded border border-gray-300 px-3 py-2 mt-1 outline-none focus:border-primary"
							placeholder="What should your team know?"
						/>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
						<div>
							<label htmlFor="bulletin-type" className="text-sm font-medium text-gray-700">
								Type
							</label>
							<select
								id="bulletin-type"
								value={form.type}
								onChange={(e) => setForm({ ...form, type: e.target.value })}
								className="w-full rounded border border-gray-300 px-3 py-2 mt-1 outline-none focus:border-primary"
							>
								{BULLETIN_TYPES.map((type) => (
									<option key={type} value={type}>
										{type.charAt(0).toUpperCase() + type.slice(1)}
									</option>
								))}
							</select>
						</div>
						<div className="flex items-end">
							<label htmlFor="bulletin-active" className="flex items-center gap-2 text-sm font-medium text-gray-700 pb-2">
								<input
									id="bulletin-active"
									type="checkbox"
									checked={form.active}
									onChange={(e) => setForm({ ...form, active: e.target.checked })}
									className="h-4 w-4 accent-[var(--color-primary)]"
								/>
								Active (visible on the dashboard)
							</label>
						</div>
					</div>
					<div className="flex gap-3">
						<button
							type="submit"
							className="px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-dull cursor-pointer"
						>
							{editingId ? "Update bulletin" : "Publish bulletin"}
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

			<div className="w-full text-left border border-gray-200 rounded-xl overflow-x-auto bg-white">
				<table className="w-full min-w-[640px]">
					<thead className="bg-gray-50">
						<tr>
							<th scope="col" className="py-3 px-4 text-gray-800 font-medium text-left">Bulletin</th>
							<th scope="col" className="py-3 px-4 text-gray-800 font-medium text-left">Type</th>
							<th scope="col" className="py-3 px-4 text-gray-800 font-medium text-center">Active</th>
							<th scope="col" className="py-3 px-4 text-gray-800 font-medium text-left">Date</th>
							<th scope="col" className="py-3 px-4 text-gray-800 font-medium text-right">Actions</th>
						</tr>
					</thead>
					<tbody className="text-sm">
						{sorted.map((bulletin) => (
							<tr key={bulletin.id} data-testid="bulletin-row">
								<td className="py-3 px-4 text-gray-700 border-t border-gray-200 max-w-sm">
									<p className="font-medium">{bulletin.title}</p>
									<p className="text-xs text-gray-500 truncate">{bulletin.body}</p>
								</td>
								<td className="py-3 px-4 border-t border-gray-200">
									<span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${badgeClass[bulletin.type] || badgeClass.info}`}>
										{bulletin.type}
									</span>
								</td>
								<td className="py-3 px-4 border-t border-gray-200 text-center">
									<input
										type="checkbox"
										aria-label={`Toggle active for ${bulletin.title}`}
										checked={bulletin.active}
										onChange={() => toggleBulletin(bulletin.id)}
										className="h-4 w-4 accent-[var(--color-primary)] cursor-pointer"
									/>
								</td>
								<td className="py-3 px-4 text-gray-700 border-t border-gray-200 whitespace-nowrap">
									{formatDay(bulletin.createdAt, { month: "short", day: "numeric", year: "numeric" })}
								</td>
								<td className="py-3 px-4 border-t border-gray-200 text-right whitespace-nowrap">
									<button
										onClick={() => edit(bulletin)}
										className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
									>
										Edit
									</button>
									<button
										onClick={() => remove(bulletin)}
										className="ml-2 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
									>
										Delete
									</button>
								</td>
							</tr>
						))}
						{sorted.length === 0 && (
							<tr>
								<td colSpan={5} className="py-8 text-center text-gray-500 border-t border-gray-200">
									No bulletins yet. Create one to get started.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default Announcements;
