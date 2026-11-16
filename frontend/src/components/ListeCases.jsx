/** Liste de cases à cocher pour gérer une association plusieurs-à-plusieurs. */
export default function ListeCases({ options, cle, libelle, selection, onChange, vide = 'Aucun élément.' }) {
  const basculer = (id) =>
    onChange(selection.includes(id) ? selection.filter((x) => x !== id) : [...selection, id])

  if (!options?.length) return <p className="text-secondary small mb-0">{vide}</p>

  return (
    <div className="et-liste-cases">
      {options.map((o) => {
        const id = o[cle]
        return (
          <div className="form-check" key={id}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`case-${cle}-${id}`}
              checked={selection.includes(id)}
              onChange={() => basculer(id)}
            />
            <label className="form-check-label" htmlFor={`case-${cle}-${id}`}>
              {libelle(o)}
            </label>
          </div>
        )
      })}
    </div>
  )
}
