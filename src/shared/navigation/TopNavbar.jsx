import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getRoleNavigation } from './navItems';

export default function TopNavbar({
  showBack = false,
  rightContent = null,
  className = '',
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navItems = getRoleNavigation(location.pathname);

  const handleNavItemClick = (item) => {
    if (!item.sectionId) {
      if (item.path === '/landing' && location.pathname === '/landing') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      navigate(item.path);
      return;
    }

    if (location.pathname !== '/landing') {
      navigate('/landing');
      setTimeout(() => {
        const section = document.getElementById(item.sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    const section = document.getElementById(item.sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`sticky top-0 z-50 ${className}`}>
      <div className="navbar bg-base-100 w-full max-w-6xl mx-auto px-5 sm:px-6 md:px-8 xl:px-12 shadow-sm flex items-center">
        <div className="flex-1 flex items-center">
        {showBack ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-square"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="#3878c2"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigate('/landing')}
              className="btn btn-ghost px-0 lg:hidden"
              aria-label="Go to landing page"
            >
              <img
                src="/images/SecondaryLogo.png"
                alt="Herland Laundry"
                className="h-10"
              />
            </button>

            <div className="hidden w-full lg:flex lg:items-center">
              <button
                type="button"
                onClick={() => navigate('/landing')}
                className="btn btn-ghost px-0"
                aria-label="Go to landing page"
              >
                <img
                  src="/images/SecondaryLogo.png"
                  alt="Herland Laundry"
                  className="h-10"
                />
              </button>

              <div className="flex-1 flex items-center justify-evenly px-4 xl:px-10">
                {navItems.map((item) => (
                  <button
                    key={`${item.label}-${item.path}`}
                    type="button"
                    onClick={() => handleNavItemClick(item)}
                    className="btn btn-ghost text-[#3878c2]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                className="btn btn-square btn-ghost shrink-0"
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="#3878c2"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </button>
            </div>
          </>
        )}
        </div>

        <div className={`flex-none ${showBack ? '' : 'lg:hidden'}`}>
          {rightContent ? (
            rightContent
          ) : (
            <button
              className="btn btn-square btn-ghost lg:hidden"
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="#3878c2"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
}
