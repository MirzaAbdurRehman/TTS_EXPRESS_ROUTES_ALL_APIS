const express = require('express');
const app = express(); 

require('dotenv').config();  // Load environment variables first

// Import database connection
const connectDB = require('./db/connect_db');

// Middleware is must before routing bcz it show error parsing error arha hai 
app.use(express.json({ strict: false })); // Yeh ensure karega ke empty body error na de

// ✅ Middleware to handle empty JSON request
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({ message: "Invalid JSON format" });
    }
    next();
});

const route = require('./routes');  // this is for routing

app.use('/api', route);  // Use the routes defined in routes.js with /api prefix

const PORT = process.env.PORT || 3000; // Use Render PORT or default 3000

// Connect to MongoDB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to connect to MongoDB. Server not started.', error);
    process.exit(1);
});