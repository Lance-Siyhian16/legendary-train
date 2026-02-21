export function RadioRow({
	id,
	label,
	checked,
	onChange,
	name = 'radioGroup',
}) {
	return (
		<label
			htmlFor={id}
			className={`flex h-7 items-center rounded px-1.5 select-none cursor-pointer whitespace-nowrap ${
				checked ? 'bg-[#e6f7e6]' : 'bg-white'
			}`}
		>
			<span className="relative w-4 h-4 flex-shrink-0 mr-2">
				<span className="absolute inset-0 rounded-full border border-[#3878c2] bg-white"></span>
				{checked && (
					<span className="absolute top-1 left-1 w-2 h-2 bg-[#3878c2] rounded-full"></span>
				)}
				<input
					id={id}
					type="radio"
					name={name}
					checked={checked}
					onChange={onChange}
					className="absolute w-full h-full opacity-0 cursor-pointer"
				/>
			</span>
			<span className="text-xs font-medium text-[#374151]">{label}</span>
		</label>
	);
}

export function FilterSelect({
	id,
	value,
	onChange,
	options = [],
	className = 'h-10 w-full border border-gray-300 rounded-md px-3 text-sm',
	...rest
}) {
	return (
		<select id={id} value={value} onChange={onChange} className={className} {...rest}>
			{options.map((option) => {
				const normalizedOption =
					typeof option === 'string'
						? { value: option, label: option }
						: option;

				return (
					<option key={normalizedOption.value} value={normalizedOption.value}>
						{normalizedOption.label}
					</option>
				);
			})}
		</select>
	);
}
