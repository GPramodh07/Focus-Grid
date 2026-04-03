const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all task routes
router.use(authMiddleware.verifyUser);

router.get('/', taskController.getAllTasks);
router.get('/:date', taskController.getTasksByDate);
router.post('/', taskController.createTask);
router.patch('/:id/status', taskController.updateTaskStatus);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;