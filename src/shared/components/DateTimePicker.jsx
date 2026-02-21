export default function DateTimePicker({
	mode = "date",
	value,
	onChange,
	min,
	max,
	required = false,
}) {
	const isDate = mode === "date";

	return (
		<div className="relative w-full max-w-md md:max-w-full">
			<div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
				{isDate ? (
					<svg
						className="w-4 h-4 text-[#3878c2]"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"
						/>
					</svg>
				) : (
					<svg
						className="w-4 h-4 text-[#3878c2]"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
						/>
					</svg>
				)}
			</div>

			<input
				type={isDate ? "date" : "time"}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				min={min}
				max={max}
				className={`${isDate ? "date-input" : "time-input"} block w-full ps-3 pe-9 py-2.5 bg-neutral-secondary-medium border border-[#3878c2] text-[#3878c2] text-sm rounded-lg focus:outline-none focus:ring-[#3878c2] focus:border-[#3878c2]`}
				required={required}
			/>
		</div>
	);
}
