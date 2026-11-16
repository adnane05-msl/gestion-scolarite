import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, taille, total, onChange }) {
  const nbPages = Math.max(1, Math.ceil((total || 0) / taille))
  if (nbPages <= 1) return null
  const debut = (page - 1) * taille + 1
  const fin = Math.min(page * taille, total)

  return (
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-3 py-2 border-top">
      <span className="small text-secondary">
        {debut}–{fin} sur {total}
      </span>
      <div className="btn-group btn-group-sm">
        <button type="button" className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="btn btn-outline-secondary disabled">
          Page {page} / {nbPages}
        </span>
        <button type="button" className="btn btn-outline-secondary" disabled={page >= nbPages} onClick={() => onChange(page + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
