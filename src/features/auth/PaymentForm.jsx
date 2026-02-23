import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const API_BASE = 'http://localhost:5000/api/v1/customer';

export default function PaymentForm() {
	const location = useLocation();
	const bookingReference = location.state?.bookingReference || '';
	const amountToPayFromState = location.state?.amountToPay;
	const paymentReferenceFromState = location.state?.paymentReference || '';

	const [referenceNumber, setReferenceNumber] = useState(paymentReferenceFromState);
	const [amountToPay, setAmountToPay] = useState(amountToPayFromState || 0);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState('');

	const fetchBookingDetails = useCallback(async () => {
		if (!bookingReference) return;

		try {
			const { data: { session } } = await supabase.auth.getSession();
			const token = session?.access_token;

			if (!token) return;

			const response = await fetch(`${API_BASE}/my-bookings/${encodeURIComponent(bookingReference)}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				// Update local state if backend has more recent data
				if (data.paymentDetails) {
					if (typeof data.paymentDetails.amountToPay === 'number') {
						setAmountToPay(data.paymentDetails.amountToPay);
					}
					if (data.paymentDetails.referenceNumber && data.paymentDetails.referenceNumber !== '-' && !referenceNumber) {
						setReferenceNumber(data.paymentDetails.referenceNumber);
					}
				}
                setError('');
			} else if (response.status === 404) {
                setError(`Booking ${bookingReference} not found. Please verify the reference number.`);
            } else {
                setError('Failed to load booking details.');
            }
		} catch (err) {
			console.error('Error fetching booking details:', err);
            setError('Could not connect to the server.');
		}
	}, [bookingReference, referenceNumber]);

	useEffect(() => {
		fetchBookingDetails();
		// Polling for amount updates every 10 seconds
		const interval = setInterval(fetchBookingDetails, 10000);
		return () => clearInterval(interval);
	}, [fetchBookingDetails]);

	const isValidReference = useMemo(
		() => /^[A-Za-z0-9-]{6,30}$/.test(referenceNumber.trim()),
		[referenceNumber]
	);

	const canSubmit = isValidReference && !submitting;

	const formattedAmount =
		typeof amountToPay === 'number' && amountToPay > 0
			? `₱${amountToPay.toLocaleString('en-PH', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
			  })}`
			: null;

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!canSubmit) return;

		setSubmitting(true);
		setError('');

		try {
			const { data: { session } } = await supabase.auth.getSession();
			const token = session?.access_token;

			const response = await fetch(`${API_BASE}/my-bookings/${encodeURIComponent(bookingReference)}/payment-reference`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ referenceNumber: referenceNumber.trim() }),
			});

			if (response.ok) {
				setSubmitted(true);
			} else {
				const data = await response.json();
				setError(data.error || 'Failed to update payment reference');
			}
		} catch (err) {
			console.error('Error updating payment reference:', err);
			setError('Could not connect to the server. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-[calc(100vh-9rem)] bg-white px-4 py-6 md:px-6">
			<div className="mx-auto w-full max-w-2xl rounded-xl border border-[#e6eef8] bg-white p-5 text-[#3878c2] shadow-sm md:p-6">
				<h1 className="text-xl font-semibold">Payment Submission</h1>

				{error && (
					<div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
						{error}
					</div>
				)}

				<div className="mt-4 rounded-lg border border-[#d9e8fb] bg-[#f9fcff] p-4">
					<div className="grid gap-3 md:grid-cols-2">
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-[#3878c2]">
								Booking Reference
							</p>
							<p className="mt-1 text-sm font-semibold text-[#3878c2]">{bookingReference || '-'}</p>
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-[#3878c2]">
								Amount to Pay
							</p>
							<p className="mt-1 text-sm font-semibold text-[#3878c2]">
								{formattedAmount || 'Waiting for staff to input your total amount.'}
							</p>
						</div>
					</div>
				</div>

				<form className="mt-5 space-y-4" onSubmit={handleSubmit}>
					<div>
						<label
							htmlFor="gcashReference"
							className="mb-1 block text-sm font-semibold"
						>
							GCash Reference Number
						</label>
						<input
							id="gcashReference"
							type="text"
							value={referenceNumber}
							onChange={(event) => {
								setSubmitted(false);
								setReferenceNumber(event.target.value);
							}}
							disabled={submitting}
							placeholder="Enter your GCash reference number"
							className="w-full rounded border border-[#3878c2] px-3 py-2 text-sm font-semibold text-[#3878c2] placeholder-[#b4b4b4] outline-none disabled:opacity-50"
						/>
						{referenceNumber && !isValidReference ? (
							<p className="mt-1 text-xs text-[#e55353]">
								Enter 6-30 characters using letters, numbers, or hyphens only.
							</p>
						) : null}
					</div>

					<p className="text-sm font-semibold text-[#3878c2]">
						Please send your payment screenshot via Viber: 09XXXXXXXXX
					</p>
					<p className="text-sm font-semibold text-[#4bad40]">
						I understand that my booking will only be processed once payment is
						verified.
					</p>

					<button
						type="submit"
						disabled={!canSubmit}
						className={`w-full rounded py-2 text-sm font-semibold text-white transition ${
							canSubmit
								? 'bg-[#4bad40] hover:bg-[#45a338]'
								: 'cursor-not-allowed bg-[#b4b4b4]'
						}`}
					>
						{submitting ? 'Submitting...' : 'Submit GCash Reference'}
					</button>
				</form>

				{submitted ? (
					<div className="mt-5 rounded-lg border border-[#d9e8fb] bg-[#f5fbff] p-4">
						<p className="text-sm font-semibold text-[#3878c2]">
							Submitted successfully. Staff will now mark your payment status as
							either <span className="font-bold">Payment Confirmed</span> or{' '}
							<span className="font-bold">Payment Flagged</span> after
							verification.
						</p>
					</div>
				) : null}
			</div>
		</div>
	);
}
