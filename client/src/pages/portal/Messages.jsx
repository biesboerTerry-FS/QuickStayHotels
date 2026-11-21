import React, { useEffect, useMemo, useState } from "react";
import Title from "../../components/Title";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useToast } from "../../context/ToastContext";
import { getMessage, getMessagesFor, markRead, sendMessage, useMessages } from "../../lib/messages";
import { formatDay } from "../../lib/format";

const Messages = ({ role = "owner" }) => {
	useDocumentTitle(`${role === "employee" ? "Employee" : "Owner"} Messages`);
	useMessages();
	const toast = useToast();
	const inbox = useMemo(() => getMessagesFor(role), [role]);
	const [selectedId, setSelectedId] = useState(inbox[0]?.id || null);
	const [composing, setComposing] = useState(false);
	const [form, setForm] = useState({ subject: "", body: "" });

	useEffect(() => {
		if (!inbox.some((item) => item.id === selectedId)) {
			setSelectedId(inbox[0]?.id || null);
		}
	}, [inbox, selectedId]);

	const selected = selectedId ? getMessage(selectedId) : null;
	const unread = inbox.filter((item) => !item.read).length;

	const openMessage = (id) => {
		setSelectedId(id);
		if (!getMessage(id)?.read) markRead(id);
	};

	const submit = (event) => {
		event.preventDefault();
		if (!form.subject.trim() || !form.body.trim()) {
			toast.show("Add both a subject and a message.", "error");
			return;
		}
		sendMessage({
			audience: role === "employee" ? "owner" : "employee",
			subject: form.subject,
			sender: role === "employee" ? "Employee portal" : "Hotel Owner",
			body: form.body,
		});
		setForm({ subject: "", body: "" });
		setComposing(false);
		toast.show("Message sent");
	};

	return (
		<div>
			<Title
				align="left"
				title="Messages"
				subTitle="Inbox for your role. Open a message to mark it as read."
			/>

			<div className="mt-8 grid gap-6 lg:grid-cols-[minmax(260px,340px)_1fr]">
				<section
					data-testid="messages-inbox"
					aria-label="Message inbox"
					className="rounded-xl border border-gray-200 bg-white"
				>
					<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
						<h2 className="text-sm font-semibold text-gray-800">
							Inbox <span className="text-gray-400">({unread} unread)</span>
						</h2>
						<button
							type="button"
							onClick={() => setComposing((value) => !value)}
							className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
						>
							{composing ? "Cancel" : "New message"}
						</button>
					</div>
					{composing && (
						<form onSubmit={submit} className="space-y-2 border-b border-gray-200 p-4">
							<input
								aria-label="Message subject"
								placeholder="Subject"
								value={form.subject}
								onChange={(e) => setForm({ ...form, subject: e.target.value })}
								className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
							/>
							<textarea
								aria-label="Message body"
								rows={3}
								placeholder="Write your message"
								value={form.body}
								onChange={(e) => setForm({ ...form, body: e.target.value })}
								className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
							/>
							<button
								type="submit"
								className="rounded-lg bg-primary px-4 py-2 text-xs text-white hover:bg-primary-dull cursor-pointer"
							>
								Send message
							</button>
						</form>
					)}
					<ul className="divide-y divide-gray-100">
						{inbox.map((message) => (
							<li key={message.id}>
								<button
									type="button"
									data-testid="message-item"
									onClick={() => openMessage(message.id)}
									className={`w-full px-4 py-3 text-left hover:bg-gray-50 cursor-pointer ${
										selectedId === message.id ? "bg-primary/5" : ""
									}`}
								>
									<div className="flex items-start justify-between gap-2">
										<p className={`text-sm ${message.read ? "text-gray-700" : "font-semibold text-gray-900"}`}>
											{message.subject}
										</p>
										{!message.read && (
											<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
										)}
									</div>
									<p className="text-xs text-gray-500 mt-1">
										{message.sender} · {formatDay(message.date, { month: "short", day: "numeric" })}
									</p>
								</button>
							</li>
						))}
						{inbox.length === 0 && (
							<li className="px-4 py-8 text-center text-sm text-gray-500">No messages yet.</li>
						)}
					</ul>
				</section>

				<section
					data-testid="message-detail"
					aria-label="Message detail"
					className="rounded-xl border border-gray-200 bg-white p-6 min-h-64"
				>
					{selected ? (
						<>
							<p className="text-xs uppercase tracking-wide text-primary">{selected.audience} inbox</p>
							<h2 className="font-playfair text-2xl text-gray-800 mt-2">{selected.subject}</h2>
							<p className="text-sm text-gray-500 mt-2">
								From {selected.sender} · {formatDay(selected.date, { month: "short", day: "numeric", year: "numeric" })}
							</p>
							<hr className="my-5 border-gray-200" />
							<p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{selected.body}</p>
						</>
					) : (
						<p className="text-sm text-gray-500">Select a message to read it.</p>
					)}
				</section>
			</div>
		</div>
	);
};

export default Messages;
