const Registration = require('../models/registrationModel');
const sendEmail = require('../utils/mailer');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const Event = require('../models/eventModel');

const registerForEvent  = async(req,res) => {
    try{
        const {eventId} = req.params;
        if(!mongoose.Types.ObjectId.isValid(eventId)){
            return res.status(400).json({error: "Invalid event ID format"});
        }
        const event = await Event.findById(eventId);
        if(!event) return res.status(404).json({error: "Event not found"});
        const existingRegistration = await Registration.findOne({
            event: eventId,
            participant: req.user._id,
        });
        if(existingRegistration){
            return res.status(400).json({error: "You are already registered for this event"});
        }
        const user = await User.findById(req.user._id);
        if(!user){
            return res.status(404).json({message: "user not found"});
        }
        const registration = await Registration.create({
            event: eventId,
            participant: req.user._id,
            spotRegistration: null,
        });
        console.log("Attempting to send email to:", req.user.email);
        try{
            await sendEmail(user.email, event.name);
            res.status(201).json({
                message: "Registration successful and confirmation email sent",
                registration,
            });
        }catch(emailError){
            console.error('Failed to send email:', emailError);
            res.status(201).json({
                message: "Registration successful but failed to send confirmation email",
                registration,
                emailError: emailError.message
            });
        }
    }catch(err){
        res.status(400).json({error: err.message});
    }
};

const viewMyRegistration = async (req, res) => {
    const registrations = await Registration.find({participant: req.user._id}).populate('event');
    res.json(registrations);
}

const spotRegister = async(req, res) => {
    try{
        const {eventId} = req.params;
        const {participantName, participantEmail} = req.body;
        let participant = await User.findOne({email: participantEmail});
        if(!participant) {
            participant = await User.create({name: participantName, email: participantEmail });
        } 
        const registration = await Registration.create({
            event: eventId,
            participant: participant._id,
            spotRegistration: req.user._id,
        });
        await sendEmail(participant.email, 'Halcyon');
        res.status(201).json(registration);
    }catch(err){
        res.status(400).json({error: err.message});
    }
}
module.exports = {registerForEvent, viewMyRegistration, spotRegister};