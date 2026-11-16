import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import useToast from '../hooks/useToast'
import useDebounce from '../hooks/useDebounce'
import { filieresService, inscriptionsService } from '../services/ressources'
import { messageErreur } from '../services/api'
import EntetePage from '../components/EntetePage.jsx'
import Modal from '../components/Modal.jsx'
import Confirmation from '../components/Confirmation.jsx'
import Pagination from '../components/Pagination.jsx'
import SelecteurEtudiant from '../components/SelecteurEtudiant.jsx'
import { Chargement, Erreur, TableauVide, Badge } from '../components/Etats.jsx'
import { anneeUniversitaire, aujourdHui, formatDate, nomComplet } from '../utils/format'

const ANNEE_COURANTE = 2026
const TAILLE = 15

export default function Inscriptions() {
  const toast = useToast()
  const [filiere, setFiliere] = useState('')
  const [annee, setAnnee] = useState('')
  const [recherche, setRecherche] = useState('')
  const [page, setPage] = useState(1)
  const rechercheRetardee = useDebounce(recherche)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ etudiant: null, id_filiere: '', date_inscription: aujourdHui(), annee_universitaire: ANNEE_COURANTE })
  const [aSupprimer, setASupprimer] = useState(null)
  const [enCours, setEnCours] = useState(false)

  const { donnees: filieres } = useFetch(filieresService.lister)
  const { donnees, chargement, erreur, recharger } = useFetch(
    () => inscriptionsService.lister({ filiere, annee, recherche: rechercheRetardee, page, taille: TAILLE }),
    [filiere, annee, rechercheRetardee, page],
  )
  useEffect(() => { setPage(1) }, [filiere, annee, rechercheRetardee])

  const enregistrer = async (e) => {
    e.preventDefault()
    if (!form.etudiant) return toast.erreur('Choisissez un étudiant.')
    if (!form.id_filiere) return toast.erreur('Choisissez une filière.')
    setEnCours(true)
    try {
      await inscriptionsService.creer({ id_etudiant: form.etudiant.id_etudiant, id_filiere: form.id_filiere, date_inscription: form.date_inscription, annee_universitaire: Number(form.annee_universitaire) })
      toast.succes('Inscription enregistrée.')
      setModal(false)
      setForm({ etudiant: null, id_filiere: '', date_inscription: aujourdHui(), annee_universitaire: ANNEE_COURANTE })
      recharger()
    } catch (err) { toast.erreur(messageErreur(err)) } finally { setEnCours(false) }
  }

  const supprimer = async () => {
    setEnCours(true)
    try { await inscriptionsService.supprimer(aSupprimer.id_inscription); toast.succes('Inscription supprimée.'); setASupprimer(null); recharger() }
    catch (err) { toast.erreur(messageErreur(err)) } finally { setEnCours(false) }
  }

  return (
    <>
      <EntetePage titre="Inscriptions" description="Inscription des étudiants dans les filières par année universitaire."
        actions={<button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setModal(true)}><Plus size={16} /> Nouvelle inscription</button>} />

      <div className="et-carte p-0">
        <div className="d-flex flex-wrap gap-2 p-3 border-bottom">
          <input className="form-control" style={{ maxWidth: 280 }} placeholder="Rechercher un étudiant…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          <select className="form-select" style={{ maxWidth: 220 }} value={filiere} onChange={(e) => setFiliere(e.target.value)}>
            <option value="">Toutes les filières</option>
            {(filieres || []).map((f) => <option key={f.id_filiere} value={f.id_filiere}>{f.nom_filiere}</option>)}
          </select>
          <select className="form-select" style={{ maxWidth: 180 }} value={annee} onChange={(e) => setAnnee(e.target.value)}>
            <option value="">Toutes les années</option>
            {(donnees?.annees || []).map((a) => <option key={a} value={a}>{anneeUniversitaire(a)}</option>)}
          </select>
        </div>
        {chargement && !donnees ? <Chargement /> : erreur ? <div className="p-3"><Erreur message={erreur} onReessayer={recharger} /></div> : donnees.donnees.length === 0 ? <TableauVide texte="Aucune inscription." /> : (
          <div className="et-tableau-conteneur">
            <table className="table et-tableau">
              <thead><tr><th>Étudiant</th><th>CNE</th><th>Filière</th><th>Année universitaire</th><th>Date</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {donnees.donnees.map((i) => (
                  <tr key={i.id_inscription}>
                    <td><Link to={`/etudiants/${i.id_etudiant}`} className="et-lien">{nomComplet(i)}</Link></td>
                    <td>{i.cne}</td>
                    <td><Badge type="info">{i.nom_filiere}</Badge></td>
                    <td>{anneeUniversitaire(i.annee_universitaire)}</td>
                    <td>{formatDate(i.date_inscription)}</td>
                    <td className="text-end"><button className="btn btn-light btn-icone text-danger" title="Supprimer" onClick={() => setASupprimer(i)}><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {donnees && <Pagination page={donnees.page} taille={donnees.taille} total={donnees.total} onChange={setPage} />}
      </div>

      <Modal ouvert={modal} titre="Nouvelle inscription" onFermer={() => setModal(false)}
        pied={<><button className="btn btn-light" onClick={() => setModal(false)} disabled={enCours}>Annuler</button><button className="btn btn-primary" form="form-insc" type="submit" disabled={enCours}>Enregistrer</button></>}>
        <form id="form-insc" onSubmit={enregistrer} className="row g-3">
          <div className="col-12"><label className="form-label">Étudiant *</label><SelecteurEtudiant valeur={form.etudiant} onChange={(etudiant) => setForm({ ...form, etudiant })} /></div>
          <div className="col-12"><label className="form-label">Filière *</label>
            <select className="form-select" required value={form.id_filiere} onChange={(e) => setForm({ ...form, id_filiere: e.target.value })}>
              <option value="">Choisir…</option>
              {(filieres || []).map((f) => <option key={f.id_filiere} value={f.id_filiere}>{f.nom_filiere}</option>)}
            </select>
          </div>
          <div className="col-md-6"><label className="form-label">Date d'inscription *</label><input type="date" className="form-control" required value={form.date_inscription} onChange={(e) => setForm({ ...form, date_inscription: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label">Année universitaire *</label>
            <input type="number" className="form-control" required min={2000} max={2100} value={form.annee_universitaire} onChange={(e) => setForm({ ...form, annee_universitaire: e.target.value })} />
            <div className="form-text">Affichée comme {anneeUniversitaire(form.annee_universitaire)}</div>
          </div>
        </form>
      </Modal>

      <Confirmation ouvert={!!aSupprimer} titre="Supprimer l'inscription" message={`Supprimer l'inscription de ${nomComplet(aSupprimer)} en ${aSupprimer?.nom_filiere} (${anneeUniversitaire(aSupprimer?.annee_universitaire)}) ?`} onConfirmer={supprimer} onAnnuler={() => setASupprimer(null)} enCours={enCours} />
    </>
  )
}
