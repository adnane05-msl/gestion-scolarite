import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, GraduationCap, Users, Layers, BookOpen,
  ClipboardList, FileText, CalendarX, Bell,
} from 'lucide-react'

export const SECTIONS = [
  { chemin: '/', libelle: 'Tableau de bord', icone: LayoutDashboard, fin: true },
  { chemin: '/etudiants', libelle: 'Étudiants', icone: GraduationCap },
  { chemin: '/enseignants', libelle: 'Enseignants', icone: Users },
  { chemin: '/filieres', libelle: 'Filières', icone: Layers },
  { chemin: '/modules', libelle: 'Modules', icone: BookOpen },
  { chemin: '/inscriptions', libelle: 'Inscriptions', icone: ClipboardList },
  { chemin: '/examens', libelle: 'Examens et notes', icone: FileText },
  { chemin: '/absences', libelle: 'Absences', icone: CalendarX },
  { chemin: '/notifications', libelle: 'Notifications', icone: Bell },
]

export default function Sidebar({ ouverte, onFermer }) {
  return (
    <aside className={`et-sidebar ${ouverte ? 'ouverte' : ''}`}>
      <div className="et-logo">
        <span className="et-logo-icone">
          <GraduationCap size={20} color="#fff" />
        </span>
        EduTrack
      </div>
      <nav>
        {SECTIONS.map(({ chemin, libelle, icone: Icone, fin }) => (
          <NavLink key={chemin} to={chemin} end={fin} onClick={onFermer}>
            <Icone size={18} />
            {libelle}
          </NavLink>
        ))}
      </nav>
      <div className="et-sidebar-pied">Gestion de la scolarité · 2026–2027</div>
    </aside>
  )
}
