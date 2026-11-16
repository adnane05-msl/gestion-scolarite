import { useEffect } from 'react'
import { X } from 'lucide-react'

/** Fenêtre modale basée sur les classes Bootstrap, sans dépendance au JS de Bootstrap. */
export default function Modal({ ouvert, titre, onFermer, children, pied, taille = '' }) {
  useEffect(() => {
    if (!ouvert) return undefined
    const toucheEchap = (e) => e.key === 'Escape' && onFermer()
    document.addEventListener('keydown', toucheEchap)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', toucheEchap)
      document.body.classList.remove('modal-open')
    }
  }, [ouvert, onFermer])

  if (!ouvert) return null

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onFermer} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" onClick={onFermer}>
        <div className={`modal-dialog modal-dialog-centered ${taille}`} onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{titre}</h5>
              <button type="button" className="btn btn-icone" onClick={onFermer} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">{children}</div>
            {pied && <div className="modal-footer">{pied}</div>}
          </div>
        </div>
      </div>
    </>
  )
}
