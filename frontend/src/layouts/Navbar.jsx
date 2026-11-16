import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Menu, Search } from 'lucide-react'
import { notificationsService } from '../services/ressources'
import { SECTIONS } from './Sidebar.jsx'

export default function Navbar({ onMenu }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [nonLues, setNonLues] = useState(0)
  const [recherche, setRecherche] = useState('')

  const section = SECTIONS.find((s) =>
    s.fin ? location.pathname === s.chemin : location.pathname.startsWith(s.chemin),
  )

  useEffect(() => {
    notificationsService.nonLues().then((r) => setNonLues(r.non_lues)).catch(() => {})
  }, [location])

  const soumettre = (e) => {
    e.preventDefault()
    if (!recherche.trim()) return
    navigate(`/etudiants?recherche=${encodeURIComponent(recherche.trim())}`)
    setRecherche('')
  }

  return (
    <header className="et-navbar">
      <button type="button" className="btn btn-light d-lg-none btn-icone" onClick={onMenu} aria-label="Menu">
        <Menu size={20} />
      </button>
      <h1>{section?.libelle ?? 'EduTrack'}</h1>
      <form className="et-recherche-globale" onSubmit={soumettre}>
        <div className="input-group input-group-sm">
          <span className="input-group-text bg-white"><Search size={15} /></span>
          <input
            className="form-control"
            placeholder="Rechercher un étudiant…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </form>
      <Link to="/notifications" className="btn btn-light btn-icone et-cloche" aria-label="Notifications">
        <Bell size={20} />
        {nonLues > 0 && <span className="badge rounded-pill bg-danger">{nonLues > 99 ? '99+' : nonLues}</span>}
      </Link>
    </header>
  )
}
