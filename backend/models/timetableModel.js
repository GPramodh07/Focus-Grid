const db = require('../db');

const CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS timetable (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        day_of_week TINYINT NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        type ENUM('class', 'break') DEFAULT 'class',
        color VARCHAR(20) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

function ensureTable(callback) {
    db.query(CREATE_TABLE_SQL, (createErr) => {
        if (createErr) return callback(createErr);

        db.query("SHOW COLUMNS FROM timetable LIKE 'color'", (colErr, columns) => {
            if (colErr) return callback(colErr);
            if (Array.isArray(columns) && columns.length) return callback(null);

            db.query('ALTER TABLE timetable ADD COLUMN color VARCHAR(20) DEFAULT NULL', callback);
        });
    });
}

exports.getByUser = (userId, callback) => {
    ensureTable((tableErr) => {
        if (tableErr) return callback(tableErr);

        const query = `
            SELECT
                id,
                user_id,
                title,
                CASE day_of_week
                    WHEN 1 THEN 'Monday'
                    WHEN 2 THEN 'Tuesday'
                    WHEN 3 THEN 'Wednesday'
                    WHEN 4 THEN 'Thursday'
                    WHEN 5 THEN 'Friday'
                    WHEN 6 THEN 'Saturday'
                    WHEN 7 THEN 'Sunday'
                    ELSE 'Monday'
                END AS day,
                start_time,
                end_time,
                type,
                color
            FROM timetable
            WHERE user_id = ?
            ORDER BY day_of_week ASC, start_time ASC
        `;
        db.query(query, [userId], callback);
    });
};

exports.create = (data, callback) => {
    ensureTable((tableErr) => {
        if (tableErr) return callback(tableErr);

        const query = `
            INSERT INTO timetable (user_id, title, day_of_week, start_time, end_time, type, color)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            query,
            [data.user_id, data.title, data.day, data.start_time, data.end_time, data.type || 'class', data.color || null],
            callback
        );
    });
};

exports.hasTimeConflict = (userId, dayOfWeek, startTime, endTime, callback) => {
    ensureTable((tableErr) => {
        if (tableErr) return callback(tableErr);

        const query = `
            SELECT COUNT(*) AS conflict_count
            FROM timetable
            WHERE user_id = ?
              AND day_of_week = ?
              AND (start_time < ? AND end_time > ?)
        `;

        db.query(query, [userId, dayOfWeek, endTime, startTime], (err, rows) => {
            if (err) return callback(err);
            const count = rows && rows[0] ? Number(rows[0].conflict_count) : 0;
            callback(null, count > 0);
        });
    });
};

exports.hasTimeConflictExcludingId = (userId, dayOfWeek, startTime, endTime, excludeId, callback) => {
    ensureTable((tableErr) => {
        if (tableErr) return callback(tableErr);

        const query = `
            SELECT COUNT(*) AS conflict_count
            FROM timetable
            WHERE user_id = ?
              AND day_of_week = ?
              AND id <> ?
              AND (start_time < ? AND end_time > ?)
        `;

        db.query(query, [userId, dayOfWeek, excludeId, endTime, startTime], (err, rows) => {
            if (err) return callback(err);
            const count = rows && rows[0] ? Number(rows[0].conflict_count) : 0;
            callback(null, count > 0);
        });
    });
};

exports.updateByIdAndUser = (id, userId, data, callback) => {
    ensureTable((tableErr) => {
        if (tableErr) return callback(tableErr);

        const query = `
            UPDATE timetable
            SET title = ?, day_of_week = ?, start_time = ?, end_time = ?, type = ?, color = ?
            WHERE id = ? AND user_id = ?
        `;

        db.query(
            query,
            [data.title, data.day, data.start_time, data.end_time, data.type || 'class', data.color || null, id, userId],
            callback
        );
    });
};

exports.deleteByIdAndUser = (id, userId, callback) => {
    ensureTable((tableErr) => {
        if (tableErr) return callback(tableErr);

        const query = 'DELETE FROM timetable WHERE id = ? AND user_id = ?';
        db.query(query, [id, userId], callback);
    });
};
