const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");

exports.getProfile = async (req, res) => {
    const userId = req.user && req.user.id;

    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: user_id is required" });
    }

    try {
        const users = await userModel.getUserById(userId);
        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.json({ success: true, user: users[0] });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ success: false, message: "Could not fetch user profile" });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user && req.user.id;
    const name = (req.body && req.body.name ? String(req.body.name) : "").trim();
    const username = (req.body && req.body.username ? String(req.body.username) : "").trim();
    const password = req.body && req.body.password ? String(req.body.password) : "";

    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: user_id is required" });
    }

    if (!name) {
        return res.status(400).json({ success: false, message: "Name is required" });
    }

    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required" });
    }

    try {
        const duplicateUsers = await userModel.getUserByUsernameExcludingId(username, userId);
        if (duplicateUsers && duplicateUsers.length > 0) {
            return res.status(409).json({ success: false, message: "Username already exists" });
        }

        let hashedPassword = "";
        if (password.trim()) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const updateResult = await userModel.updateUserProfile(userId, {
            name,
            username,
            password: hashedPassword
        });

        if (!updateResult || updateResult.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: Number(userId),
                name,
                username
            }
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({ success: false, message: "Could not update profile" });
    }
};
