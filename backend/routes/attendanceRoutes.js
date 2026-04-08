const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware.verifyUser);

router.get("/:subject_id", attendanceController.getAttendance);
router.get("/percentage/:subject_id", attendanceController.getAttendancePercentage);
router.post("/", attendanceController.addAttendance);
router.put("/:id", attendanceController.updateAttendance);
router.delete("/:id", attendanceController.deleteAttendance);

module.exports = router;
