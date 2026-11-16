import { useCallback, useEffect, useState } from 'react'
import { messageErreur } from '../services/api'

/**
 * Charge des données via une fonction asynchrone.
 * Se relance quand `deps` change ; `recharger()` force un nouveau chargement.
 */
export default function useFetch(chargeur, deps = []) {
  const [donnees, setDonnees] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let actif = true
    setChargement(true)
    setErreur(null)
    chargeur()
      .then((r) => actif && setDonnees(r))
      .catch((e) => actif && setErreur(messageErreur(e)))
      .finally(() => actif && setChargement(false))
    return () => {
      actif = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const recharger = useCallback(() => setVersion((v) => v + 1), [])
  return { donnees, chargement, erreur, recharger, setDonnees }
}
