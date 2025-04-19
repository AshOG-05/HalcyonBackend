const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    participant:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    event:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required:'True'
    },
    registeredAt:{
        type:Date,
        default: Date.now
    },
    spotRegistration:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
},{timestamps: true});

module.exports = mongoose.model('Registration', registrationSchema);    

