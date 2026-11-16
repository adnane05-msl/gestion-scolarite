import { useEffect, useState } from 'react'

/** Retarde la propagation d'une valeur (utile pour les champs de recherche). */
export default function useDebounce(valeur, delai = 350) {
  const [retardee, setRetardee] = useState(valeur)
  useEffect(() => {
    const t = setTimeout(() => setRetardee(valeur), delai)
    return () => clearTimeout(t)
  }, [valeur, delai])
  return retardee
}
