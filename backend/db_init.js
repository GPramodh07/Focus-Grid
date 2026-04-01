const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const sqlFilePath = path.resolve(__dirname, '../database/init.sql');

if (!fs.existsSync(sqlFilePath)) {
    console.error(`SQL file not found at: ${sqlFilePath}`);
    process.exit(1);
}

const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
const statements = sqlScript
    .split(';')
    .map((stmt) => stmt.trim())
    .filter(Boolean);

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

function runStatementsSequentially(index = 0) {
    if (index >= statements.length) {
        console.log('Database and tables initialized successfully.');
        connection.end();
        return;
    }

    const statement = statements[index];

    connection.query(statement, (queryErr) => {
        if (queryErr) {
            const ignorableCodes = new Set(['ER_DUP_KEYNAME', 'ER_DUP_FIELDNAME']);
            if (!ignorableCodes.has(queryErr.code)) {
                console.error('Database initialization failed:', queryErr.message);
                connection.end();
                process.exit(1);
                return;
            }
        }

        runStatementsSequentially(index + 1);
    });
}

connection.connect((connectErr) => {
    if (connectErr) {
        console.error('Failed to connect to MySQL:', connectErr.message);
        process.exit(1);
    }

    runStatementsSequentially();
});