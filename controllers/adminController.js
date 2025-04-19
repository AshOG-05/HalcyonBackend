const User = require('../models/userModel');
const Registration = require('../models/registrationModel');
const Event = require('../models/eventModel');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

const getAllRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find().populate('participant', 'name email')
            .populate('event', 'name');
        return res.json(registrations);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

const assignTeamMember = async (req, res) => {
    try {
        const { eventId, userId } = req.params;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ error: "Evenet not found" });

        event.managedBy = userId;
        await event.save();
        res.json({ message: "Team member assigned to event" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports = { getAllUsers, getAllRegistrations, assignTeamMember };