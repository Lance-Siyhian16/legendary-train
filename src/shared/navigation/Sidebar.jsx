import { useNavigate, useLocation } from 'react-router-dom';
import { getRoleNavigation } from './navItems';

export default function Sidebar({
    variant = 'drawer',
    isOpen = false,
    onClose = () => {},
    className = '',
}) {
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
            onClose();
            return;
        }

        navigate('/landing');
        setTimeout(() => {
            const section = document.getElementById(item.sectionId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
        onClose();
    };

    if (variant === 'desktop') {
        return (
            <aside className={`hidden lg:block ${className}`}>
                <div className="sticky top-20">
                    <div className="rounded-2xl bg-white p-2">
                        <div className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = isActivePath(item.path);
                                return (
                                    <button
                                        key={`${item.label}-${item.path}`}
                                        type="button"
                                        onClick={() => handleNavItemClick(item)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                                            isActive
                                                ? 'bg-[#63bce6]/20 text-[#3878c2]'
                                                : 'text-[#3878c2] hover:bg-[#63bce6]/10'
                                        }`}
                                    >
                                        {item.icon ? (
                                            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#f0f6ff] text-[#3878c2]">
                                                {item.icon}
                                            </span>
                                        ) : null}
                                        <span className="whitespace-nowrap">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-64 bg-white z-50 shadow-lg transform transition-transform ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Logo */}
                <div className="p-4 border-b border-gray-200">
                    <img
                        src="/images/PrimaryLogo.png"
                        alt="Herland Laundry"
                        className="w-32 mx-auto"
                    />
                </div>

                {/* Menu */}
                <nav className="py-4 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={`${item.label}-${item.path}`}
                            onClick={() => handleNavItemClick(item)}
                            className="flex w-full items-center gap-3 px-6 py-3 text-left text-[#3878c2] font-medium hover:bg-[#3878c2]/10 transition"
                        >
                            {item.icon ? <span className="text-[#3878c2]">{item.icon}</span> : null}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </>
    );
}
