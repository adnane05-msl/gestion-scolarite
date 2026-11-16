import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import useToast from '../hooks/useToast'
import useDebounce from '../hooks/useDebounce'
import { absencesService } from '../services/ressources'
import { messageErreur } from '../services/api'
import EntetePage from '../components/EntetePage.jsx'
import Modal from '../components/Modal.jsx'
import Confirmation from '../components/Confirmation.jsx'
import Pagination from '../components/Pagination.jsx'
import SelecteurEtudiant from '../components/SelecteurEtudiant.jsx'
import { Chargement, Erreur, TableauVide, Badge } from '../components/Etats.jsx'
import { aujourdHui, formatDate, nomComplet, versInputDate } from '../utils/format'

const TAILLE = 15
const FORM_VIDE = { etudiant: null, date_absence: aujourdHui(), nb_heures: 2, justifie: false }

export default function Absences() {
  const toast = useToast()
  const [recherche, setRecherche] = useState('')
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')
  const [justifie, setJustifie] = useState('')
  const [page, setPage] = useState(1)
  const rechercheRetardee = useDebounce(recherche)
  const [modal, setModal] = useState(null) // { mode, absence? }
  const [form, setForm] = useState(FORM_VIDE)
  const [aSupprimer, setASupprimer] = useState(null)
  const [enCours, setEnCours] = useState(false)

  const { donnees, chargement, erreur, recharger } = useFetch(
    () => absencesService.lister({ recherche: rechercheRetardee, debut, fin, justifie, page, taille: TAILLE }),
    [rechercheRetardee, debut, fin, justifie, page],
  )
  const { donnees: totaux, recharger: rechargerTotaux } = useFetch(() => absencesService.totaux(8))
  const { donnees: alertes, recharger: rechargerAlertes } = useFetch(absencesService.alertes)
  useEffect(() => { setPage(1) }, [rechercheRetardee, debut, fin, justifie])

  const toutRecharger = () => { recharger(); rechargerTotaux(); rechargerAlertes() }

  const ouvrirAjout = () => { setForm(FORM_VIDE); setModal({ mode: 'ajout' }) }
  const ouvrirEdition = (a) => {
    setForm({ etudiant: { id_etudiant: a.id_etudiant, nom: a.nom, prenom: a.prenom, cne: a.cne }, date_absence: versInputDate(a.date_absence), nb_heures: a.nb_heures, justifie: !!a.justifie })
    setModal({ mode: 'edition', absence: a })
  }

  const enregistrer = async (e) => {
    e.preventDefault()
    if (modal.mode === 'ajout' && !form.etudiant) return toast.erreur('Choisissez un étudiant.')
    setEnCours(true)
    try {
      const corps = { date_absence: form.date_absence, nb_heures: Number(form.nb_heures), justifie: form.justifie }
      if (modal.mode === 'ajout') {
        await absencesService.creer({ ...corps, id_etudiant: form.etudiant.id_etudiant })
        toast.succes(form.justifie ? 'Absence enregistrée.' : 'Absence enregistrée. Une notification a été créée par le trigger.')
      } else {
        await absencesService.modifier(modal.absence.id_absence, corps)
        toast.succes('Absence modifiée.')
      }
      setModal(null); toutRecharger()
    } catch (err) { toast.erreur(messageErreur(err)) } finally { setEnCours(false) }
  }

  const supprimer = async () => {
    setEnCours(true)
    try { await absencesService.supprimer(aSupprimer.id_absence); toast.succes('Absence supprimée.'); setASupprimer(null); toutRecharger() }
    catch (err) { toast.erreur(messageErreur(err)) } finally { setEnCours(false) }
  }

  return (
    <>
      <EntetePage titre="Absences" description="Suivi de l'assiduité. Chaque absence non justifiée déclenche automatiquement une notification (trigger MySQL)."
        actions={<button className="btn btn-primary d-flex align-items-center gap-2" onClick={ouvrirAjout}><Plus size={16} /> Ajouter une absence</button>} />

      {alertes && alertes.etudiants.length > 0 && (
        <div className="et-carte et-alerte-rouge mb-3">
          <div className="d-flex align-items-center gap-2 mb-2 text-danger fw-semibold"><AlertTriangle size={18} /> Étudiants à surveiller — seuil : {alertes.seuil} h cumulées</div>
          <div className="d-flex flex-wrap gap-2">
            {alertes.etudiants.map((e) => (
              <Link key={e.id_etudiant} to={`/etudiants/${e.id_etudiant}`} className="badge rounded-pill et-badge-douce-erreur text-decoration-none">
                {nomComplet(e)} · {Number(e.total_heures)} h
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="row g-3">
        <div className="col-xl-8">
          <div className="et-carte p-0">
            <div className="d-flex flex-wrap gap-2 p-3 border-bottom">
              <input className="form-control" style={{ maxWidth: 240 }} placeholder="Étudiant (nom, CNE)…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
              <input type="date" className="form-control" style={{ maxWidth: 170 }} value={debut} onChange={(e) => setDebut(e.target.value)} title="Du" />
              <input type="date" className="form-control" style={{ maxWidth: 170 }} value={fin} onChange={(e) => setFin(e.target.value)} title="Au" />
              <select className="form-select" style={{ maxWidth: 180 }} value={justifie} onChange={(e) => setJustifie(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="1">Justifiées</option>
                <option value="0">Non justifiées</option>
              </select>
            </div>
            {chargement && !donnees ? <Chargement /> : erreur ? <div className="p-3"><Erreur message={erreur} onReessayer={recharger} /></div> : donnees.donnees.length === 0 ? <TableauVide texte="Aucune absence." /> : (
              <div className="et-tableau-conteneur">
                <table className="table et-tableau">
                  <thead><tr><th>Étudiant</th><th>Date</th><th>Heures</th><th>Statut</th><th className="text-end">Actions</th></tr></thead>
                  <tbody>
                    {donnees.donnees.map((a) => (
                      <tr key={a.id_absence}>
                        <td><Link to={`/etudiants/${a.id_etudiant}`} className="et-lien">{nomComplet(a)}</Link> <span className="text-secondary small">{a.cne}</span></td>
                        <td>{formatDate(a.date_absence)}</td>
                        <td>{a.nb_heures} h</td>
                        <td>{a.justifie ? <Badge type="succes">Justifiée</Badge> : <Badge type="erreur">Non justifiée</Badge>}</td>
                        <td className="text-end text-nowrap">
                          <button className="btn btn-light btn-icone me-1" title="Modifier" onClick={() => ouvrirEdition(a)}><Pencil size={16} /></button>
                          <button className="btn btn-light btn-icone text-danger" title="Supprimer" onClick={() => setASupprimer(a)}><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {donnees && <Pagination page={donnees.page} taille={donnees.taille} total={donnees.total} onChange={setPage} />}
          </div>
        </div>
        <div className="col-xl-4">
          <div className="et-carte p-0">
            <h6 className="fw-semibold px-3 pt-3 pb-2 mb-0">Étudiants les plus absents</h6>
            {!totaux ? <Chargement /> : totaux.length === 0 ? <TableauVide texte="Aucune absence." /> : (
              <table className="table et-tableau">
                <thead><tr><th>Étudiant</th><th>Total</th><th>Non just.</th></tr></thead>
                <tbody>
                  {totaux.map((t) => (
                    <tr key={t.id_etudiant}>
                      <td><Link to={`/etudiants/${t.id_etudiant}`} className="et-lien">{nomComplet(t)}</Link></td>
                      <td className="fw-semibold">{Number(t.total_heures)} h</td>
                      <td className="text-danger">{Number(t.heures_non_justifiees)} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Modal ouvert={!!modal} titre={modal?.mode === 'ajout' ? 'Nouvelle absence' : 'Modifier l\'absence'} onFermer={() => setModal(null)}
        pied={<><button className="btn btn-light" onClick={() => setModal(null)} disabled={enCours}>Annuler</button><button className="btn btn-primary" form="form-abs" type="submit" disabled={enCours}>Enregistrer</button></>}>
        <form id="form-abs" onSubmit={enregistrer} className="row g-3">
          <div className="col-12"><label className="form-label">Étudiant *</label>
            {modal?.mode === 'ajout' ? <SelecteurEtudiant valeur={form.etudiant} onChange={(etudiant) => setForm({ ...form, etudiant })} /> : <div className="form-control bg-light">{nomComplet(form.etudiant)} ({form.etudiant?.cne})</div>}
          </div>
          <div className="col-md-6"><label className="form-label">Date *</label><input type="date" className="form-control" required value={form.date_absence} onChange={(e) => setForm({ ...form, date_absence: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label">Nombre d'heures *</label><input type="number" min="1" max="24" className="form-control" required value={form.nb_heures} onChange={(e) => setForm({ ...form, nb_heures: e.target.value })} /></div>
          <div className="col-12">
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" id="justifie" checked={form.justifie} onChange={(e) => setForm({ ...form, justifie: e.target.checked })} />
              <label className="form-check-label" htmlFor="justifie">Absence justifiée</label>
            </div>
            {modal?.mode === 'ajout' && !form.justifie && <div className="form-text text-danger">Non justifiée : le trigger créera une notification.</div>}
          </div>
        </form>
      </Modal>

      <Confirmation ouvert={!!aSupprimer} titre="Supprimer l'absence" message={`Supprimer l'absence de ${nomComplet(aSupprimer)} du ${formatDate(aSupprimer?.date_absence)} ? Refusé si une notification y est rattachée.`} onConfirmer={supprimer} onAnnuler={() => setASupprimer(null)} enCours={enCours} />
    </>
  )
}
