const express = require("express");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// Import routes
const authRoutes = require("./routes/authRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const taskRoutes = require("./routes/taskRoutes");
const routineRoutes = require("./routes/routineRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");

// Middleware to parse JSON bodies and handle CORS
app.use(express.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// Mount routes
// Mounted on /api/auth as per instruction example, and also on / to not break existing frontend
app.use("/api/auth", authRoutes);
app.use("/", authRoutes);

app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/user", userRoutes);

app.listen(port, () => {
    console.log("Server is running");
    console.log("http://localhost:" + port);
});
