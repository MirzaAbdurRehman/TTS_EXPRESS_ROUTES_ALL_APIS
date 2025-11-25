const express = require('express');
const cors = require('cors');
const app = express();

require('dotenv').config();

// Import DB
const connectDB = require('./db/connect_db');

// GLOBAL CORS (THIS FIXES YOUR ISSUE)
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}));

// Body parser
app.use(express.json({ strict: false }));

// Handle invalid JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ message: "Invalid JSON format" });
    }
    next();
});

// Routes
const route = require('./routes');
app.use('/api', route);

const PORT = process.env.PORT || 5001;

// Connect DB + Start server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('DB connection failed. Server not started.', error);
        process.exit(1);
    });
