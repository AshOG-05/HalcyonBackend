const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleMiddleware');
const {
    registerForEvent,
    viewMyRegistration,
    spotRegistration
} = require('../controllers/registrationController.js');

// Regular registration endpoint - only for regular users
router.post('/:eventId', auth, registerForEvent);

// Spot registration endpoint - only for team members
router.post('/spot/:eventId', auth, allowedRoles('team'), spotRegistration);

// Get my registrations - works for both users and team members
router.get('/me', auth, viewMyRegistration);

module.exports = router;