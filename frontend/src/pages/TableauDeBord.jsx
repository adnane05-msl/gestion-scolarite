import { Link } from 'react-router-dom'
import { GraduationCap, Users, Layers, BookOpen, FileText, Bell } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import useFetch from '../hooks/useFetch'
import { statsService } from '../services/ressources'
import CarteStat from '../components/CarteStat.jsx'
import EntetePage from '../components/EntetePage.jsx'
import { Chargement, Erreur, TableauVide, Badge } from '../components/Etats.jsx'
import { formatDate, formatDateHeure, moisLisible, nomComplet } from '../utils/format'

const COULEURS = { bleu: '#2563eb', marine: '#142d52', vert: '#16a34a', orange: '#f59e0b', rouge: '#dc2626', violet: '#7c3aed' }

function Graphique({ titre, children, hauteur = 260 }) {
  return (
    <div className="et-carte h-100">
      <h6 className="fw-semibold mb-3">{titre}</h6>
      <div style={{ height: hauteur }}>{children}</div>
    </div>
  )
}

export default function TableauDeBord() {
  const { donnees, chargement, erreur, recharger } = useFetch(statsService.tableauDeBord)

  if (chargement) return <Chargement texte="Chargement du tableau de bord…" />
  if (erreur) return <Erreur message={erreur} onReessayer={recharger} />

  const { cartes, etudiants_par_filiere, moyenne_par_module, absences_par_mois, derniers_inscrits, notifications_recentes } = donnees
  const absencesMois = absences_par_mois.map((a) => ({ ...a, libelle: moisLisible(a.mois) }))

  return (
    <>
      <EntetePage titre="Vue d'ensemble" description="Indicateurs en temps réel issus de la base de données." />

      <div className="row g-3 mb-4">
        {[
          ['Étudiants', cartes.etudiants, GraduationCap, COULEURS.bleu],
          ['Enseignants', cartes.enseignants, Users, COULEURS.marine],
          ['Filières', cartes.filieres, Layers, COULEURS.violet],
          ['Modules', cartes.modules, BookOpen, COULEURS.vert],
          ['Examens', cartes.examens, FileText, COULEURS.orange],
          ['Notifications non lues', cartes.notifications_non_lues, Bell, COULEURS.rouge],
        ].map(([libelle, valeur, icone, couleur]) => (
          <div className="col-6 col-md-4 col-xl-2" key={libelle}>
            <CarteStat libelle={libelle} valeur={valeur} icone={icone} couleur={couleur} />
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-6">
          <Graphique titre="Étudiants par filière">
            <ResponsiveContainer>
              <BarChart data={etudiants_par_filiere} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="nom_filiere" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="nb_etudiants" name="Étudiants" fill={COULEURS.bleu} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Graphique>
        </div>
        <div className="col-lg-6">
          <Graphique titre="Moyenne des notes par module">
            <ResponsiveContainer>
              <BarChart data={moyenne_par_module} layout="vertical" margin={{ top: 0, right: 16, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="nom_module" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="moyenne" name="Moyenne /20" fill={COULEURS.marine} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Graphique>
        </div>
        <div className="col-12">
          <Graphique titre="Heures d'absence par mois" hauteur={220}>
            <ResponsiveContainer>
              <LineChart data={absencesMois} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="libelle" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="heures" name="Heures" stroke={COULEURS.orange} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Graphique>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="et-carte p-0">
            <div className="d-flex justify-content-between align-items-center px-3 pt-3 pb-2">
              <h6 className="fw-semibold mb-0">Derniers étudiants inscrits</h6>
              <Link to="/inscriptions" className="et-lien small">Voir tout</Link>
            </div>
            {derniers_inscrits.length === 0 ? (
              <TableauVide texte="Aucune inscription." />
            ) : (
              <div className="et-tableau-conteneur">
                <table className="table et-tableau">
                  <thead><tr><th>Étudiant</th><th>CNE</th><th>Filière</th><th>Date</th></tr></thead>
                  <tbody>
                    {derniers_inscrits.map((e) => (
                      <tr key={`${e.id_etudiant}-${e.date_inscription}`}>
                        <td><Link to={`/etudiants/${e.id_etudiant}`} className="et-lien">{nomComplet(e)}</Link></td>
                        <td>{e.cne}</td>
                        <td>{e.nom_filiere}</td>
                        <td>{formatDate(e.date_inscription)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="et-carte p-0">
            <div className="d-flex justify-content-between align-items-center px-3 pt-3 pb-2">
              <h6 className="fw-semibold mb-0">Notifications récentes</h6>
              <Link to="/notifications" className="et-lien small">Voir tout</Link>
            </div>
            {notifications_recentes.length === 0 ? (
              <TableauVide texte="Aucune notification." />
            ) : (
              notifications_recentes.map((n) => (
                <div key={n.id_notification} className={`et-notif ${n.statut === 'lue' ? 'lue' : 'non-lue'}`}>
                  <span className="et-point" />
                  <div className="flex-grow-1">
                    <div className="small">
                      <Link to={`/etudiants/${n.id_etudiant}`} className="et-lien">{nomComplet(n)}</Link> — {n.message}
                    </div>
                    <div className="text-secondary" style={{ fontSize: '.75rem' }}>{formatDateHeure(n.date_notification)}</div>
                  </div>
                  <Badge type={n.statut === 'lue' ? 'neutre' : 'info'}>{n.statut === 'lue' ? 'Lue' : 'Non lue'}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
