import { createContext, useCallback, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

export const ToastContext = createContext({ succes: () => {}, erreur: () => {}, info: () => {} })

const ICONES = { succes: CheckCircle2, erreur: AlertCircle, info: Info }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const retirer = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const ajouter = useCallback(
    (type, message) => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, type, message }])
      setTimeout(() => retirer(id), type === 'erreur' ? 6000 : 3500)
    },
    [retirer],
  )

  const valeur = useMemo(
    () => ({
      succes: (m) => ajouter('succes', m),
      erreur: (m) => ajouter('erreur', m),
      info: (m) => ajouter('info', m),
    }),
    [ajouter],
  )

  return (
    <ToastContext.Provider value={valeur}>
      {children}
      <div className="et-toasts" aria-live="polite">
        {toasts.map((t) => {
          const Icone = ICONES[t.type]
          return (
            <div key={t.id} className={`et-toast ${t.type}`}>
              <Icone size={18} />
              <span className="flex-grow-1 small">{t.message}</span>
              <button
                type="button"
                className="btn btn-sm p-0 text-white border-0"
                onClick={() => retirer(t.id)}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
