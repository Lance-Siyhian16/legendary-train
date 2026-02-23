/**
 * ManageBookings.jsx
 *
 * Admin dashboard component for managing laundry service bookings.
 * Supports viewing, filtering, sorting, and searching bookings by status
 * or customer. Admins can advance bookings through a multi-stage workflow
 * (received → payment → preparation → shipping → final → done), set payment
 * amounts, and track progress via a timeline stepper. All booking data is
 * fetched from and persisted to the Supabase backend through REST API calls.
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import BottomNavbar from '../../shared/navigation/BottomNavbar';
import { STATUS_ORDER, getStatusKey, getStatusMeta } from '../../shared/components/StatusMeta';
import { FilterSelect, RadioRow } from '../../shared/components/OptionInput';
import VerticalStepper from '../../shared/components/VerticalStepper';
import { supabase } from '../../lib/supabase';

const API_BASE = 'http://localhost:5000/api/v1/admin';

const SHIPPING_ACTION_BY_OPTION = {
  dropOffPickUpLater: "Mark Ready for Pickup",
  dropOffDelivered: "Dispatch Booking",
  pickedUpDelivered: "Dispatch Booking",
};

const STAGE_ACTIONS = {
  received: ["Accept Booking", "Edit Booking", "Cancel Booking"],
  payment: ["Confirm Payment", "Flag Payment"],
  preparation: ["Start Laundry"],
  shipping: [],
  final: ["Complete Booking"],
  done: [],
};

const ACTION_EFFECTS = {
  "Accept Booking": { status: "Booking Accepted", nextStage: "payment" },
  "Edit Booking": { status: "Booking Edited", nextStage: "payment" },
  "Cancel Booking": { status: "Booking Cancelled", nextStage: "done" },
  "Confirm Payment": { status: "Payment Confirmed", nextStage: "preparation" },
  "Flag Payment": { status: "Payment Flagged", nextStage: "done" },
  "Start Laundry": { status: "In Progress", nextStage: "shipping" },
  "Mark Ready for Pickup": { status: "Ready for Pick-up", nextStage: "final" },
  "Dispatch Booking": { status: "Out for Delivery", nextStage: "final" },
  "Complete Booking": { status: "Booking Completed", nextStage: "done" },
};

const RED_BUTTONS = ["Cancel Booking", "Flag Payment"];

const now = new Date().toISOString();

const initialBookings = [
  {
    id: "REF-20260215-001",
    customerName: "Juan Dela Cruz",
    date: "Feb 12, 2026",
    collectionOption: "dropOffPickUpLater",
    stage: "received",
    timeline: [{ status: "Booking Received", timestamp: now }],
  },
  {
    id: "REF-20260215-002",
    customerName: "Maria Santos",
    date: "Feb 13, 2026",
    collectionOption: "dropOffDelivered",
    stage: "shipping",
    timeline: [
      { status: "Booking Received", timestamp: now },
      { status: "Booking Accepted", timestamp: now },
      { status: "Payment Confirmed", timestamp: now },
      { status: "In Progress", timestamp: now },
    ],
  },
];

const getCurrentStatus = (booking) =>
  booking.timeline[booking.timeline.length - 1]?.status || "Booking Received";

const getShippingButtons = (booking) => {
  const option = booking.collectionOption || (booking.isDelivery ? "dropOffDelivered" : "dropOffPickUpLater");
  const action = SHIPPING_ACTION_BY_OPTION[option];
  return action ? [action] : [];
};

const getButtonsForBooking = (booking) => {
  if (booking.stage === "shipping") return getShippingButtons(booking);
  return STAGE_ACTIONS[booking.stage] || [];
};

const toTitleCase = (value = "") =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return "-";
  const dateObject = new Date(dateValue);
  if (Number.isNaN(dateObject.getTime())) return dateValue;
  return dateObject.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimeForDisplay = (timeValue) => {
  if (!timeValue) return "-";
  if (!timeValue.includes(":")) return timeValue;

  const [hourText, minuteText] = timeValue.split(":");
  const hourValue = Number(hourText);
  if (Number.isNaN(hourValue)) return timeValue;

  const period = hourValue >= 12 ? "PM" : "AM";
  const formattedHour = hourValue % 12 || 12;
  return `${String(formattedHour).padStart(2, "0")}:${minuteText} ${period}`;
};

const getServicesSummary = (booking) => {
  const saved = booking.serviceDetails;
  if (saved?.selectedServices?.length) {
    return saved.selectedServices.map((service) => toTitleCase(service));
  }

  if (saved?.services) {
    return Object.entries(saved.services)
      .filter(([, selected]) => Boolean(selected))
      .map(([service]) => toTitleCase(service));
  }

  return [];
};

const getAddonsSummary = (booking) => {
  const saved = booking.serviceDetails;
  if (saved?.selectedAddons?.length) {
    return saved.selectedAddons.map((addon) => `${toTitleCase(addon.name)} (${addon.quantity})`);
  }

  if (saved?.addons) {
    return Object.entries(saved.addons)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([addon, quantity]) => `${toTitleCase(addon)} (${quantity})`);
  }

  return [];
};

const getCollectionDetails = (booking) => ({
  mode: booking.collectionDetails?.optionLabel || booking.optionLabel || "-",
  collectionDate: booking.collectionDetails?.collectionDate || "",
  collectionTime: booking.collectionDetails?.collectionTime || "",
  deliveryDate: booking.collectionDetails?.deliveryDate || "",
  deliveryTime: booking.collectionDetails?.deliveryTime || "",
});

const getPaymentDetails = (booking) => {
  const payment = booking.paymentDetails || {};
  const method = payment.method || "GCash";
  const rawReferenceNumber = payment.referenceNumber;
  const isGcashMethod = method.toLowerCase() === "gcash";
  
  // Show reference number if it's not a placeholder and not empty
  const referenceNumber = (rawReferenceNumber !== undefined && rawReferenceNumber !== null && rawReferenceNumber !== "-")
      ? rawReferenceNumber
      : "";

  return {
    method,
    referenceNumber,
    status: payment.status || "Pending",
    amountToPay: payment.amountToPay,
  };
};

const hasReferenceNumber = (referenceNumber) => {
  if (referenceNumber === undefined || referenceNumber === null) return false;
  const normalizedReference = String(referenceNumber).trim();
  return normalizedReference !== "" && normalizedReference !== "-";
};

const canConfirmPaymentForBooking = (booking) => {
  const payment = booking?.paymentDetails || {};
  const paymentMethod = String(payment.method || "GCash").toLowerCase();

  if (paymentMethod !== "gcash") return true;
  return hasReferenceNumber(payment.referenceNumber);
};

export default function ManageBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(() => [...initialBookings]);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // New state
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [amountDrafts, setAmountDrafts] = useState({});
  const [amountError, setAmountError] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Fetch bookings from the database via backend API
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError("");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_BASE}/bookings`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setBookings(data);
        }
        // If API returns empty, keep initialBookings as fallback
      } else {
        console.error('Failed to fetch bookings from backend');
        setFetchError('Could not load bookings from the server. Showing local data.');
        // Keep initialBookings as fallback
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setFetchError('Could not connect to the server. Showing local data.');
      // Keep initialBookings as fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === expandedId) || null,
    [bookings, expandedId]
  );

  useEffect(() => {
    if (!selectedBooking) return;

    const existingAmount = selectedBooking.paymentDetails?.amountToPay;
    setAmountDrafts((prev) => {
      if (prev[selectedBooking.id] !== undefined) return prev;
      return {
        ...prev,
        [selectedBooking.id]:
          existingAmount !== undefined && existingAmount !== null
            ? String(existingAmount)
            : "",
      };
    });
  }, [selectedBooking]);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const applyAction = async (bookingId, actionLabel) => {
    const effect = ACTION_EFFECTS[actionLabel];
    if (!effect) return;

    if (actionLabel === "Confirm Payment") {
      const targetBooking = bookings.find((booking) => booking.id === bookingId);
      if (!canConfirmPaymentForBooking(targetBooking)) return;
    }

    // Build the updated timeline for the API call
    const currentBooking = bookings.find((booking) => booking.id === bookingId);
    const updatedTimeline = [
      ...(currentBooking?.timeline || []),
      { status: effect.status, timestamp: new Date().toISOString() },
    ];

    // Update local state immediately for responsive UI
    setBookings((prev) =>
      prev.map((booking) => {
        if (booking.id !== bookingId) return booking;

        const nextPaymentDetails = booking.paymentDetails
          ? {
              ...booking.paymentDetails,
              status:
                actionLabel === "Confirm Payment"
                  ? "Payment Confirmed"
                  : actionLabel === "Flag Payment"
                  ? "Payment Flagged"
                  : booking.paymentDetails.status,
            }
          : booking.paymentDetails;

        return {
          ...booking,
          timeline: updatedTimeline,
          stage: effect.nextStage,
          paymentDetails: nextPaymentDetails,
        };
      })
    );

    // Persist to database via backend
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const dbId = currentBooking?.dbId || bookingId;

      await fetch(`${API_BASE}/bookings/${dbId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: effect.status,
          nextStage: effect.nextStage,
          timeline: updatedTimeline,
        }),
      });
    } catch (error) {
      console.error('Failed to persist status update:', error);
    }
  };

  const saveAmountToPay = async (bookingId) => {
    const targetBooking = bookings.find((booking) => booking.id === bookingId);
    const paymentStatus = targetBooking?.paymentDetails?.status;
    const isPaymentConfirmed = typeof paymentStatus === "string" && paymentStatus.toLowerCase().includes("payment confirmed");

    if (isPaymentConfirmed) {
      setAmountError("Amount can no longer be edited after payment is confirmed.");
      return;
    }

    const draft = (amountDrafts[bookingId] || "").trim();
    const parsedAmount = Number(draft);

    if (!draft || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError("Enter a valid amount greater than 0.");
      return;
    }

    setAmountError("");

    // Update local state immediately
    setBookings((prev) =>
      prev.map((booking) => {
        if (booking.id !== bookingId) return booking;
        return {
          ...booking,
          paymentDetails: {
            ...(booking.paymentDetails || {}),
            amountToPay: parsedAmount,
          },
        };
      })
    );

    // Persist to database via backend
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const dbId = targetBooking?.dbId || bookingId;

      await fetch(`${API_BASE}/bookings/${dbId}/amount`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amountToPay: parsedAmount }),
      });
    } catch (error) {
      console.error('Failed to persist amount update:', error);
    }
  };

  // Filter bookings based on selected status
  const filteredBookings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const statusFiltered =
      filterStatus === "all"
        ? bookings
        : bookings.filter((booking) => getStatusKey(getCurrentStatus(booking)) === filterStatus);

    const searchFiltered =
      normalizedQuery.length === 0
        ? statusFiltered
        : statusFiltered.filter((booking) => {
            const bookingId = (booking.id || "").toLowerCase();
            const customerName = (booking.customerName || "").toLowerCase();
            return bookingId.includes(normalizedQuery) || customerName.includes(normalizedQuery);
          });

    const sorted = [...searchFiltered].sort((firstBooking, secondBooking) =>
      firstBooking.id.localeCompare(secondBooking.id, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );

    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [filterStatus, bookings, sortDirection, searchQuery]);

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
        <header className="mb-3">
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
            <h1 className="text-2xl font-semibold">Manage Bookings</h1>
          </div>
        </header>

        <div className="mb-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-[minmax(220px,1fr)_160px_minmax(240px,auto)] md:items-center md:gap-3">
            <label htmlFor="booking-search" className="sr-only">
              Search by reference number or customer name
            </label>
            <input
              id="booking-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference # or customer"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-[#374151] placeholder:text-gray-400 md:min-w-0"
            />

            <FilterSelect
              id="booking-status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: "all", label: "All Statuses" },
                ...STATUS_ORDER.map((key) => ({
                  value: key,
                  label: getStatusMeta(key).label,
                })),
              ]}
              className="h-10 w-full border border-gray-300 rounded-md px-3 text-sm"
            />

            <div className="flex h-10 min-w-[240px] items-center justify-between gap-2 rounded-md border border-[#b4b4b4] px-3 sm:col-span-2 md:col-span-1">
              <p className="whitespace-nowrap text-xs font-semibold text-[#3878c2]">Sort by</p>
              <div className="flex items-center gap-1.5">
                <RadioRow
                  id="sort-ascending"
                  name="sortDirection"
                  label="Ascending"
                  checked={sortDirection === "asc"}
                  onChange={() => setSortDirection("asc")}
                />
                <RadioRow
                  id="sort-descending"
                  name="sortDirection"
                  label="Descending"
                  checked={sortDirection === "desc"}
                  onChange={() => setSortDirection("desc")}
                />
              </div>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading && <p className="text-gray-500 col-span-full">Loading bookings...</p>}
          {fetchError && <p className="text-amber-600 text-sm col-span-full">{fetchError}</p>}
          {!loading && filteredBookings.length === 0 && (
            <p className="text-gray-500 col-span-full">No bookings found for this status.</p>
          )}

          {filteredBookings.map((booking) => {
            const activeColor = getStatusMeta(getCurrentStatus(booking)).color;
            const buttons = getButtonsForBooking(booking);

            return (
              <div
                key={booking.id}
                className="relative w-full rounded-2xl border border-[#3878c2] bg-white text-left shadow-sm overflow-hidden transition hover:shadow-lg hover:scale-[1.01]"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl"
                  style={{ backgroundColor: activeColor }}
                />

                <div className="relative p-5 flex flex-col gap-2">
                  <button onClick={() => toggleExpand(booking.id)} className="text-left w-full">
                    <h2 className="text-base font-semibold text-[#3878c2] break-words">{booking.customerName}</h2>
                    <p className="text-xs text-[#374151] mt-0.5">{booking.id}</p>
                    <p className="text-xs text-[#374151] mt-0.5">Booking received on {booking.date}</p>
                  </button>

                  {/* Action buttons */}
                  {expandedId === booking.id && buttons.length > 0 && (
                    <p className="mt-2 text-xs text-[#374151]">Expanded in full-screen view.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedBooking && (() => {
        const buttons = getButtonsForBooking(selectedBooking);
        const serviceList = getServicesSummary(selectedBooking);
        const addonList = getAddonsSummary(selectedBooking);
        const collectionDetails = getCollectionDetails(selectedBooking);
        const paymentDetails = getPaymentDetails(selectedBooking);
        const isPaymentConfirmed = paymentDetails.status.toLowerCase().includes("payment confirmed");
        const canConfirmPayment = canConfirmPaymentForBooking(selectedBooking);
        const isBookingConfirmed = selectedBooking.timeline.some(
          (entry) => entry.status === "Booking Accepted" || entry.status === "Booking Edited"
        );
        const weight = selectedBooking.serviceDetails?.weight;
        const notes = selectedBooking.notes || "-";

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-white px-4 py-6 sm:py-10">
            <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
              <header className="mb-6 flex items-center gap-2 text-[#3878c2]">
                <button
                  type="button"
                  onClick={() => setExpandedId(null)}
                  className="inline-flex items-center"
                  aria-label="Back to bookings"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                </button>
                <h1 className="text-2xl font-semibold">Booking Details</h1>
              </header>

              <div className="mb-4">
                <h2 className="text-base font-semibold text-[#3878c2] break-words">{selectedBooking.customerName}</h2>
                <p className="text-xs text-[#374151] mt-0.5">{selectedBooking.id}</p>
                <p className="text-xs text-[#374151] mt-0.5">Booking received on {selectedBooking.date}</p>
              </div>

              {buttons.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {buttons.map((label) => {
                    const isRed = RED_BUTTONS.includes(label);
                    const isConfirmPaymentButton = label === "Confirm Payment";
                    const isDisabled = isConfirmPaymentButton && !canConfirmPayment;
                    return (
                      <button
                        key={label}
                        disabled={isDisabled}
                        onClick={() => applyAction(selectedBooking.id, label)}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white transition ${
                          isDisabled
                            ? "cursor-not-allowed bg-[#9ca3af]"
                            : `hover:opacity-90 ${isRed ? "bg-[#ff0000]" : "bg-[#63bce6]"}`
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
              {buttons.includes("Confirm Payment") && !canConfirmPayment ? (
                <p className="-mt-4 mb-6 text-xs text-[#ff0000]">
                  Cannot confirm payment yet. Customer must submit a GCash reference number first.
                </p>
              ) : null}

              <div className="space-y-5">
                <section className="rounded-2xl border border-[#b4b4b4] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[#3878c2]">Booking Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-[#3878c2]">Services</p>
                      <p className="mt-1 text-sm text-[#374151]">{serviceList.length ? serviceList.join(", ") : "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#3878c2]">Add-ons</p>
                      <p className="mt-1 text-sm text-[#374151]">{addonList.length ? addonList.join(", ") : "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#3878c2]">Laundry Weight</p>
                      <p className="mt-1 text-sm text-[#374151]">{weight ? `${weight} kg` : "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#3878c2]">Collection Mode</p>
                      <p className="mt-1 text-sm text-[#374151]">{collectionDetails.mode}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#3878c2]">Collection Schedule</p>
                      <p className="mt-1 text-sm text-[#374151]">
                        {formatDateForDisplay(collectionDetails.collectionDate)} • {formatTimeForDisplay(collectionDetails.collectionTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#3878c2]">Delivery Schedule</p>
                      <p className="mt-1 text-sm text-[#374151]">
                        {formatDateForDisplay(collectionDetails.deliveryDate)} • {formatTimeForDisplay(collectionDetails.deliveryTime)}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-semibold text-[#3878c2]">Notes</p>
                      <p className="mt-1 text-sm text-[#374151] whitespace-pre-wrap">{notes}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#b4b4b4] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[#3878c2]">Payment Details</h3>
                  <div className={`grid gap-4 ${isBookingConfirmed ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
                    <div>
                      <p className="text-xs font-semibold text-[#3878c2]">Payment Method</p>
                      <p className="mt-1 text-sm text-[#374151]">{paymentDetails.method}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#3878c2]">Reference Number</p>
                      <p className="mt-1 text-sm text-[#374151] break-all">{paymentDetails.referenceNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#3878c2]">Payment Status</p>
                      <p className="mt-1 text-sm text-[#374151]">{paymentDetails.status}</p>
                    </div>
                    {isBookingConfirmed && (
                      <div>
                        <p className="text-xs font-semibold text-[#3878c2]">Amount to Pay</p>
                        <p className="mt-1 text-sm text-[#374151]">
                          {typeof paymentDetails.amountToPay === "number"
                            ? `₱${paymentDetails.amountToPay.toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "Not set"}
                        </p>
                      </div>
                    )}
                  </div>

                  {isBookingConfirmed && (
                    <>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
                        <div className="w-full sm:max-w-xs">
                          <label htmlFor="amount-to-pay" className="mb-1 block text-xs font-semibold text-[#3878c2]">
                            Staff Input: Amount to Pay
                          </label>
                          <input
                            id="amount-to-pay"
                            type="number"
                            min="1"
                            step="0.01"
                            value={amountDrafts[selectedBooking.id] || ""}
                            disabled={isPaymentConfirmed}
                            onChange={(event) => {
                              setAmountError("");
                              setAmountDrafts((prev) => ({
                                ...prev,
                                [selectedBooking.id]: event.target.value,
                              }));
                            }}
                            placeholder="Enter total amount"
                            className={`h-10 w-full rounded-md border border-[#b4b4b4] px-3 text-sm ${
                              isPaymentConfirmed ? "cursor-not-allowed bg-gray-100 text-gray-500" : "text-[#374151]"
                            }`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => saveAmountToPay(selectedBooking.id)}
                          disabled={isPaymentConfirmed}
                          className={`h-10 rounded-md px-4 text-sm font-semibold text-white ${
                            isPaymentConfirmed ? "cursor-not-allowed bg-[#9ca3af]" : "bg-[#4bad40]"
                          }`}
                        >
                          Save Amount
                        </button>
                      </div>
                      {isPaymentConfirmed ? (
                        <p className="mt-2 text-xs text-[#374151]">Amount is locked because payment is already confirmed.</p>
                      ) : null}
                      {amountError ? <p className="mt-2 text-xs text-[#ff0000]">{amountError}</p> : null}
                    </>
                  )}
                </section>

                <section className="rounded-2xl border border-[#b4b4b4] p-4">
                  <h3 className="mb-4 text-sm font-semibold text-[#3878c2]">Booking Progress</h3>
                  <VerticalStepper steps={selectedBooking.timeline} />
                </section>
              </div>
            </div>
          </div>
        );
      })()}

      <BottomNavbar />
    </div>
  );
}