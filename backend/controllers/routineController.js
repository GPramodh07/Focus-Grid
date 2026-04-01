const Routine = require('../models/routineModel');

function sendDbError(res, context, err) {
    console.error(`${context}:`, err);
    return res.status(500).json({ success: false, error: 'Database error: ' + err.message });
}

exports.getRoutines = (req, res) => {
    const userId = req.user.id;
    Routine.getRoutinesByUser(userId, (err, results) => {
        if (err) {
            return sendDbError(res, 'Error fetching routines', err);
        }

        res.json({ success: true, routines: results });
    });
};

exports.createRoutine = (req, res) => {
    const userId = req.user.id;
    const { title, start_time, end_time } = req.body;
    const cleanedTitle = typeof title === 'string' ? title.trim() : '';

    if (!cleanedTitle) {
        return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (!start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'start_time and end_time are required' });
    }

    if (start_time >= end_time) {
        return res.status(400).json({ success: false, message: 'End time must be greater than start time' });
    }

    const payload = {
        user_id: userId,
        title: cleanedTitle,
        start_time,
        end_time
    };

    Routine.checkTimeConflict(userId, start_time, end_time, (conflictErr, conflicts) => {
        if (conflictErr) {
            return sendDbError(res, 'Error checking routine time conflict', conflictErr);
        }

        if (conflicts.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This time slot already exists. Please choose a different time.'
            });
        }

        Routine.createRoutine(payload, (err, result) => {
            if (err) {
                return sendDbError(res, 'Error creating routine', err);
            }

            res.status(201).json({ success: true, message: 'Routine created', id: result.insertId });
        });
    });
};

exports.updateRoutine = (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, start_time, end_time } = req.body;
    const cleanedTitle = typeof title === 'string' ? title.trim() : '';

    if (!cleanedTitle) {
        return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (!start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'start_time and end_time are required' });
    }

    if (start_time >= end_time) {
        return res.status(400).json({ success: false, message: 'End time must be greater than start time' });
    }

    Routine.checkTimeConflictExcludingId(userId, id, start_time, end_time, (conflictErr, conflicts) => {
        if (conflictErr) {
            return sendDbError(res, 'Error checking routine time conflict', conflictErr);
        }

        if (conflicts.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This time slot already exists. Please choose a different time.'
            });
        }

        Routine.updateRoutine(id, { user_id: userId, title: cleanedTitle, start_time, end_time }, (err, result) => {
            if (err) {
                return sendDbError(res, 'Error updating routine', err);
            }

            if (!result.affectedRows) {
                return res.status(404).json({ success: false, message: 'Routine not found' });
            }

            res.json({ success: true, message: 'Routine updated' });
        });
    });
};

exports.deleteRoutine = (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    Routine.deleteRoutine(id, userId, (err, result) => {
        if (err) {
            return sendDbError(res, 'Error deleting routine', err);
        }

        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: 'Routine not found' });
        }

        res.json({ success: true, message: 'Routine deleted' });
    });
};