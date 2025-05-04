const User = require('../models/userModel');
const Registration = require('../models/registrationModel');
const Event = require('../models/eventModel');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const imagePath = path.join(__dirname, '../resources/image.png');
let imageBase64 = '';

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
    const { eventID } = req.params;
    const event = await Event.findById(eventID);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Get registrations with participant details
    const registrations = await Registration.find({ event: eventID })
      .populate('teamLeader', 'mobile')
      .populate('event', 'name');

    // Read and encode the image
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    } catch (imgErr) {
      console.error('Error reading image:', imgErr);
      imageBase64 = ''; // Set empty if image can't be read
    }

    if (!registrations) return res.status(404).json({ error: "No registrations found" });

    const html = `
<html>
  <head>
    <title>Registrations 2024</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        margin: 40px;
        color: #000;
      }

      .header {
        text-align: center;
        position: relative;
        padding: 20px 0;
        margin-bottom: 20px;
      }

      .header-bg {
        position: relative;
        background-image: url('${imageBase64}');
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        padding: 30px 0;
        min-height: 100px;
      }

      h1, h2 {
        text-align: center;
        margin: 0;
        padding: 4px;
      }

      h1 {
        font-size: 28px;
        font-weight: bold;
        text-transform: uppercase;
      }

      h2 {
        font-size: 20px;
        font-weight: normal;
        margin-bottom: 10px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 30px;
      }

      th, td {
        border: 1px solid #000;
        padding: 8px 12px;
        text-align: left;
      }

      th {
        background-color: #f0f0f0;
        font-weight: bold;
        text-align: center;
      }

      td:nth-child(1), td:nth-child(4) {
        text-align: center;
      }

      tr:nth-child(even) {
        background-color: #fafafa;
      }

      .no-data {
        text-align: center;
        padding: 20px;
        font-style: italic;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="header-bg">
        <h1>HALCYON 2025</h1>
      </div>
      <h2>Registrations</h2>
      <h2>Event: ${event.name}</h2>
    </div>
    <table>
      <tr>
        <th>Sl. No.</th>
        <th>Name</th>
        <th>Email</th>
        <th>Contact No.</th>
      </tr>
      ${registrations.length > 0 ?
        registrations.map((registration, index) => {
          return `
            <tr>
              <td>${index + 1}</td>
              <td>${registration.teamName || 'N/A'}</td>
              <td>${registration.teamLeader?.mobile || 'N/A'}</td>
            </tr>`;
        }).join('') :
        `<tr><td colspan="4" class="no-data">No registrations found for this event</td></tr>`
      }
    </table>
  </body>
</html>
`;

    const options = {
      format: "A4",
      orientation: "portrait",
      border: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in"
      },
      type: "pdf",
      quality: "100",
    };
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error generating PDF" });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=registrations.pdf');
      res.send(buffer);
    })
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