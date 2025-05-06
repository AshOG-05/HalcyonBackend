const Registration = require('../models/registrationModel');
const sendEmail = require('../utils/mailer');
const mongoose = require('mongoose');
const Event = require('../models/eventModel');

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
            orderId
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


        if (event.isVariableTeamSize) {
            if (teamSize > event.teamSize) {
                return res.status(400).json({ error: `Team size cannot exceed ${event.teamSize}` });
            }
        } else {
            if (teamSize !== event.teamSize) {
                return res.status(400).json({ error: `Team size must be ${event.teamSize} members` })
            }
        }
        if (teamSize > 2 && !teamName) {
            return res.status(400).json({ error: "Team name is required for teams with more than 2 members" });
        }
        if (!teamLeaderDetails || !teamLeaderDetails.collegeName || !teamLeaderDetails.usn) {
            return res.status(400).json({ error: "Team leader details are required" });
        }
        if (event.fees > 0 && (!paymentId || !orderId)) {
            return res.status(400).json({
                error: "Payment is required for this event",
                requiresPayment: true,
                eventFees: event.fees,
            });
        }

        // Check if this is a spot registration (created by a team member)
        const isSpotRegistration = req.user.role === 'team';

        const registration = await Registration.create({
            event: eventId,
            teamLeader: req.user._id,
            teamLeaderDetails: {
                collegeName: teamLeaderDetails.collegeName,
                usn: teamLeaderDetails.usn,
            },
            teamName: teamName || null,
            teamMembers: teamMembers || [],
            teamSize: teamSize || 1,
            spotRegistration: isSpotRegistration ? req.user._id : null, // Mark as spot registration if created by team member
            paymentId: paymentId || null,
            paymentStatus: event.fees > 0 ? 'completed' : 'not_required'
        });
        res.status(201).json(registration);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

const viewMyRegistration = async (req, res) => {
    try {
        // Find registrations where the user is either the team leader or the spot registration creator
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

module.exports = { registerForEvent, viewMyRegistration };