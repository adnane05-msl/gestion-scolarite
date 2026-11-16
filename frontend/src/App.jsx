import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './layouts/Layout.jsx'
import TableauDeBord from './pages/TableauDeBord.jsx'
import Etudiants from './pages/Etudiants.jsx'
import FicheEtudiant from './pages/FicheEtudiant.jsx'
import Enseignants from './pages/Enseignants.jsx'
import Filieres from './pages/Filieres.jsx'
import Modules from './pages/Modules.jsx'
import Inscriptions from './pages/Inscriptions.jsx'
import ExamensNotes from './pages/ExamensNotes.jsx'
import Absences from './pages/Absences.jsx'
import Notifications from './pages/Notifications.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TableauDeBord />} />
        <Route path="etudiants" element={<Etudiants />} />
        <Route path="etudiants/:id" element={<FicheEtudiant />} />
        <Route path="enseignants" element={<Enseignants />} />
        <Route path="filieres" element={<Filieres />} />
        <Route path="modules" element={<Modules />} />
        <Route path="inscriptions" element={<Inscriptions />} />
        <Route path="examens" element={<ExamensNotes />} />
        <Route path="absences" element={<Absences />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
