const db = require("../db");

exports.getAttendanceBySubject = (userId, subjectId) => {
    return new Promise((resolve, reject) => {
        db.query(
            `
                SELECT a.*
                FROM attendance a
                INNER JOIN subjects s ON s.id = a.subject_id
                WHERE a.subject_id = ? AND s.user_id = ?
                ORDER BY a.class_date
            `,
            [subjectId, userId],
            (error, results) => {
            if (error) return reject(error);
            resolve(results);
            }
        );
    });
};

exports.getAttendancePercentageBySubject = (userId, subjectId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                COALESCE(SUM(a.status='present'), 0) AS presents, 
                COALESCE(SUM(a.status='absent'), 0) AS absents 
            FROM attendance a
            INNER JOIN subjects s ON s.id = a.subject_id
            WHERE a.subject_id = ? AND s.user_id = ?
        `;
        db.query(query, [subjectId, userId], (error, results) => {
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

exports.addAttendance = (userId, subject_id, class_date, hours, status, note) => {
    return new Promise((resolve, reject) => {
        db.query(
            `
                INSERT INTO attendance (subject_id, class_date, hours, status, note)
                SELECT s.id, ?, ?, ?, ?
                FROM subjects s
                WHERE s.id = ? AND s.user_id = ?
            `,
            [class_date, hours, status, note || null, subject_id, userId],
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
    });
};

exports.updateAttendance = (userId, id, hours, status, note) => {
    return new Promise((resolve, reject) => {
        db.query(
            `
                UPDATE attendance a
                INNER JOIN subjects s ON s.id = a.subject_id
                SET a.hours = ?, a.status = ?, a.note = ?
                WHERE a.id = ? AND s.user_id = ?
            `,
            [hours, status, note || null, id, userId],
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
    });
};

exports.deleteAttendance = (userId, id) => {
    return new Promise((resolve, reject) => {
        db.query(
            `
                DELETE a
                FROM attendance a
                INNER JOIN subjects s ON s.id = a.subject_id
                WHERE a.id = ? AND s.user_id = ?
            `,
            [id, userId],
            (error, result) => {
            if (error) return reject(error);
            resolve(result);
            }
        );
    });
};
