const Timetable = require('../models/timetableModel');
const Task = require('../models/taskModel');
const Attendance = require('../models/attendanceModel');

function sendDbError(res, context, err) {
    console.error(`${context}:`, err);
    return res.status(500).json({ success: false, message: 'Database error' });
}

function mapJsDayToDbDay(jsDay) {
    if (jsDay >= 1 && jsDay <= 6) return jsDay;
    return null;
}

function getTimezoneOffsetMinutes(req) {
    const raw = req.headers['x-timezone-offset'];
    if (raw === undefined || raw === null || raw === '') return 0;
    const parsed = Number(String(raw));
    return Number.isFinite(parsed) ? parsed : 0;
}

function getClientNow(req) {
    // JS getTimezoneOffset(): minutes to add to local time to get UTC.
    // Convert server "now" into client's local time by subtracting that offset.
    const offsetMinutes = getTimezoneOffsetMinutes(req);
    const clientMs = Date.now() - offsetMinutes * 60 * 1000;
    return new Date(clientMs);
}

function formatYmdFromDateUTC(dateObj) {
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

exports.getTodayClasses = (req, res) => {
    const userId = req.user && req.user.id;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: user_id is required' });
    }

    const clientNow = getClientNow(req);
    const jsDay = clientNow.getUTCDay();
    const dbDay = mapJsDayToDbDay(jsDay);

    if (!dbDay) {
        return res.json({ success: true, data: [] });
    }

    Timetable.getClassesByDay(userId, dbDay, (err, results) => {
        if (err) {
            return sendDbError(res, 'Error fetching today classes', err);
        }

        return res.json({ success: true, data: results || [] });
    });
};

exports.getTodayTasks = (req, res) => {
    const userId = req.user && req.user.id;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: user_id is required' });
    }

    const today = formatYmdFromDateUTC(getClientNow(req));

    Task.getTodayTasks(userId, today, (err, results) => {
        if (err) {
            return sendDbError(res, 'Error fetching today tasks', err);
        }

        return res.json({ success: true, data: results || [] });
    });
};

exports.getAttendanceSummary = async (req, res) => {
    const userId = req.user && req.user.id;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: user_id is required' });
    }

    try {
        const summaryRows = await Attendance.getAttendanceSummaryByUser(userId);

        const data = (summaryRows || []).map((row) => {
            const { percentage } = Attendance.calculateAttendancePercentage(row);

            return {
                subject_name: row.subject_name,
                attendance_percentage: percentage
            };
        });

        return res.json({ success: true, data });
    } catch (err) {
        return sendDbError(res, 'Error fetching attendance summary', err);
    }
};
