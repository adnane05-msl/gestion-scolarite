import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import useToast from '../hooks/useToast'
import useDebounce from '../hooks/useDebounce'
import { enseignantsService, modulesService } from '../services/ressources'
import { messageErreur } from '../services/api'
import EntetePage from '../components/EntetePage.jsx'
import Modal from '../components/Modal.jsx'
import Confirmation from '../components/Confirmation.jsx'
import ListeCases from '../components/ListeCases.jsx'
import { Chargement, Erreur, TableauVide, Badge } from '../components/Etats.jsx'

export default function Enseignants() {
  const toast = useToast()
  const [recherche, setRecherche] = useState('')
  const rechercheRetardee = useDebounce(recherche)
  const [modal, setModal] = useState(null)
  const [affectation, setAffectation] = useState(null) // { enseignant, ids }
  const [aSupprimer, setASupprimer] = useState(null)
  const [enCours, setEnCours] = useState(false)

  const { donnees, chargement, erreur, recharger } = useFetch(() => enseignantsService.lister(rechercheRetardee), [rechercheRetardee])
  const { donnees: modules } = useFetch(() => modulesService.lister({}))
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const ouvrirAjout = () => { reset({ nom: '', prenom: '', email: '', specialite: '' }); setModal({ mode: 'ajout' }) }
  const ouvrirEdition = (e) => { reset({ nom: e.nom, prenom: e.prenom, email: e.email || '', specialite: e.specialite || '' }); setModal({ mode: 'edition', enseignant: e }) }

  const action = async (fn, succes) => {
    setEnCours(true)
    try { await fn(); toast.succes(succes); recharger(); return true }
    catch (e) { toast.erreur(messageErreur(e)); return false }
    finally { setEnCours(false) }
  }

  const enregistrer = async (v) => {
    const ok = await action(
      () => (modal.mode === 'ajout' ? enseignantsService.creer(v) : enseignantsService.modifier(modal.enseignant.id_enseignant, v)),
      modal.mode === 'ajout' ? 'Enseignant ajouté.' : 'Enseignant modifié.',
    )
    if (ok) setModal(null)
  }
  const supprimer = async () => {
    const ok = await action(() => enseignantsService.supprimer(aSupprimer.id_enseignant), 'Enseignant supprimé.')
    if (ok) setASupprimer(null)
  }
  const enregistrerAffectation = async () => {
    const ok = await action(() => enseignantsService.definirModules(affectation.enseignant.id_enseignant, affectation.ids), 'Modules mis à jour.')
    if (ok) setAffectation(null)
  }

  return (
    <>
      <EntetePage
        titre="Enseignants"
        description="Corps enseignant et affectation aux modules."
        actions={<button className="btn btn-primary d-flex align-items-center gap-2" onClick={ouvrirAjout}><Plus size={16} /> Ajouter un enseignant</button>}
      />

      <div className="et-carte p-0">
        <div className="p-3 border-bottom">
          <div className="input-group" style={{ maxWidth: 340 }}>
            <span className="input-group-text bg-white"><Search size={15} /></span>
            <input className="form-control" placeholder="Nom, prénom ou spécialité…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          </div>
        </div>
        {chargement && !donnees ? <Chargement /> : erreur ? <div className="p-3"><Erreur message={erreur} onReessayer={recharger} /></div> : donnees.length === 0 ? <TableauVide texte="Aucun enseignant." /> : (
          <div className="et-tableau-conteneur">
            <table className="table et-tableau">
              <thead><tr><th>Nom</th><th>Prénom</th><th>Email</th><th>Spécialité</th><th>Modules enseignés</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {donnees.map((e) => (
                  <tr key={e.id_enseignant}>
                    <td className="fw-medium">{e.nom}</td>
                    <td>{e.prenom}</td>
                    <td className="text-secondary">{e.email || '—'}</td>
                    <td>{e.specialite || '—'}</td>
                    <td>{e.modules ? e.modules.split(', ').map((m) => <span key={m} className="me-1"><Badge type="neutre">{m}</Badge></span>) : <span className="text-secondary">Aucun</span>}</td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-light btn-icone me-1" title="Affecter des modules" onClick={() => setAffectation({ enseignant: e, ids: e.ids_modules })}><BookOpen size={16} /></button>
                      <button className="btn btn-light btn-icone me-1" title="Modifier" onClick={() => ouvrirEdition(e)}><Pencil size={16} /></button>
                      <button className="btn btn-light btn-icone text-danger" title="Supprimer" onClick={() => setASupprimer(e)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal ouvert={!!modal} titre={modal?.mode === 'ajout' ? 'Nouvel enseignant' : 'Modifier l\'enseignant'} onFermer={() => setModal(null)}
        pied={<><button className="btn btn-light" onClick={() => setModal(null)} disabled={enCours}>Annuler</button><button className="btn btn-primary" form="form-ens" type="submit" disabled={enCours}>Enregistrer</button></>}>
        <form id="form-ens" onSubmit={handleSubmit(enregistrer)} className="row g-3">
          <div className="col-md-6"><label className="form-label">Nom *</label><input className={`form-control ${errors.nom ? 'is-invalid' : ''}`} {...register('nom', { required: 'Obligatoire.' })} />{errors.nom && <div className="invalid-feedback">{errors.nom.message}</div>}</div>
          <div className="col-md-6"><label className="form-label">Prénom *</label><input className={`form-control ${errors.prenom ? 'is-invalid' : ''}`} {...register('prenom', { required: 'Obligatoire.' })} />{errors.prenom && <div className="invalid-feedback">{errors.prenom.message}</div>}</div>
          <div className="col-md-6"><label className="form-label">Email</label><input type="email" className="form-control" {...register('email')} /></div>
          <div className="col-md-6"><label className="form-label">Spécialité</label><input className="form-control" {...register('specialite')} /></div>
        </form>
      </Modal>

      <Modal ouvert={!!affectation} titre={`Modules de ${affectation?.enseignant.prenom} ${affectation?.enseignant.nom}`} onFermer={() => setAffectation(null)}
        pied={<><button className="btn btn-light" onClick={() => setAffectation(null)} disabled={enCours}>Annuler</button><button className="btn btn-primary" onClick={enregistrerAffectation} disabled={enCours}>Enregistrer</button></>}>
        {affectation && (
          <ListeCases options={modules || []} cle="id_module" libelle={(m) => `${m.nom_module} (S${m.semestre})`} selection={affectation.ids} onChange={(ids) => setAffectation({ ...affectation, ids })} vide="Aucun module disponible." />
        )}
      </Modal>

      <Confirmation ouvert={!!aSupprimer} titre="Supprimer l'enseignant" message={`Supprimer ${aSupprimer?.prenom} ${aSupprimer?.nom} ? Ses affectations aux modules seront retirées.`} onConfirmer={supprimer} onAnnuler={() => setASupprimer(null)} enCours={enCours} />
    </>
  )
}
