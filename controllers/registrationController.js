const Registration = require('../models/registrationModel');
const Event = require('../models/eventModel');
const mongoose = require('mongoose');

const registerForEvent = async (req, res) => {
    try {
        console.log('Registration request received');
        console.log('User from token:', req.user);
        console.log('Request body:', req.body);
        console.log('Request params:', req.params);

        const { eventId } = req.params;
        const {
            teamName,
            teamMembers,
            teamSize,
            teamLeaderDetails,
            paymentId,
            orderId,
            transactionId
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ error: "Invalid event ID format" });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ error: "Event not found" });

        // Check if registration is open for this event
        if (!event.registrationOpen) {
            return res.status(403).json({
                error: "Registration for this event is currently closed",
                registrationClosed: true
            });
        }

        // Validate team size
        if (event.minTeamSize && event.maxTeamSize) {
            // Use min and max team sizes if available
            if (teamSize < event.minTeamSize || teamSize > event.maxTeamSize) {
                return res.status(400).json({
                    error: `Team size must be between ${event.minTeamSize} and ${event.maxTeamSize} members`
                });
            }
        } else if (event.isVariableTeamSize) {
            // Fallback to old logic for backward compatibility
            if (teamSize > event.teamSize) {
                return res.status(400).json({ error: `Team size cannot exceed ${event.teamSize}` });
            }
        } else {
            // Fixed team size
            if (teamSize !== event.teamSize) {
                return res.status(400).json({ error: `Team size must be ${event.teamSize} members` });
            }
        }

        if (teamSize > 2 && !teamName) {
            return res.status(400).json({ error: "Team name is required for teams with more than 2 members" });
        }

        if (!teamLeaderDetails || !teamLeaderDetails.collegeName || !teamLeaderDetails.usn) {
            return res.status(400).json({ error: "Team leader details are required" });
        }

        // Check for duplicate registration
        const existingRegistration = await Registration.findOne({
            event: eventId,
            teamLeader: req.user._id
        });

        if (existingRegistration) {
            return res.status(400).json({
                error: 'You have already registered for this event',
                alreadyRegistered: true
            });
        }

        // PAYMENT CHECK BYPASSED - Accept registration regardless of payment status
        console.log('Payment check bypassed - accepting registration');

        // Check if this is a spot registration (created by a team member)
        const isSpotRegistration = req.user.role === 'team';

        // Prepare registration data
        const registrationData = {
            event: eventId,
            teamLeader: req.user._id,
            teamLeaderDetails: {
                collegeName: teamLeaderDetails.collegeName,
                usn: teamLeaderDetails.usn,
            },
            teamName: teamName || null,
            teamMembers: teamMembers || [],
            teamSize: teamSize || 1,
            spotRegistration: isSpotRegistration ? req.user._id : null,
            paymentId: paymentId || null,
            orderId: orderId || null,
            transactionId: transactionId || null,
            paymentStatus: event.fees > 0 ? 'pending' : 'not_required'
        };

        console.log('Creating registration with data:', JSON.stringify(registrationData, null, 2));

        const registration = await Registration.create(registrationData);

        console.log('Registration created successfully:', registration);
        res.status(201).json(registration);
    } catch (err) {
        console.error('Registration creation failed:', err);

        // Handle validation errors specifically
        if (err.name === 'ValidationError') {
            const validationErrors = Object.values(err.errors).map(e => e.message);
            console.error('Validation errors:', validationErrors);
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors,
                fullError: err.message
            });
        }

        // Handle duplicate key errors
        if (err.code === 11000) {
            console.error('Duplicate key error:', err);
            return res.status(400).json({
                error: 'Duplicate registration detected',
                details: err.message
            });
        }

        return res.status(500).json({ error: err.message });
    }
}

const viewMyRegistration = async (req, res) => {
    try {
        const registrations = await Registration.find({
            $or: [
                { teamLeader: req.user._id },
                { spotRegistration: req.user._id }
            ]
        }).populate('event').populate('teamLeader', 'name email mobile');

        res.json(registrations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const checkRegistration = async (req, res) => {
    try {
        console.log('Checking registration for event:', req.params.eventId);
        console.log('User:', req.user);

        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ error: "Invalid event ID format" });
        }

        // Check if user is already registered for this event
        const existingRegistration = await Registration.findOne({
            event: eventId,
            teamLeader: req.user._id
        }).populate('event', 'name');

        if (existingRegistration) {
            return res.json({
                isRegistered: true,
                registrationDetails: {
                    teamName: existingRegistration.teamName,
                    teamSize: existingRegistration.teamSize,
                    registrationDate: existingRegistration.createdAt,
                    transactionId: existingRegistration.transactionId,
                    paymentStatus: existingRegistration.paymentStatus
                }
            });
        } else {
            return res.json({
                isRegistered: false
            });
        }
    } catch (err) {
        console.error('Error checking registration:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = { registerForEvent, viewMyRegistration, checkRegistration };
