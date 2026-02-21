export const STATUS_META = {
	BookingReceived: { label: "Booking Received", color: "#b4b4b4" },
	BookingAccepted: { label: "Booking Accepted", color: "#ffde59" },
	BookingEdited: { label: "Booking Edited", color: "#ffde59" },
	PaymentConfirmed: { label: "Payment Confirmed", color: "#ffde59" },
	InProgress: { label: "In Progress", color: "#ffde59" },
	ReadyForPickup: { label: "Ready for Pick-up", color: "#63bce6" },
	OutForDelivery: { label: "Out for Delivery", color: "#63bce6" },
	BookingCompleted: { label: "Booking Completed", color: "#4bad40" },
	BookingCancelled: { label: "Booking Cancelled", color: "#ff0000" },
	PaymentFlagged: { label: "Payment Flagged", color: "#ff0000" },
};

export const STATUS_ORDER = ["BookingReceived", "BookingAccepted", "BookingEdited", "PaymentConfirmed", "InProgress", "ReadyForPickup", "OutForDelivery", "BookingCompleted", "BookingCancelled", "PaymentFlagged"];

export const ACTIVE_STATUSES = ["BookingReceived", "BookingAccepted", "BookingEdited", "PaymentConfirmed", "InProgress", "ReadyForPickup", "OutForDelivery"];

export const PAST_STATUSES = ["BookingCompleted", "BookingCancelled", "PaymentFlagged"];

export const getStatusKey = (status = "") => {
	const lower = status.toLowerCase();
	if (lower === "received" || lower.includes("received") || lower.includes("placed")) return "BookingReceived";
	if (lower === "accepted" || lower.includes("accepted")) return "BookingAccepted";
	if (lower === "edited" || lower.includes("edited")) return "BookingEdited";
	if (lower === "confirmed" || lower.includes("payment confirmed")) return "PaymentConfirmed";
	if (lower === "flagged" || lower.includes("flagged")) return "PaymentFlagged";
	if (lower === "progress" || lower.includes("in progress")) return "InProgress";
	if (lower === "ready" || lower.includes("ready for pick")) return "ReadyForPickup";
	if (lower === "out" || lower.includes("out for delivery")) return "OutForDelivery";
	if (lower === "cancelled" || lower.includes("cancelled")) return "BookingCancelled";
	if (lower === "completed" || lower.includes("completed")) return "BookingCompleted";
	return "BookingReceived";
};

export const getStatusMeta = (status) => {
	if (!status) return STATUS_META.BookingReceived;
	return STATUS_META[status] || STATUS_META[getStatusKey(status)] || STATUS_META.BookingReceived;
};
