import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ACTIVE_STATUSES, PAST_STATUSES, getStatusMeta } from "../../../shared/components/StatusMeta";

const BOOKINGS = [
  { id: "HL-906735-6662", status: "InProgress", route: "Picked up & Delivered", from: { type: "Picked up", address: "Herland Laundry" }, to: { type: "Delivered", address: "Herland Laundry" }, date: "Feb 2, 2026" },
  { id: "HL-906735-6662", status: "ReadyForPickup", route: "Drop-off & Pick up later", from: { type: "Drop-off", address: "Herland Laundry" }, to: { type: "Pick up later", address: "Herland Laundry" }, date: "Jan 28, 2026" },
  { id: "HL-906735-6662", status: "BookingCompleted", route: "Drop-off & Delivered", from: { type: "Drop-off", address: "Herland Laundry" }, to: { type: "Delivered", address: "Herland Laundry" }, date: "Jan 19, 2026" },
  { id: "HL-906735-6662", status: "BookingCancelled", route: "Picked up & Delivered", from: { type: "Picked up", address: "Herland Laundry" }, to: { type: "Delivered", address: "Herland Laundry" }, date: "Jan 6, 2026" },
];

const FILTERS = ["All", "Active", "Past"];

export default function BookingHistory() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const navigate = useNavigate();

  // Filter bookings based on selected filter
  const filteredBookings = BOOKINGS.filter((booking) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Active") return ACTIVE_STATUSES.includes(booking.status);
    if (selectedFilter === "Past") return PAST_STATUSES.includes(booking.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#3878c2]">
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
            <h1 className="text-2xl font-semibold">Booking History</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => {
              const isActive = filter === selectedFilter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`rounded-full px-3 py-1.5 text-xs sm:px-4 sm:text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#63bce6] text-white"
                      : "border border-[#3878c2] text-[#3878c2] hover:bg-[#63bce6]/20"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </header>

        {filteredBookings.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center space-y-6">
            <img
              src="/images/WashingMachine.png"
              alt="Washing Machine"
              className="h-48 w-auto"
            />
            <p className="text-lg text-[#b4b4b4]">
              No bookings yet. Your completed and upcoming bookings will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredBookings.map((booking) => {
              const statusMeta = getStatusMeta(booking.status);
              return (
                <button
                  key={booking.id + booking.status + booking.date} // ensure unique key
                  type="button"
                  onClick={() => navigate(`/bookings/${encodeURIComponent(booking.id)}`)}
                  className="relative w-full rounded-2xl border border-[#3878c2] bg-white text-left shadow-sm overflow-hidden transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#63bce6]/60"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: statusMeta.color }}
                  />

                  <div className="relative p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-sm font-semibold text-[#3878c2] break-all">
                        {booking.id}
                      </h2>
                      <span
                        className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold md:hidden"
                        style={{
                          color: statusMeta.color,
                          backgroundColor: `${statusMeta.color}22`,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      <p className="text-xs text-[#374151]">
                        Booking received on {booking.date}
                      </p>
                      <span
                        className="hidden w-fit rounded-full px-3 py-1 text-xs font-semibold md:inline-flex"
                        style={{
                          color: statusMeta.color,
                          backgroundColor: `${statusMeta.color}22`,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-col gap-4">
                      <div className="rounded-xl p-0.5">
                        <p className="text-sm font-semibold text-[#3878c2]">
                          {booking.from.type}
                        </p>
                        <p className="mt-1 text-sm text-[#374151]">
                          {booking.from.address}
                        </p>
                      </div>

                      <hr className="border-t-1 border-[#3878c2] w-11/12 mx-auto" />

                      <div className="rounded-xl p-0.5">
                        <p className="text-sm font-semibold text-[#3878c2]">
                          {booking.to.type}
                        </p>
                        <p className="mt-1 text-sm text-[#374151]">
                          {booking.to.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
