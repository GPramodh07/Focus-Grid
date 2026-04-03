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

exports.getAttendanceSummaryByUser = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT
                s.id AS subject_id,
                s.subject_name,
                COALESCE(SUM(a.status = 'present'), 0) AS presents,
                COALESCE(SUM(a.status = 'absent'), 0) AS absents
            FROM subjects s
            LEFT JOIN attendance a ON a.subject_id = s.id
            WHERE s.user_id = ?
            GROUP BY s.id, s.subject_name
            ORDER BY s.id ASC
        `;

        db.query(query, [userId], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

exports.calculateAttendancePercentage = (stats) => {
    const presents = parseInt(stats && stats.presents, 10) || 0;
    const absents = parseInt(stats && stats.absents, 10) || 0;
    const total = presents + absents;
    const percentage = total > 0 ? Math.round((presents / total) * 100) : 0;

    return {
        presents,
        absents,
        percentage
    };
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
