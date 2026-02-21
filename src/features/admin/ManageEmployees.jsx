import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNavbar from '../../shared/navigation/BottomNavbar'
import InfoCard from '../../shared/components/InfoCard'
import { FilterSelect, RadioRow } from '../../shared/components/OptionInput'
import { supabase } from '../../lib/supabase';

// Mock data for seeding
  const mockemployee = [
    { name: 'Maria Santos', role: 'staff', phone: '09171234567', email: 'maria@herland.com', password: 'password123' },
    { name: 'Ricardo Dalisay', role: 'staff', phone: '09187654321', email: 'ricardo@herland.com', password: 'password123' },
    { name: 'Elena Gilbert', role: 'staff', phone: '09191112222', email: 'elena@herland.com', password: 'password123' },
    { name: 'Stefan Salvatore', role: 'rider', phone: '09203334444', email: 'stefan@herland.com', password: 'password123' },
    { name: 'Bonnie Bennett', role: 'staff', phone: '09215556666', email: 'bonnie@herland.com', password: 'password123' },
  ];

  export default function ManageEmployees() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [filterRole, setFilterRole] = useState('all');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch employees from backend
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch('http://localhost:5000/api/v1/admin/users', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter for ONLY staff, rider, admin
        const mappedEmployees = data
            .filter(u => ['Staff', 'Rider', 'Admin'].includes(u.role)) 
            .map(user => ({
                ...user,
                name: user.full_name || user.name || 'Unknown',
                // Ensure other fields are present
            }));

        setEmployee(mappedEmployees);
      } else {
        console.error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };



  const filteredEmployees = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const roleFiltered =
      filterRole === 'all'
        ? employee
        : employee.filter((member) => member.role === filterRole);

    const searchFiltered =
      normalizedQuery.length === 0
        ? roleFiltered
        : roleFiltered.filter((member) => {
            const name = (member.name || '').toLowerCase();
            const id = (member.id || '').toLowerCase();
            const role = (member.role || '').toLowerCase();
            return (
              name.includes(normalizedQuery) ||
              id.includes(normalizedQuery) ||
              role.includes(normalizedQuery)
            );
          });

    const sorted = [...searchFiltered].sort((a, b) => {
        // Handle potential missing IDs
        const idA = a.id || '';
        const idB = b.id || '';
        return idA.localeCompare(idB, undefined, {
            numeric: true,
            sensitivity: 'base',
        });
    });

    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [employee, filterRole, searchQuery, sortDirection]);

  const toggleExpand = (id) =>
    setExpandedId(expandedId === id ? null : id);

  const startEditing = (member) => {
    setEditingId(member.id);
    setEditData({ ...member });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
     try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const response = await fetch(`http://localhost:5000/api/v1/admin/users/${editingId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                role: editData.role,
                phone: editData.phone,
                email: editData.email,
                name: editData.name,
            })
        });

        if (response.ok) {
            setEmployee((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...editData } : c)));
            setEditingId(null);
            setEditData({});
            // If role changed to customer, it should disappear from this list
            if (editData.role === 'Customer') {
                 setEmployee(prev => prev.filter(c => c.id !== editingId));
            }
        } else {
            console.error('Failed to update role');
            alert('Failed to update role.');
        }
    } catch (error) {
        console.error('Error updating role:', error);
        alert('An error occurred.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch(`http://localhost:5000/api/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        setEmployee((prev) => prev.filter((s) => s.id !== id));
        if (expandedId === id) setExpandedId(null);
      } else {
        alert('Failed to delete employee.');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('An error occurred while deleting.');
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">

        <header className="mb-6 flex items-center gap-2 text-[#3878c2]">
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
          <h1 className="text-2xl font-semibold">Manage Employees</h1>
        </header>

        {/* Filters */}
        <div className="mb-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-[minmax(220px,1fr)_160px_minmax(240px,auto)] md:items-center md:gap-3">

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, or access type"
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-[#374151]"
          />

          <FilterSelect
            id="employee-role-filter"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            options={[
              { value: 'all', label: 'All Access Types' },
              { value: 'Staff', label: 'Staff Access' },
              { value: 'Rider', label: 'Rider Access' },
            ]}
            className="h-10 w-full border border-gray-300 rounded-md px-3 text-sm"
          />

          <div className="flex h-10 min-w-[240px] items-center justify-between gap-2 rounded-md border border-[#b4b4b4] px-3 sm:col-span-2 md:col-span-1">
            <p className="whitespace-nowrap text-xs font-semibold text-[#3878c2]">Sort by Employee ID</p>
            <div className="flex items-center gap-1.5">
              <RadioRow
                id="employee-sort-ascending"
                name="employeeSortDirection"
                label="Ascending"
                checked={sortDirection === 'asc'}
                onChange={() => setSortDirection('asc')}
              />
              <RadioRow
                id="employee-sort-descending"
                name="employeeSortDirection"
                label="Descending"
                checked={sortDirection === 'desc'}
                onChange={() => setSortDirection('desc')}
              />
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEmployees.length === 0 && (
            <p className="text-gray-500 col-span-full">
              No employees found.
            </p>
          )}

          {filteredEmployees.map((member) => (
            <InfoCard
              key={member.id}
              mode="employee"
              id={member.id}
              item={member}
              name={member.name}
              subtitle={member.role.toUpperCase()}
              meta={`ID: ${member.id}`}
              isExpanded={expandedId === member.id}
              isEditing={editingId === member.id}
              editData={editData}
              onToggleExpand={toggleExpand}
              onStartEditing={startEditing}
              onCancelEditing={cancelEditing}
              onSaveEdit={saveEdit}
              onInputChange={handleInputChange}
              onDelete={handleDelete}
              panelVariant="blue"
            />
          ))}
        </div>
      </div>

      <BottomNavbar />
    </div>
  );
}
