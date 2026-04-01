const Timetable = require('../models/timetableModel');

const VALID_DAYS = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
const VALID_TYPES = new Set(['class', 'break']);
const DAY_TO_INT = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
};

function sendDbError(res, context, err) {
    console.error(`${context}:`, err);
    return res.status(500).json({ success: false, error: 'Database error: ' + err.message });
}

function normalizeHexColor(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
    return null;
}

exports.getTimetable = (req, res) => {
    const userId = req.user.id;

    Timetable.getByUser(userId, (err, results) => {
        if (err) {
            return sendDbError(res, 'Error fetching timetable', err);
        }

        res.json({ success: true, records: results });
    });
};

exports.createClass = (req, res) => {
    const userId = req.user.id;
    const { title, day, start_time, end_time, type, color } = req.body;

    const cleanedTitle = typeof title === 'string' ? title.trim() : '';
    const cleanedDay = typeof day === 'string' ? day.trim() : '';
    const cleanedType = typeof type === 'string' ? type.trim().toLowerCase() : 'class';

    if (!cleanedTitle || !start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'title, start_time and end_time are required' });
    }

    if (!VALID_DAYS.has(cleanedDay)) {
        return res.status(400).json({ success: false, message: 'Invalid day value' });
    }

    if (end_time <= start_time) {
        return res.status(400).json({ success: false, message: 'End time must be greater than start time' });
    }

    if (!VALID_TYPES.has(cleanedType)) {
        return res.status(400).json({ success: false, message: 'Invalid type value' });
    }

    const payload = {
        user_id: userId,
        title: cleanedTitle,
        day: DAY_TO_INT[cleanedDay],
        start_time,
        end_time,
        type: cleanedType,
        color: normalizeHexColor(color)
    };

    Timetable.hasTimeConflict(userId, payload.day, start_time, end_time, (conflictErr, hasConflict) => {
        if (conflictErr) {
            return sendDbError(res, 'Error checking timetable conflict', conflictErr);
        }

        if (hasConflict) {
            return res.status(409).json({
                success: false,
                message: 'This time slot already exists. Please choose a different time.'
            });
        }

        Timetable.create(payload, (err, result) => {
            if (err) {
                return sendDbError(res, 'Error creating timetable record', err);
            }

            res.status(201).json({ success: true, message: 'Class saved', id: result.insertId });
        });
    });
};

exports.updateClass = (req, res) => {
    const userId = req.user.id;
    const classId = Number(req.params.id);
    const { title, day, start_time, end_time, type, color } = req.body;

    if (!Number.isInteger(classId) || classId <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid class id' });
    }

    const cleanedTitle = typeof title === 'string' ? title.trim() : '';
    const cleanedDay = typeof day === 'string' ? day.trim() : '';
    const cleanedType = typeof type === 'string' ? type.trim().toLowerCase() : 'class';

    if (!cleanedTitle || !start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'title, start_time and end_time are required' });
    }

    if (!VALID_DAYS.has(cleanedDay)) {
        return res.status(400).json({ success: false, message: 'Invalid day value' });
    }

    if (end_time <= start_time) {
        return res.status(400).json({ success: false, message: 'End time must be greater than start time' });
    }

    if (!VALID_TYPES.has(cleanedType)) {
        return res.status(400).json({ success: false, message: 'Invalid type value' });
    }

    const payload = {
        user_id: userId,
        title: cleanedTitle,
        day: DAY_TO_INT[cleanedDay],
        start_time,
        end_time,
        type: cleanedType,
        color: normalizeHexColor(color)
    };

    Timetable.hasTimeConflictExcludingId(
        userId,
        payload.day,
        start_time,
        end_time,
        classId,
        (conflictErr, hasConflict) => {
            if (conflictErr) {
                return sendDbError(res, 'Error checking timetable conflict', conflictErr);
            }

            if (hasConflict) {
                return res.status(409).json({
                    success: false,
                    message: 'This time slot already exists. Please choose a different time.'
                });
            }

            Timetable.updateByIdAndUser(classId, userId, payload, (err, result) => {
                if (err) {
                    return sendDbError(res, 'Error updating timetable record', err);
                }

                if (!result || result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: 'Class not found' });
                }

                return res.json({ success: true, message: 'Class updated' });
            });
        }
    );
};

exports.deleteClass = (req, res) => {
    const userId = req.user.id;
    const classId = Number(req.params.id);

    if (!Number.isInteger(classId) || classId <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid class id' });
    }

    Timetable.deleteByIdAndUser(classId, userId, (err, result) => {
        if (err) {
            return sendDbError(res, 'Error deleting timetable record', err);
        }

        if (!result || result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }

        return res.json({ success: true, message: 'Class deleted' });
    });
};
