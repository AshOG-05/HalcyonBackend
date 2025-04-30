const User = require('../models/userModel');
const Registration = require('../models/registrationModel');
const Event = require('../models/eventModel');
const pdf = require('html-pdf');

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
        const registrations = await Registration.find()
            .populate('participant', 'name email')
            .populate('event', 'name date venue category day');
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


const generatePdf = async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const Handlebars = require('handlebars');

        // Get registrations with more detailed information
        const registrations = await Registration.find()
            .populate({
                path: 'participant',
                select: 'name email',
                model: 'User'
            })
            .populate({
                path: 'event',
                select: 'name category day venue date',
                model: 'Event'
            });

        // Group registrations by event for better organization
        const eventGroups = {};
        registrations.forEach(reg => {
            if (reg.event) {
                const eventId = reg.event._id.toString();
                if (!eventGroups[eventId]) {
                    const category = reg.event.category || 'other';
                    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                    const eventDate = new Date(reg.event.date);
                    const formattedDate = eventDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });

                    eventGroups[eventId] = {
                        event: reg.event,
                        categoryName: categoryName,
                        formattedDate: formattedDate,
                        registrations: []
                    };
                }

                // Format registration date
                const formattedRegistrationDate = new Date(reg.registeredAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Add registration to the event group with index
                eventGroups[eventId].registrations.push({
                    ...reg.toObject(),
                    index: eventGroups[eventId].registrations.length + 1,
                    formattedRegistrationDate: formattedRegistrationDate
                });
            }
        });

        // Convert to array and sort by event name
        const eventGroupsArray = Object.values(eventGroups).sort((a, b) =>
            a.event.name.localeCompare(b.event.name)
        );

        // Get total registrations and events
        const totalRegistrations = registrations.length;
        const totalEvents = eventGroupsArray.length;

        // Find max registrations per event
        const maxRegistrationsPerEvent = eventGroupsArray.reduce((max, group) =>
            Math.max(max, group.registrations.length), 0);

        // Format current date for header
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Read the HTML template
        const templatePath = path.join(__dirname, '../templates/registration-report.html');
        const templateSource = fs.readFileSync(templatePath, 'utf8');

        // Compile the template
        const template = Handlebars.compile(templateSource);

        // Prepare data for the template
        const data = {
            formattedDate,
            totalRegistrations,
            totalEvents,
            maxRegistrationsPerEvent,
            eventGroups: eventGroupsArray
        };

        // Generate HTML content
        const htmlContent = template(data);
        const options = {
            format: 'A4',
            orientation: 'landscape',
            border: {
                top: '15mm',
                right: '15mm',
                bottom: '15mm',
                left: '15mm'
            },
            footer: {
                height: '10mm',
                contents: {
                    default: '<div style="text-align: center; font-size: 8px; color: #888;">Page {{page}} of {{pages}}</div>'
                }
            },
            timeout: 30000
        };
        pdf.create(htmlContent, options).toBuffer((err, buffer) => {
            if (err) return res.status(500).json({ error: err.message });
            // Format date for filename
            const dateForFilename = currentDate.toISOString().split('T')[0];
            const filename = `halcyon_registrations_${dateForFilename}.pdf`;

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(buffer);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        await Event.findByIdAndRemove(eventId);
        res.json({ message: `Event with Id ${eventId} deleted successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const editEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!event) return res.status(404).json({ error: "Event not found" });
        res.json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


module.exports = { getAllUsers, getAllRegistrations, assignTeamMember, generatePdf, deleteEvent, editEvent };