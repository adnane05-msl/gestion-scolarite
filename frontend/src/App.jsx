import { useEffect, useState } from 'react'

export default function App() {
  const [etat, setEtat] = useState(null)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setEtat)
      .catch(() => setErreur('Backend injoignable'))
  }, [])

  return (
    <main>
      <h1>Gestion de la scolarité</h1>
      {erreur && <p>{erreur}</p>}
      {etat && (
        <p>
          Backend : {etat.status} — Base : {etat.database} — MySQL {etat.mysql}
        </p>
      )}
    </main>
  )
}