import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

function readAmountToPayFromStorage(bookingReference) {
	if (!bookingReference) return null;

	try {
		const raw = localStorage.getItem('hlBookings');
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return null;

		const matchedBooking = parsed.find((booking) => booking.id === bookingReference);
		const storedAmount = matchedBooking?.paymentDetails?.amountToPay;

		if (typeof storedAmount === 'number') return storedAmount;
		if (typeof storedAmount === 'string' && storedAmount.trim() !== '') {
			const converted = Number(storedAmount);
			return Number.isNaN(converted) ? null : converted;
		}

		return null;
	} catch {
		return null;
	}
}

function readPaymentReferenceFromStorage(bookingReference) {
	if (!bookingReference) return '';

	try {
		const raw = localStorage.getItem('hlBookings');
		if (!raw) return '';
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return '';

		const matchedBooking = parsed.find((booking) => booking.id === bookingReference);
		const storedReference = matchedBooking?.paymentDetails?.referenceNumber;

		if (storedReference === undefined || storedReference === null) return '';
		if (storedReference === '-') return '';
		return String(storedReference);
	} catch {
		return '';
	}
}

function savePaymentReferenceToStorage(bookingReference, referenceNumber) {
	if (!bookingReference) return false;

	try {
		const raw = localStorage.getItem('hlBookings');
		if (!raw) return false;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return false;

		let hasMatch = false;
		const normalizedReference = referenceNumber.trim();

		const updated = parsed.map((booking) => {
			if (booking.id !== bookingReference) return booking;
			hasMatch = true;

			return {
				...booking,
				paymentDetails: {
					...(booking.paymentDetails || {}),
					referenceNumber: normalizedReference,
				},
			};
		});

		if (!hasMatch) return false;

		localStorage.setItem('hlBookings', JSON.stringify(updated));
		return true;
	} catch {
		return false;
	}
}

export default function PaymentForm() {
	const location = useLocation();
	const bookingReference = location.state?.bookingReference || '';
	const amountToPayFromState = location.state?.amountToPay;
	const paymentReference = location.state?.paymentReference || '';
	const [referenceNumber, setReferenceNumber] = useState(
		paymentReference || readPaymentReferenceFromStorage(bookingReference)
	);
	const [submitted, setSubmitted] = useState(false);
	const [amountToPay, setAmountToPay] = useState(() => {
		if (typeof amountToPayFromState === 'number') return amountToPayFromState;
		return readAmountToPayFromStorage(bookingReference);
	});

	useEffect(() => {
		if (typeof amountToPayFromState === 'number') {
			setAmountToPay(amountToPayFromState);
			return;
		}

		setAmountToPay(readAmountToPayFromStorage(bookingReference));
	}, [amountToPayFromState, bookingReference]);

	useEffect(() => {
		if (!bookingReference) return;

		const intervalId = setInterval(() => {
			setAmountToPay(readAmountToPayFromStorage(bookingReference));
		}, 5000);

		return () => clearInterval(intervalId);
	}, [bookingReference]);

	useEffect(() => {
		if (!bookingReference) return;
		if (paymentReference) return;

		const storedReference = readPaymentReferenceFromStorage(bookingReference);
		if (storedReference) {
			setReferenceNumber(storedReference);
		}
	}, [bookingReference, paymentReference]);

	const isValidReference = useMemo(
		() => /^[A-Za-z0-9-]{6,30}$/.test(referenceNumber.trim()),
		[referenceNumber]
	);

	const canSubmit = isValidReference;

	const formattedAmount =
		typeof amountToPay === 'number'
			? `₱${amountToPay.toLocaleString('en-PH', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
			  })}`
			: null;

	const handleSubmit = (event) => {
		event.preventDefault();
		if (!canSubmit) return;

		savePaymentReferenceToStorage(bookingReference, referenceNumber);
		setReferenceNumber(referenceNumber.trim());
		setSubmitted(true);
	};

	return (
		<div className="min-h-[calc(100vh-9rem)] bg-white px-4 py-6 md:px-6">
			<div className="mx-auto w-full max-w-2xl rounded-xl border border-[#e6eef8] bg-white p-5 text-[#3878c2] shadow-sm md:p-6">
				<h1 className="text-xl font-semibold">Payment Submission</h1>

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
							placeholder="Enter your GCash reference number"
							className="w-full rounded border border-[#3878c2] px-3 py-2 text-sm font-semibold text-[#3878c2] placeholder-[#b4b4b4] outline-none"
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
						Submit GCash Reference
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
