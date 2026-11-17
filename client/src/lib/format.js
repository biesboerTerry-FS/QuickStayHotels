export const toDay = (value) => String(value).slice(0, 10);

export const todayIso = () => toDay(new Date().toISOString());

export const formatDay = (value, options = null) => {
	if (options) {
		return new Date(value).toLocaleDateString("en-US", {
			timeZone: "UTC",
			...options,
		});
	}
	const [year, month, day] = toDay(value).split("-");
	return `${month}/${day}/${year}`;
};

export const formatCurrency = (value) =>
	`$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
