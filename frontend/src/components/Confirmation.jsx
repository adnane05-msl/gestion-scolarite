import { AlertTriangle } from 'lucide-react'
import Modal from './Modal.jsx'

export default function Confirmation({ ouvert, titre = 'Confirmer', message, onConfirmer, onAnnuler, enCours }) {
  return (
    <Modal
      ouvert={ouvert}
      titre={titre}
      onFermer={onAnnuler}
      pied={
        <>
          <button type="button" className="btn btn-light" onClick={onAnnuler} disabled={enCours}>
            Annuler
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirmer} disabled={enCours}>
            {enCours ? 'Suppression…' : 'Supprimer'}
          </button>
        </>
      }
    >
      <div className="d-flex gap-3 align-items-start">
        <AlertTriangle className="text-danger flex-shrink-0" size={28} />
        <p className="mb-0">{message}</p>
      </div>
    </Modal>
  )
}
