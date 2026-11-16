"""Connexion MySQL et fonctions utilitaires d'accès aux données."""

import os

import mysql.connector
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "gestion_scolarite"),
    )


def query(sql, params=None, one=False):
    """Exécute un SELECT paramétré et renvoie des dictionnaires."""
    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params or ())
        rows = cur.fetchall()
        cur.close()
    finally:
        conn.close()
    if one:
        return rows[0] if rows else None
    return rows


def execute(sql, params=None):
    """Exécute un INSERT / UPDATE / DELETE paramétré. Renvoie (lastrowid, rowcount)."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        conn.commit()
        resultat = (cur.lastrowid, cur.rowcount)
        cur.close()
    finally:
        conn.close()
    return resultat


def execute_many(instructions):
    """Exécute plusieurs instructions dans une seule transaction.

    instructions : liste de tuples (sql, params).
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        for sql, params in instructions:
            cur.execute(sql, params or ())
        conn.commit()
        cur.close()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
