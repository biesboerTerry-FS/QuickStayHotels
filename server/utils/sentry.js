import * as Sentry from "@sentry/node";

export const initSentry = () => {
	const dsn = process.env.SENTRY_DSN;
	if (!dsn) return;

	Sentry.init({
		dsn,
		tracesSampleRate: 1.0,
	});
};

export default Sentry;
