const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

router.use(authMiddleware.verifyUser);

router.get("/profile", userController.getProfile);
router.patch("/update-profile", userController.updateProfile);

module.exports = router;
