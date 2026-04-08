const attendanceModel = require("../models/attendanceModel");

exports.getAttendance = async (req, res) => {
    const userId = req.user && req.user.id;
    const subjectId = req.params.subject_id;
    if (!userId || !subjectId) {
        return res.status(400).json({ success: false, message: "subject_id is required" });
    }

    try {
        const results = await attendanceModel.getAttendanceBySubject(userId, subjectId);
        res.json({ success: true, attendance: results });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ success: false, message: "Server error fetching attendance" });
    }
};

exports.getAttendancePercentage = async (req, res) => {
    const userId = req.user && req.user.id;
    const subjectId = req.params.subject_id;
    if (!userId || !subjectId) {
        return res.status(400).json({ success: false, message: "subject_id is required" });
    }

    try {
        const stats = await attendanceModel.getAttendancePercentageBySubject(userId, subjectId);
        const { presentHours, absentHours, totalHours, percentage } = attendanceModel.calculateAttendancePercentage(stats);

        res.json({
            success: true,
            subject_id: parseInt(subjectId),
            presentHours,
            absentHours,
            totalHours,
            percentage
        });
    } catch (error) {
        console.error("Error fetching attendance stats:", error);
        res.status(500).json({ success: false, message: "Server error fetching stats" });
    }
};

exports.addAttendance = async (req, res) => {
    const userId = req.user && req.user.id;
    const { subject_id, class_date, hours, status, note } = req.body;

    if (!userId || !subject_id || !class_date || !hours || !status) {
        return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    try {
        const result = await attendanceModel.addAttendance(userId, subject_id, class_date, hours, status, note);
        if (!result || result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }
        res.status(201).json({ success: true, message: "Attendance added", id: result.insertId });
    } catch (error) {
        console.error("Error adding attendance:", error);
        res.status(500).json({ success: false, message: "Could not add attendance" });
    }
};

exports.updateAttendance = async (req, res) => {
    const userId = req.user && req.user.id;
    const attendanceId = req.params.id;
    const { hours, status, note } = req.body;

    if (!userId || !hours || !status) {
        return res.status(400).json({ success: false, message: "hours and status are required" });
    }

    try {
        const result = await attendanceModel.updateAttendance(userId, attendanceId, hours, status, note);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Attendance record not found" });
        }
        res.json({ success: true, message: "Attendance updated" });
    } catch (error) {
        console.error("Error updating attendance:", error);
        res.status(500).json({ success: false, message: "Could not update attendance" });
    }
};

exports.deleteAttendance = async (req, res) => {
    const userId = req.user && req.user.id;
    const attendanceId = req.params.id;

    try {
        const result = await attendanceModel.deleteAttendance(userId, attendanceId);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Attendance record not found" });
        }
        res.json({ success: true, message: "Attendance deleted" });
    } catch (error) {
        console.error("Error deleting attendance:", error);
        res.status(500).json({ success: false, message: "Could not delete attendance" });
    }
};
