const Event = require('../models/eventModel');

const createEvent = async (req, res) => {
    try {
        const { name, description, date, venue, rules, prizes, coordinators, day, category,fees} = req.body;
        const event = await Event.create({
            name,
            description,
            date,
            venue,
            rules: rules || [],
            prizes: prizes || [],
            coordinators: coordinators || [],
            day: day, // Default to Day 1 if not specified
            category: category || 'other', // Default to 'other' if not specified
            managedBy: req.user._id,
            teamSize: req.body.teamSize || 1,
            fees: req.body.fees || 0,
        });
        res.status(201).json(event);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: "Event not found" });
        res.json(event);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const editEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!event) return res.status(404).json({ error: "Event not found" });
        res.json(event);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { createEvent, getAllEvents, getEventById, editEvent };

