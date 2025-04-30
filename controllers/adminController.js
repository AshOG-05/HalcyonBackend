const User = require('../models/userModel');
const Registration = require('../models/registrationModel');
const Event = require('../models/eventModel');
const PDFDocument = require('pdfkit');
const fs = require('fs');

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
            .populate('participant', 'name email mobile')
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
        const { eventName } = req.params;
        const registrations = await Registration.find({ event:eventName });
        const doc = new PDFDocument({ margin: 30 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${eventName}_registrations.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('HALCYON 2025', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('REGISTRATION', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Event Name: ${eventName}`);
        doc.moveDown(1);

        // Table headers
        const tableTop = doc.y;
        const rowHeight = 20;
        const colWidths = [50, 100, 200, 100];

        const drawRow = (y, row) => {
            doc.text(row[0], 40, y);
            doc.text(row[1], 100, y);
            doc.text(row[2], 200, y);
            doc.text(row[3], 420, y);
        };

        // Header row
        drawRow(tableTop, ['Sl. No.', 'College Code', 'Name', 'Contact No.']);
        doc.moveDown();

        // Data rows
        registrations.forEach((reg, index) => {
            const y = tableTop + rowHeight * (index + 1);
            drawRow(y, [
                index + 1,
                reg.collegeCode || 'N/A',
                reg.name || 'N/A',
                reg.contactNumber || 'N/A',
            ]);
        });

        doc.end();
    } catch (err) {
        console.error('Error generating PDF:', err);
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