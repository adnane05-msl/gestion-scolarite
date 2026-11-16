import api from './api'

const d = (p) => p.then((r) => r.data)

export const statsService = {
  tableauDeBord: () => d(api.get('/stats')),
}

export const etudiantsService = {
  lister: (params) => d(api.get('/etudiants', { params })),
  minimal: (recherche = '') => d(api.get('/etudiants/minimal', { params: { recherche } })),
  fiche: (id) => d(api.get(`/etudiants/${id}`)),
  creer: (donnees) => d(api.post('/etudiants', donnees)),
  modifier: (id, donnees) => d(api.put(`/etudiants/${id}`, donnees)),
  supprimer: (id) => d(api.delete(`/etudiants/${id}`)),
}

export const enseignantsService = {
  lister: (recherche = '') => d(api.get('/enseignants', { params: { recherche } })),
  creer: (donnees) => d(api.post('/enseignants', donnees)),
  modifier: (id, donnees) => d(api.put(`/enseignants/${id}`, donnees)),
  supprimer: (id) => d(api.delete(`/enseignants/${id}`)),
  definirModules: (id, ids_modules) => d(api.put(`/enseignants/${id}/modules`, { ids_modules })),
}

export const filieresService = {
  lister: () => d(api.get('/filieres')),
  creer: (donnees) => d(api.post('/filieres', donnees)),
  modifier: (id, donnees) => d(api.put(`/filieres/${id}`, donnees)),
  supprimer: (id) => d(api.delete(`/filieres/${id}`)),
  etudiants: (id) => d(api.get(`/filieres/${id}/etudiants`)),
  modules: (id) => d(api.get(`/filieres/${id}/modules`)),
  definirModules: (id, ids_modules) => d(api.put(`/filieres/${id}/modules`, { ids_modules })),
}

export const modulesService = {
  lister: (params) => d(api.get('/modules', { params })),
  creer: (donnees) => d(api.post('/modules', donnees)),
  modifier: (id, donnees) => d(api.put(`/modules/${id}`, donnees)),
  supprimer: (id) => d(api.delete(`/modules/${id}`)),
  definirFilieres: (id, ids_filieres) => d(api.put(`/modules/${id}/filieres`, { ids_filieres })),
  definirEnseignants: (id, ids_enseignants) =>
    d(api.put(`/modules/${id}/enseignants`, { ids_enseignants })),
}

export const inscriptionsService = {
  lister: (params) => d(api.get('/inscriptions', { params })),
  creer: (donnees) => d(api.post('/inscriptions', donnees)),
  supprimer: (id) => d(api.delete(`/inscriptions/${id}`)),
}

export const examensService = {
  lister: () => d(api.get('/examens')),
  creer: (donnees) => d(api.post('/examens', donnees)),
  modifier: (id, donnees) => d(api.put(`/examens/${id}`, donnees)),
  supprimer: (id) => d(api.delete(`/examens/${id}`)),
  etudiants: (id) => d(api.get(`/examens/${id}/etudiants`)),
  enregistrerNotes: (id, notes) => d(api.post(`/examens/${id}/notes`, { notes })),
  classement: (filiere) => d(api.get('/examens/classement', { params: filiere ? { filiere } : {} })),
}

export const absencesService = {
  lister: (params) => d(api.get('/absences', { params })),
  creer: (donnees) => d(api.post('/absences', donnees)),
  modifier: (id, donnees) => d(api.put(`/absences/${id}`, donnees)),
  supprimer: (id) => d(api.delete(`/absences/${id}`)),
  totaux: (limite = 10) => d(api.get('/absences/totaux', { params: { limite } })),
  alertes: () => d(api.get('/absences/alertes')),
}

export const notificationsService = {
  lister: (params) => d(api.get('/notifications', { params })),
  nonLues: () => d(api.get('/notifications/non-lues')),
  marquerLue: (id) => d(api.put(`/notifications/${id}/lue`)),
  toutMarquerLues: () => d(api.put('/notifications/tout-lues')),
}
