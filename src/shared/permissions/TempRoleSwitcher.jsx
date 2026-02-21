import { useNavigate } from 'react-router-dom';

export default function RoleTestingPanel() {
  const navigate = useNavigate();

  const roles = [
    { label: 'Guest View', path: '/guest' },
    { label: 'User View', path: '/user' },
    { label: 'Rider View', path: '/rider' },
    { label: 'Staff View', path: '/staff' },
    { label: 'Admin View', path: '/admin' },
  ];

  return (
    <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-2xl">
        <div className="md:rounded-2xl md:border md:border-[#e6eef8] md:bg-white md:px-10 md:py-10 md:shadow-sm">

          <h1 className="text-center text-xl font-semibold text-[#3878c2] mb-8">
            Temporary Role Testing Panel
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {roles.map((role) => (
              <button
                key={role.label}
                onClick={() => navigate(role.path)}
                className="
                  px-6 py-2
                  rounded
                  text-sm font-semibold
                  bg-[#4bad40]
                  text-white
                  hover:bg-[#45a338]
                  transition-colors
                "
              >
                {role.label}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
