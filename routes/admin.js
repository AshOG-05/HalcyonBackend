const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleMiddleware');
const { getAllUsers, getAllRegistrations, generatePdf, deleteEvent, editEvent } = require('../controllers/adminController');


router.get('/users', auth, allowedRoles('admin'), getAllUsers);
router.get('/registrations', auth, allowedRoles('admin'), getAllRegistrations);
router.get('/pdf', auth, allowedRoles('admin'), generatePdf);
router.post('/generate-certificate', auth, allowedRoles('admin'), generatePdf);
// Test endpoint without auth for debugging
router.get('/test-certificate', generatePdf);
router.delete('/event/:id', auth, allowedRoles('admin'), deleteEvent);
router.put('/event/:id', auth, allowedRoles('admin'), editEvent);

module.exports = router;