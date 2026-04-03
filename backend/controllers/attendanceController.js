const attendanceModel = require("../models/attendanceModel");

exports.getAttendance = async (req, res) => {
    const subjectId = req.params.subject_id;
    if (!subjectId) {
        return res.status(400).json({ success: false, message: "subject_id is required" });
    }

    try {
        const results = await attendanceModel.getAttendanceBySubject(subjectId);
        res.json({ success: true, attendance: results });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ success: false, message: "Server error fetching attendance" });
    }
};

exports.getAttendancePercentage = async (req, res) => {
    const subjectId = req.params.subject_id;
    if (!subjectId) {
        return res.status(400).json({ success: false, message: "subject_id is required" });
    }

    try {
        const stats = await attendanceModel.getAttendancePercentageBySubject(subjectId);
        const { presents, absents, percentage } = attendanceModel.calculateAttendancePercentage(stats);

        res.json({
            success: true,
            subject_id: parseInt(subjectId),
            presents,
            absents,
            percentage
        });
    } catch (error) {
        console.error("Error fetching attendance stats:", error);
        res.status(500).json({ success: false, message: "Server error fetching stats" });
    }
};

exports.addAttendance = async (req, res) => {
    const { subject_id, class_date, hours, status, note } = req.body;

    if (!subject_id || !class_date || !hours || !status) {
        return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    try {
        const result = await attendanceModel.addAttendance(subject_id, class_date, hours, status, note);
        res.status(201).json({ success: true, message: "Attendance added", id: result.insertId });
    } catch (error) {
        console.error("Error adding attendance:", error);
        res.status(500).json({ success: false, message: "Could not add attendance" });
    }
};

exports.updateAttendance = async (req, res) => {
    const attendanceId = req.params.id;
    const { hours, status, note } = req.body;

    if (!hours || !status) {
        return res.status(400).json({ success: false, message: "hours and status are required" });
    }

    try {
        const result = await attendanceModel.updateAttendance(attendanceId, hours, status, note);
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
    const attendanceId = req.params.id;

    try {
        const result = await attendanceModel.deleteAttendance(attendanceId);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Attendance record not found" });
        }
        res.json({ success: true, message: "Attendance deleted" });
    } catch (error) {
        console.error("Error deleting attendance:", error);
        res.status(500).json({ success: false, message: "Could not delete attendance" });
    }
};
