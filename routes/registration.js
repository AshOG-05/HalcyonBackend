const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleMiddleware');
const {registerForEvent, viewMyRegistration, spotRegister} = require('../controllers/registrationController.js');

router.post('/:eventId', auth, registerForEvent);
router.get('/me', auth, viewMyRegistration);
router.post('/spot/:eventId',auth, allowedRoles('team'), spotRegister);
module.exports = router;