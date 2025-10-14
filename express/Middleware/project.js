// project.js (middleware)

const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET;

// ✅ Rename from verifyToken ➜ extractToken
const extractToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];

  if (bearerHeader) {
    const token = bearerHeader.split(' ')[1];
    req.token = token;
    next();
  } else {
    res.status(403).json({ message: "Access Denied: Token is missing or Invalid!..." });
  }
};

const protect = (req, res, next) => {
  jwt.verify(req.token, secretKey, (err, authData) => {
    if (err) {
      return res.status(403).json({ message: "Unauthorized: Invalid token" });
    }
    req.user = authData;
    next();
  });
};

module.exports = { extractToken, protect };
