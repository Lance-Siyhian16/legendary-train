export default function InfoCard({
  id,
  name,
  subtitle,
  meta,
  mode,
  item,
  isExpanded,
  isEditing,
  editData,
  onToggleExpand,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onInputChange,
  onDelete,
  onTogglePassword,
  isPasswordVisible,
  panelVariant = 'blue',
}) {
  const isBluePanel = panelVariant === 'blue';

  return (
    <div className="w-full rounded-2xl border border-[#3878c2] bg-white shadow-sm overflow-hidden transition hover:shadow-lg hover:scale-[1.01] flex">
      <div className={`flex items-center justify-center w-16 shrink-0 ${isBluePanel ? 'bg-[#63bce6]' : 'bg-white'}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke={isBluePanel ? '#fff' : '#3878c2'}
          className={`h-auto ${isBluePanel ? 'w-10' : 'w-8'}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-2 min-w-0">
        <button onClick={() => onToggleExpand(id)} className="text-left w-full">
          <h2 className="text-sm font-semibold text-[#3878c2] break-words">{name}</h2>
          {subtitle && <p className="text-sm text-[#374151] mt-0.5">{subtitle}</p>}
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className="text-sm text-[#374151]">{meta}</p>
            <p className="text-[10px] font-bold text-[#3878c2] whitespace-nowrap">{isExpanded ? 'Collapse' : 'Expand'}</p>
          </div>
        </button>

        {isExpanded && (
          <div className="mt-4 border-t border-[#b4b4b4] pt-3">
            {mode === 'employee' && (
              isEditing ? (
                <div className="flex flex-col gap-2">
                  <input
                    name="name"
                    value={editData?.name || ''}
                    onChange={onInputChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-[#3878c2]"
                    placeholder="Name"
                  />
                  <select
                    name="role"
                    value={editData?.role || 'staff'}
                    onChange={onInputChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-[#3878c2]"
                  >
                    <option value="staff">Staff</option>
                    <option value="rider">Rider</option>
                  </select>
                  <input
                    name="phone"
                    value={editData?.phone || ''}
                    onChange={onInputChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-[#3878c2]"
                    placeholder="Phone"
                  />
                  <input
                    name="email"
                    value={editData?.email || ''}
                    onChange={onInputChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-[#3878c2]"
                    placeholder="Email"
                  />

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={onCancelEditing}
                      className="flex-1 py-1.5 bg-[#ff0000] text-white rounded-full text-xs font-bold hover:opacity-90 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onSaveEdit}
                      className="flex-1 py-1.5 bg-[#63bce6] text-white rounded-full text-xs font-bold hover:opacity-90 transition"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1 text-sm">
                  <p>
                    <span className="font-semibold text-[#3878c2]">Phone:</span> {item?.phone}
                  </p>
                  <p>
                    <span className="font-semibold text-[#3878c2]">Email:</span> {item?.email}
                  </p>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => onDelete(id)}
                      className="flex-1 py-1.5 bg-[#ff0000] text-white rounded-full text-xs font-bold hover:opacity-90 transition"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => onStartEditing(item)}
                      className="flex-1 py-1.5 bg-[#63bce6] text-white rounded-full text-xs font-bold hover:opacity-90 transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )
            )}

            {mode === 'user' && (
              isEditing ? (
                <div className="flex flex-col gap-2">
                  <input
                    name="name"
                    value={editData?.name || ''}
                    onChange={onInputChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-[#3878c2]"
                    placeholder="Name"
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#3878c2]">Role:</label>
                    <div className="flex gap-2">
                      {/* Checkbox for "Set as Employee" */}
                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                          <input
                            type="checkbox"
                            checked={editData?.role === 'staff'}
                            onChange={(e) => {
                              const newRole = e.target.checked ? 'staff' : 'customer';
                              onInputChange({ target: { name: 'role', value: newRole } });
                            }}
                            className="w-4 h-4 text-[#3878c2] border-gray-300 rounded focus:ring-[#3878c2]"
                          />
                          <span className="text-sm text-gray-700">Set as Employee</span>
                        </label>
                    </div>
                  </div>
                  <input
                    name="id"
                    value={editData?.id || ''}
                    onChange={onInputChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-[#3878c2]"
                    placeholder="ID"
                  />
                  <input
                    name="address"
                    value={editData?.address || ''}
                    onChange={onInputChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-[#3878c2]"
                    placeholder="Address"
                  />
                  <input
                    name="phone"
                    value={editData?.phone || ''}
                    onChange={onInputChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-[#3878c2]"
                    placeholder="Phone"
                  />
                  <input
                    name="password"
                    value={editData?.password || ''}
                    onChange={onInputChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-[#3878c2]"
                    placeholder="Password"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={onCancelEditing}
                      className="flex-1 py-1.5 bg-gray-400 text-white rounded-full text-xs font-bold hover:opacity-90 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onSaveEdit}
                      className="flex-1 py-1.5 bg-[#4bad40] text-white rounded-full text-xs font-bold hover:opacity-90 transition"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1 text-sm">
                  <p>
                    <span className="font-semibold text-[#3878c2]">Role:</span> <span className="capitalize">{item?.role || 'Customer'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-[#3878c2]">Phone:</span> {item?.phone}
                  </p>
                  <p>
                    <span className="font-semibold text-[#3878c2]">Address:</span> {item?.address}
                  </p>
                  <p>
                    <span className="font-semibold text-[#3878c2]">Password:</span> {isPasswordVisible ? item?.password : '********'}
                    <button
                      onClick={() => onTogglePassword(id)}
                      className="text-[#3878c2] ml-2 text-xs hover:text-blue-700"
                    >
                      {isPasswordVisible ? 'Hide' : 'Show'}
                    </button>
                  </p>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => onDelete(id)}
                      className="flex-1 py-1.5 bg-[#ff0000] text-white rounded-full text-xs font-bold hover:opacity-90 transition"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => onStartEditing(item)}
                      className="flex-1 py-1.5 bg-[#3878c2] text-white rounded-full text-xs font-bold hover:opacity-90 transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
