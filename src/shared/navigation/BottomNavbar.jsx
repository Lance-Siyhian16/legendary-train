import { useLocation, useNavigate } from 'react-router-dom';
import { getRoleNavigation } from './navItems';

export default function BottomNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = getRoleNavigation(location.pathname);

  const isActivePath = (path) => {
    if (path === '/landing') {
      return location.pathname === '/landing' || location.pathname === '/guest';
    }

    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/user';
    }

    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavItemClick = (item) => {
    if (!item.sectionId) {
      if (item.path === '/landing' && location.pathname === '/landing') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate(item.path);
      }
      return;
    }

    navigate('/landing');
    setTimeout(() => {
      const section = document.getElementById(item.sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full -translate-x-1/2 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:px-4 sm:pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden">
      <div className="mx-auto w-full max-w-lg sm:max-w-xl md:max-w-4xl lg:max-w-5xl">
        <div className="flex items-center justify-between gap-1 bg-[#63bce6] px-2 py-2 text-white shadow-lg sm:px-3">
          {navItems.map((item) => (
            <button
              key={`${item.label}-${item.path}`}
              className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] sm:text-[11px] font-semibold transition-colors ${
                isActivePath(item.path) ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              onClick={() => handleNavItemClick(item)}
            >
              {item.icon ? item.icon : null}
              <span className="leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
