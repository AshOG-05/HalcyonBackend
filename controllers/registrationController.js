const Registration = require('../models/registrationModel');
const sendEmail = require('../utils/mailer');
const User = require('../models/userModel');
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
        } = req.body;
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ error: "Invalid event ID format" });
        }
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ error: "Event not found" });
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
            spotRegistration: null,
        });
        res.status(201).json(registration);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

const viewMyRegistration = async (req, res) => {
    const registrations = await Registration.find({ participant: req.user._id }).populate('event');
    res.json(registrations);
}

const spotRegister = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { participantName, participantEmail } = req.body;
        let participant = await User.findOne({ email: participantEmail });
        if (!participant) {
            participant = await User.create({ name: participantName, email: participantEmail });
        }
        const registration = await Registration.create({
            event: eventId,
            participant: participant._id,
            spotRegistration: req.user._id,
        });
        await sendEmail(participant.email, 'Halcyon');
        res.status(201).json(registration);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports = { registerForEvent, viewMyRegistration, spotRegister };