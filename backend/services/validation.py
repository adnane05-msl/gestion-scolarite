"""Règles métier et validations partagées."""

from datetime import date

from middlewares.erreurs import ErreurApplicative

SEUIL_ALERTE_ABSENCE = 20  # heures cumulées à partir desquelles un étudiant est "à surveiller"
ANNEE_UNIVERSITAIRE_COURANTE = 2026


def champs_obligatoires(donnees, *champs):
    if donnees is None:
        raise ErreurApplicative("Corps de requête JSON manquant.")
    manquants = [c for c in champs if donnees.get(c) in (None, "")]
    if manquants:
        raise ErreurApplicative(f"Champs obligatoires manquants : {', '.join(manquants)}.")


def entier(valeur, nom, minimum=None, maximum=None):
    try:
        v = int(valeur)
    except (TypeError, ValueError):
        raise ErreurApplicative(f"{nom} doit être un nombre entier.")
    if minimum is not None and v < minimum:
        raise ErreurApplicative(f"{nom} doit être au moins {minimum}.")
    if maximum is not None and v > maximum:
        raise ErreurApplicative(f"{nom} doit être au plus {maximum}.")
    return v


def note_valide(valeur):
    try:
        v = float(valeur)
    except (TypeError, ValueError):
        raise ErreurApplicative("La note doit être un nombre.")
    if v < 0 or v > 20:
        raise ErreurApplicative("La note doit être comprise entre 0 et 20.")
    return round(v, 2)


def date_valide(valeur, nom="La date"):
    try:
        return date.fromisoformat(str(valeur))
    except ValueError:
        raise ErreurApplicative(f"{nom} doit être au format AAAA-MM-JJ.")


def pagination(args, taille_defaut=20):
    page = entier(args.get("page", 1), "page", minimum=1)
    taille = entier(args.get("taille", taille_defaut), "taille", minimum=1, maximum=200)
    return page, taille, (page - 1) * taille
