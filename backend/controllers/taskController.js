const Task = require('../models/taskModel');

function sendDbError(res, context, err) {
    console.error(`${context}:`, err);
    return res.status(500).json({ success: false, error: "Database error: " + err.message });
}

function normalizeTaskStatus(status) {
    if (!status) return 'pending';

    const normalized = String(status).trim().toLowerCase();
    if (normalized === 'in-progress') return 'missed';

    const allowedStatuses = ['pending', 'completed', 'missed'];
    return allowedStatuses.includes(normalized) ? normalized : 'pending';
}

exports.getAllTasks = (req, res) => {
    const userId = req.user.id;
    Task.getAllTasks(userId, (err, results) => {
        if (err) {
            return sendDbError(res, "Error fetching tasks", err);
        }
        res.json({ success: true, tasks: results });
    });
};

exports.getTasksByDate = (req, res) => {
    const userId = req.user.id;
    const { date } = req.params;
    Task.getTasksByDate(userId, date, (err, results) => {
        if (err) {
            return sendDbError(res, "Error fetching tasks by date", err);
        }
        res.json({ success: true, tasks: results });
    });
};

exports.createTask = (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    const userId = req.user.id;
    const taskData = { ...req.body, user_id: userId };
    taskData.status = normalizeTaskStatus(taskData.status);

    if (!taskData.title || !taskData.task_date) {
        return res.status(400).json({ success: false, error: "Title and date are required" });
    }

    Task.createTask(taskData, (err, result) => {
        if (err) {
            return sendDbError(res, "Error creating task", err);
        }
        res.json({ success: true, message: 'Task created', id: result.insertId });
    });
};

exports.updateTask = (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.id;
    const taskData = { ...req.body, user_id: userId };
    taskData.status = normalizeTaskStatus(taskData.status);
    Task.updateTask(taskId, taskData, (err) => {
        if (err) {
            return sendDbError(res, "Error updating task", err);
        }
        res.json({ success: true, message: 'Task updated' });
    });
};

exports.deleteTask = (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.id;
    Task.deleteTask(taskId, userId, (err) => {
        if (err) {
            return sendDbError(res, "Error deleting task", err);
        }
        res.json({ success: true, message: 'Task deleted' });
    });
};

exports.updateTaskStatus = (req, res) => {
    const userId = req.user.id;
    const taskId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(taskId) || taskId <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid task id' });
    }

    const normalizedStatus = String(status || '').trim().toLowerCase();
    if (!['pending', 'completed'].includes(normalizedStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    Task.updateTaskStatus(taskId, userId, normalizedStatus, (err, result) => {
        if (err) {
            return sendDbError(res, 'Error updating task status', err);
        }

        if (!result || result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        return res.json({ success: true, message: 'Task status updated' });
    });
};