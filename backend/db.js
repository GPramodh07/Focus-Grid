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

// 1. Identify the environment (defaults to development)
const env = process.env.NODE_ENV || 'development';

// 2. Try to load the environment-specific file
// We wrap this in a way that it won't crash if the file is missing
require('dotenv').config({
  path: path.resolve(__dirname, `../.env.${env}`)
});

// 3. IMPORTANT FALLBACK: Load the system environment variables
// This ensures Render's dashboard variables are used if the file doesn't exist
require('dotenv').config(); 

const isProduction = env === 'production';

const pool = mysql.createPool({
  // If process.env.DB_HOST is in the Render Dashboard, it will be used here
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || (isProduction ? 12892 : 3306),

  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ DB connection error:", err.message);
  } else {
    console.log(`✅ Connected to ${isProduction ? 'Aiven (Production)' : 'Local MySQL'}`);
    connection.release();
  }
});

module.exports = pool;
