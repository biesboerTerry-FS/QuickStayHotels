import React, { useState } from "react";
import { useToast } from "../context/ToastContext";
import { apiFetch } from "../lib/api";
import addIcon from "../assets/addIcon.svg";

let uploadSeq = 0;
const nextId = () => `upload-${Date.now()}-${uploadSeq++}`;

/**
 * A single upload control plus the list of files attached to it.
 *
 * - Renders exactly ONE file input / upload icon per field.
 * - Clears the input value as soon as files are picked, so the same file can be
 *   selected again and more files can be attached until `maxFiles` is reached.
 * - Calls `onUpload(url)` once per successfully uploaded file (existing contract).
 * - Calls `onRemove(url)` when a thumbnail is removed so parents can stay in sync.
 * - `value` may be supplied to make the thumbnail list controlled (e.g. a form);
 *   without it the component manages its own list internally.
 */
const ImageUpload = ({
	onUpload,
	onRemove,
	value,
	defaultValue = [],
	maxFiles = 8,
	accept = "image/*",
	label = "Upload image",
	className = "",
}) => {
	const [uploading, setUploading] = useState(false);
	const [internalUrls, setInternalUrls] = useState(defaultValue);
	const [pending, setPending] = useState([]); // local previews while uploading
	const toast = useToast();

	const single = maxFiles === 1;
	const urls = value ?? internalUrls;
	const attachedCount = urls.length + pending.length;
	const atLimit = !single && attachedCount >= maxFiles;

	const addUrl = (url) => {
		if (value == null) setInternalUrls((prev) => [...prev, url]);
		onUpload?.(url);
	};

	const removeUrl = (url) => {
		if (value == null) setInternalUrls((prev) => prev.filter((item) => item !== url));
		onRemove?.(url);
	};

	const handleChange = async (event) => {
		const files = Array.from(event.target.files || []);
		// Reset immediately so the icon returns to its plain state and the same
		// file can be re-selected right away.
		event.target.value = "";
		if (!files.length) return;

		// Never let the visible list (attached + in-flight) exceed the limit.
		const remaining = single ? 1 : Math.max(0, maxFiles - attachedCount);
		const chosen = files.slice(0, remaining);
		if (files.length > chosen.length) {
			toast.show(`You can attach up to ${maxFiles} image${maxFiles === 1 ? "" : "s"}.`, "error");
		}
		if (!chosen.length) return;

		const staged = chosen.map((file) => ({
			id: nextId(),
			preview: URL.createObjectURL(file),
		}));
		setPending((prev) => [...prev, ...staged]);
		setUploading(true);

		let succeeded = 0;
		try {
			for (let index = 0; index < chosen.length; index += 1) {
				const file = chosen[index];
				const stage = staged[index];
				try {
					const response = await apiFetch("/api/upload", {
						method: "POST",
						body: file,
						headers: { "Content-Type": file.type },
					});
					const data = await response.json();
					if (!response.ok) throw new Error(data.message || "Upload failed");

					// Single-file fields replace their existing preview.
					if (single && urls.length) removeUrl(urls[0]);
					addUrl(data.url);
					succeeded += 1;
				} catch (error) {
					toast.show(error.message || "Upload failed", "error");
				} finally {
					setPending((prev) => {
						const found = prev.find((item) => item.id === stage.id);
						if (found) URL.revokeObjectURL(found.preview);
						return prev.filter((item) => item.id !== stage.id);
					});
				}
			}
			if (succeeded) {
				toast.show(
					succeeded === 1
						? "Image uploaded"
						: `${succeeded} images uploaded`
				);
			}
		} finally {
			setUploading(false);
		}
	};

	const removePending = (id) => {
		setPending((prev) => {
			const found = prev.find((item) => item.id === id);
			if (found) URL.revokeObjectURL(found.preview);
			return prev.filter((item) => item.id !== id);
		});
	};

	return (
		<div className={`flex flex-wrap items-start gap-3 ${className}`}>
			{/* The ONLY upload icon for this field. */}
			<label
				data-testid="upload-button"
				className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors select-none ${
					uploading || atLimit
						? "opacity-50 cursor-not-allowed"
						: "cursor-pointer hover:bg-gray-50"
				}`}
			>
				<input
					data-testid="upload-input"
					type="file"
					accept={accept}
					multiple={!single}
					onChange={handleChange}
					disabled={uploading || atLimit}
					className="hidden"
				/>
				<img src={addIcon} alt="" className="w-4 h-4 shrink-0" />
				<span>{uploading ? "Uploading…" : label}</span>
			</label>

			{urls.map((url, index) => (
				<div key={`${url}-${index}`} data-testid="upload-thumbnail" className="relative">
					<img
						src={url}
						alt={`Attached image ${index + 1}`}
						className="w-24 h-24 object-cover rounded-lg border border-gray-200"
					/>
					<button
						type="button"
						aria-label={`Remove image ${index + 1}`}
						data-testid="remove-image"
						onClick={() => removeUrl(url)}
						className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs leading-none hover:bg-red-600"
					>
						×
					</button>
				</div>
			))}

			{pending.map((item) => (
				<div key={item.id} data-testid="upload-thumbnail" className="relative">
					<img
						src={item.preview}
						alt="Attaching image"
						className="w-24 h-24 object-cover rounded-lg border border-gray-200 opacity-70"
					/>
					<button
						type="button"
						aria-label="Cancel upload"
						data-testid="remove-image"
						onClick={() => removePending(item.id)}
						className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs leading-none hover:bg-red-600"
					>
						×
					</button>
				</div>
			))}
		</div>
	);
};

export default ImageUpload;
