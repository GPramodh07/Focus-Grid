const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.verifyUser);

router.get('/', timetableController.getTimetable);
router.post('/', timetableController.createClass);
router.put('/:id', timetableController.updateClass);
router.delete('/:id', timetableController.deleteClass);

module.exports = router;
