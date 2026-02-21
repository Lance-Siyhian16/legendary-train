import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'


const now = new Date().toISOString()

const fallbackBookings = [
	{
		id: 'REF-20260215-001',
		customerName: 'Juan Dela Cruz',
		collectionOption: 'dropOffPickUpLater',
		collectionDetails: {
			collectionDate: now,
			collectionTime: '09:00',
			deliveryDate: now,
			deliveryTime: '15:00',
			pickupAddress: 'Herland Laundry - Main Branch',
			deliveryAddress: 'Herland Laundry - Main Branch',
		},
	},
	{
		id: 'REF-20260215-002',
		customerName: 'Maria Santos',
		collectionOption: 'dropOffDelivered',
		collectionDetails: {
			collectionDate: now,
			collectionTime: '10:00',
			deliveryDate: now,
			deliveryTime: '16:30',
			pickupAddress: 'Herland Laundry - Main Branch',
			deliveryAddress: 'Customer address (delivery)',
		},
	},
]

export default function RiderDashboard() {
	const navigate = useNavigate()
	const [bookings] = useState(fallbackBookings)
	const [expandedId, setExpandedId] = useState(null)

	const riderBookings = useMemo(
		() =>
			bookings.map((booking, index) => {
				const fallbackRoute = getRouteAddresses(booking)
				const collectionDetails = booking.collectionDetails || {}

				return {
					id: booking.id || `booking-${index + 1}`,
					customerName: booking.customerName || 'Customer',
					pickupAddress: collectionDetails.pickupAddress || fallbackRoute.pickupAddress,
					pickupDate: collectionDetails.collectionDate || '',
					pickupTime: collectionDetails.collectionTime || '',
					deliveryAddress: collectionDetails.deliveryAddress || fallbackRoute.deliveryAddress,
					deliveryDate: collectionDetails.deliveryDate || '',
					deliveryTime: collectionDetails.deliveryTime || '',
				}
			}),
		[bookings]
	)

	const selectedBooking = useMemo(
		() => riderBookings.find((booking) => booking.id === expandedId) || null,
		[riderBookings, expandedId]
	)

	const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id))

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
					<h1 className="text-2xl font-semibold">Manage Bookings</h1>
				</header>

				<div className="grid gap-4 md:grid-cols-2">
					{riderBookings.length === 0 && (
						<p className="col-span-full text-sm text-[#374151]">No bookings available.</p>
					)}

					{riderBookings.map((booking) => (
						<section key={booking.id} className="rounded-2xl border border-[#3878c2] bg-white p-4 shadow-sm">
							<button type="button" onClick={() => toggleExpand(booking.id)} className="w-full text-left">
								<h2 className="text-base font-semibold text-[#3878c2]">{booking.customerName}</h2>
							</button>

							<div className="mt-4 grid gap-4 sm:grid-cols-2">
								<div>
									<p className="text-xs font-semibold text-[#3878c2]">Pickup From</p>
									<p className="mt-1 text-sm text-[#374151]">{booking.pickupAddress || '-'}</p>
									<p className="mt-1 text-xs text-[#374151]">
										{formatDate(booking.pickupDate)} • {formatTime(booking.pickupTime)}
									</p>
								</div>

								<div>
									<p className="text-xs font-semibold text-[#3878c2]">Deliver To</p>
									<p className="mt-1 text-sm text-[#374151]">{booking.deliveryAddress || '-'}</p>
									<p className="mt-1 text-xs text-[#374151]">
										{formatDate(booking.deliveryDate)} • {formatTime(booking.deliveryTime)}
									</p>
								</div>
							</div>

							<div className="mt-4 rounded-xl border border-[#b4b4b4] bg-white p-4">
								<p className="text-xs font-semibold text-[#3878c2]">Map</p>
								<div className="mt-2 min-h-28 rounded-lg border border-[#b4b4b4] bg-white" aria-label="Map placeholder" />
							</div>

							{expandedId === booking.id && (
								<p className="mt-3 text-xs text-[#374151]">Expanded in full-screen view.</p>
							)}
						</section>
					))}
				</div>
			</div>

			{selectedBooking && (
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

						<div className="bg-white">
							<h2 className="text-base font-semibold text-[#3878c2]">{selectedBooking.customerName}</h2>

							<div className="mt-4 grid gap-4 md:grid-cols-2">
								<div>
									<p className="text-xs font-semibold text-[#3878c2]">Pickup From</p>
									<p className="mt-1 text-sm text-[#374151]">{selectedBooking.pickupAddress || '-'}</p>
									<p className="mt-1 text-xs text-[#374151]">
										{formatDate(selectedBooking.pickupDate)} • {formatTime(selectedBooking.pickupTime)}
									</p>
								</div>

								<div>
									<p className="text-xs font-semibold text-[#3878c2]">Deliver To</p>
									<p className="mt-1 text-sm text-[#374151]">{selectedBooking.deliveryAddress || '-'}</p>
									<p className="mt-1 text-xs text-[#374151]">
										{formatDate(selectedBooking.deliveryDate)} • {formatTime(selectedBooking.deliveryTime)}
									</p>
								</div>
							</div>

							<div className="mt-5 rounded-2xl border border-[#b4b4b4] p-4">
								<p className="text-xs font-semibold text-[#3878c2]">Map</p>
								<div className="mt-2 min-h-40 rounded-lg border border-[#b4b4b4] bg-white" aria-label="Map placeholder" />
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
