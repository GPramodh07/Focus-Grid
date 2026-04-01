const db = require('../db');

exports.getRoutinesByUser = (userId, callback) => {
    const query = 'SELECT * FROM routines WHERE user_id = ?';
    db.query(query, [userId], callback);
};

exports.checkDuplicateTitle = (userId, title, callback) => {
    const query = 'SELECT * FROM routines WHERE user_id = ? AND title = ?';
    db.query(query, [userId, title], callback);
};

exports.checkTimeConflict = (userId, startTime, endTime, callback) => {
    const query = `
        SELECT * FROM routines
        WHERE user_id = ?
        AND ((? < end_time) AND (? > start_time))
    `;
    db.query(query, [userId, startTime, endTime], callback);
};

exports.checkTimeConflictExcludingId = (userId, routineId, startTime, endTime, callback) => {
    const query = `
        SELECT * FROM routines
        WHERE user_id = ?
        AND id != ?
        AND ((? < end_time) AND (? > start_time))
    `;
    db.query(query, [userId, routineId, startTime, endTime], callback);
};

exports.createRoutine = (data, callback) => {
    const query = 'INSERT INTO routines (user_id, title, start_time, end_time) VALUES (?, ?, ?, ?)';
    db.query(query, [data.user_id, data.title, data.start_time, data.end_time], callback);
};

exports.updateRoutine = (id, data, callback) => {
    const query = 'UPDATE routines SET title = ?, start_time = ?, end_time = ? WHERE id = ? AND user_id = ?';
    db.query(query, [data.title, data.start_time, data.end_time, id, data.user_id], callback);
};

exports.deleteRoutine = (id, userId, callback) => {
    const query = 'DELETE FROM routines WHERE id = ? AND user_id = ?';
    db.query(query, [id, userId], callback);
};