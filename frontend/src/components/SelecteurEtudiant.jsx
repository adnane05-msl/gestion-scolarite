import { useEffect, useState } from 'react'
import { etudiantsService } from '../services/ressources'
import useDebounce from '../hooks/useDebounce'

/** Champ de recherche d'un étudiant (par nom, prénom ou CNE) avec liste de suggestions. */
export default function SelecteurEtudiant({ valeur, onChange, placeholder = 'Rechercher un étudiant…' }) {
  const [texte, setTexte] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [ouvert, setOuvert] = useState(false)
  const recherche = useDebounce(texte)

  useEffect(() => {
    if (!ouvert) return
    etudiantsService.minimal(recherche).then(setSuggestions).catch(() => setSuggestions([]))
  }, [recherche, ouvert])

  const choisir = (e) => {
    onChange(e)
    setTexte('')
    setOuvert(false)
  }

  return (
    <div className="position-relative">
      {valeur ? (
        <div className="d-flex align-items-center gap-2">
          <span className="form-control bg-light">
            {valeur.prenom} {valeur.nom} <span className="text-secondary">({valeur.cne})</span>
          </span>
          <button type="button" className="btn btn-light" onClick={() => onChange(null)}>
            Changer
          </button>
        </div>
      ) : (
        <input
          className="form-control"
          placeholder={placeholder}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onFocus={() => setOuvert(true)}
          onBlur={() => setTimeout(() => setOuvert(false), 150)}
        />
      )}
      {ouvert && !valeur && suggestions.length > 0 && (
        <div className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 1060, maxHeight: 240, overflowY: 'auto' }}>
          {suggestions.map((s) => (
            <button
              type="button"
              key={s.id_etudiant}
              className="list-group-item list-group-item-action small"
              onMouseDown={() => choisir(s)}
            >
              {s.prenom} {s.nom} <span className="text-secondary">— {s.cne}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
