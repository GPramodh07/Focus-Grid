const db = require("../db");

exports.getAttendanceBySubject = (subjectId) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM attendance WHERE subject_id = ? ORDER BY class_date", [subjectId], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

exports.getAttendancePercentageBySubject = (subjectId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                SUM(status='present') AS presents, 
                SUM(status='absent') AS absents 
            FROM attendance 
            WHERE subject_id = ?
        `;
        db.query(query, [subjectId], (error, results) => {
            if (error) return reject(error);
            resolve(results[0]);
        });
    });
};

exports.addAttendance = (subject_id, class_date, hours, status, note) => {
    return new Promise((resolve, reject) => {
        db.query(
            "INSERT INTO attendance (subject_id, class_date, hours, status, note) VALUES (?, ?, ?, ?, ?)",
            [subject_id, class_date, hours, status, note || null],
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
    });
};

exports.updateAttendance = (id, hours, status, note) => {
    return new Promise((resolve, reject) => {
        db.query(
            "UPDATE attendance SET hours = ?, status = ?, note = ? WHERE id = ?",
            [hours, status, note || null, id],
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
    });
};

exports.deleteAttendance = (id) => {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM attendance WHERE id = ?", [id], (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};
