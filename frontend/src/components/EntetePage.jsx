export default function EntetePage({ titre, description, actions }) {
  return (
    <div className="et-entete-page">
      <div>
        <h2>{titre}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="d-flex gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}
