const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const conn = mysql.createConnection({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME
});

conn.connect(err => {
    if(err)
    {
        console.error("Error in connection");
    }
    else
    {
        console.log("Connection success");
    }
});

module.exports = conn;
