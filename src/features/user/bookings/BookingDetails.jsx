import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import VerticalStepper from "../../../shared/components/VerticalStepper";
import { supabase } from "../../../lib/supabase";

const API_BASE = "http://localhost:5000/api/v1/customer";

export default function BookingDetails() {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError("Please log in to view booking details.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE}/my-bookings/${encodeURIComponent(bookingId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      } else if (response.status === 404) {
        setError("Booking not found.");
      } else {
        setError("Could not load booking details.");
      }
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Derive timeline — if the booking has a delivery option, add the appropriate pending steps
  const buildFullTimeline = (bk) => {
    if (!bk) return [];

    const timeline = bk.timeline || [
      { status: "Booking Received", timestamp: new Date().toISOString() },
    ];

    // Check if terminal statuses exist
    const hasCompleted = timeline.some((s) => s.status === "Booking Completed");
    const hasCancelled = timeline.some((s) => s.status === "Booking Cancelled");
    const hasFlagged = timeline.some((s) => s.status === "Payment Flagged");
    if (hasCompleted || hasCancelled || hasFlagged) return timeline;

    // Determine which future steps to show
    const allStatuses = timeline.map((s) => s.status);
    const isDelivery =
      bk.collectionOption === "dropOffDelivered" ||
      bk.collectionOption === "pickedUpDelivered";

    const futureSteps = [
      "Booking Received",
      "Booking Accepted",
      "Payment Confirmed",
      "In Progress",
      isDelivery ? "Out for Delivery" : "Ready for Pick-up",
      "Booking Completed",
    ];

    // Add any future steps that haven't been reached yet (with null timestamp)
    const result = [...timeline];
    for (const step of futureSteps) {
      if (!allStatuses.includes(step)) {
        result.push({ status: step, timestamp: null });
      }
    }

    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
          <p className="text-lg text-[#b4b4b4]">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
          <header className="mb-6 flex items-center gap-2 text-[#3878c2]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold">Booking Details</h1>
          </header>
          <p className="text-lg text-[#e55353]">{error}</p>
        </div>
      </div>
    );
  }

  const referenceNumber = booking?.id || bookingId;
  const fullTimeline = buildFullTimeline(booking);

  // Helper to format date for display
  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0");
    const month = d.toLocaleString("default", { month: "long" });
    return `${month} ${day}, ${d.getFullYear()}`;
  };

  // Helper to format time to 12-hour
  const formatTime = (time) => {
    if (!time) return "-";
    const [hourStr, min] = time.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${hour.toString().padStart(2, "0")}:${min} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
        {/* Header */}
        <header className="mb-6 flex items-center gap-2 text-[#3878c2]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold">Booking Details</h1>
        </header>

        {/* Reference Number */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#b4b4b4]">
            Reference number
          </h2>
          <p className="text-xl font-bold break-all text-[#3878c2]">
            {referenceNumber}
          </p>
        </div>

        <div className="mb-8 border-t border-[#f0f0f0]" />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Timeline */}
          <div className="lg:col-span-1">
            <h3 className="mb-4 text-lg font-semibold text-[#3878c2]">Tracking</h3>
            <div className="rounded-2xl border border-[#3878c2]/20 bg-[#f9fbff] p-6 shadow-sm">
              <VerticalStepper steps={fullTimeline} />
            </div>
          </div>

          {/* Right Column: Booking Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Service Summary Card */}
            <div className="rounded-2xl border border-[#3878c2]/20 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-[#3878c2]">
                Service Summary
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                    Selected Services
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-[#374151]">
                    {booking?.serviceDetails?.selectedServices?.length > 0 ? (
                      booking.serviceDetails.selectedServices.map((s) => (
                        <li key={s} className="capitalize">{s}</li>
                      ))
                    ) : (
                      <li>-</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                    Add-Ons
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-[#374151]">
                    {booking?.serviceDetails?.selectedAddons?.length > 0 ? (
                      booking.serviceDetails.selectedAddons.map((addon) => (
                        <li key={addon.name}>
                          {addon.name}: {addon.quantity * 2} pcs
                        </li>
                      ))
                    ) : (
                      <li>None</li>
                    )}
                  </ul>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                    Total Weight
                  </p>
                  <p className="mt-1 text-sm text-[#374151]">
                    {booking?.serviceDetails?.weight || 0} kg
                  </p>
                </div>
              </div>
            </div>

            {/* Collection & Delivery Card */}
            <div className="rounded-2xl border border-[#3878c2]/20 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-[#3878c2]">
                Collection & Delivery
              </h3>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                      Collection
                    </p>
                    <div className="text-sm text-[#374151]">
                      <p className="font-medium">
                        {formatDate(booking?.collectionDetails?.collectionDate)}
                      </p>
                      <p>{formatTime(booking?.collectionDetails?.collectionTime)}</p>
                      <p className="mt-1 text-xs text-[#b4b4b4]">
                        {booking?.collectionDetails?.pickupAddress}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                      Delivery
                    </p>
                    <div className="text-sm text-[#374151]">
                      <p className="font-medium">
                        {formatDate(booking?.collectionDetails?.deliveryDate)}
                      </p>
                      <p>{formatTime(booking?.collectionDetails?.deliveryTime)}</p>
                      <p className="mt-1 text-xs text-[#b4b4b4]">
                        {booking?.collectionDetails?.deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-[#eef6ff] p-3 text-sm text-[#3878c2]">
                  <span className="font-semibold">Mode:</span>{" "}
                  {booking?.collectionDetails?.optionLabel || "-"}
                </div>
              </div>
            </div>

            {/* Payment Card */}
            <div className="rounded-2xl border border-[#3878c2]/20 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-[#3878c2]">
                Payment Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                    Method
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#374151]">
                    {booking?.paymentDetails?.method || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                    Status
                  </p>
                  <span className="mt-1 inline-flex items-center rounded-full bg-[#fdf2f2] px-2.5 py-0.5 text-xs font-medium text-[#e55353] capitalize">
                    {booking?.paymentDetails?.status || "Pending"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                    Amount to Pay
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#4bad40]">
                    ₱
                    {booking?.paymentDetails?.amountToPay?.toFixed(2) || "0.00"}
                  </p>
                  {booking?.paymentDetails?.method === "GCash" && (
                    <p className="mt-1 text-xs text-[#b4b4b4]">
                      Kindly settle payment via GCash once verified.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {booking?.notes && (
              <div className="rounded-2xl border border-[#3878c2]/20 bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-[#3878c2]">
                  Special Instructions
                </h3>
                <p className="text-sm text-[#374151] italic">
                  "{booking.notes}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
