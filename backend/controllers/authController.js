const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    try {
        const result = await userModel.getUserByUsername(username);
        
        if (result.length > 0) {
            const user = result[0];
            const storedPassword = String(user.password || "");
            const isHashed = storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$");
            const isValidPassword = isHashed
                ? await bcrypt.compare(password, storedPassword)
                : storedPassword === password;

            if (isValidPassword) {
                return res.json({ success: true, message: "Login successful", user: { id: user.id, username: user.username, name: user.name } });
            } else {
                return res.status(401).json({ success: false, message: "Incorrect password" });
            }
        } else {
            return res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error("Error in fetching data:", error);
        return res.status(500).json({ success: false, message: "Error securely accessing data" });
    }
};

exports.register = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        const checkResult = await userModel.getUserByUsername(username);
        if (checkResult.length > 0) {
            return res.status(409).json({ success: false, message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await userModel.createUser(name, username, hashedPassword);
        return res.status(201).json({ success: true, message: "Registration successful" });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ success: false, message: "Could not register user" });
    }
};
