const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Import models
const Registration = require('./models/registrationModel');
const Event = require('./models/eventModel');
const User = require('./models/userModel');

const debugRegistration = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB successfully');

        // Check database connection
        console.log('\n📊 Database Status:');
        console.log('Database name:', mongoose.connection.db.databaseName);
        console.log('Connection state:', mongoose.connection.readyState);

        // Count existing records
        console.log('\n📈 Record Counts:');
        const userCount = await User.countDocuments();
        const eventCount = await Event.countDocuments();
        const registrationCount = await Registration.countDocuments();
        
        console.log(`Users: ${userCount}`);
        console.log(`Events: ${eventCount}`);
        console.log(`Registrations: ${registrationCount}`);

        // Show recent registrations
        console.log('\n📋 Recent Registrations:');
        const recentRegistrations = await Registration.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('event', 'name')
            .populate('teamLeader', 'name email');

        if (recentRegistrations.length === 0) {
            console.log('❌ No registrations found in database');
        } else {
            recentRegistrations.forEach((reg, index) => {
                console.log(`${index + 1}. Event: ${reg.event?.name || 'Unknown'}`);
                console.log(`   Team Leader: ${reg.teamLeader?.name || 'Unknown'} (${reg.teamLeader?.email || 'No email'})`);
                console.log(`   Team Size: ${reg.teamSize}`);
                console.log(`   Team Name: ${reg.teamName || 'N/A'}`);
                console.log(`   Transaction ID: ${reg.transactionId || 'N/A'}`);
                console.log(`   Payment Status: ${reg.paymentStatus}`);
                console.log(`   Created: ${reg.createdAt}`);
                console.log('   ---');
            });
        }

        // Show available events
        console.log('\n🎯 Available Events:');
        const events = await Event.find().select('name registrationOpen fees').limit(5);
        events.forEach((event, index) => {
            console.log(`${index + 1}. ${event.name} - Registration: ${event.registrationOpen ? 'Open' : 'Closed'} - Fee: ₹${event.fees || 0}`);
        });

        // Show users
        console.log('\n👥 Sample Users:');
        const users = await User.find().select('name email role').limit(3);
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
        });

    } catch (error) {
        console.error('❌ Error during debug:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
};

// Run the debug script
debugRegistration();
