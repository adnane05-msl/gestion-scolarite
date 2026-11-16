import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 15000 })

/** Extrait un message lisible d'une erreur Axios. */
export const messageErreur = (erreur) =>
  erreur?.response?.data?.erreur ||
  (erreur?.code === 'ECONNABORTED' ? 'Le serveur met trop de temps à répondre.' : null) ||
  (erreur?.request && !erreur?.response ? 'Backend injoignable. Vérifiez que Flask est lancé.' : null) ||
  erreur?.message ||
  'Erreur inconnue.'

export default api
