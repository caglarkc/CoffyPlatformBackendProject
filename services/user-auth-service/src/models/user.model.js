const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    lastLogoutAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: String,
        enum: ['active', 'notVerified', 'blocked' , 'deleted'],
        default: 'notVerified'
    },
    adminMessage: {
        type: String,
        default: null
    }
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);