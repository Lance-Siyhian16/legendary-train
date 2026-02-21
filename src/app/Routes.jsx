import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from '../features/auth/Login'
import Signup from '../features/auth/SignUp'
import BookNow from '../features/auth/BookNow'
import PaymentForm from '../features/auth/PaymentForm'
import BookingHistory from '../features/user/bookings/BookingHistory'
import BookingDetails from '../features/user/bookings/BookingDetails'
import Notifications from '../shared/inbox/Notifications'
import Profile from '../features/user/profile/Profile'
import LandingPage from '../features/landing/LandingPage'
import Dashboard from '../features/landing/Dashboard'
import RiderDashboard from '../features/rider/RiderDashboard'
import StaffDashboard from '../features/staff/StaffDashboard'
import AdminDashboard from '../features/admin/AdminDashboard'
import ManageBookings from '../features/admin/ManageBookings'
import ManageEmployees from '../features/admin/ManageEmployees'
import ManageServices from '../features/admin/ManageServices'
import ManageUsers from '../features/admin/ManageUsers'
import Reports from '../features/admin/Reports'
import TempRoleSwitcher from '../shared/permissions/TempRoleSwitcher'

function resolveNotificationsPathByRole() {
	const activeRole = window.sessionStorage.getItem('activeRole')

	if (activeRole === 'staff') return '/staff/notifications'
	if (activeRole === 'rider') return '/rider/notifications'
	return '/user/notifications'
}

function NotificationsRoleRedirect() {
	return <Navigate to={resolveNotificationsPathByRole()} replace />
}

function resolveBookingsElementByRole() {
	const activeRole = window.sessionStorage.getItem('activeRole')
	if (activeRole === 'rider') return <RiderDashboard />
	return <BookingHistory />
}

export default function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<TempRoleSwitcher />} />
			<Route path="/dashboard" element={<Dashboard />} />
			<Route path="/landing" element={<LandingPage />} />
			<Route path="/guest" element={<LandingPage />} />
			<Route path="/user" element={<Dashboard />} />
			<Route path="/rider" element={<RiderDashboard />} />
			<Route path="/staff" element={<StaffDashboard />} />
			<Route path="/admin" element={<AdminDashboard />} />
			<Route path="/admin/manage-bookings" element={<ManageBookings />} />
			<Route path="/admin/manage-employees" element={<ManageEmployees />} />
			<Route path="/admin/manage-services" element={<ManageServices />} />
			<Route path="/admin/manage-users" element={<ManageUsers />} />
			<Route path="/admin/reports" element={<Reports />} />
			<Route path="/role-switcher" element={<TempRoleSwitcher />} />
			<Route path="/login" element={<Login />} />
			<Route path="/signup" element={<Signup />} />
			<Route path="/book" element={<BookNow />} />
			<Route path="/payment" element={<PaymentForm />} />
			<Route path="/bookings" element={resolveBookingsElementByRole()} />
			<Route path="/bookings/:bookingId" element={<BookingDetails />} />
			<Route path="/notifications" element={<NotificationsRoleRedirect />} />
			<Route path="/user/notifications" element={<Notifications />} />
			<Route path="/staff/notifications" element={<Notifications />} />
			<Route path="/rider/notifications" element={<Notifications />} />
			<Route path="/profile" element={<Profile />} />
		</Routes>
	)
}
