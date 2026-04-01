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
