const subjectModel = require("../models/subjectModel");

exports.getSubjects = async (req, res) => {
    const userId = req.user && req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const results = await subjectModel.getSubjectsByUser(userId);
        res.json({ success: true, subjects: results });
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({ success: false, message: "Server error fetching subjects" });
    }
};

exports.addSubject = async (req, res) => {
    const userId = req.user && req.user.id;
    const { subject_name } = req.body;

    if (!userId || !subject_name) {
        return res.status(400).json({ success: false, message: "subject_name is required" });
    }

    try {
        const result = await subjectModel.createSubject(userId, subject_name);
        res.status(201).json({ success: true, message: "Subject added", id: result.insertId, subject_name: subject_name, user_id: userId });
    } catch (error) {
        console.error("Error adding subject:", error);
        res.status(500).json({ success: false, message: "Could not add subject" });
    }
};

exports.updateSubject = async (req, res) => {
    const userId = req.user && req.user.id;
    const subjectId = req.params.id;
    const { subject_name } = req.body;

    if (!subject_name) {
        return res.status(400).json({ success: false, message: "subject_name is required" });
    }

    try {
        const result = await subjectModel.updateSubject(subjectId, userId, subject_name);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }
        res.json({ success: true, message: "Subject updated" });
    } catch (error) {
        console.error("Error updating subject:", error);
        res.status(500).json({ success: false, message: "Could not update subject" });
    }
};

exports.deleteSubject = async (req, res) => {
    const userId = req.user && req.user.id;
    const subjectId = req.params.id;

    try {
        const result = await subjectModel.deleteSubject(subjectId, userId);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }
        res.json({ success: true, message: "Subject deleted" });
    } catch (error) {
        console.error("Error deleting subject:", error);
        res.status(500).json({ success: false, message: "Could not delete subject" });
    }
};
