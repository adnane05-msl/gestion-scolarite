import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, Hash, BookOpen, FileText, CalendarX, Bell, FileCheck, Check } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import useToast from '../hooks/useToast'
import { absencesService, etudiantsService, notificationsService } from '../services/ressources'
import { messageErreur } from '../services/api'
import CarteStat from '../components/CarteStat.jsx'
import { Chargement, Erreur, TableauVide, Badge } from '../components/Etats.jsx'
import { anneeUniversitaire, formatDate, formatDateHeure, formatNote, nomComplet, versInputDate } from '../utils/format'

function Bloc({ titre, children }) {
  return (
    <div className="et-carte p-0 h-100">
      <h6 className="fw-semibold px-3 pt-3 pb-2 mb-0">{titre}</h6>
      {children}
    </div>
  )
}

export default function FicheEtudiant() {
  const { id } = useParams()
  const toast = useToast()
  const { donnees, chargement, erreur, recharger } = useFetch(() => etudiantsService.fiche(id), [id])

  const justifier = async (n) => {
    try {
      await absencesService.modifier(n.id_absence, {
        date_absence: versInputDate(n.date_absence),
        nb_heures: n.nb_heures,
        justifie: true,
      })
      if (n.statut !== 'lue') await notificationsService.marquerLue(n.id_notification)
      toast.succes('Absence justifiée.')
      recharger()
    } catch (e) { toast.erreur(messageErreur(e)) }
  }

  const marquerLue = async (n) => {
    try { await notificationsService.marquerLue(n.id_notification); recharger() }
    catch (e) { toast.erreur(messageErreur(e)) }
  }

  if (chargement) return <Chargement texte="Chargement de la fiche…" />
  if (erreur) return <Erreur message={erreur} onReessayer={recharger} />

  const { etudiant, inscriptions, modules, notes, moyenne, absences, notifications } = donnees
  const filiereActuelle = inscriptions[0]
  const notificationsNonLues = notifications.filter((n) => n.statut !== 'lue').length
  const heuresNonJustifiees = Number(absences.non_justifiees)

  return (
    <>
      <Link to="/etudiants" className="et-lien d-inline-flex align-items-center gap-1 mb-3 small"><ArrowLeft size={14} /> Retour à la liste</Link>

      <div className="et-carte mb-3 d-flex flex-wrap align-items-center gap-3">
        <div className="rounded-circle d-grid place-items-center text-white fw-bold" style={{ width: 56, height: 56, background: '#142d52', display: 'grid', placeItems: 'center', fontSize: 20 }}>
          {etudiant.prenom[0]}{etudiant.nom[0]}
        </div>
        <div className="flex-grow-1">
          <h2 className="h4 mb-1">{nomComplet(etudiant)}</h2>
          <div className="d-flex flex-wrap gap-3 small text-secondary">
            <span className="d-flex align-items-center gap-1"><Hash size={14} /> {etudiant.cne}</span>
            <span className="d-flex align-items-center gap-1"><Mail size={14} /> {etudiant.email || 'Aucun email'}</span>
          </div>
        </div>
        {filiereActuelle ? <Badge type="info">{filiereActuelle.nom_filiere} · {anneeUniversitaire(filiereActuelle.annee_universitaire)}</Badge> : <Badge type="avert">Non inscrit</Badge>}
      </div>

      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3"><CarteStat icone={FileText} libelle="Moyenne générale" valeur={formatNote(moyenne)} couleur="#2563eb" /></div>
        <div className="col-6 col-lg-3"><CarteStat icone={BookOpen} libelle="Notes enregistrées" valeur={notes.length} couleur="#16a34a" /></div>
        <div className="col-6 col-lg-3"><CarteStat icone={CalendarX} libelle={`Heures d'absence (dont ${heuresNonJustifiees} non justifiées)`} valeur={Number(absences.total)} couleur={heuresNonJustifiees >= 20 ? '#dc2626' : '#f59e0b'} /></div>
        <div className="col-6 col-lg-3"><CarteStat icone={Bell} libelle={`Notifications non lues (${notifications.length} au total)`} valeur={notificationsNonLues} couleur="#7c3aed" /></div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <Bloc titre="Historique des inscriptions">
            {inscriptions.length === 0 ? <TableauVide texte="Aucune inscription." /> : (
              <table className="table et-tableau">
                <thead><tr><th>Filière</th><th>Année</th><th>Date</th></tr></thead>
                <tbody>{inscriptions.map((i) => <tr key={i.id_inscription}><td>{i.nom_filiere}</td><td>{anneeUniversitaire(i.annee_universitaire)}</td><td>{formatDate(i.date_inscription)}</td></tr>)}</tbody>
              </table>
            )}
          </Bloc>
        </div>
        <div className="col-lg-6">
          <Bloc titre={`Modules de la filière${filiereActuelle ? ` — ${filiereActuelle.nom_filiere}` : ''}`}>
            {modules.length === 0 ? <TableauVide texte="Aucun module." /> : (
              <table className="table et-tableau">
                <thead><tr><th>Module</th><th>Semestre</th></tr></thead>
                <tbody>{modules.map((m) => <tr key={m.id_module}><td>{m.nom_module}</td><td>S{m.semestre}</td></tr>)}</tbody>
              </table>
            )}
          </Bloc>
        </div>
        <div className="col-lg-6">
          <Bloc titre="Notes obtenues">
            {notes.length === 0 ? <TableauVide texte="Aucune note enregistrée." /> : (
              <table className="table et-tableau">
                <thead><tr><th>Module</th><th>Examen</th><th>Note</th></tr></thead>
                <tbody>
                  {notes.map((n) => (
                    <tr key={n.id_note}>
                      <td>{n.nom_module}</td>
                      <td>{formatDate(n.date_examen)}</td>
                      <td><Badge type={n.valeur_note >= 10 ? 'succes' : 'erreur'}>{formatNote(n.valeur_note)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Bloc>
        </div>
        <div className="col-lg-6">
          <Bloc titre="Notifications liées aux absences">
            {notifications.length === 0 ? <TableauVide texte="Aucune notification." /> : notifications.map((n) => (
              <div key={n.id_notification} className={`et-notif ${n.statut === 'lue' ? 'lue' : 'non-lue'}`}>
                <span className="et-point" />
                <div className="flex-grow-1 small">
                  <div>{n.message}</div>
                  <div className="text-secondary" style={{ fontSize: '.75rem' }}>{formatDateHeure(n.date_notification)}</div>
                  <div className="mt-1 d-flex gap-1 flex-wrap align-items-center">
                    <Badge type={n.statut === 'lue' ? 'neutre' : 'info'}>{n.statut === 'lue' ? 'Lue' : 'Non lue'}</Badge>
                    {n.justifie ? <Badge type="succes">Absence justifiée</Badge> : <Badge type="erreur">À traiter</Badge>}
                  </div>
                </div>
                <div className="d-flex gap-1 align-items-start">
                  {!n.justifie && (
                    <button className="btn btn-light btn-icone text-primary" title="Justificatif reçu : justifier l'absence" onClick={() => justifier(n)}>
                      <FileCheck size={16} />
                    </button>
                  )}
                  {n.statut !== 'lue' && (
                    <button className="btn btn-light btn-icone text-success" title="Marquer comme lue" onClick={() => marquerLue(n)}>
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </Bloc>
        </div>
      </div>
    </>
  )
}
