import { useNavigate } from 'react-router-dom';
import TopNavbar from '../../shared/navigation/TopNavbar';
import BottomNavbar from '../../shared/navigation/BottomNavbar';

const menuItems = [
	{ label: 'Manage Bookings', path: '/admin/manage-bookings' },
	{ label: 'Manage Employees', path: '/admin/manage-employees' },
	{ label: 'Manage Services', path: '/admin/manage-services' },
	{ label: 'Manage Users', path: '/admin/manage-users' },
	{ label: 'Reports', path: '/admin/reports' },
];

export default function AdminDashboard() {
	const navigate = useNavigate();

	return (
		<div className="relative flex min-h-screen flex-col bg-white">
			<main className="relative flex flex-1 flex-col pb-24">
				<div className="relative h-64 w-full overflow-hidden md:h-80 lg:h-96">
					<img
						src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80"
						alt="Laundry Shop"
						className="h-full w-full object-cover"
					/>
					<div className="absolute inset-0 flex flex-col items-center justify-center bg-herland-blue/50 p-4 text-center">
						<h1 className="mb-2 text-xl font-bold leading-tight text-white drop-shadow-lg md:text-3xl lg:text-4xl">
							This is the Admin Dashboard!
						</h1>
						<h2 className="text-lg font-bold leading-tight text-white drop-shadow-lg md:text-2xl lg:text-3xl">
							What do you want to do today?
						</h2>
					</div>
				</div>

				<div className="mx-auto w-full max-w-md flex-1 px-6 py-8 md:max-w-3xl lg:max-w-5xl">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
						{menuItems.map((item) => (
							<button
								key={item.path}
								type="button"
								className="w-full rounded-full border-none bg-herland-green px-6 py-4 text-sm font-semibold text-white shadow-md outline-none transition-all hover:opacity-90 active:scale-95 md:text-base"
								onClick={() => navigate(item.path)}
							>
								{item.label}
							</button>
						))}
					</div>
				</div>
			</main>

			<BottomNavbar />
		</div>
	);
}
