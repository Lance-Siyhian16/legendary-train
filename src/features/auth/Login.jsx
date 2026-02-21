import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('email'); // email | mobile
  const [value, setValue] = useState('');
  const [password, setPassword] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation
  useEffect(() => {
    if (!value) {
      setWarning('');
      return;
    }

    if (mode === 'mobile') {
      const phMobileRegex = /^9\d{9}$/;
      setWarning(
        phMobileRegex.test(value)
          ? ''
          : 'Please enter a valid Philippine mobile number'
      );
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setWarning(
        emailRegex.test(value) ? '' : 'Please enter a valid email address'
      );
    }
  }, [value, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (warning || !value || !password) return;

    setLoading(true);
    setError('');

    // Build the identifier: phone numbers need the +63 prefix for Supabase
    const identifier =
      mode === 'mobile' ? `+63${value}` : value;

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: mode === 'email' ? identifier : undefined,
        phone: mode === 'mobile' ? identifier : undefined,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const userId = data.user?.id;

      // Look up role in profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const role = profile?.role || 'Customer';

      // Store role for the route switcher
      window.sessionStorage.setItem('activeRole', role);

      // Redirect based on role
      if (role === 'Admin') navigate('/admin');
      else if (role === 'Staff') navigate('/staff');
      else if (role === 'Rider') navigate('/rider');
      else navigate('/user');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-9rem)] overflow-hidden flex items-center justify-center bg-white px-4 md:px-6">
      <div className="w-full max-w-md md:max-w-lg">
        <div className="md:rounded-2xl md:border md:border-[#e6eef8] md:bg-white md:px-10 md:py-10 md:shadow-sm">

          {/* Logo */}
          <img
            src="/images/PrimaryLogo.png"
            alt="Herland Laundry"
            className="mx-auto mb-3 w-52 sm:w-56 h-auto"
          />

          {/* Welcome */}
          <h1 className="text-center text-lg font-semibold text-[#3878c2] mb-6 sm:text-xl">
            Welcome to Herland Laundry!
          </h1>

          {/* Toggle Buttons */}
          <div className="flex mb-4 overflow-hidden rounded">
            <button
              type="button"
              onClick={() => { setMode('mobile'); setValue(''); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === 'mobile'
                  ? 'bg-[#4bad40] text-white'
                  : 'bg-[#b4b4b4] text-white'
              }`}
            >
              Mobile Number
            </button>
            <button
              type="button"
              onClick={() => { setMode('email'); setValue(''); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === 'email'
                  ? 'bg-[#4bad40] text-white'
                  : 'bg-[#b4b4b4] text-white'
              }`}
            >
              Email Address
            </button>
          </div>

          {/* Helper Text */}
          <p className="text-center text-sm text-[#3878c2] mb-4">
            {mode === 'mobile'
              ? 'Use your mobile number to login'
              : 'Use your email address to login'}
          </p>

          {/* Input Form */}
          <form onSubmit={handleSubmit}>
            {/* Identifier input */}
            <div className="flex items-center border border-[#3878c2] rounded px-3 py-2 mb-3">
              {mode === 'mobile' && (
                <div className="flex items-center mr-3">
                  <span className="text-[#3878c2] text-sm font-semibold select-none">
                    +63
                  </span>
                  <span className="mx-2 h-5 w-px bg-[#3878c2]" />
                </div>
              )}
              <input
                type={mode === 'mobile' ? 'tel' : 'email'}
                value={value}
                onChange={(e) => {
                  let val = e.target.value;
                  if (mode === 'mobile') {
                    val = val.replace(/\D/g, '');
                    if (val.length > 10) val = val.slice(0, 10);
                  }
                  setValue(val);
                }}
                placeholder={
                  mode === 'mobile' ? 'Enter mobile number' : 'Enter email address'
                }
                className="w-full outline-none bg-transparent text-sm font-semibold text-[#3878c2] placeholder-[#b4b4b4] placeholder:font-normal"
              />
            </div>

            {/* Warning for identifier */}
            {warning && (
              <p className="text-xs text-[#ff0000] mb-2">{warning}</p>
            )}

            {/* Password input */}
            <div className="flex items-center border border-[#3878c2] rounded px-3 py-2 mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full outline-none bg-transparent text-sm font-semibold text-[#3878c2] placeholder-[#b4b4b4] placeholder:font-normal"
              />
            </div>

            {/* Auth error */}
            {error && (
              <p className="text-xs sm:text-sm text-[#ff0000] mb-3 text-center">{error}</p>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={!!warning || !value || !password || loading}
              className={`w-full py-2 rounded text-sm font-semibold transition-colors mb-3 ${
                !warning && value && password && !loading
                  ? 'bg-[#4bad40] text-white hover:bg-[#45a338]'
                  : 'bg-[#b4b4b4] text-white cursor-not-allowed'
              }`}
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>

            {/* Sign up link */}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="w-full py-2 rounded text-sm font-semibold text-[#3878c2] border border-[#3878c2] hover:bg-[#f0f0f0] transition-colors"
            >
              Don't have an account? Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
