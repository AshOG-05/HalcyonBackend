const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleMiddleware');
const { getAllUsers, getAllRegistrations } = require('../controllers/adminController');


router.get('/users', auth, allowedRoles('admin'), getAllUsers);
router.get('/registrations', auth, allowedRoles('admin'), getAllRegistrations);

module.exports = router;