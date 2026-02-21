import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    requiredFields: '',
    confirmPassword: '',
  });

  const [isValid, setIsValid] = useState(false);

  // State for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Password condition checks
  const passwordConditions = {
    length: /.{8,}/,
    lowercase: /[a-z]/,
    uppercase: /[A-Z]/,
    number: /\d/,
    specialChar: /[^A-Za-z0-9]/,
  };

  const checkPasswordConditions = (password) => ({
    length: passwordConditions.length.test(password),
    lowercase: passwordConditions.lowercase.test(password),
    uppercase: passwordConditions.uppercase.test(password),
    number: passwordConditions.number.test(password),
    specialChar: passwordConditions.specialChar.test(password),
  });

  const passwordStatus = checkPasswordConditions(formData.password);

  useEffect(() => {
    const requiredFieldsFilled =
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.phoneNumber.trim() &&
      formData.password.trim() &&
      formData.confirmPassword.trim();

    setErrors({
      requiredFields: requiredFieldsFilled ? '' : 'Please fill out the required fields',
      confirmPassword:
        formData.password &&
        formData.confirmPassword &&
        formData.password !== formData.confirmPassword
          ? 'Passwords do not match'
          : '',
    });

    const allValid =
      requiredFieldsFilled &&
      Object.values(passwordStatus).every(Boolean) &&
      formData.password === formData.confirmPassword;

    setIsValid(allValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, submitError: '' }));

    try {
      const payload = {
        email: formData.email || undefined,
        phone: formData.phoneNumber,
        password: formData.password,
        metadata: {
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phoneNumber,
        },
      };

      const response = await fetch('http://localhost:5000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        console.log('Registration successful:', data);
        sessionStorage.setItem('registeredEmail', formData.email || formData.phoneNumber);
        navigate('/'); 
      } else {
        // Backend returned an error (e.g., rate limit, email exists)
        console.warn('Backend registration failed:', data.error);
        alert(`Registration failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-9rem)] overflow-hidden flex items-center justify-center bg-[#ffffff] px-4 md:px-6">
      <div className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl space-y-0">
        <h1 className="text-center text-lg font-semibold text-[#3878c2] mb-6 sm:text-xl">
          Hello! Let's sign you up!
        </h1>

        <form onSubmit={handleSubmit}>
          {/* First Name */}
          <div className="mb-3">
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              className="w-full outline-none border border-[#3878c2] rounded px-3 py-2 text-sm font-semibold text-[#3878c2] placeholder-[#b4b4b4]"
            />
          </div>

          {/* Last Name */}
          <div className="mb-3">
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              className="w-full outline-none border border-[#3878c2] rounded px-3 py-2 text-sm font-semibold text-[#3878c2] placeholder-[#b4b4b4]"
            />
          </div>

          {/* Phone Number */}
          <div className="mb-3">
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full outline-none border border-[#3878c2] rounded px-3 py-2 text-sm font-semibold text-[#3878c2] placeholder-[#b4b4b4]"
            />
          </div>

          {/* Email (Optional) */}
          <div className="mb-3">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address (optional)"
              className="w-full outline-none border border-[#3878c2] rounded px-3 py-2 text-sm font-semibold text-[#3878c2] placeholder-[#b4b4b4]"
            />
          </div>

          {/* Password */}
          <div className="mb-1 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full outline-none border border-[#3878c2] rounded px-3 py-2 text-sm font-semibold text-[#3878c2] placeholder-[#b4b4b4]"
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

          {/* Password Conditions */}
          <ul className="text-xs sm:text-sm text-[#ff0000] mb-3 list-none">
            {!passwordStatus.length && <li>Must have at least 8 characters</li>}
            {!passwordStatus.lowercase && <li>Must contain a lowercase letter</li>}
            {!passwordStatus.uppercase && <li>Must contain an uppercase letter</li>}
            {!passwordStatus.number && <li>Must contain a number</li>}
            {!passwordStatus.specialChar && <li>Must contain a special character</li>}
          </ul>

          {/* Confirm Password */}
          <div className="mb-3 relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="w-full outline-none border border-[#3878c2] rounded px-3 py-2 text-sm font-semibold text-[#3878c2] placeholder-[#b4b4b4]"
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 cursor-pointer"
            >
              {showConfirmPassword ? (
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

            {/* Error Messages */}
            {errors.requiredFields && (
              <p className="text-xs sm:text-sm text-[#ff0000] mt-1">{errors.requiredFields}</p>
            )}
            {errors.confirmPassword && (
              <p className="text-xs sm:text-sm text-[#ff0000] mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <p className="text-xs sm:text-sm text-[#4bad40] mb-3 text-center">
            <strong>
              By signing up, you agree to our <br /> Terms and Conditions and Privacy Policy
            </strong>
          </p>

          {/* Next Button */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full py-2 rounded text-sm font-semibold transition-colors mb-3 ${
              isValid && !isLoading
                ? 'bg-[#4bad40] text-[#ffffff] hover:bg-[#45a338]'
                : 'bg-[#b4b4b4] text-[#ffffff] cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Signing up...' : 'Next'}
          </button>
          
          {/* Back to Login */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-2 rounded text-sm font-semibold text-[#3878c2] border border-[#3878c2] hover:bg-[#f0f0f0] transition-colors"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
