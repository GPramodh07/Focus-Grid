const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware.verifyUser, subjectController.getSubjects);
router.post("/", authMiddleware.verifyUser, subjectController.addSubject);
router.put("/:id", subjectController.updateSubject);
router.delete("/:id", subjectController.deleteSubject);

module.exports = router;
