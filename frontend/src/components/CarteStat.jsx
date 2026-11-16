export default function CarteStat({ icone: Icone, libelle, valeur, couleur = '#2563eb' }) {
  return (
    <div className="et-carte et-carte-stat">
      <div className="et-icone" style={{ background: `${couleur}1a`, color: couleur }}>
        <Icone size={22} />
      </div>
      <div>
        <div className="et-valeur">{valeur ?? '—'}</div>
        <div className="et-libelle">{libelle}</div>
      </div>
    </div>
  )
}
