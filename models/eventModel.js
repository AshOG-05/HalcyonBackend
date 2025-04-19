const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: String,
    description: String,
    date: Date,
    venue: String,
    managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rules: [String],
    prizes: [String],
    coordinators: [{
        name: String,
        phone: String
    }],
    day: { type: Number, enum: [1, 2], default: 1 } // 1 for Day 1, 2 for Day 2
}, { timestamp: true });
module.exports = mongoose.model('Event', eventSchema);

