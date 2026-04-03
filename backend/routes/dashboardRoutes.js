const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.verifyUser);

router.get('/today-classes', dashboardController.getTodayClasses);
router.get('/today-tasks', dashboardController.getTodayTasks);
router.get('/attendance-summary', dashboardController.getAttendanceSummary);

module.exports = router;
