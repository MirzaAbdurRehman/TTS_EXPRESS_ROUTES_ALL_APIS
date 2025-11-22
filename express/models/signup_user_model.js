

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    userName: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    address: {type: String},
    phone: {type: String, unique: true},
});

userSchema.pre('save', async function (next) {
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10); // salt  number 0 to 10
    next();
});

module.exports = mongoose.model('UserSchema', userSchema); // userScema is a name that represt the name in mongodb atlas





