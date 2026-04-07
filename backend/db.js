// const mysql = require('mysql2');
// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// const pool = mysql.createPool({
//     host: process.env.DB_HOST || 'localhost',
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD || '',
//     database: process.env.DB_NAME || 'task_manager_DB',
//     port: process.env.DB_PORT || 3306,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// pool.getConnection((err, connection) => {
//     if (err) {
//         console.error("Error in connection pool:", err);
//     } else {
//         console.log("Database connection pool created successfully");
//         connection.release();
//     }
// });

// module.exports = pool;

const mysql = require('mysql2');
const path = require('path');

// 1. Identify environment
const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

// 2. ONLY load files if we are NOT on Render
if (!isProduction) {
    require('dotenv').config({
        path: path.resolve(__dirname, `../.env.${env}`)
    });
}

// 3. This is the magic line - it tells Node to look at the Dashboard variables
require('dotenv').config(); 

const pool = mysql.createPool({
    // These now MUST come from the Render Environment variables in production
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || (isProduction ? 12892 : 3306),
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ DB connection error:", err.message);
        // This will print the host it's TRYING to use, helping us debug
        console.error("Attempted Host:", process.env.DB_HOST); 
    } else {
        console.log(`✅ Connected to ${isProduction ? 'Aiven (Production)' : 'Local MySQL'}`);
        connection.release();
    }
});

module.exports = pool;
