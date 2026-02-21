import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    phone: "09123456789",
    email: "member@herland.com",
    password: "password",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
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
            <h1 className="text-2xl font-semibold">My Profile</h1>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#3878c2] px-3 py-1 text-xs font-semibold text-[#3878c2]"
          >
            Edit
          </button>
        </div>

        <div className="text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#eaf2fb] text-[#3878c2]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-10 w-10"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#3878c2]">{formData.firstName} {formData.lastName}</p>
          </div>

          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            {/* First Name */}
            <div className="flex items-center justify-between rounded-xl bg-[#f5f9fd] px-3 py-2">
              <span className="text-[#374151]">First Name</span>
              <span className="font-semibold text-[#3878c2]">{formData.firstName}</span>
            </div>

            {/* Last Name */}
            <div className="flex items-center justify-between rounded-xl bg-[#f5f9fd] px-3 py-2">
              <span className="text-[#374151]">Last Name</span>
              <span className="font-semibold text-[#3878c2]">{formData.lastName}</span>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between rounded-xl bg-[#f5f9fd] px-3 py-2">
              <span className="text-[#374151]">Phone</span>
              <span className="font-semibold text-[#3878c2]">{formData.phone}</span>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between rounded-xl bg-[#f5f9fd] px-3 py-2">
              <span className="text-[#374151]">Email</span>
              <span className="font-semibold text-[#3878c2]">{formData.email}</span>
            </div>

            {/* Password */}
            <div className="mb-1 relative rounded-xl bg-[#f5f9fd] px-3 py-2 md:col-span-1">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full outline-none bg-transparent text-sm font-semibold text-[#3878c2] placeholder-[#374151]"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 cursor-pointer"
              >
                {showPassword ? (
                  // Eye Slash Icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="#3878c2"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  // Eye Icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="#3878c2"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
