const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    teamName:{
        type:String,
        required: false,
    },
    teamLeader:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    teamMembers:[{
        type:String,
        required:false,
    }],
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