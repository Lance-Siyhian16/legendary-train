import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Carousel from "../../shared/navigation/Carousel";
import { ACTIVE_STATUSES, getStatusMeta } from "../../shared/components/StatusMeta";

const BOOKINGS = [
  {
    id: "HL-906735-6662",
    status: "InProgress",
    route: "Picked up & Delivered",
    from: { type: "Picked up", address: "Herland Laundry" },
    to: { type: "Delivered", address: "Herland Laundry" },
    date: "Feb 2, 2026",
  },
  {
    id: "HL-906735-8888",
    status: "InProgress",
    route: "Drop-off & Delivered",
    from: { type: "Drop-off", address: "Herland Laundry" },
    to: { type: "Delivered", address: "Herland Laundry" },
    date: "Jan 19, 2026",
  },
];

const carouselSlides = [
  {
    title: "WASH",
    description: "Fresh, clean, handled with care.",
    image:
      "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&h=400&fit=crop",
    overlay: "#63bce6",
  },
  {
    title: "DRY",
    description: "Quick and gentle drying.",
    image:
      "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&h=400&fit=crop",
    overlay: "#ffb850",
  },
  {
    title: "FOLD",
    description: "Neat, organized, ready to wear.",
    image:
      "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&h=400&fit=crop",
    overlay: "#ffde59",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const activeBookings = useMemo(
    () => BOOKINGS.filter((b) => ACTIVE_STATUSES.includes(b.status)),
    []
  );

  return (
    <div className="min-h-screen bg-[#ffffff] px-4 py-6 sm:py-10">

      {/* Greeting + Carousel */}
      <div className="mx-auto w-full max-w-none">
        <h1 className="text-2xl font-semibold text-[#3878c2] mb-2">
          Hello John !
        </h1>
        <Carousel slides={carouselSlides} />
      </div>

      {/* Active Bookings Section */}
      <div className="mx-auto mt-8 w-full max-w-none">

        {/* Active Bookings Heading */}
        {activeBookings.length > 0 && (
          <h3 className="font-semibold text-[#3878c2] mb-2">
            Active Bookings ({activeBookings.length})
          </h3>
        )}

        {/* No Active Bookings */}
        {activeBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-2xl py-10 px-6 shadow-sm">
            <img
              src="/images/WashingMachine.png"
              alt="Washing Machine"
              className="h-40 w-auto"
            />
            <p className="text-lg text-[#b4b4b4]">
              No active bookings at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {activeBookings.map((booking) => {
              const statusMeta = getStatusMeta(booking.status);

              return (
                <button
                  key={booking.id + booking.status + booking.date}
                  type="button"
                  onClick={() =>
                    navigate(`/bookings/${encodeURIComponent(booking.id)}`)
                  }
                  className="relative w-full rounded-2xl border border-[#3878c2] bg-white text-left shadow-sm overflow-hidden transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#63bce6]/60"
                >
                  {/* Left Status Color Strip */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: statusMeta.color }}
                  />

                  <div className="relative p-5 flex flex-col gap-3">

                    {/* Booking ID + Status */}
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

                    {/* Date + Status (tablet/desktop) */}
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

                    {/* From / To */}
                    <div className="mt-5 flex flex-col gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#3878c2]">
                          {booking.from.type}
                        </p>
                        <p className="mt-1 text-sm text-[#374151]">
                          {booking.from.address}
                        </p>
                      </div>

                      <hr className="border-t border-[#3878c2] w-11/12 mx-auto" />

                      <div>
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
