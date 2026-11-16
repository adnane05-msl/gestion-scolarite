export const formatDate = (valeur) => {
  if (!valeur) return ''
  const d = new Date(valeur)
  return Number.isNaN(d.getTime()) ? String(valeur) : d.toLocaleDateString('fr-FR')
}

export const formatDateHeure = (valeur) => {
  if (!valeur) return ''
  const d = new Date(valeur)
  return Number.isNaN(d.getTime())
    ? String(valeur)
    : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

/** Convertit une date reçue de l'API (format HTTP) en AAAA-MM-JJ pour les <input type="date">. */
export const versInputDate = (valeur) => {
  if (!valeur) return ''
  const d = new Date(valeur)
  if (Number.isNaN(d.getTime())) return ''
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mois}-${jour}`
}

export const aujourdHui = () => versInputDate(new Date())

/** 2026 -> "2026–2027" */
export const anneeUniversitaire = (annee) => (annee ? `${annee}–${Number(annee) + 1}` : '')

export const nomComplet = (p) => (p ? `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() : '')

export const formatNote = (n) => (n === null || n === undefined ? '—' : Number(n).toFixed(2))

export const moisLisible = (aaaaMm) => {
  if (!aaaaMm) return ''
  const [a, m] = aaaaMm.split('-')
  const d = new Date(Number(a), Number(m) - 1, 1)
  return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}
