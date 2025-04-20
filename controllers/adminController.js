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
        const registrations = await Registration.find()
            .populate({
                path: 'participant',
                select: 'name email',
                model: 'User'
            })
            .populate({
                path: 'event',
                select: 'name',
                model: 'Event'
            });
        const htmlContent = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 10px; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 5px;
                        text-align: left;
                    }
                    th { background-color: #f2f2f2; }
                    h2 {
                        font-size: 14px;
                        margin: 5px 0;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <h2>Halcyon Event Registrations</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Event</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${registrations.map(reg => `
                            <tr>
                                <td>${reg.participant?.name || 'N/A'}</td>
                                <td>${reg.participant?.email || 'N/A'}</td>
                                <td>${reg.event?.name || 'N/A'}</td>
                                <td>${new Date(reg.registeredAt).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top: 10px; text-align: right; font-size: 8px;">
                    Generated: ${new Date().toLocaleDateString()}
                </div>
            </body>
            </html>
            `;
        const options = {
            format: 'A4',
            border: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        };
        pdf.create(htmlContent, options).toBuffer((err, buffer) => {
            if (err) return res.status(500).json({ error: err.message });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=registration.pdf');
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