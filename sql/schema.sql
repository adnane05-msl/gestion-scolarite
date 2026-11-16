USE gestion_scolarite;

CREATE TABLE FILIERE (
    id_filiere   INT AUTO_INCREMENT PRIMARY KEY,
    nom_filiere  VARCHAR(100) NOT NULL UNIQUE,
    description  TEXT
) ENGINE=InnoDB;

CREATE TABLE ETUDIANT (
    id_etudiant  INT AUTO_INCREMENT PRIMARY KEY,
    nom          VARCHAR(50) NOT NULL,
    prenom       VARCHAR(50) NOT NULL,
    email        VARCHAR(100) UNIQUE,
    cne          VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE ENSEIGNANT (
    id_enseignant INT AUTO_INCREMENT PRIMARY KEY,
    nom           VARCHAR(50) NOT NULL,
    prenom        VARCHAR(50) NOT NULL,
    email         VARCHAR(100) UNIQUE,
    specialite    VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE MODULE (
    id_module   INT AUTO_INCREMENT PRIMARY KEY,
    nom_module  VARCHAR(100) NOT NULL,
    semestre    INT NOT NULL CHECK (semestre BETWEEN 1 AND 6)
) ENGINE=InnoDB;

CREATE TABLE CONTENIR (
    id_filiere INT NOT NULL,
    id_module  INT NOT NULL,
    PRIMARY KEY (id_filiere, id_module),
    FOREIGN KEY (id_filiere) REFERENCES FILIERE(id_filiere),
    FOREIGN KEY (id_module)  REFERENCES MODULE(id_module)
) ENGINE=InnoDB;

CREATE TABLE ENSEIGNER (
    id_enseignant INT NOT NULL,
    id_module     INT NOT NULL,
    PRIMARY KEY (id_enseignant, id_module),
    FOREIGN KEY (id_enseignant) REFERENCES ENSEIGNANT(id_enseignant),
    FOREIGN KEY (id_module)     REFERENCES MODULE(id_module)
) ENGINE=InnoDB;

CREATE TABLE INSCRIPTION (
    id_inscription      INT AUTO_INCREMENT PRIMARY KEY,
    id_etudiant         INT NOT NULL,
    id_filiere          INT NOT NULL,
    date_inscription    DATE NOT NULL,
    annee_universitaire INT NOT NULL,
    UNIQUE (id_etudiant, id_filiere, annee_universitaire),
    FOREIGN KEY (id_etudiant) REFERENCES ETUDIANT(id_etudiant),
    FOREIGN KEY (id_filiere)  REFERENCES FILIERE(id_filiere)
) ENGINE=InnoDB;

CREATE TABLE EXAMEN (
    id_examen   INT AUTO_INCREMENT PRIMARY KEY,
    id_module   INT NOT NULL,
    date_examen DATE NOT NULL,
    FOREIGN KEY (id_module) REFERENCES MODULE(id_module)
) ENGINE=InnoDB;

CREATE TABLE NOTE (
    id_note     INT AUTO_INCREMENT PRIMARY KEY,
    id_etudiant INT NOT NULL,
    id_examen   INT NOT NULL,
    valeur_note DECIMAL(4,2) NOT NULL CHECK (valeur_note BETWEEN 0 AND 20),
    date_saisie DATE NOT NULL,
    UNIQUE (id_etudiant, id_examen),
    FOREIGN KEY (id_etudiant) REFERENCES ETUDIANT(id_etudiant),
    FOREIGN KEY (id_examen)   REFERENCES EXAMEN(id_examen)
) ENGINE=InnoDB;

CREATE TABLE ABSENCE (
    id_absence   INT AUTO_INCREMENT PRIMARY KEY,
    id_etudiant  INT NOT NULL,
    date_absence DATE NOT NULL,
    nb_heures    INT NOT NULL CHECK (nb_heures > 0),
    justifie     BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (id_etudiant) REFERENCES ETUDIANT(id_etudiant)
) ENGINE=InnoDB;

CREATE TABLE NOTIFICATION (
    id_notification   INT AUTO_INCREMENT PRIMARY KEY,
    id_absence        INT NOT NULL,
    message           TEXT NOT NULL,
    date_notification DATETIME NOT NULL,
    statut            VARCHAR(20) NOT NULL DEFAULT 'non_lue'
                      CHECK (statut IN ('non_lue', 'lue')),
    FOREIGN KEY (id_absence) REFERENCES ABSENCE(id_absence)
) ENGINE=InnoDB;