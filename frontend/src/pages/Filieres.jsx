import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { BookOpen, GraduationCap, Pencil, Plus, Trash2, Users } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import useToast from '../hooks/useToast'
import { filieresService, modulesService } from '../services/ressources'
import { messageErreur } from '../services/api'
import EntetePage from '../components/EntetePage.jsx'
import Modal from '../components/Modal.jsx'
import Confirmation from '../components/Confirmation.jsx'
import ListeCases from '../components/ListeCases.jsx'
import { Chargement, Erreur, TableauVide } from '../components/Etats.jsx'

export default function Filieres() {
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [assoc, setAssoc] = useState(null) // { filiere, ids }
  const [vueEtudiants, setVueEtudiants] = useState(null) // { filiere, liste }
  const [aSupprimer, setASupprimer] = useState(null)
  const [enCours, setEnCours] = useState(false)

  const { donnees, chargement, erreur, recharger } = useFetch(filieresService.lister)
  const { donnees: modules } = useFetch(() => modulesService.lister({}))
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const action = async (fn, succes) => {
    setEnCours(true)
    try { await fn(); toast.succes(succes); recharger(); return true }
    catch (e) { toast.erreur(messageErreur(e)); return false }
    finally { setEnCours(false) }
  }

  const ouvrirAjout = () => { reset({ nom_filiere: '', description: '' }); setModal({ mode: 'ajout' }) }
  const ouvrirEdition = (f) => { reset({ nom_filiere: f.nom_filiere, description: f.description || '' }); setModal({ mode: 'edition', filiere: f }) }
  const enregistrer = async (v) => {
    const ok = await action(() => (modal.mode === 'ajout' ? filieresService.creer(v) : filieresService.modifier(modal.filiere.id_filiere, v)), modal.mode === 'ajout' ? 'Filière ajoutée.' : 'Filière modifiée.')
    if (ok) setModal(null)
  }
  const supprimer = async () => {
    const ok = await action(() => filieresService.supprimer(aSupprimer.id_filiere), 'Filière supprimée.')
    if (ok) setASupprimer(null)
  }
  const ouvrirModules = async (f) => {
    try { const liste = await filieresService.modules(f.id_filiere); setAssoc({ filiere: f, ids: liste.map((m) => m.id_module) }) }
    catch (e) { toast.erreur(messageErreur(e)) }
  }
  const enregistrerModules = async () => {
    const ok = await action(() => filieresService.definirModules(assoc.filiere.id_filiere, assoc.ids), 'Modules de la filière mis à jour.')
    if (ok) setAssoc(null)
  }
  const ouvrirEtudiants = async (f) => {
    try { setVueEtudiants({ filiere: f, liste: await filieresService.etudiants(f.id_filiere) }) }
    catch (e) { toast.erreur(messageErreur(e)) }
  }

  return (
    <>
      <EntetePage titre="Filières" description="Filières de l'établissement et modules qu'elles contiennent (table CONTENIR)."
        actions={<button className="btn btn-primary d-flex align-items-center gap-2" onClick={ouvrirAjout}><Plus size={16} /> Ajouter une filière</button>} />

      {chargement ? <Chargement /> : erreur ? <Erreur message={erreur} onReessayer={recharger} /> : donnees.length === 0 ? <div className="et-carte"><TableauVide texte="Aucune filière." /></div> : (
        <div className="row g-3">
          {donnees.map((f) => (
            <div className="col-md-6 col-xl-4" key={f.id_filiere}>
              <div className="et-carte et-carte-filiere d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="fw-semibold mb-0">{f.nom_filiere}</h5>
                  <div className="text-nowrap">
                    <button className="btn btn-light btn-icone me-1" title="Modifier" onClick={() => ouvrirEdition(f)}><Pencil size={15} /></button>
                    <button className="btn btn-light btn-icone text-danger" title="Supprimer" onClick={() => setASupprimer(f)}><Trash2 size={15} /></button>
                  </div>
                </div>
                <p className="text-secondary small flex-grow-1">{f.description || 'Aucune description.'}</p>
                <div className="d-flex gap-3 small mb-3">
                  <span className="d-flex align-items-center gap-1"><GraduationCap size={15} className="text-primary" /> {f.nb_etudiants} étudiant{f.nb_etudiants > 1 ? 's' : ''}</span>
                  <span className="d-flex align-items-center gap-1"><BookOpen size={15} className="text-success" /> {f.nb_modules} module{f.nb_modules > 1 ? 's' : ''}</span>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" onClick={() => ouvrirEtudiants(f)}><Users size={14} /> Étudiants</button>
                  <button className="btn btn-outline-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" onClick={() => ouvrirModules(f)}><BookOpen size={14} /> Modules</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal ouvert={!!modal} titre={modal?.mode === 'ajout' ? 'Nouvelle filière' : 'Modifier la filière'} onFermer={() => setModal(null)}
        pied={<><button className="btn btn-light" onClick={() => setModal(null)} disabled={enCours}>Annuler</button><button className="btn btn-primary" form="form-fil" type="submit" disabled={enCours}>Enregistrer</button></>}>
        <form id="form-fil" onSubmit={handleSubmit(enregistrer)} className="row g-3">
          <div className="col-12"><label className="form-label">Nom *</label><input className={`form-control ${errors.nom_filiere ? 'is-invalid' : ''}`} {...register('nom_filiere', { required: 'Obligatoire.' })} />{errors.nom_filiere && <div className="invalid-feedback">{errors.nom_filiere.message}</div>}</div>
          <div className="col-12"><label className="form-label">Description</label><textarea rows={3} className="form-control" {...register('description')} /></div>
        </form>
      </Modal>

      <Modal ouvert={!!assoc} titre={`Modules de la filière ${assoc?.filiere.nom_filiere}`} onFermer={() => setAssoc(null)}
        pied={<><button className="btn btn-light" onClick={() => setAssoc(null)} disabled={enCours}>Annuler</button><button className="btn btn-primary" onClick={enregistrerModules} disabled={enCours}>Enregistrer</button></>}>
        {assoc && <ListeCases options={modules || []} cle="id_module" libelle={(m) => `${m.nom_module} (S${m.semestre})`} selection={assoc.ids} onChange={(ids) => setAssoc({ ...assoc, ids })} />}
      </Modal>

      <Modal ouvert={!!vueEtudiants} titre={`Étudiants — ${vueEtudiants?.filiere.nom_filiere}`} onFermer={() => setVueEtudiants(null)} taille="modal-lg">
        {vueEtudiants && (vueEtudiants.liste.length === 0 ? <TableauVide texte="Aucun étudiant inscrit." /> : (
          <div className="et-tableau-conteneur" style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table className="table et-tableau">
              <thead><tr><th>CNE</th><th>Nom</th><th>Prénom</th><th>Année</th></tr></thead>
              <tbody>{vueEtudiants.liste.map((e) => <tr key={e.id_etudiant}><td>{e.cne}</td><td><Link to={`/etudiants/${e.id_etudiant}`} className="et-lien">{e.nom}</Link></td><td>{e.prenom}</td><td>{e.annee_universitaire}</td></tr>)}</tbody>
            </table>
          </div>
        ))}
      </Modal>

      <Confirmation ouvert={!!aSupprimer} titre="Supprimer la filière" message={`Supprimer la filière ${aSupprimer?.nom_filiere} ? La suppression sera refusée si des étudiants y sont inscrits.`} onConfirmer={supprimer} onAnnuler={() => setASupprimer(null)} enCours={enCours} />
    </>
  )
}
