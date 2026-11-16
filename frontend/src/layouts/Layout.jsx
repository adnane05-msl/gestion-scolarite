import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'

export default function Layout() {
  const [menuOuvert, setMenuOuvert] = useState(false)
  return (
    <>
      <Sidebar ouverte={menuOuvert} onFermer={() => setMenuOuvert(false)} />
      <div className={`et-voile ${menuOuvert ? 'visible' : ''}`} onClick={() => setMenuOuvert(false)} />
      <Navbar onMenu={() => setMenuOuvert((o) => !o)} />
      <main className="et-contenu">
        <Outlet />
      </main>
    </>
  )
}
