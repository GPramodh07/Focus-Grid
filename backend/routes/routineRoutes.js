const express = require('express');
const router = express.Router();
const routineController = require('../controllers/routineController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.verifyUser);

router.get('/', routineController.getRoutines);
router.post('/', routineController.createRoutine);
router.put('/:id', routineController.updateRoutine);
router.delete('/:id', routineController.deleteRoutine);

module.exports = router;