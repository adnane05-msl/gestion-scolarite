import { Inbox, AlertCircle } from 'lucide-react'

export function Chargement({ texte = 'Chargement…' }) {
  return (
    <div className="d-flex align-items-center gap-2 text-secondary py-4 justify-content-center">
      <div className="spinner-border spinner-border-sm" role="status" />
      <span className="small">{texte}</span>
    </div>
  )
}

export function Erreur({ message, onReessayer }) {
  return (
    <div className="alert alert-danger d-flex align-items-center gap-2 mb-0">
      <AlertCircle size={18} />
      <span className="flex-grow-1">{message}</span>
      {onReessayer && (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onReessayer}>
          Réessayer
        </button>
      )}
    </div>
  )
}

export function TableauVide({ texte = 'Aucune donnée à afficher.' }) {
  return (
    <div className="et-vide">
      <Inbox size={40} />
      <div>{texte}</div>
    </div>
  )
}

export function Badge({ type = 'neutre', children }) {
  return <span className={`badge rounded-pill et-badge-douce-${type}`}>{children}</span>
}
