import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import VerticalStepper from "../../../shared/components/VerticalStepper";

export default function BookingDetails() {
  const navigate = useNavigate();
  const referenceNumber = "REF-20260215-001";

  // Change this variable to true if the booking is for delivery
  const isDelivery = false;

  // Construct timeline dynamically
  const bookingTimeline = useMemo(() => {
    const baseTimeline = [
      { status: "Booking Received", timestamp: "2026-02-12T09:15:00" },
      { status: "Booking Accepted", timestamp: "2026-02-12T09:16:00" },
      { status: "Payment Confirmed", timestamp: "2026-02-12T09:35:00" },
      { status: "In Progress", timestamp: "2026-02-12T13:45:00" },
    ];

    // Add either Ready or Out step
    if (isDelivery) {
      baseTimeline.push({ status: "Out for Delivery", timestamp: null });
    } else {
      baseTimeline.push({ status: "Ready for Pick-up", timestamp: null });
    }

    // Add completed step
    baseTimeline.push({ status: "Booking Completed", timestamp: null });

    return baseTimeline;
  }, [isDelivery]);

  return (
    <div
      className="min-h-screen bg-white px-4 py-6 sm:py-10"
    >
      <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
        {/* Header */}
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

        {/* Reference Number */}
        <h2 className="text-lg font-semibold" style={{ color: "#3878c2" }}>
          Reference number
        </h2>
        <p className="font-bold mb-4 break-all" style={{ color: "#3878c2" }}>
          {referenceNumber}
        </p>

        <div className="mb-6" style={{ borderTop: "1px solid #b4b4b4" }}></div>

        {/* Vertical Stepper */}
        <VerticalStepper steps={bookingTimeline} />
      </div>
    </div>
  );
}
