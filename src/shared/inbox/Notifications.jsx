import { useMemo, useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePermissions } from "../permissions/UsePermissions";

const USER_NOTIFICATIONS = [
  {
    id: "NTF-1029",
    title: "Laundry ready for pickup",
    message:
      "Your booking HL-906735-6662 is ready. Drop by today before 7:00 PM.",
    time: "Feb 7, 2026 · 10:15 AM",
    read: false,
  },
  {
    id: "NTF-1030",
    title: "Payment confirmed",
    message: "We have received your payment for booking HL-906735-6662.",
    time: "Feb 6, 2026 · 2:08 PM",
    read: false,
  },
  {
    id: "NTF-1031",
    title: "Driver en route",
    message:
      "Your pickup driver is on the way. Estimated arrival in 20 minutes.",
    time: "Feb 6, 2026 · 9:40 AM",
    read: false,
  },
  {
    id: "NTF-1032",
    title: "Booking accepted",
    message:
      "We have received your booking. We will update you once processing starts.",
    time: "Feb 5, 2026 · 5:10 PM",
    read: true,
  },
];

const STAFF_NOTIFICATIONS = [
  {
    id: "STF-2101",
    title: "New walk-in drop-off",
    message: "Booking HL-906740-1021 has arrived at the front desk.",
    time: "Feb 8, 2026 · 8:45 AM",
    read: false,
  },
  {
    id: "STF-2102",
    title: "Machine maintenance check",
    message: "Dryer #2 is due for a maintenance check before 3:00 PM today.",
    time: "Feb 7, 2026 · 1:20 PM",
    read: false,
  },
  {
    id: "STF-2103",
    title: "Rush booking assigned",
    message: "Please prioritize booking HL-906738-9910 for same-day release.",
    time: "Feb 6, 2026 · 11:05 AM",
    read: true,
  },
];

const RIDER_NOTIFICATIONS = [
  {
    id: "RDR-3101",
    title: "Pickup assigned",
    message: "New pickup assigned: HL-906742-4408 at Batasan Hills.",
    time: "Feb 8, 2026 · 9:12 AM",
    read: false,
  },
  {
    id: "RDR-3102",
    title: "Customer not available",
    message: "Customer for HL-906739-7753 requested a reschedule at 2:30 PM.",
    time: "Feb 7, 2026 · 2:04 PM",
    read: false,
  },
  {
    id: "RDR-3103",
    title: "Delivery completed",
    message: "Delivery completed for HL-906736-2231. Proof photo uploaded.",
    time: "Feb 6, 2026 · 5:28 PM",
    read: true,
  },
];

const ROLE_NOTIFICATIONS = {
  user: USER_NOTIFICATIONS,
  staff: STAFF_NOTIFICATIONS,
  rider: RIDER_NOTIFICATIONS,
};

const FILTERS = ["All", "Unread", "Today"];
const LONG_PRESS_DURATION = 600; // milliseconds

const getRoleFromPath = (pathname = "") => {
  if (pathname.startsWith("/staff")) return "staff";
  if (pathname.startsWith("/rider")) return "rider";
  return "user";
};

export default function Notifications() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeRole = useMemo(() => getRoleFromPath(location.pathname), [location.pathname]);
  const [filter, setFilter] = useState("All");
  const [notifications, setNotifications] = useState(() => ROLE_NOTIFICATIONS[activeRole]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { requestNotificationPermission } = usePermissions();

  const pressTimer = useRef(null);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  useEffect(() => {
    setFilter("All");
    setNotifications(ROLE_NOTIFICATIONS[activeRole]);
    setSelectedNotification(null);
    setIsModalOpen(false);
  }, [activeRole]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "Unread") return notifications.filter((n) => !n.read);
    return notifications;
  }, [filter, notifications]);

  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const startPressTimer = (item) => {
    pressTimer.current = setTimeout(() => {
      setSelectedNotification(item);
      setIsModalOpen(true);
    }, LONG_PRESS_DURATION);
  };

  const clearPressTimer = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const handleToggleRead = () => {
    if (selectedNotification) {
      toggleRead(selectedNotification.id);
      setIsModalOpen(false);
      setSelectedNotification(null);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
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
              <h1 className="text-2xl font-semibold">Notifications</h1>
            </div>
            <p className="text-sm text-[#b4b4b4]">
              {unreadCount === 0
                ? "You are all caught up."
                : `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`}
            </p>
          </div>

          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="text-sm font-semibold text-[#4bad40] disabled:text-[#b4b4b4]"
          >
            Mark all as read
          </button>
        </header>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const isActive = filter === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-1.5 text-xs sm:px-4 sm:text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#63bce6] text-white"
                    : "border border-[#3878c2] text-[#3878c2] hover:bg-[#63bce6]/20"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center space-y-6">
            <img
              src="/images/WashingMachine.png"
              alt="Washing Machine"
              className="h-48 w-auto"
            />
            <p className="text-lg text-[#b4b4b4]">
              No notifications right now.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {filteredNotifications.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleRead(item.id)}
                  onMouseDown={() => startPressTimer(item)}
                  onMouseUp={clearPressTimer}
                  onMouseLeave={clearPressTimer}
                  onTouchStart={() => startPressTimer(item)}
                  onTouchEnd={clearPressTimer}
                  className={`w-full px-3 py-4 text-left transition ${
                    item.read ? "bg-white" : "bg-[#63bce6]/10"
                  }`}
                >
                  <h2
                    className={`text-sm transition-colors ${
                      item.read
                        ? "font-medium text-[#9ca3af]"
                        : "font-semibold text-[#3878c2]"
                    }`}
                  >
                    {item.title}
                  </h2>
                  <p
                    className={`mt-1 text-sm transition-colors ${
                      item.read ? "text-[#b4b4b4]" : "text-[#374151]"
                    }`}
                  >
                    {item.message}
                  </p>
                  <p className="mt-1 text-xs text-[#b4b4b4]">{item.time}</p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Long Press Modal */}
        {isModalOpen && selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-lg">
              
              <h3 className="mb-2 text-lg font-semibold text-[#3878c2]">
                {selectedNotification.title}
              </h3>

              <p className="mb-6 text-sm text-[#374151]">
                {selectedNotification.message}
              </p>

              <div className="flex flex-col gap-3">
                
                {/* Primary Action */}
                <button
                  onClick={handleToggleRead}
                  className="w-full rounded-lg bg-[#4bad40] py-2.5 font-semibold text-white"
                >
                  {selectedNotification.read
                    ? "Mark as unread"
                    : "Mark as read"}
                </button>

                {/* Secondary Action */}
                <button
                  onClick={() => deleteNotification(selectedNotification.id)}
                  className="w-full rounded-lg border border-[#3878c2] py-2.5 font-semibold text-[#3878c2]"
                >
                  Delete
                </button>

                {/* Secondary Action */}
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedNotification(null);
                  }}
                  className="w-full rounded-lg border border-[#3878c2] py-2.5 font-semibold text-[#3878c2]"
                >
                  Cancel
                </button>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
