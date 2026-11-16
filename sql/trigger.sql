USE gestion_scolarite;

DROP TRIGGER IF EXISTS trg_absence_notification;

DELIMITER $$

CREATE TRIGGER trg_absence_notification
AFTER INSERT ON ABSENCE
FOR EACH ROW
BEGIN
    IF NEW.justifie = FALSE THEN
        INSERT INTO NOTIFICATION (id_absence, message, date_notification, statut)
        VALUES (
            NEW.id_absence,
            CONCAT('Absence non justifiée de ', NEW.nb_heures,
                ' heure(s) le ', DATE_FORMAT(NEW.date_absence, '%d/%m/%Y')),
            NOW(),
            'non_lue'
        );
    END IF;
END$$

DELIMITER ;