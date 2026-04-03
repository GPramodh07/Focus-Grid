const db = require('../db');

exports.getAllTasks = (userId, callback) => {
    const query = `
        SELECT
            id,
            user_id,
            title,
            description,
            DATE_FORMAT(task_date, '%Y-%m-%d') AS task_date,
            start_time,
            end_time,
            status
        FROM tasks
        WHERE user_id = ?
        ORDER BY task_date ASC, start_time ASC
    `;
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error("[TASK-MODEL] getAllTasks query failed:", err.message);
        }
        callback(err, result);
    });
};

exports.getTasksByDate = (userId, date, callback) => {
    const query = `
        SELECT
            id,
            user_id,
            title,
            description,
            DATE_FORMAT(task_date, '%Y-%m-%d') AS task_date,
            start_time,
            end_time,
            status
        FROM tasks
        WHERE user_id = ? AND task_date = ?
        ORDER BY start_time ASC
    `;
    db.query(query, [userId, date], (err, result) => {
        if (err) {
            console.error("[TASK-MODEL] getTasksByDate query failed:", err.message);
        }
        callback(err, result);
    });
};

exports.createTask = (data, callback) => {
    const query = `
        INSERT INTO tasks (user_id, title, description, task_date, start_time, end_time, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const queryParams = [
        data.user_id, 
        data.title, 
        data.description, 
        data.task_date, 
        data.start_time || null, 
        data.end_time || null, 
        data.status || 'pending'
    ];

    db.query(query, queryParams, (err, result) => {
        if (err) {
            console.error("[TASK-MODEL] Query execution failed:", {
                code: err.code,
                errno: err.errno,
                message: err.message,
                sql: err.sql
            });
        }
        callback(err, result);
    });
};

exports.updateTask = (id, data, callback) => {
    const query = `
        UPDATE tasks 
        SET title = ?, description = ?, task_date = ?, start_time = ?, end_time = ?, status = ? 
        WHERE id = ? AND user_id = ?
    `;
    db.query(query, [
        data.title, 
        data.description, 
        data.task_date, 
        data.start_time || null, 
        data.end_time || null, 
        data.status || 'pending', 
        id, 
        data.user_id
    ], callback);
};

exports.deleteTask = (id, userId, callback) => {
    const query = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
    db.query(query, [id, userId], callback);
};

exports.getTodayTasks = (userId, date, callback) => {
    const query = `
        SELECT id, title, start_time, end_time, status
        FROM tasks
        WHERE user_id = ?
          AND task_date = ?
        ORDER BY start_time ASC
    `;

    db.query(query, [userId, date], (err, result) => {
        if (err) {
            console.error('[TASK-MODEL] getTodayTasks query failed:', err.message);
        }
        callback(err, result);
    });
};

exports.updateTaskStatus = (taskId, userId, status, callback) => {
    const query = `
        UPDATE tasks
        SET status = ?
        WHERE id = ? AND user_id = ?
    `;

    db.query(query, [status, taskId, userId], callback);
};