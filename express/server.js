const express = require('express');
const app = express(); 


// Middleware   is must before routing bcz it show error  parsing error arha hai 
app.use(express.json({ strict: false })); // Yeh ensure karega ke empty body error na de

// ✅ Middleware to handle empty JSON request
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({ message: "Invalid JSON format" });
    }
    next();
});

require('dotenv').config();  // Load environment variables


const route = require('./routes');  // this is for routing

app.use('/api', route);  // Use the routes defined in routes.js with /api prefix



const PORT = process.env.PORT || 3000; // Use Render PORT or default 3000

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});