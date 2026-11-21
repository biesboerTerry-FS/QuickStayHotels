import React, { useState } from "react";
import { useToast } from "../context/ToastContext";
import { apiFetch } from "../lib/api";

const ImageUpload = ({ onUpload, className = "" }) => {
	const [uploading, setUploading] = useState(false);
	const toast = useToast();

	const handleChange = async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setUploading(true);
		try {
			const response = await apiFetch("/api/upload", {
				method: "POST",
				body: file,
				headers: {
					"Content-Type": file.type,
				},
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "Upload failed");
			onUpload(data.url);
			toast.show("Image uploaded");
		} catch (error) {
			toast.show(error.message, "error");
		} finally {
			setUploading(false);
		}
	};

	return (
		<label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
			<input
				type="file"
				accept="image/*"
				onChange={handleChange}
				disabled={uploading}
				className="hidden"
			/>
			<span
				className={`px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors ${
					uploading
						? "opacity-50 cursor-not-allowed"
						: "hover:bg-gray-50"
				}`}
			>
				{uploading ? "Uploading…" : "Upload image"}
			</span>
		</label>
	);
};

export default ImageUpload;
