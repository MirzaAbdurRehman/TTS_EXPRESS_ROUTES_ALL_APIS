
const mongoose = require('mongoose');

const connectDB = async () => {
    try{

        if (mongoose.connection.readyState === 1) {
            console.log('✅ MongoDB Already Connected');
            return;
        }

        // Get MongoDB URI from environment variables
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error('❌ MONGO_URI is missing! Add it to .env file or Render environment variables.');
        }

        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected Successfully');
    }
    catch(error){
        console.error('MongoDB connection failed:', error.message);
        throw error;  // Re-throw to let server.js handle it
    }
}

module.exports = connectDB;


