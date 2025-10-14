

const mongoose = require('mongoose');

const empModel = new mongoose.Schema({
    name: String,
    email: String,
    position: String,
    department: String,
});

module.exports = mongoose.model('Employee', empModel);