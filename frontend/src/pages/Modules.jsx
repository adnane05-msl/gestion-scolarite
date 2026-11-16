import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Layers, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import useToast from '../hooks/useToast'
import useDebounce from '../hooks/useDebounce'
import { enseignantsService, filieresService, modulesService } from '../services/ressources'
import { messageErreur } from '../services/api'
import EntetePage from '../components/EntetePage.jsx'
import Modal from '../components/Modal.jsx'
import Confirmation from '../components/Confirmation.jsx'
import ListeCases from '../components/ListeCases.jsx'
import { Chargement, Erreur, TableauVide, Badge } from '../components/Etats.jsx'

const SEMESTRES = [1, 2, 3, 4, 5, 6]

export default function Modules() {
  const toast = useToast()
  const [recherche, setRecherche] = useState('')
  const [semestre, setSemestre] = useState('')
  const rechercheRetardee = useDebounce(recherche)
  const [modal, setModal] = useState(null)
  const [assoc, setAssoc] = useState(null) // { type: 'filieres' | 'enseignants', module, ids }
  const [aSupprimer, setASupprimer] = useState(null)
  const [enCours, setEnCours] = useState(false)

  const { donnees, chargement, erreur, recharger } = useFetch(() => modulesService.lister({ recherche: rechercheRetardee, semestre }), [rechercheRetardee, semestre])
  const { donnees: filieres } = useFetch(filieresService.lister)
  const { donnees: enseignants } = useFetch(() => enseignantsService.lister(''))
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const action = async (fn, succes) => {
    setEnCours(true)
    try { await fn(); toast.succes(succes); recharger(); return true }
    catch (e) { toast.erreur(messageErreur(e)); return false }
    finally { setEnCours(false) }
  }

  const ouvrirAjout = () => { reset({ nom_module: '', semestre: 1 }); setModal({ mode: 'ajout' }) }
  const ouvrirEdition = (m) => { reset({ nom_module: m.nom_module, semestre: m.semestre }); setModal({ mode: 'edition', module: m }) }
  const enregistrer = async (v) => {
    const ok = await action(() => (modal.mode === 'ajout' ? modulesService.creer(v) : modulesService.modifier(modal.module.id_module, v)), modal.mode === 'ajout' ? 'Module ajouté.' : 'Module modifié.')
    if (ok) setModal(null)
  }
  const supprimer = async () => {
    const ok = await action(() => modulesService.supprimer(aSupprimer.id_module), 'Module supprimé.')
    if (ok) setASupprimer(null)
  }
  const enregistrerAssoc = async () => {
    const fn = assoc.type === 'filieres' ? modulesService.definirFilieres : modulesService.definirEnseignants
    const ok = await action(() => fn(assoc.module.id_module, assoc.ids), 'Associations mises à jour.')
    if (ok) setAssoc(null)
  }

  const listeBadges = (texte, type) => (texte ? texte.split(', ').map((x) => <span key={x} className="me-1"><Badge type={type}>{x}</Badge></span>) : <span className="text-secondary">—</span>)

  return (
    <>
      <EntetePage titre="Modules" description="Catalogue des modules, répartition par filière (CONTENIR) et par enseignant (ENSEIGNER)."
        actions={<button className="btn btn-primary d-flex align-items-center gap-2" onClick={ouvrirAjout}><Plus size={16} /> Ajouter un module</button>} />

      <div className="et-carte p-0">
        <div className="d-flex flex-wrap gap-2 p-3 border-bottom">
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text bg-white"><Search size={15} /></span>
            <input className="form-control" placeholder="Nom du module…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          </div>
          <select className="form-select" style={{ maxWidth: 200 }} value={semestre} onChange={(e) => setSemestre(e.target.value)}>
            <option value="">Tous les semestres</option>
            {SEMESTRES.map((s) => <option key={s} value={s}>Semestre {s}</option>)}
          </select>
        </div>
        {chargement && !donnees ? <Chargement /> : erreur ? <div className="p-3"><Erreur message={erreur} onReessayer={recharger} /></div> : donnees.length === 0 ? <TableauVide texte="Aucun module." /> : (
          <div className="et-tableau-conteneur">
            <table className="table et-tableau">
              <thead><tr><th>Module</th><th>Semestre</th><th>Filières</th><th>Enseignants</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {donnees.map((m) => (
                  <tr key={m.id_module}>
                    <td className="fw-medium">{m.nom_module}</td>
                    <td><Badge type="neutre">S{m.semestre}</Badge></td>
                    <td>{listeBadges(m.filieres, 'info')}</td>
                    <td>{listeBadges(m.enseignants, 'succes')}</td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-light btn-icone me-1" title="Filières" onClick={() => setAssoc({ type: 'filieres', module: m, ids: m.ids_filieres })}><Layers size={16} /></button>
                      <button className="btn btn-light btn-icone me-1" title="Enseignants" onClick={() => setAssoc({ type: 'enseignants', module: m, ids: m.ids_enseignants })}><Users size={16} /></button>
                      <button className="btn btn-light btn-icone me-1" title="Modifier" onClick={() => ouvrirEdition(m)}><Pencil size={16} /></button>
                      <button className="btn btn-light btn-icone text-danger" title="Supprimer" onClick={() => setASupprimer(m)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal ouvert={!!modal} titre={modal?.mode === 'ajout' ? 'Nouveau module' : 'Modifier le module'} onFermer={() => setModal(null)}
        pied={<><button className="btn btn-light" onClick={() => setModal(null)} disabled={enCours}>Annuler</button><button className="btn btn-primary" form="form-mod" type="submit" disabled={enCours}>Enregistrer</button></>}>
        <form id="form-mod" onSubmit={handleSubmit(enregistrer)} className="row g-3">
          <div className="col-md-8"><label className="form-label">Nom *</label><input className={`form-control ${errors.nom_module ? 'is-invalid' : ''}`} {...register('nom_module', { required: 'Obligatoire.' })} />{errors.nom_module && <div className="invalid-feedback">{errors.nom_module.message}</div>}</div>
          <div className="col-md-4"><label className="form-label">Semestre *</label>
            <select className="form-select" {...register('semestre', { required: true, valueAsNumber: true })}>{SEMESTRES.map((s) => <option key={s} value={s}>Semestre {s}</option>)}</select>
          </div>
        </form>
      </Modal>

      <Modal ouvert={!!assoc} titre={assoc?.type === 'filieres' ? `Filières du module ${assoc?.module.nom_module}` : `Enseignants du module ${assoc?.module.nom_module}`} onFermer={() => setAssoc(null)}
        pied={<><button className="btn btn-light" onClick={() => setAssoc(null)} disabled={enCours}>Annuler</button><button className="btn btn-primary" onClick={enregistrerAssoc} disabled={enCours}>Enregistrer</button></>}>
        {assoc?.type === 'filieres' && <ListeCases options={filieres || []} cle="id_filiere" libelle={(f) => f.nom_filiere} selection={assoc.ids} onChange={(ids) => setAssoc({ ...assoc, ids })} />}
        {assoc?.type === 'enseignants' && <ListeCases options={enseignants || []} cle="id_enseignant" libelle={(e) => `${e.prenom} ${e.nom}${e.specialite ? ` — ${e.specialite}` : ''}`} selection={assoc.ids} onChange={(ids) => setAssoc({ ...assoc, ids })} />}
      </Modal>

      <Confirmation ouvert={!!aSupprimer} titre="Supprimer le module" message={`Supprimer le module ${aSupprimer?.nom_module} ? La suppression sera refusée s'il possède des examens.`} onConfirmer={supprimer} onAnnuler={() => setASupprimer(null)} enCours={enCours} />
    </>
  )
}
