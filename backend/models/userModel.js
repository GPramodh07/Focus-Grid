const db = require("../db");

exports.getUserByUsername = (username) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM users WHERE username = ?", [username], (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};

exports.createUser = (name, username, password) => {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO users (name, username, password) VALUES (?, ?, ?)", [name, username, password], (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};

exports.getUserById = (id) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT id, name, username FROM users WHERE id = ?", [id], (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};

exports.getUserByUsernameExcludingId = (username, id) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT id FROM users WHERE username = ? AND id <> ?", [username, id], (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};

exports.updateUserProfile = (userId, profile) => {
    const { name, username, password } = profile;

    return new Promise((resolve, reject) => {
        const hasPassword = Boolean(password);
        const query = hasPassword
            ? "UPDATE users SET name = ?, username = ?, password = ? WHERE id = ?"
            : "UPDATE users SET name = ?, username = ? WHERE id = ?";
        const params = hasPassword
            ? [name, username, password, userId]
            : [name, username, userId];

        db.query(query, params, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};
