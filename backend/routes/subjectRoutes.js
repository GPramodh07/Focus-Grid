const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware.verifyUser);

router.get("/", subjectController.getSubjects);
router.post("/", subjectController.addSubject);
router.put("/:id", subjectController.updateSubject);
router.delete("/:id", subjectController.deleteSubject);

module.exports = router;
