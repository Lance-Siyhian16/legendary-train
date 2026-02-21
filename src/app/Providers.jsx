import React, { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { LayoutProvider } from './LayoutContext'
import { PermissionsProvider } from '../shared/permissions/UsePermissions'

export default function Providers({ children }) {
	const [hideBottomNav, setHideBottomNav] = useState(false)

	return (
		<BrowserRouter>
			<PermissionsProvider>
				<LayoutProvider value={{ hideBottomNav, setHideBottomNav }}>{children}</LayoutProvider>
			</PermissionsProvider>
		</BrowserRouter>
	)
}
