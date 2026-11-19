import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setState } from "../data/store";
import useDocumentTitle from "../hooks/useDocumentTitle";

const PaymentSuccess = () => {
	const [params] = useSearchParams();
	const bookingId = params.get("bookingId");
	const navigate = useNavigate();

	useDocumentTitle("Payment confirmed");

	useEffect(() => {
		if (bookingId) {
			setState("bookings", (list) =>
				list.map((item) =>
					item._id === bookingId
						? { ...item, isPaid: true, paymentMethod: "Stripe" }
						: item,
				),
			);
		}
		navigate(`/booking-confirmed/${bookingId || ""}`, { replace: true });
	}, [bookingId, navigate]);

	return (
		<div className="flex items-center justify-center min-h-[70vh] px-6 text-center">
			<p className="text-gray-600">Confirming your payment…</p>
		</div>
	);
};

export default PaymentSuccess;
