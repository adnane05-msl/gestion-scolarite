import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import useToast from '../hooks/useToast'
import useDebounce from '../hooks/useDebounce'
import { etudiantsService, filieresService } from '../services/ressources'
import { messageErreur } from '../services/api'
import EntetePage from '../components/EntetePage.jsx'
import Modal from '../components/Modal.jsx'
import Confirmation from '../components/Confirmation.jsx'
import Pagination from '../components/Pagination.jsx'
import { Chargement, Erreur, TableauVide, Badge } from '../components/Etats.jsx'

const TAILLE = 15

export default function Etudiants() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [recherche, setRecherche] = useState(params.get('recherche') || '')
  const [filiere, setFiliere] = useState('')
  const [page, setPage] = useState(1)
  const rechercheRetardee = useDebounce(recherche)

  const [modal, setModal] = useState(null) // null | { mode: 'ajout' } | { mode: 'edition', etudiant }
  const [aSupprimer, setASupprimer] = useState(null)
  const [enCours, setEnCours] = useState(false)

  const { donnees: filieres } = useFetch(filieresService.lister)
  const { donnees, chargement, erreur, recharger } = useFetch(
    () => etudiantsService.lister({ recherche: rechercheRetardee, filiere, page, taille: TAILLE }),
    [rechercheRetardee, filiere, page],
  )

  useEffect(() => { setPage(1) }, [rechercheRetardee, filiere])
  useEffect(() => {
    const r = params.get('recherche')
    if (r !== null) { setRecherche(r); setParams({}, { replace: true }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const ouvrirAjout = () => { reset({ nom: '', prenom: '', email: '', cne: '' }); setModal({ mode: 'ajout' }) }
  const ouvrirEdition = (e) => { reset({ nom: e.nom, prenom: e.prenom, email: e.email || '', cne: e.cne }); setModal({ mode: 'edition', etudiant: e }) }

  const enregistrer = async (valeurs) => {
    setEnCours(true)
    try {
      if (modal.mode === 'ajout') {
        await etudiantsService.creer(valeurs)
        toast.succes('Étudiant ajouté. Pensez à l\'inscrire dans une filière.')
      } else {
        await etudiantsService.modifier(modal.etudiant.id_etudiant, valeurs)
        toast.succes('Étudiant modifié.')
      }
      setModal(null)
      recharger()
    } catch (e) {
      toast.erreur(messageErreur(e))
    } finally {
      setEnCours(false)
    }
  }

  // Avant de proposer la suppression, on demande au serveur ce qui est rattaché
  // à l'étudiant, pour l'annoncer au lieu de laisser la clé étrangère refuser.
  const demanderSuppression = async (etudiant) => {
    setASupprimer({ ...etudiant, dep: null })
    try {
      setASupprimer({ ...etudiant, dep: await etudiantsService.dependances(etudiant.id_etudiant) })
    } catch (e) {
      toast.erreur(messageErreur(e))
      setASupprimer(null)
    }
  }

  const supprimer = async () => {
    setEnCours(true)
    try {
      const avecDonnees = (aSupprimer.dep?.total ?? 0) > 0
      const reponse = await etudiantsService.supprimer(aSupprimer.id_etudiant, avecDonnees)
      toast.succes(reponse.message)
      setASupprimer(null)
      recharger()
    } catch (e) {
      toast.erreur(messageErreur(e))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <>
      <EntetePage
        titre="Étudiants"
        description="Gestion des étudiants : création, modification, recherche et consultation des fiches."
        actions={<button className="btn btn-primary d-flex align-items-center gap-2" onClick={ouvrirAjout}><Plus size={16} /> Ajouter un étudiant</button>}
      />

      <div className="et-carte p-0">
        <div className="d-flex flex-wrap gap-2 p-3 border-bottom">
          <div className="input-group" style={{ maxWidth: 340 }}>
            <span className="input-group-text bg-white"><Search size={15} /></span>
            <input className="form-control" placeholder="Nom, prénom ou CNE…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          </div>
          <select className="form-select" style={{ maxWidth: 240 }} value={filiere} onChange={(e) => setFiliere(e.target.value)}>
            <option value="">Toutes les filières</option>
            {(filieres || []).map((f) => <option key={f.id_filiere} value={f.id_filiere}>{f.nom_filiere}</option>)}
          </select>
        </div>

        {chargement && !donnees ? <Chargement /> : erreur ? <div className="p-3"><Erreur message={erreur} onReessayer={recharger} /></div> : donnees.donnees.length === 0 ? (
          <TableauVide texte="Aucun étudiant ne correspond à la recherche." />
        ) : (
          <div className="et-tableau-conteneur">
            <table className="table et-tableau">
              <thead>
                <tr><th>CNE</th><th>Nom</th><th>Prénom</th><th>Email</th><th>Filière actuelle</th><th className="text-end">Actions</th></tr>
              </thead>
              <tbody>
                {donnees.donnees.map((e) => (
                  <tr key={e.id_etudiant}>
                    <td className="fw-medium">{e.cne}</td>
                    <td>{e.nom}</td>
                    <td>{e.prenom}</td>
                    <td className="text-secondary">{e.email || '—'}</td>
                    <td>{e.nom_filiere ? <Badge type="info">{e.nom_filiere}</Badge> : <Badge type="avert">Non inscrit</Badge>}</td>
                    <td className="text-end text-nowrap">
                      <Link to={`/etudiants/${e.id_etudiant}`} className="btn btn-light btn-icone me-1" title="Fiche"><Eye size={16} /></Link>
                      <button className="btn btn-light btn-icone me-1" title="Modifier" onClick={() => ouvrirEdition(e)}><Pencil size={16} /></button>
                      <button className="btn btn-light btn-icone text-danger" title="Supprimer" onClick={() => demanderSuppression(e)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {donnees && <Pagination page={donnees.page} taille={donnees.taille} total={donnees.total} onChange={setPage} />}
      </div>

      <Modal
        ouvert={!!modal}
        titre={modal?.mode === 'ajout' ? 'Nouvel étudiant' : 'Modifier l\'étudiant'}
        onFermer={() => setModal(null)}
        pied={
          <>
            <button className="btn btn-light" onClick={() => setModal(null)} disabled={enCours}>Annuler</button>
            <button className="btn btn-primary" form="form-etudiant" type="submit" disabled={enCours}>{enCours ? 'Enregistrement…' : 'Enregistrer'}</button>
          </>
        }
      >
        <form id="form-etudiant" onSubmit={handleSubmit(enregistrer)} className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Nom *</label>
            <input className={`form-control ${errors.nom ? 'is-invalid' : ''}`} {...register('nom', { required: 'Le nom est obligatoire.' })} />
            {errors.nom && <div className="invalid-feedback">{errors.nom.message}</div>}
          </div>
          <div className="col-md-6">
            <label className="form-label">Prénom *</label>
            <input className={`form-control ${errors.prenom ? 'is-invalid' : ''}`} {...register('prenom', { required: 'Le prénom est obligatoire.' })} />
            {errors.prenom && <div className="invalid-feedback">{errors.prenom.message}</div>}
          </div>
          <div className="col-md-6">
            <label className="form-label">CNE *</label>
            <input className={`form-control ${errors.cne ? 'is-invalid' : ''}`} {...register('cne', { required: 'Le CNE est obligatoire.', maxLength: { value: 20, message: '20 caractères maximum.' } })} />
            {errors.cne && <div className="invalid-feedback">{errors.cne.message}</div>}
          </div>
          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} {...register('email', { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide.' } })} />
            {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
          </div>
        </form>
      </Modal>

      <Confirmation
        ouvert={!!aSupprimer}
        titre="Supprimer l'étudiant"
        message={aSupprimer && (
          <>
            <p className="mb-2">
              Supprimer <strong>{aSupprimer.prenom} {aSupprimer.nom}</strong> ({aSupprimer.cne}) ?
            </p>
            {!aSupprimer.dep ? (
              <p className="mb-0 small text-secondary">Vérification des données liées…</p>
            ) : aSupprimer.dep.total === 0 ? (
              <p className="mb-0 small text-secondary">
                Aucune donnée liée à cet étudiant. La suppression est définitive.
              </p>
            ) : (
              <>
                <p className="mb-1 small">
                  Les données suivantes lui sont rattachées et seront supprimées avec lui :
                </p>
                <ul className="small mb-0">
                  {aSupprimer.dep.inscriptions > 0 && <li>{aSupprimer.dep.inscriptions} inscription(s)</li>}
                  {aSupprimer.dep.notes > 0 && <li>{aSupprimer.dep.notes} note(s)</li>}
                  {aSupprimer.dep.absences > 0 && <li>{aSupprimer.dep.absences} absence(s)</li>}
                  {aSupprimer.dep.notifications > 0 && <li>{aSupprimer.dep.notifications} notification(s)</li>}
                </ul>
              </>
            )}
          </>
        )}
        libelleConfirmer={aSupprimer?.dep?.total > 0 ? 'Supprimer avec ses données' : 'Supprimer'}
        onConfirmer={supprimer}
        onAnnuler={() => setASupprimer(null)}
        enCours={enCours || (!!aSupprimer && !aSupprimer.dep)}
      />
    </>
  )
}
