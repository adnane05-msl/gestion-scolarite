# EduTrack — plateforme de gestion de la scolarité

Projet Bases de Données Relationnelles — Master Data & IA, INPT Rabat.

## Structure

```
backend/     API REST Flask (config/ middlewares/ services/ controllers/ routes/)
frontend/    Application React (Vite, Bootstrap, React Router, Axios, Recharts, React Hook Form, Lucide)
sql/         schema.sql, data.sql, trigger.sql, requetes.sql, index.sql
modeles/     MCD et MLD (PowerDesigner)
```

## Installation

Prérequis : Python 3.11+, Node.js LTS, MySQL 8 (Workbench ou XAMPP).

1. Base de données (dans Workbench, dans cet ordre) : `sql/schema.sql`, `sql/trigger.sql`, `sql/data.sql`, `sql/index.sql`.
2. Backend :
   ```
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   copy .env.exemple .env      (puis renseigner DB_USER / DB_PASSWORD)
   python app.py
   ```
3. Frontend (second terminal) :
   ```
   cd frontend
   npm install
   npm run dev
   ```
4. Ouvrir http://localhost:5173

Optionnel : `python generer_donnees.py` (dans backend) ajoute 2000 étudiants pour la démonstration des index.
