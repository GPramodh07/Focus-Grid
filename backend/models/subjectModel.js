const db = require("../db");

exports.getSubjectsByUser = (userId) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM subjects WHERE user_id = ? ORDER BY id ASC", [userId], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

exports.createSubject = (userId, subjectName) => {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO subjects (user_id, subject_name) VALUES (?, ?)", [userId, subjectName], (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};

exports.updateSubject = (id, userId, subjectName) => {
    return new Promise((resolve, reject) => {
        db.query("UPDATE subjects SET subject_name = ? WHERE id = ? AND user_id = ?", [subjectName, id, userId], (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};

exports.deleteSubject = (id, userId) => {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM subjects WHERE id = ? AND user_id = ?", [id, userId], (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};
