import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import useToast from '../hooks/useToast'
import { etudiantsService, examensService, filieresService, modulesService } from '../services/ressources'
import { messageErreur } from '../services/api'
import EntetePage from '../components/EntetePage.jsx'
import Modal from '../components/Modal.jsx'
import Confirmation from '../components/Confirmation.jsx'
import SelecteurEtudiant from '../components/SelecteurEtudiant.jsx'
import { Chargement, Erreur, TableauVide, Badge } from '../components/Etats.jsx'
import { formatDate, formatNote, nomComplet, versInputDate } from '../utils/format'

/* ------------------------------------------------------------------ */
/* Onglet 1 : Examens                                                  */
/* ------------------------------------------------------------------ */
function OngletExamens({ examens, chargement, erreur, recharger }) {
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [aSupprimer, setASupprimer] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const { donnees: modules } = useFetch(() => modulesService.lister({}))
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const ouvrirAjout = () => { reset({ id_module: '', date_examen: '' }); setModal({ mode: 'ajout' }) }
  const ouvrirEdition = (x) => { reset({ id_module: x.id_module, date_examen: versInputDate(x.date_examen) }); setModal({ mode: 'edition', examen: x }) }

  const enregistrer = async (v) => {
    setEnCours(true)
    try {
      if (modal.mode === 'ajout') await examensService.creer(v); else await examensService.modifier(modal.examen.id_examen, v)
      toast.succes(modal.mode === 'ajout' ? 'Examen créé.' : 'Examen modifié.')
      setModal(null); recharger()
    } catch (e) { toast.erreur(messageErreur(e)) } finally { setEnCours(false) }
  }
  const supprimer = async () => {
    setEnCours(true)
    try { await examensService.supprimer(aSupprimer.id_examen); toast.succes('Examen supprimé.'); setASupprimer(null); recharger() }
    catch (e) { toast.erreur(messageErreur(e)) } finally { setEnCours(false) }
  }

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={ouvrirAjout}><Plus size={16} /> Créer un examen</button>
      </div>
      <div className="et-carte p-0">
        {chargement ? <Chargement /> : erreur ? <div className="p-3"><Erreur message={erreur} onReessayer={recharger} /></div> : examens.length === 0 ? <TableauVide texte="Aucun examen." /> : (
          <div className="et-tableau-conteneur">
            <table className="table et-tableau">
              <thead><tr><th>#</th><th>Module</th><th>Semestre</th><th>Date</th><th>Avancement de la saisie</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {examens.map((x) => (
                  <tr key={x.id_examen}>
                    <td className="text-secondary">{x.id_examen}</td>
                    <td className="fw-medium">{x.nom_module}</td>
                    <td><Badge type="neutre">S{x.semestre}</Badge></td>
                    <td>{formatDate(x.date_examen)}</td>
                    <td>
                      {x.nb_notes} / {x.nb_concernes} étudiants{' '}
                      {x.nb_concernes > 0 && x.nb_notes >= x.nb_concernes
                        ? <Badge type="succes">Terminé</Badge>
                        : x.nb_notes === 0
                          ? <Badge type="neutre">À saisir</Badge>
                          : <Badge type="avert">En cours</Badge>}
                    </td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-light btn-icone me-1" title="Modifier" onClick={() => ouvrirEdition(x)}><Pencil size={16} /></button>
                      <button className="btn btn-light btn-icone text-danger" title="Supprimer" onClick={() => setASupprimer(x)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal ouvert={!!modal} titre={modal?.mode === 'ajout' ? 'Nouvel examen' : 'Modifier l\'examen'} onFermer={() => setModal(null)}
        pied={<><button className="btn btn-light" onClick={() => setModal(null)} disabled={enCours}>Annuler</button><button className="btn btn-primary" form="form-exam" type="submit" disabled={enCours}>Enregistrer</button></>}>
        <form id="form-exam" onSubmit={handleSubmit(enregistrer)} className="row g-3">
          <div className="col-12"><label className="form-label">Module *</label>
            <select className={`form-select ${errors.id_module ? 'is-invalid' : ''}`} {...register('id_module', { required: 'Choisissez un module.' })}>
              <option value="">Choisir…</option>
              {(modules || []).map((m) => <option key={m.id_module} value={m.id_module}>{m.nom_module} (S{m.semestre})</option>)}
            </select>
            {errors.id_module && <div className="invalid-feedback">{errors.id_module.message}</div>}
          </div>
          <div className="col-12"><label className="form-label">Date de l'examen *</label>
            <input type="date" className={`form-control ${errors.date_examen ? 'is-invalid' : ''}`} {...register('date_examen', { required: 'Obligatoire.' })} />
            {errors.date_examen && <div className="invalid-feedback">{errors.date_examen.message}</div>}
          </div>
        </form>
      </Modal>

      <Confirmation ouvert={!!aSupprimer} titre="Supprimer l'examen" message={`Supprimer l'examen de ${aSupprimer?.nom_module} du ${formatDate(aSupprimer?.date_examen)} ? Refusé si des notes y sont rattachées.`} onConfirmer={supprimer} onAnnuler={() => setASupprimer(null)} enCours={enCours} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Onglet 2 : Saisie des notes                                         */
/* ------------------------------------------------------------------ */
function OngletSaisie({ examens, rechargerExamens }) {
  const toast = useToast()
  const [idExamen, setIdExamen] = useState('')
  const [etudiants, setEtudiants] = useState(null)
  const [examen, setExamen] = useState(null)
  const [valeurs, setValeurs] = useState({})
  const [chargement, setChargement] = useState(false)
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    if (!idExamen) { setEtudiants(null); return }
    setChargement(true)
    examensService.etudiants(idExamen)
      .then((r) => {
        setExamen(r.examen); setEtudiants(r.etudiants)
        setValeurs(Object.fromEntries(r.etudiants.map((e) => [e.id_etudiant, e.valeur_note ?? ''])))
      })
      .catch((e) => toast.erreur(messageErreur(e)))
      .finally(() => setChargement(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idExamen])

  const modifies = (etudiants || []).filter((e) => String(valeurs[e.id_etudiant] ?? '') !== String(e.valeur_note ?? '') && valeurs[e.id_etudiant] !== '')
  const invalides = Object.values(valeurs).some((v) => v !== '' && (Number.isNaN(Number(v)) || Number(v) < 0 || Number(v) > 20))

  const enregistrer = async () => {
    if (invalides) return toast.erreur('Toutes les notes doivent être comprises entre 0 et 20.')
    if (modifies.length === 0) return toast.info('Aucune modification à enregistrer.')
    setEnCours(true)
    try {
      const r = await examensService.enregistrerNotes(idExamen, modifies.map((e) => ({ id_etudiant: e.id_etudiant, valeur_note: Number(valeurs[e.id_etudiant]) })))
      toast.succes(r.message)
      const maj = await examensService.etudiants(idExamen)
      setEtudiants(maj.etudiants)
      rechargerExamens()
    } catch (e) { toast.erreur(messageErreur(e)) } finally { setEnCours(false) }
  }

  return (
    <>
      <div className="et-carte mb-3">
        <label className="form-label">Examen</label>
        <select className="form-select" style={{ maxWidth: 480 }} value={idExamen} onChange={(e) => setIdExamen(e.target.value)}>
          <option value="">Sélectionner un examen…</option>
          {examens.map((x) => <option key={x.id_examen} value={x.id_examen}>#{x.id_examen} — {x.nom_module} — {formatDate(x.date_examen)}</option>)}
        </select>
        <div className="form-text">Les étudiants affichés sont ceux inscrits dans une filière contenant le module de l'examen.</div>
      </div>

      {chargement && <Chargement />}
      {etudiants && !chargement && (
        <div className="et-carte p-0">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 border-bottom">
            <div><strong>{examen.nom_module}</strong> <span className="text-secondary">— {formatDate(examen.date_examen)} — {etudiants.length} étudiant{etudiants.length > 1 ? 's' : ''}</span></div>
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={enregistrer} disabled={enCours || modifies.length === 0}>
              <Save size={16} /> Enregistrer {modifies.length > 0 ? `(${modifies.length})` : ''}
            </button>
          </div>
          {etudiants.length === 0 ? <TableauVide texte="Aucun étudiant concerné par cet examen." /> : (
            <div className="et-tableau-conteneur" style={{ maxHeight: 520, overflowY: 'auto' }}>
              <table className="table et-tableau">
                <thead><tr><th>CNE</th><th>Nom</th><th>Prénom</th><th>Filière</th><th>Note actuelle</th><th>Saisie /20</th></tr></thead>
                <tbody>
                  {etudiants.map((e) => {
                    const v = valeurs[e.id_etudiant]
                    const invalide = v !== '' && (Number.isNaN(Number(v)) || Number(v) < 0 || Number(v) > 20)
                    return (
                      <tr key={e.id_etudiant}>
                        <td>{e.cne}</td><td>{e.nom}</td><td>{e.prenom}</td>
                        <td><Badge type="info">{e.nom_filiere}</Badge></td>
                        <td>{e.valeur_note === null ? <Badge type="avert">Non saisie</Badge> : formatNote(e.valeur_note)}</td>
                        <td>
                          <input type="number" step="0.25" min="0" max="20" className={`form-control form-control-sm et-input-note ${invalide ? 'is-invalid' : ''}`} value={v} onChange={(ev) => setValeurs({ ...valeurs, [e.id_etudiant]: ev.target.value })} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Onglet 3 : Consultation des notes et classement                     */
/* ------------------------------------------------------------------ */
function OngletConsultation() {
  const toast = useToast()
  const [etudiant, setEtudiant] = useState(null)
  const [fiche, setFiche] = useState(null)
  const [filiere, setFiliere] = useState('')
  const { donnees: filieres } = useFetch(filieresService.lister)
  const { donnees: classement, chargement, erreur, recharger } = useFetch(() => examensService.classement(filiere), [filiere])

  useEffect(() => {
    if (!etudiant) { setFiche(null); return }
    etudiantsService.fiche(etudiant.id_etudiant).then(setFiche).catch((e) => toast.erreur(messageErreur(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etudiant])

  return (
    <div className="row g-3">
      <div className="col-lg-5">
        <div className="et-carte">
          <h6 className="fw-semibold mb-3">Notes d'un étudiant</h6>
          <SelecteurEtudiant valeur={etudiant} onChange={setEtudiant} />
          {fiche && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Link to={`/etudiants/${fiche.etudiant.id_etudiant}`} className="et-lien">Voir la fiche complète</Link>
                <span>Moyenne : <strong>{formatNote(fiche.moyenne)}</strong></span>
              </div>
              {fiche.notes.length === 0 ? <TableauVide texte="Aucune note." /> : (
                <table className="table et-tableau">
                  <thead><tr><th>Module</th><th>Date examen</th><th>Note</th></tr></thead>
                  <tbody>{fiche.notes.map((n) => <tr key={n.id_note}><td>{n.nom_module}</td><td>{formatDate(n.date_examen)}</td><td><Badge type={n.valeur_note >= 10 ? 'succes' : 'erreur'}>{formatNote(n.valeur_note)}</Badge></td></tr>)}</tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="col-lg-7">
        <div className="et-carte p-0">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 border-bottom">
            <h6 className="fw-semibold mb-0">Classement par moyenne</h6>
            <select className="form-select form-select-sm" style={{ maxWidth: 220 }} value={filiere} onChange={(e) => setFiliere(e.target.value)}>
              <option value="">Toutes les filières</option>
              {(filieres || []).map((f) => <option key={f.id_filiere} value={f.id_filiere}>{f.nom_filiere}</option>)}
            </select>
          </div>
          {chargement ? <Chargement /> : erreur ? <div className="p-3"><Erreur message={erreur} onReessayer={recharger} /></div> : classement.length === 0 ? <TableauVide texte="Aucune note enregistrée." /> : (
            <div className="et-tableau-conteneur" style={{ maxHeight: 560, overflowY: 'auto' }}>
              <table className="table et-tableau">
                <thead><tr><th>Rang</th><th>Étudiant</th><th>Filière</th><th>Notes</th><th>Moyenne</th></tr></thead>
                <tbody>
                  {classement.map((c) => (
                    <tr key={`${c.nom_filiere}-${c.id_etudiant}`}>
                      <td><Badge type={c.rang === 1 ? 'succes' : 'neutre'}>{c.rang}</Badge></td>
                      <td><Link to={`/etudiants/${c.id_etudiant}`} className="et-lien">{nomComplet(c)}</Link> <span className="text-secondary small">{c.cne}</span></td>
                      <td>{c.nom_filiere}</td>
                      <td>{c.nb_notes}</td>
                      <td className="fw-semibold">{formatNote(c.moyenne)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function ExamensNotes() {
  const [onglet, setOnglet] = useState('examens')
  const { donnees: examens, chargement, erreur, recharger } = useFetch(examensService.lister)

  return (
    <>
      <EntetePage titre="Examens et notes" description="Création des examens, saisie des notes par examen et consultation des résultats." />
      <ul className="nav et-onglets border-bottom mb-3">
        {[['examens', 'Examens'], ['saisie', 'Saisie des notes'], ['consultation', 'Consultation des notes']].map(([cle, libelle]) => (
          <li className="nav-item" key={cle}><button className={`nav-link ${onglet === cle ? 'active' : ''}`} onClick={() => setOnglet(cle)}>{libelle}</button></li>
        ))}
      </ul>
      {onglet === 'examens' && <OngletExamens examens={examens || []} chargement={chargement} erreur={erreur} recharger={recharger} />}
      {onglet === 'saisie' && <OngletSaisie examens={examens || []} rechargerExamens={recharger} />}
      {onglet === 'consultation' && <OngletConsultation />}
    </>
  )
}
