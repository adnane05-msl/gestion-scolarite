import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CheckCheck, ExternalLink } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import useToast from '../hooks/useToast'
import { notificationsService } from '../services/ressources'
import { messageErreur } from '../services/api'
import EntetePage from '../components/EntetePage.jsx'
import Pagination from '../components/Pagination.jsx'
import { Chargement, Erreur, TableauVide, Badge } from '../components/Etats.jsx'
import { formatDate, formatDateHeure, nomComplet } from '../utils/format'

const TAILLE = 20

export default function Notifications() {
  const toast = useToast()
  const [statut, setStatut] = useState('')
  const [page, setPage] = useState(1)
  const [enCours, setEnCours] = useState(false)
  const { donnees, chargement, erreur, recharger } = useFetch(() => notificationsService.lister({ statut, page, taille: TAILLE }), [statut, page])
  useEffect(() => { setPage(1) }, [statut])

  const marquerLue = async (n) => {
    try { await notificationsService.marquerLue(n.id_notification); recharger() }
    catch (e) { toast.erreur(messageErreur(e)) }
  }
  const toutMarquer = async () => {
    setEnCours(true)
    try { const r = await notificationsService.toutMarquerLues(); toast.succes(r.message); recharger() }
    catch (e) { toast.erreur(messageErreur(e)) } finally { setEnCours(false) }
  }

  return (
    <>
      <EntetePage titre="Notifications" description="Alertes créées automatiquement par le trigger MySQL à chaque absence non justifiée."
        actions={<button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={toutMarquer} disabled={enCours}><CheckCheck size={16} /> Tout marquer comme lu</button>} />

      <div className="et-carte p-0">
        <div className="d-flex gap-2 p-3 border-bottom">
          {[['', 'Toutes'], ['non_lue', 'Non lues'], ['lue', 'Lues']].map(([v, l]) => (
            <button key={v} className={`btn btn-sm ${statut === v ? 'btn-primary' : 'btn-light'}`} onClick={() => setStatut(v)}>{l}</button>
          ))}
        </div>
        {chargement && !donnees ? <Chargement /> : erreur ? <div className="p-3"><Erreur message={erreur} onReessayer={recharger} /></div> : donnees.donnees.length === 0 ? <TableauVide texte="Aucune notification." /> : (
          donnees.donnees.map((n) => (
            <div key={n.id_notification} className={`et-notif ${n.statut === 'lue' ? 'lue' : 'non-lue'}`}>
              <span className="et-point" />
              <div className="flex-grow-1">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <Link to={`/etudiants/${n.id_etudiant}`} className="et-lien">{nomComplet(n)}</Link>
                  <span className="text-secondary small">{n.cne}</span>
                  <Badge type={n.statut === 'lue' ? 'neutre' : 'info'}>{n.statut === 'lue' ? 'Lue' : 'Non lue'}</Badge>
                </div>
                <div className="small mt-1">{n.message}</div>
                <div className="text-secondary" style={{ fontSize: '.75rem' }}>
                  {formatDateHeure(n.date_notification)} · absence du {formatDate(n.date_absence)} ({n.nb_heures} h)
                </div>
              </div>
              <div className="d-flex gap-1 align-items-start">
                <Link to={`/etudiants/${n.id_etudiant}`} className="btn btn-light btn-icone" title="Ouvrir la fiche"><ExternalLink size={16} /></Link>
                {n.statut !== 'lue' && <button className="btn btn-light btn-icone text-success" title="Marquer comme lue" onClick={() => marquerLue(n)}><Check size={16} /></button>}
              </div>
            </div>
          ))
        )}
        {donnees && <Pagination page={donnees.page} taille={donnees.taille} total={donnees.total} onChange={setPage} />}
      </div>
    </>
  )
}
